#!/usr/bin/env node

// src/cli/init.ts  - single source of truth

import { runZeroUiInit } from './postInstall.cjs';

async function cli() {
	return await runZeroUiInit();
}

/* -------- CLI  -------- */
if (require.main === module) {
	cli().catch((error) => {
		console.error('CLI failed:', error);
		process.exit(1);
	});
}

/* -------- ES6 Export  -------- */
export default cli;
