// src/postcss/traverse.cjs

// Always returns the callable function from @babel/traverse to fix Node 22 no longer applies synthetic-default interop.+
const t = require('@babel/traverse');
module.exports = t.default || t;
