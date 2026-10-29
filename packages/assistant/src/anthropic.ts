/** The only file that talks to Anthropic. Uses the official SDK. */
import Anthropic from '@anthropic-ai/sdk';
import { AssistantUnavailableError } from './model.ts';
import type { ContentBlock, ModelClient, ModelRequest, ModelResponse } from './model.ts';

export interface AnthropicOptions {
  apiKey: string;
  /** For tests and local development only. */
  baseUrl?: string;
  /** For tests: replaces the network. */
  fetch?: typeof fetch;
  /** Automatic retries on connection errors, 429 and 5xx. Default 2. */
  maxRetries?: number;
}

export function createAnthropicModel(opts: AnthropicOptions): ModelClient {
  const client = new Anthropic({ apiKey: opts.apiKey, baseURL: opts.baseUrl, fetch: opts.fetch, maxRetries: opts.maxRetries ?? 2, timeout: 120_000 });

  return {
    async create(req: ModelRequest): Promise<ModelResponse> {
      try {
        const res = await client.beta.messages.create({
          model: req.model,
          max_tokens: req.maxTokens,
          // Caches the stable prefix (tools, then system, then the conversation so far) across questions and across tool rounds.
          cache_control: { type: 'ephemeral' },
          system: req.system,
          // Thinking is left at the model's default (adaptive, always on for Opus 5.5). Effort is set because Opus 5.5 defaults to medium and we want it explicit.
          output_config: { effort: 'medium' },
          tools: req.tools.map((t) => ({ ...t, strict: true })) as Anthropic.Beta.BetaTool[],
          // Forced tool use is not supported on this model family: the model chooses, or (last round) is told not to use tools.
          tool_choice: req.toolChoice === 'none' ? { type: 'none' } : { type: 'auto' },
          messages: req.messages as Anthropic.Beta.BetaMessageParam[],
          // If the safety classifiers decline a request, retry it on the server-defined fallback model rather than stopping.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        });
        const usage = res.usage;
        const iterations = (usage as unknown as { iterations?: { type?: string }[] }).iterations ?? [];
        const content = res.content as unknown as ContentBlock[];
        return {
          content,
          stopReason: res.stop_reason,
          usage: {
            inputTokens: usage.input_tokens ?? 0,
            outputTokens: usage.output_tokens ?? 0,
            cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
            cacheReadTokens: usage.cache_read_input_tokens ?? 0,
          },
          fallbackRan: iterations.some((i) => i.type === 'fallback_message') || content.some((b) => b.type === 'fallback'),
        };
      } catch (e) {
        throw mapError(e);
      }
    },
  };
}

/** Turn SDK errors into messages Grant can act on. Details go to the server log, never to the page. */
function mapError(e: unknown): Error {
  if (e instanceof AssistantUnavailableError) return e;
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    console.error('Anthropic refused the API key', (e as Error).message);
    return new AssistantUnavailableError('not_configured', 'The Assistant could not sign in to Anthropic. Check the API key.');
  }
  if (e instanceof Anthropic.RateLimitError) return new AssistantUnavailableError('busy', 'Anthropic is busy right now. Try again in a minute.');
  if (e instanceof Anthropic.BadRequestError || e instanceof Anthropic.NotFoundError || e instanceof Anthropic.UnprocessableEntityError) {
    console.error('Anthropic rejected the request', (e as Error).message);
    return new AssistantUnavailableError('rejected', 'The Assistant could not process that request. It has been logged.');
  }
  if (e instanceof Anthropic.APIConnectionError || e instanceof Anthropic.InternalServerError || e instanceof Anthropic.APIError) {
    console.error('Anthropic unavailable', (e as Error).message);
    return new AssistantUnavailableError('unreachable', 'Anthropic could not be reached. Try again.');
  }
  throw e;
}
