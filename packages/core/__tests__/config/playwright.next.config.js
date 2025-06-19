import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: '../e2e', // all E2E specs live here
	snapshotDir: '../snapshots',
	workers: 2,
	timeout: 30_000,
	expect: { timeout: 15_000 },
	reporter: 'html',

	use: { headless: true, baseURL: BASE_URL },

	projects: [
		{ name: 'setup', testMatch: /nextSetup\.js/ },
		{ name: 'next-cli-e2e', dependencies: ['setup'], testMatch: /cli-next\.spec\.js/ },
		{ name: 'next-e2e', dependencies: ['next-cli-e2e'], testMatch: /next\.spec\.js/ },
	],
	webServer: {
		command: 'pnpm run dev',
		cwd: path.resolve(__dirname, '../fixtures/next'),
		url: BASE_URL,
		timeout: 60_000, // Give more time for CI environments
		reuseExistingServer: !process.env.CI, // Don't reuse in CI
	},
});
