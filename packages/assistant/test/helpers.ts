import { fixtures, FIXTURE_NOW, FIXTURE_TODAY } from '@bc/contract/fixtures';
import { MemoryStore } from '@bc/core';
import type { AssistantEnv, Store } from '@bc/core';
import { createAssistant } from '../src/index.ts';
import type { AssistantOptions } from '../src/index.ts';
import { ScriptedModel } from '../src/testing.ts';

export const NOW = FIXTURE_NOW;
export const TODAY = FIXTURE_TODAY;

export const freshStore = () => new MemoryStore(fixtures as unknown as Record<string, any[]>);
export const env = (store: Store, now = NOW, today = TODAY): AssistantEnv => ({ store, now, today });

export function setup(model: ScriptedModel, extra: Partial<AssistantOptions> = {}, store: Store = freshStore()) {
  const assistant = createAssistant({ model, ...extra });
  return { assistant, store, ask: (question: string, more: Record<string, unknown> = {}, now = NOW, today = TODAY) => assistant.ask({ question, ...more } as never, env(store, now, today)) };
}

/** A usage event as the Assistant itself would have written it. */
export const usageEvent = (costCents: number, at: string, id = `aud-${Math.random().toString(36).slice(2, 8)}`) => ({
  kind: 'insert' as const, type: 'audit',
  rec: { id, version: 1, createdAt: at, updatedAt: at, archived: false, tags: [], type: 'audit', actor: 'assistant', action: 'assistant.usage', at, after: { costCents } },
});
