/**
 * What a question costs, in whole cents, from the token counts the API reports. Prices are per million tokens, held as integer
 * nano-dollars per token (so $4.00 per million tokens is 4,000) and rounded up to the cent once per request, never down.
 * Source: the model price table in the Claude API reference (cached 2026-10-06). Re-check it when you change the model.
 */
import type { ModelUsage } from './model.ts';

interface Rates { input: number; output: number; cacheRead: number }

const PRICES: Record<string, Rates> = {
  'claude-opus-5-5': { input: 4000, output: 20000, cacheRead: 200 },
  'claude-opus-5': { input: 5000, output: 25000, cacheRead: 500 },
  'claude-sonnet-5-5': { input: 2000, output: 10000, cacheRead: 200 },
  'claude-sonnet-5': { input: 2000, output: 10000, cacheRead: 200 },
  'claude-haiku-5-5': { input: 100, output: 500, cacheRead: 10 },
  'claude-fable-5-1': { input: 10000, output: 50000, cacheRead: 250 },
};
/** Used for an unknown model and for any request a fallback model touched: the dearest known rates, so the meter never undercounts. */
export const CEILING_RATES: Rates = PRICES['claude-fable-5-1']!;

export const KNOWN_MODELS = Object.keys(PRICES);
export const isKnownModel = (model: string) => model in PRICES;

const NANO_PER_CENT = 10_000_000;

export function costCents(model: string, usage: ModelUsage, opts: { fallbackRan?: boolean } = {}): number {
  const r = opts.fallbackRan ? CEILING_RATES : PRICES[model] ?? CEILING_RATES;
  const nano =
    usage.inputTokens * r.input +
    usage.cacheCreationTokens * Math.round(r.input * 1.25) +
    usage.cacheReadTokens * r.cacheRead +
    usage.outputTokens * r.output;
  return nano === 0 ? 0 : Math.max(1, Math.ceil(nano / NANO_PER_CENT));
}

export const addUsage = (a: ModelUsage, b: ModelUsage): ModelUsage => ({
  inputTokens: a.inputTokens + b.inputTokens,
  outputTokens: a.outputTokens + b.outputTokens,
  cacheCreationTokens: a.cacheCreationTokens + b.cacheCreationTokens,
  cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
});
export const ZERO_USAGE: ModelUsage = { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };

export const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
