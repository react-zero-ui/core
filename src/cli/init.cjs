#!/usr/bin/env node

// src/cli/init.cjs

//import the actual implementation from postInstall.cjs 
const { runZeroUiInit } = require('./postInstall.cjs');


// Take command line arguments (defaulting to process.argv.slice(2) which are the args after node <scriptname>) and pass them to runZeroUiInit

function cli(argv = process.argv.slice(2)) {
  runZeroUiInit(argv);
}

// If the script is being run directly (not imported), run the cli function
if (require.main === module) cli(); // makes it so that the script can be run directly from the command line
module.exports = cli; // makes it so that the script can be imported and used in other files
