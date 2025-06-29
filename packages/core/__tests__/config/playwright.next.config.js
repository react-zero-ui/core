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
	reporter: [
		['list'], // Shows test results in terminal
	],

	use: {
		headless: true,
		baseURL: BASE_URL,
		// Show console logs from page/browser
		trace: 'retain-on-failure',
	},

	globalSetup: '../e2e/nextSetup.js',

	projects: [
		{ name: 'next-cli-e2e', testMatch: /cli-next\.spec\.js/ },
		{ name: 'next-e2e', dependencies: ['next-cli-e2e'], testMatch: /next\.spec\.js/ },
		{ name: 'next-scoped-e2e', dependencies: ['next-e2e'], testMatch: /next-scoped\.spec\.js/ },
	],
	webServer: {
		command: 'pnpm run dev',
		cwd: path.resolve(__dirname, '../fixtures/next'),
		url: BASE_URL,
		timeout: 60_000, // Give more time for CI environments
		reuseExistingServer: false, // Don't reuse in CI
	},
});
