import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;


export default defineConfig({
	testDir: "../e2e", // all E2E specs live here
	workers: 2,
	timeout: 300_000,
	expect: {
		timeout: 150_000,
	},
	reporter: "null",
	globalSetup: path.resolve(__dirname, "../helpers/globalSetup.next.js"),

	use: {
		headless: true,
		baseURL: BASE_URL,

	},

	// One project = one fixture app (Next, Vite, etc.)
	projects: [
		{
			name: "next-e2e",
			testMatch: /.*next.*\.spec\.js/,  // Matches both cli-next.spec.js and next.spec.js
			use: {
				baseURL: BASE_URL,
			},
		},
	],
	webServer: {
		command: "pnpm run dev",
		cwd: path.resolve(__dirname, "../fixtures/next"),
		url: BASE_URL,
	},
});
