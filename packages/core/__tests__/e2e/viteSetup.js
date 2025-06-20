import { resetZeroUiState } from '../helpers/resetProjectState.js';
import { loadCliFromFixture } from '../helpers/loadCli.js';
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

	console.log('[Global Setup] ✅ Vite fixture setup complete!✅');

	// Wait for 10 seconds to make sure the file system is stable
	console.log('[Global Setup] ⏳ Waiting 5 seconds for file system to stabilize...');
	await new Promise(resolve => setTimeout(resolve, 5000));
	return;

}
