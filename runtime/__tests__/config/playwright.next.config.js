import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log(__dirname);

// Utility function to check if a port is in use
const checkPortAvailability = (port, host = 'localhost') => {
	return new Promise((resolve) => {
		const server = net.createServer();

		server.listen(port, host, () => {
			server.once('close', () => {
				resolve(false); // Port is available
			});
			server.close();
		});

		server.on('error', () => {
			resolve(true); // Port is in use
		});
	});
};

// Check port and show warning if needed
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const portInUse = await checkPortAvailability(PORT);
if (portInUse && !process.env.CI) {
	console.warn(`⚠️  WARNING: Port ${PORT} is already in use!`);
	console.warn(`   This might interfere with your tests if it's not your Next.js dev server.`);
	console.warn(`   Make sure your Next.js app is running on ${BASE_URL} or stop other services using this port.`);
	console.warn(`   Tests will attempt to reuse the existing server.`);
}

export default defineConfig({
	testDir: "../e2e", // all E2E specs live here
	workers: 2,
	timeout: 10000,
	reporter: "null",

	use: {
		headless: true,
		baseURL: BASE_URL,

	},


	// One project = one fixture app (Next, Vite, etc.)
	projects: [
		{
			name: "cli-setup",
			testMatch: /.*cli-next\.spec\.js/,
		},
		{
			dependencies: ["cli-setup"],
			name: "next-e2e",
			testMatch: /.*next\.spec\.js/,
			use: {
				baseURL: BASE_URL,
			},
		},
	],
	webServer: {
		command: "npm run dev",
		cwd: path.resolve(__dirname, "../fixtures/next"),
		url: BASE_URL,
		reuseExistingServer: !process.env.CI, // speeds local runs
	},
});
