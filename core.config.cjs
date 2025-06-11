const CONFIG = {
  SUPPORTED_EXTENSIONS: {
    TYPESCRIPT: ['.ts', '.tsx'],
    JAVASCRIPT: ['.js', '.jsx'],
  },
  HOOK_NAME: 'useUI',
  MIN_HOOK_ARGUMENTS: 2,
  MAX_HOOK_ARGUMENTS: 2,
  HEADER: '/* AUTO-GENERATED - DO NOT EDIT */',
  ZERO_UI_DIR: '.zero-ui',
};

const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  '.turbo',
  '.vercel',
  '.git',
  'dist',
  'build',
  'coverage',
  'out',
  'public',
  'build',


]);
module.exports = {
  CONFIG,
  IGNORE_DIRS,
};