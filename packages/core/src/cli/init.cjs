#!/usr/bin/env node

// src/cli/init.cjs  - single source of truth

//import the actual implementation from postInstall.cjs 
const { runZeroUiInit } = require('./postInstall.cjs');


// Take command line arguments (defaulting to process.argv.slice(2) which are the args after node <scriptname>) and pass them to runZeroUiInit
function cli(argv = process.argv.slice(2)) {
  runZeroUiInit(argv);
}

/* -------- CL I  -------- */
if (require.main === module) cli();   // `npx init-react-zero-ui`

/* -------- CJS  -------- */
module.exports = cli;                 // `require('@…/cli')()`

/* -------- ESM  -------- */
module.exports.default = cli;         // `import('@…/cli').then(m => m.default())`
