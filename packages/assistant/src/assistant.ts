/**
 * The Vault Assistant. One question in, one cited answer out. It reads records with tools, never writes them, stays inside a monthly
 * spend cap, and logs every question's cost as an audit event.
 */
import { dateIn, HttpError } from '@bc/core';
import type { Assistant, AssistantEnv, Store } from '@bc/core';
import { addUsage, costCents, dollars, isKnownModel, ZERO_USAGE } from './cost.ts';
import { buildSystemPrompt } from './context.ts';
import { AssistantUnavailableError } from './model.ts';
import type { ContentBlock, ModelClient, ModelMessage } from './model.ts';
import { runTool, TOOLS, ToolError } from './tools.ts';
import type { Seen, ToolCtx } from './tools.ts';

export const DEFAULT_MODEL = 'claude-opus-5-5';
/** $20 a month, in cents, until Grant raises it. */
export const DEFAULT_MONTHLY_CAP_CENTS = 2000;

export interface AssistantOptions {
  model: ModelClient;
  modelId?: string;
  monthlyCapCents?: number;
  timeZone?: string;
  /** Most model calls for one question (each tool round is one call). */
  maxRounds?: number;
  maxTokens?: number;
}

const USAGE_ACTION = 'assistant.usage';
const MARKER = /\[\[([A-Za-z]+):([^\]\s]+)\]\]/g;

/** What has been spent this calendar month (Grant's time zone), from the usage events this Assistant wrote. */
export async function monthToDateCents(store: Store, now: string, timeZone: string): Promise<number> {
  const month = dateIn(timeZone, now).slice(0, 7);
  const events = await store.list('audit', { filters: { action: USAGE_ACTION }, includeArchived: true });
  return events.filter((e) => dateIn(timeZone, e.at).slice(0, 7) === month).reduce((sum, e) => sum + (Number(e.after?.costCents) || 0), 0);
}

/**
 * Replace [[type:id]] markers with numbered references, keeping only markers for records the tools actually returned. A marker for
 * anything else is removed: the model may not cite what it did not read.
 */
export function resolveCitations(text: string, seen: Map<string, Seen>): { answer: string; citations: Seen[]; dropped: number } {
  const order: Seen[] = [];
  let dropped = 0;
  const answer = text
    .replace(MARKER, (_m, type: string, id: string) => {
      const s = seen.get(`${type}:${id}`);
      if (!s) { dropped += 1; return ''; }
      let n = order.findIndex((o) => o === s) + 1;
      if (n === 0) { order.push(s); n = order.length; }
      return `[${n}]`;
    })
    .replace(/ +([.,;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  return { answer, citations: order, dropped };
}

export function createAssistant(opts: AssistantOptions): Assistant {
  const modelId = opts.modelId ?? DEFAULT_MODEL;
  const cap = opts.monthlyCapCents ?? DEFAULT_MONTHLY_CAP_CENTS;
  const tz = opts.timeZone ?? 'America/Chicago';
  const maxRounds = opts.maxRounds ?? 6;
  const maxTokens = opts.maxTokens ?? 4096;
  if (!isKnownModel(modelId)) console.warn(`No price on file for "${modelId}"; the spend meter will use the highest rates. Add it to cost.ts.`);

  return {
    async ask(input, env: AssistantEnv) {
      const { store, now, today } = env;
      const before = await monthToDateCents(store, now, tz);
      if (before >= cap) throw new HttpError(429, 'rate_limited', `The Assistant's budget for this month (${dollars(cap)}) is used up. Raise the cap to keep asking.`);

      const { prompt, scopeLines, truncated } = await buildSystemPrompt(store, { role: input.role, projectId: input.projectId, accountId: input.accountId });
      const ctx: ToolCtx = { store, today, seen: new Map() };
      const messages: ModelMessage[] = [{ role: 'user', content: [`Today is ${today}.`, ...scopeLines, '', input.question].join('\n') }];

      let usage = ZERO_USAGE;
      let fallbackRan = false;
      let spentCents = 0;
      let stop: string | null = null;
      let final: ContentBlock[] = [];
      const toolsUsed: string[] = [];
      let stoppedForBudget = false;
      let rounds = 0;

      try {
        for (; rounds < maxRounds; rounds++) {
          const res = await opts.model.create({ model: modelId, system: prompt, messages, tools: TOOLS, toolChoice: rounds === maxRounds - 1 ? 'none' : 'auto', maxTokens });
          usage = addUsage(usage, res.usage);
          fallbackRan ||= res.fallbackRan;
          spentCents = costCents(modelId, usage, { fallbackRan });
          stop = res.stopReason;
          final = res.content;
          if (res.stopReason !== 'tool_use') { rounds += 1; break; }

          // Keep the assistant turn exactly as returned (thinking blocks included), then answer every tool call in one user message.
          messages.push({ role: 'assistant', content: res.content });
          const calls = res.content.filter((b): b is Extract<ContentBlock, { type: 'tool_use' }> => b.type === 'tool_use');
          const results = await Promise.all(calls.map(async (call): Promise<ContentBlock> => {
            toolsUsed.push(call.name);
            try {
              return { type: 'tool_result', tool_use_id: call.id, content: await runTool(call.name, (call.input ?? {}) as Record<string, unknown>, ctx) };
            } catch (e) {
              if (e instanceof ToolError) return { type: 'tool_result', tool_use_id: call.id, content: e.message, is_error: true };
              console.error('Assistant tool failed', call.name, e);
              return { type: 'tool_result', tool_use_id: call.id, content: 'That lookup failed. Try a different one.', is_error: true };
            }
          }));
          messages.push({ role: 'user', content: results });

          if (before + spentCents >= cap) { stoppedForBudget = true; break; }
        }
      } catch (e) {
        if (e instanceof AssistantUnavailableError) {
          // Whatever was spent before the failure still counts.
          if (spentCents > 0) await logUsage(store, now, { modelId, usage, spentCents, rounds, toolsUsed, fallbackRan, question: input.question, outcome: e.kind });
          throw new HttpError(e.kind === 'busy' ? 429 : 503, e.kind === 'busy' ? 'rate_limited' : 'unavailable', e.message);
        }
        throw e;
      }

      let text = final.filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text').map((b) => b.text).join('\n').trim();
      let outcome = 'answered';
      if (stop === 'refusal') { text = 'The model declined to answer that. Try rephrasing the question.'; outcome = 'refused'; }
      else if (stoppedForBudget) { text = `I stopped before finishing because this month's budget (${dollars(cap)}) is used up. Raise the cap to continue.`; outcome = 'budget'; }
      else if (stop === 'max_tokens') { text = `${text}\n\n[The answer was cut off at its length limit. Ask a narrower question.]`; outcome = 'truncated'; }
      else if (stop === 'tool_use') { text = text || 'I could not finish that in the number of lookups allowed. Try a narrower question.'; outcome = 'too_many_rounds'; }
      else if (!text) { text = 'I could not produce an answer. Try rephrasing.'; outcome = 'empty'; }
      if (truncated) text += '\n\n[Your standing instructions are longer than the Assistant can read. The end was cut off.]';

      const { answer, citations, dropped } = resolveCitations(text, ctx.seen);
      await logUsage(store, now, { modelId, usage, spentCents, rounds, toolsUsed, fallbackRan, question: input.question, outcome, droppedCitations: dropped });

      return {
        answer,
        citations: citations.map((c) => ({ recordType: c.recordType as never, recordId: c.recordId, title: c.title, snippet: c.snippet })),
        usage: { inputTokens: usage.inputTokens + usage.cacheReadTokens + usage.cacheCreationTokens, outputTokens: usage.outputTokens, costCents: spentCents, monthToDateCents: before + spentCents, monthlyCapCents: cap },
      };
    },
  };
}

async function logUsage(store: Store, now: string, u: { modelId: string; usage: typeof ZERO_USAGE; spentCents: number; rounds: number; toolsUsed: string[]; fallbackRan: boolean; question: string; outcome: string; droppedCitations?: number }) {
  const id = `aud_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  await store.apply([{
    kind: 'insert', type: 'audit',
    rec: {
      id, version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'audit', actor: 'assistant', action: USAGE_ACTION, at: now,
      after: { model: u.modelId, ...u.usage, costCents: u.spentCents, rounds: u.rounds, tools: u.toolsUsed, fallbackRan: u.fallbackRan, outcome: u.outcome, droppedCitations: u.droppedCitations ?? 0, question: u.question.slice(0, 500) },
    },
  }]);
}
