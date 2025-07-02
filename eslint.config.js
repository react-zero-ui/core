// eslint.config.js  - ESLint 9 flat-config, JS + CJS
import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-node';
import importPlugin from 'eslint-plugin-import';

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
	{ ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'eslint.config.js', './packages/core/__tests__/unit/fixtures'] },

	/* 2 - baseline rules */
	js.configs.recommended,

	/* 3 - CommonJS (*.cjs) */
	{
		files: ['**/*.cjs'],
		plugins: { node: nodePlugin, import: importPlugin },
		languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: nodeGlobals },
		rules: {
			'node/no-unsupported-features/es-syntax': 'off',
			'import/no-unresolved': 'error', // Catch unresolved imports
			'import/named': 'error', // Catch missing named exports
			'import/default': 'error', // Catch missing default exports
			'import/no-absolute-path': 'error', // Prevent absolute paths
		},
	},

	/* 4 - ES-module / browser (*.js) */
	{
		files: ['**/*.js'],
		plugins: { node: nodePlugin, import: importPlugin },
		languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...nodeGlobals, ...browserGlobals } },
		rules: {
			'node/no-unsupported-features/es-syntax': 'off',
			'import/no-unresolved': 'error',
			'import/named': 'error',
			'import/default': 'error',
			'import/no-absolute-path': 'error',
		},
	},

	/* 5 - JSX files */
	{
		files: ['**/*.jsx'],
		plugins: { node: nodePlugin, import: importPlugin },
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: { ...nodeGlobals, ...browserGlobals },
			parserOptions: { ecmaFeatures: { jsx: true } },
		},
		rules: {
			'node/no-unsupported-features/es-syntax': 'off',
			'import/no-unresolved': 'error',
			'import/named': 'error',
			'import/default': 'error',
			'import/no-absolute-path': 'error',
		},
	},
];
