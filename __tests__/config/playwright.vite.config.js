import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log(__dirname);

export default defineConfig({
	testDir: "../e2e", // all E2E specs live here
	workers: 2,
	timeout: 10000,
	reporter: "null",

	use: {
		headless: true,
		baseURL: "http://localhost:5173",
	},

	// One project = one fixture app (Next, Vite, etc.)
	projects: [

		{

			name: "vite-e2e",
			testMatch: /.*vite\.spec\.js/,
			use: {
				baseURL: "http://localhost:5173",
			},
		},
	],
	webServer: {
		command: "npm run dev",
		cwd: path.resolve(__dirname, "../fixtures/vite"),
		url: "http://localhost:5173",
		reuseExistingServer: !process.env.CI, // speeds local runs
	},
});
