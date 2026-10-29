/** A stand-in model for tests: replays scripted responses and records every request it was sent. Never touches the network. */
import { ZERO_USAGE } from './cost.ts';
import type { ContentBlock, ModelClient, ModelRequest, ModelResponse, ModelUsage } from './model.ts';

export type Script = ModelResponse | ((req: ModelRequest) => ModelResponse | Promise<ModelResponse>) | Error;

export class ScriptedModel implements ModelClient {
  readonly requests: ModelRequest[] = [];
  private queue: Script[];
  constructor(...script: Script[]) { this.queue = [...script]; }
  async create(req: ModelRequest): Promise<ModelResponse> {
    this.requests.push(structuredClone(req));
    const next = this.queue.shift();
    if (!next) throw new Error('ScriptedModel: no more scripted responses');
    if (next instanceof Error) throw next;
    return typeof next === 'function' ? next(req) : next;
  }
}

export const usage = (u: Partial<ModelUsage> = {}): ModelUsage => ({ ...ZERO_USAGE, ...u });
export const text = (t: string, u: Partial<ModelUsage> = {}, stop = 'end_turn'): ModelResponse => ({ content: [{ type: 'text', text: t }], stopReason: stop, usage: usage(u), fallbackRan: false });
export const toolCalls = (calls: { id: string; name: string; input: unknown }[], u: Partial<ModelUsage> = {}, lead?: ContentBlock[]): ModelResponse => ({
  content: [...(lead ?? []), ...calls.map((c) => ({ type: 'tool_use' as const, ...c }))], stopReason: 'tool_use', usage: usage(u), fallbackRan: false,
});
