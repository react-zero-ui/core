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
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

const portInUse = await checkPortAvailability(PORT);
if (portInUse && !process.env.CI) {
	console.warn(`⚠️  WARNING: Port ${PORT} is already in use!`);
	console.warn(`   This might interfere with your tests if it's not your Vite dev server.`);
	console.warn(`   Make sure your Vite app is running on ${BASE_URL} or stop other services using this port.`);
	console.warn(`   Tests will attempt to reuse the existing server.`);
}


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
