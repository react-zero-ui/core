import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;


export default defineConfig({
	testDir: "../e2e", // all E2E specs live here
	workers: 1,
	timeout: 300_000,
	expect: {
		timeout: 150_000,
	}, reporter: "null",
	globalSetup: path.resolve(__dirname, "../helpers/globalSetup.vite.js"),

	use: {
		headless: true,
		baseURL: BASE_URL,

	},

	// One project = one fixture app (Next, Vite, etc.)
	projects: [
		{
			name: "vite-e2e",
			testMatch: /.*vite.*\.spec\.js/,  // Matches both cli-vite.spec.js and vite.spec.js
			use: {
				baseURL: BASE_URL,
			},
		},
	],
	webServer: {
		command: "pnpm run dev",
		cwd: path.resolve(__dirname, "../fixtures/vite"),
		url: BASE_URL,
	},
});
