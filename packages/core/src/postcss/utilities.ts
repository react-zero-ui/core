import path from 'path';
import fs from 'fs';
import os from 'os';

// Helper to create temp directory and run test
export async function runTest(files: Record<string, string>, callback: () => Promise<void>) {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-test-ast'));
	const originalCwd = process.cwd();
	try {
		process.chdir(testDir);
		// Create test files
		for (const [filePath, content] of Object.entries(files)) {
			const dir = path.dirname(filePath);
			if (dir !== '.') {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(filePath, content);
		}

		// Run assertions
		await callback();
	} finally {
		process.chdir(originalCwd);
		// Clean up any generated files in the package directory
		fs.rmSync(testDir, { recursive: true, force: true });
	}
}

export function readFile(path: string) {
	return fs.readFileSync(path, 'utf-8');
}
