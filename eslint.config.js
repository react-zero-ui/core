// eslint.config.js  - ESLint 9 flat-config, JS + CJS
import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-node';

const nodeGlobals = {
	require: 'readonly',
	module: 'readonly',
	exports: 'readonly',
	__dirname: 'readonly',
	__filename: 'readonly',
	process: 'readonly',
	console: 'readonly',
	Buffer: 'readonly',
	setTimeout: 'readonly',
	setInterval: 'readonly',
	clearTimeout: 'readonly',
	clearInterval: 'readonly',
};

const browserGlobals = {
	window: 'readonly',
	document: 'readonly',
	navigator: 'readonly',
	requestAnimationFrame: 'readonly',
	cancelAnimationFrame: 'readonly',
	setTimeout: 'readonly',
	setInterval: 'readonly',
	clearTimeout: 'readonly',
	clearInterval: 'readonly',
	console: 'readonly',
};

export default [
	/* 1 - never lint generated / vendor files */
	{ ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'eslint.config.js'] },

	/* 2 - baseline rules */
	js.configs.recommended,

	/* 3 - CommonJS (*.cjs) */
	{
		files: ['**/*.cjs'],
		plugins: { node: nodePlugin },
		languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: nodeGlobals },
		rules: { 'node/no-unsupported-features/es-syntax': 'off' },
	},

	/* 4 - ES-module / browser (*.js) */
	{
		files: ['**/*.js'],
		plugins: { node: nodePlugin },
		languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...nodeGlobals, ...browserGlobals } },
		rules: { 'node/no-unsupported-features/es-syntax': 'off' },
	},
];
