import { test } from 'node:test';
import assert from 'node:assert';
import { readFile, runTest } from '../utilities.ts';
import { parseAndUpdatePostcssConfig, parseAndUpdateViteConfig, parseJsonWithBabel, patchNextBodyTag } from './ast-generating.cts';

const zeroUiPlugin = '@react-zero-ui/core/postcss';
const zeroUiVitePlugin = '@react-zero-ui/core/vite';

test('parseAndUpdatePostcssConfig should parse and update PostCSS config', async () => {
	await runTest(
		{
			'postcss.config.js': `
				module.exports = {
					plugins: [require('tailwindcss'), require('autoprefixer')],
				}`,
			'postcss.config2.mjs': `
				const config = { plugins: [ '@tailwindcss/postcss'] };
export default config;
`,
		},
		async () => {
			const config = parseAndUpdatePostcssConfig(readFile('postcss.config.js'), zeroUiPlugin, false);
			assert(config?.includes(zeroUiPlugin));
			const config2 = parseAndUpdatePostcssConfig(readFile('postcss.config2.mjs'), zeroUiPlugin, true);
			assert(config2?.includes(zeroUiPlugin));
		}
	);
});

const FIXTURES = {
	// 1. ESM object
	'vite.config.js': `

    export default { plugins: [react(),'@tailwindcss/vite'] };
  `,

	// 2. defineConfig helper
	'vite.config.ts': `
    import { defineConfig } from 'vite';
    export default defineConfig({ plugins: [react(),'@tailwindcss/vite'] });
  `,

	// 3. sync factory
	'vite.config.mjs': `
    export default ({ mode }) => ({ plugins: [react(),'@tailwindcss/vite'] });
  `,

	// 4. async factory + indirection
	'vite.config.mts': `
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    const cfg = defineConfig({ plugins: [react(),'@tailwindcss/vite'] });
    export default async () => cfg;
  `,
};

test('parseAndUpdateViteConfig inserts Zero-UI and removes Tailwind', () => {
	for (const [name, src] of Object.entries(FIXTURES)) {
		const out = parseAndUpdateViteConfig(src, zeroUiVitePlugin);
		assert(out && out.includes(zeroUiVitePlugin), `${name} missing zeroUI`);
		assert(out.includes('zeroUI()'), `${name} missing zeroUI`);
		assert(out.includes('react()'), `${name} missing react`);
		assert(!out.includes('@tailwindcss/vite'), `${name} still contains tailwind`);
	}
});

test('patchNextBodyTag should patch the body tag with the {...bodyAttributes}', async () => {
	await runTest(
		{
			'src/app/layout.tsx': `
    <html>
      <body>
        <div>Hello</div>
      </body>
    </html>
    `,
		},
		async () => {
			await patchNextBodyTag();
			const result = readFile('src/app/layout.tsx');
			assert(result.includes('{...bodyAttributes}'), 'body tag not patched');
			assert(result.includes('import { bodyAttributes } from "@zero-ui/attributes";'), 'import not found');
		}
	);
});

test('parseJsonWithBabel should parse a JSON file', () => {
	const result = parseJsonWithBabel(readFile('package.json'));
	assert(result, 'package.json not parsed');
});
