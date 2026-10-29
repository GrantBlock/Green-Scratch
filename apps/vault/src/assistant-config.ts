import { createAnthropicModel, createAssistant, DEFAULT_MONTHLY_CAP_CENTS } from '@bc/assistant';
import type { ModelClient } from '@bc/assistant';
import type { Assistant } from '@bc/core';
import type { Env } from './env.ts';

/**
 * The Assistant, if a key is set. Without one the Vault answers with a plain word match that says it is not set up, so nothing
 * pretends to be Claude. The model and cap come from settings; the key is a secret.
 */
export function assistantFromEnv(env: Pick<Env, 'ANTHROPIC_API_KEY' | 'ASSISTANT_MODEL' | 'ASSISTANT_MONTHLY_CAP_CENTS' | 'ANTHROPIC_BASE_URL' | 'DEV_AUTH' | 'TIME_ZONE'>, model?: ModelClient): Assistant | undefined {
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (!key && !model) return undefined;
  const cap = Number(env.ASSISTANT_MONTHLY_CAP_CENTS);
  return createAssistant({
    // A different base URL would send the key to another server, so it only counts in local development.
    model: model ?? createAnthropicModel({ apiKey: key!, baseUrl: env.DEV_AUTH === 'true' ? env.ANTHROPIC_BASE_URL || undefined : undefined }),
    modelId: env.ASSISTANT_MODEL?.trim() || undefined,
    monthlyCapCents: Number.isInteger(cap) && cap > 0 ? cap : DEFAULT_MONTHLY_CAP_CENTS,
    timeZone: env.TIME_ZONE ?? 'America/Chicago',
  });
}
