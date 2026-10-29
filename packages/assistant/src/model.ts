/** The small slice of the Messages API the Assistant uses, so the logic can be tested without a network and the SDK stays in one file. */
export interface ToolSpec { name: string; description: string; input_schema: Record<string, unknown> }

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }
  // Thinking blocks and anything else are carried through untouched: they must be sent back unchanged on the next turn.
  | { type: string; [key: string]: unknown };

export interface ModelMessage { role: 'user' | 'assistant'; content: string | ContentBlock[] }

export interface ModelRequest {
  model: string;
  system: string;
  messages: ModelMessage[];
  tools: ToolSpec[];
  /** 'none' stops the model calling tools (used on the last round); tool definitions must still be sent when the conversation contains tool calls. */
  toolChoice?: 'auto' | 'none';
  maxTokens: number;
}

export interface ModelUsage { inputTokens: number; outputTokens: number; cacheCreationTokens: number; cacheReadTokens: number }

export interface ModelResponse {
  content: ContentBlock[];
  stopReason: string | null;
  usage: ModelUsage;
  /** True if the request was served, in whole or part, by a fallback model after a refusal. Billed at that model's rates. */
  fallbackRan: boolean;
}

export interface ModelClient { create(req: ModelRequest): Promise<ModelResponse> }

/** Why the model could not be used. The message is safe to show to Grant; details stay in the server log. */
export class AssistantUnavailableError extends Error {
  kind: 'not_configured' | 'busy' | 'rejected' | 'unreachable';
  constructor(kind: AssistantUnavailableError['kind'], message: string) {
    super(message);
    this.kind = kind;
  }
}
