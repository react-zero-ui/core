#!/usr/bin/env node

// src/cli/init.cts  - single source of truth

//import the actual implementation from postInstall.cjs
const { runZeroUiInit } = require('./postInstall.cjs');

// Take command line arguments (defaulting to process.argv.slice(2) which are the args after node <scriptname>) and pass them to runZeroUiInit
async function cli(argv = process.argv.slice(2)) {
	return await runZeroUiInit(argv);
}

/* -------- CL I  -------- */
if (require.main === module) {
	cli().catch((error) => {
		console.error('CLI failed:', error);
		process.exit(1);
	});
}

/* -------- CJS  -------- */
module.exports = cli; // `require('@…/cli')()`
