// packages/core/__tests__/helpers/globalSetup.vite.js
import { resetZeroUiState } from './resetProjectState.js';
import { loadCliFromFixture } from './loadCli.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  const projectDir = path.resolve(__dirname, '../fixtures/vite');

  // Reset and setup the Vite fixture
  console.log('[Global Setup] Setting up Vite fixture...');
  await resetZeroUiState(projectDir, false);

  const zeroUiCli = await loadCliFromFixture(projectDir);
  await zeroUiCli([]);

  console.log('[Global Setup] Vite fixture setup complete!');
} 