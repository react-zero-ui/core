// eslint.config.js  - ESLint 9 flat-config, JS + CJS
import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-n';
import importPlugin from 'eslint-plugin-import';
import tsParser from '@typescript-eslint/parser';

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
	HTMLElement: 'readonly',
	Element: 'readonly',
};

export default [
	/* 1 - never lint generated / vendor files */
	{ ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'eslint.config.js', './packages/core/__tests__/unit/fixtures'] },

	/* 2 - baseline rules */
	js.configs.recommended,

	/* 3 - CommonJS (*.cjs) */
	{
		files: ['**/*.cjs'],
		plugins: { n: nodePlugin, import: importPlugin },
		languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: nodeGlobals },
		rules: {
			'n/no-unsupported-features/es-syntax': 'off',
			'import/no-unresolved': 'error', // Catch unresolved imports
			'import/named': 'error', // Catch missing named exports
			'import/default': 'error', // Catch missing default exports
			'import/no-absolute-path': 'error', // Prevent absolute paths
		},
	},

	/* 4 - ES-module / browser (*.js) */
	{
		files: ['**/*.js'],
		plugins: { n: nodePlugin, import: importPlugin },
		languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...nodeGlobals, ...browserGlobals } },
		rules: {
			'n/no-unsupported-features/es-syntax': 'off',
			'import/no-unresolved': 'error',
			'import/named': 'error',
			'import/default': 'error',
			'import/no-absolute-path': 'error',
		},
	},

	/* 5 - TypeScript files (*.ts, *.tsx) */
	{
		files: ['**/*.ts', '**/*.tsx'],
		plugins: { n: nodePlugin, import: importPlugin },
		languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module', globals: { ...nodeGlobals, ...browserGlobals } },
		rules: {
			'n/no-unsupported-features/es-syntax': 'off',
			'import/no-unresolved': 'off', // TypeScript handles this
			'import/named': 'off', // TypeScript handles this
			'import/default': 'off', // TypeScript handles this
			'import/no-absolute-path': 'error',
			'no-unused-vars': 'off', // TypeScript handles this better
			'no-undef': 'off', // TypeScript handles this
		},
	},
];
