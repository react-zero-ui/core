import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: '../e2e', // all E2E specs live here
	snapshotDir: '../snapshots',
	workers: 2,
	timeout: 30_000,
	expect: { timeout: 15_000 },
	reporter: [
		['list'], // Shows test results in terminal
	],

	use: {
		headless: true,
		baseURL: BASE_URL,
		// Show console logs from page/browser
		trace: 'retain-on-failure',
	},

	globalSetup: '../e2e/viteSetup.js',

	// One project = one fixture app (Next, Vite, etc.)
	projects: [
		{
			name: 'vite-cli-e2e',
			testMatch: /cli-vite\.spec\.js/, // Matches both cli-vite.spec.js and vite.spec.js
		},
		{
			name: 'vite-e2e',
			dependencies: ['vite-cli-e2e'],
			testMatch: /vite\.spec\.js/, // Matches both cli-vite.spec.js and vite.spec.js
		},
		{
			name: 'vite-scopes-e2e',
			dependencies: ['vite-e2e'],
			testMatch: /vite-scopes\.spec\.js/, // Matches both cli-vite.spec.js and vite.spec.js
		},
	],
	webServer: {
		command: 'pnpm run build-and-preview',
		cwd: path.resolve(__dirname, '../fixtures/vite'),
		url: BASE_URL,
		timeout: 60_000, // Give more time for CI environments
		reuseExistingServer: false, // Don't reuse in CI
	},
});
