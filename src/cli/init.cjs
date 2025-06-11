#!/usr/bin/env node
const { runZeroUiInit } = require('./postInstall.cjs');

module.exports = function cli(argv = process.argv.slice(2)) {
  runZeroUiInit(argv);

  // still allow direct execution:
  if (require.main === module) process.exit(0);
};