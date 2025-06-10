import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log(__dirname);

export default defineConfig({
	testDir: "./__tests__/e2e", // all E2E specs live here
	workers: 2,
	timeout: 10000,
	reporter: "null",

	use: {
		headless: true,
		baseURL: "http://localhost:3000",
	},

	// One project = one fixture app (Next, Vite, etc.)
	projects: [
		{
			name: "cli-setup",
			testMatch: /.*cli\.spec\.js/,
		},
		{
			name: "next-e2e",
			testMatch: /.*next\.spec\.js/,
			use: {
				baseURL: "http://localhost:3000",
			},
		},
		// add more fixture apps later:
		// {
		//   name: 'vite',
		//   testDir: './tests/e2e/vite',
		//   webServer: {
		//     command: 'npm run dev',
		//     cwd: path.resolve(__dirname, 'tests/fixtures/vite'),
		//     port: 5173,
		//   },
		// },
	],
	webServer: {
		command: "npm run dev",
		cwd: path.resolve(__dirname, "./__tests__/fixtures/next"),
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI, // speeds local runs
	},
});
