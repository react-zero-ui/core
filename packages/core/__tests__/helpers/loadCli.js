// __tests__/helpers/loadCli.js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import path from 'node:path';

export async function loadCliFromFixture(fixtureDir) {
	// Get the directory of this helper file
	const __dirname = dirname(fileURLToPath(import.meta.url));
	console.log('__dirname: ', __dirname);

	// Build the path to the CLI module - from helpers/ go up to core/ then to dist/
	const modulePath = path.resolve(__dirname, '../../dist/cli/init.js');
	console.log('[Global Setup] CLI path:', modulePath);

	// Return a wrapper function that runs CLI as separate process to avoid module loading issues
	const wrappedCli = async () => {
		const originalCwd = process.cwd();
		try {
			process.chdir(fixtureDir); // Change to fixture directory
			console.log('[Global Setup] Changed to fixture directory:', fixtureDir);

			// Run the CLI as a separate Node.js process to avoid module loading conflicts
			const result = execSync(`node "${modulePath}"`, { stdio: 'pipe', encoding: 'utf-8', timeout: 30000 });

			console.log('[Global Setup] CLI executed successfully');
			return result;
		} catch (error) {
			console.error('[Global Setup] CLI execution failed:', error.message);
			if (error.stdout) console.log('STDOUT:', error.stdout);
			if (error.stderr) console.log('STDERR:', error.stderr);
			throw error;
		} finally {
			process.chdir(originalCwd); // Always restore original directory
			console.log('[Global Setup] Restored original directory:', originalCwd);
		}
	};

	return wrappedCli;
}
