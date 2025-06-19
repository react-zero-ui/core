import { resetZeroUiState } from '../helpers/resetProjectState.js';
import { loadCliFromFixture } from '../helpers/loadCli.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
	const projectDir = path.resolve(__dirname, '../fixtures/next');

	// Reset and setup the Next.js fixture
	console.log('[Global Setup] Setting up Next.js fixture...');
	await resetZeroUiState(projectDir, true);

	const zeroUiCli = await loadCliFromFixture(projectDir);
	await zeroUiCli([]);

	console.log('[Global Setup] ✅ Next.js fixture setup complete!✅');
}
