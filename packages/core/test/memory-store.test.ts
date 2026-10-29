import { runStoreConformance } from '../src/testing/index.ts';
import { MemoryStore } from '../src/index.ts';

runStoreConformance('memory', async () => ({ store: new MemoryStore() }));
