#!/usr/bin/env node

// src/cli/init.ts  - single source of truth

//import the actual implementation from postInstall.ts
import { runZeroUiInit } from './postInstall.js';

// Take command line arguments (defaulting to process.argv.slice(2) which are the args after node <scriptname>) and pass them to runZeroUiInit
async function cli() {
	return await runZeroUiInit();
}

/* -------- CLI  -------- */
// ES module equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
	cli().catch((error) => {
		console.error('CLI failed:', error);
		process.exit(1);
	});
}

/* -------- ES Module Export  -------- */
export default cli;
