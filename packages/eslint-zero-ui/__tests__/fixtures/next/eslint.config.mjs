import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';
import zeroUiPlugin from 'eslint-zero-ui';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* Convert “old-style” shareable configs shipped by Next.js */
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
	/* Global ignores ─────────────────────────────────────────────── */
	{ ignores: ['.zero-ui/**', '.next/**', 'node_modules/**'] },

	/* Next presets (core-web-vitals + TS) */
	...compat.extends('next/core-web-vitals', 'next/typescript'),

	/* Your Zero-UI rule  ─────────────────────────────────────────── */
	{
		files: ['**/*.{tsx,jsx}'],
		languageOptions: { parser: tsParser, parserOptions: { project: './tsconfig.json' } },
		plugins: {
			'react-zero-ui': zeroUiPlugin, // load from workspace
		},
		rules: { 'react-zero-ui/require-data-attr': 'error', '@typescript-eslint/no-unused-vars': ['warn'], 'no-console': ['warn', { allow: ['warn', 'error'] }] },
	},
];
