#!/usr/bin/env node
// init.js — runs in the user's project context

const { runZeroUiInit } = require('./scripts/postInstall.js');
runZeroUiInit();
