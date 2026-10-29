import { registerStory } from '../src/testing/index.ts';
import { startMock } from '../mock/server.ts';

registerStory('mock', () => startMock());
