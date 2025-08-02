import { test } from 'node:test';
import assert from 'node:assert';
import { buildCss, findAllSourceFiles, isZeroUiInitialized, patchPostcssConfig, patchTsConfig, patchViteConfig, toKebabCase } from './helpers.js';
import { readFile, runTest } from './test-utilities.js';
import { CONFIG } from '../config.js';
import { processVariants, VariantData } from './ast-parsing.js';

test('toKebabCase should convert a string to kebab case', () => {
	assert.equal(toKebabCase('helloWorld'), 'hello-world');
});

test('toKebabCase should throw an error if the input is not a string', () => {
	assert.throws(() => toKebabCase(123 as unknown as string));
});

const src = `
      import { useUI } from '@react-zero-ui/core';
			const featureEnabled = 'feature-enabled';
			const bool = false;
			const theme = ['true'];
export function Component() {
	const [isVisible, setIsVisible] = useUI('modal-visible', 'false');
	const [isEnabled, setIsEnabled] = useUI(bool ?? featureEnabled, theme[0]);
return (
	<div>
		<div
			className="modal-visible-true:block modal-visible-true:bg-black md:feature-enabled-false:hidden">
			Open Modal
		</div>
	</div>
); }`;

const expectedVariants: VariantData[] = [
	{ key: 'feature-enabled', values: ['false'], initialValue: 'true', scope: 'global' },
	{ key: 'modal-visible', values: ['true'], initialValue: 'false', scope: 'global' },
];
const initialValues = { 'data-feature-enabled': 'true', 'data-modal-visible': 'false' };

test('findAllSourceFiles Return *absolute* paths of every JS/TS file we care about', () => {
	const result = findAllSourceFiles();
	assert.equal(result.length > 0, true);
});

test('processVariants should process variants', async () => {
	await runTest({ 'src/app/component.tsx': src }, async () => {
		const { finalVariants, initialGlobalValues, sourceFiles } = await processVariants();
		assert.deepStrictEqual(finalVariants, expectedVariants);
		assert.deepStrictEqual(initialGlobalValues, initialValues);
		assert.equal(sourceFiles.length, 1);
	});
});

// tiny helper - avoids CRLF - LF failures on Windows runners
const norm = (s: string) => s.replace(/\r\n/g, '\n');

test('buildCss emits @custom-variant blocks in stable order', () => {
	const css = buildCss(expectedVariants);
	const expected = `/* AUTO-GENERATED - DO NOT EDIT */\n@custom-variant feature-enabled-false { &:where(body[data-feature-enabled='false'] &) { @slot; } }\n@custom-variant modal-visible-true { &:where(body[data-modal-visible='true'] &) { @slot; } }\n`;
	assert.strictEqual(norm(css), norm(expected), 'CSS snapshot mismatch');
});

// test('generateAttributesFile writes files once and stays stable', async () => {
// 	await runTest({}, async () => {
// 		/* ------------------------------------------------------------------ *
// 		 * 1. first call — files should be created
// 		 * ------------------------------------------------------------------ */
// 		const first = await generateAttributesFile(expectedVariants, initialValues);
// 		console.log('first: ', first);
// 		assert.deepStrictEqual(first, { jsChanged: true, tsChanged: true }, 'first run must write both files');

// 		const attrDir = path.join(process.cwd(), CONFIG.ZERO_UI_DIR);
// 		const jsPath = path.join(attrDir, 'attributes.js');
// 		const tsPath = path.join(attrDir, 'attributes.d.ts');

// 		const jsText = readFile(jsPath);
// 		const tsText = readFile(tsPath);
// 		// --- JS snapshot -----------------------------------------------------
// 		const expectedJs = `${CONFIG.HEADER}
// export const bodyAttributes = {
//   "data-feature-enabled": "true",
//   "data-modal-visible": "false"
// };
// `;
// 		assert.strictEqual(norm(jsText), norm(expectedJs), 'attributes.js snapshot mismatch');
// 		// --- TS snapshot -----------------------------------------------------
// 		const expectedTs = `${CONFIG.HEADER}
// export declare const bodyAttributes: {
//   "data-feature-enabled": "false" | "true";
//   "data-modal-visible": "false" | "true";
// };
// `;
// 		assert.strictEqual(norm(tsText), norm(expectedTs), 'attributes.d.ts snapshot mismatch');
// 		/* ------------------------------------------------------------------ *
// 		 * 2. second call — nothing should change
// 		 * ------------------------------------------------------------------ */
// 		const second = await generateAttributesFile(expectedVariants, initialValues);
// 		console.log('second: ', second);
// 		assert.deepStrictEqual(second, { jsChanged: false, tsChanged: false }, 'second run must be a no-op');
// 		// files still identical
// 		assert.strictEqual(norm(readFile(jsPath)), norm(expectedJs));
// 		assert.strictEqual(norm(readFile(tsPath)), norm(expectedTs));
// 	});
// });

test('isZeroUiInitialized returns false when attribute files are missing', async () => {
	await runTest({}, async () => {
		assert.equal(isZeroUiInitialized(), false);
	});
});

test('isZeroUiInitialized returns true when both attribute files exist and contain signatures', async () => {
	await runTest(
		{
			[`${CONFIG.ZERO_UI_DIR}/attributes.js`]: `${CONFIG.HEADER}
export const bodyAttributes = {};
`,
			[`${CONFIG.ZERO_UI_DIR}/attributes.d.ts`]: `${CONFIG.HEADER}
export declare const bodyAttributes: {};
`,
		},
		async () => {
			assert.equal(isZeroUiInitialized(), true);
		}
	);
});

test('isZeroUiInitialized returns false when no attribute files exist', async () => {
	assert.equal(isZeroUiInitialized(), false);
});

test('patchTsConfig writes alias & includes once, then stays stable', async () => {
	await runTest(
		{
			'tsconfig.json': `{
  "compilerOptions": { "target": "ES2022" },
  "include": ["src"]
}`,
		},
		async () => {
			/* 1 ▸ first run patches the file -------------------------------- */
			await patchTsConfig();

			const after1 = JSON.parse(readFile('tsconfig.json'));
			assert.deepStrictEqual(after1.compilerOptions.paths, { '@zero-ui/attributes': ['./.zero-ui/attributes.js'] });
			assert.deepStrictEqual(after1.include.sort(), ['src', '.zero-ui/**/*.d.ts', '.next/**/*.d.ts'].sort());

			const snapshot = norm(readFile('tsconfig.json'));

			/* 2 ▸ second run is a no-op ------------------------------------- */
			await patchTsConfig();
			assert.strictEqual(norm(readFile('tsconfig.json')), snapshot);
		}
	);
});

test('patchTsConfig is skipped when vite.config.ts exists', async () => {
	await runTest({ 'tsconfig.json': `{ "compilerOptions": {} }`, 'vite.config.ts': `export default {}` /* triggers early return */ }, async () => {
		await patchTsConfig();
		const ts = JSON.parse(readFile('tsconfig.json'));
		assert.equal(ts.compilerOptions.paths?.['@zero-ui/attributes'], undefined);
	});
});

const ZERO = CONFIG.POSTCSS_PLUGIN;
const TAIL = '@tailwindcss/postcss';

// tiny helper for ordering assertion
const zeroBeforeTail = (s: string) => s.indexOf(ZERO) > -1 && s.indexOf(TAIL) > -1 && s.indexOf(ZERO) < s.indexOf(TAIL);

/* 1 ▸ create postcss.config.js when absent (CommonJS default) */
test('patchPostcssConfig creates postcss.config.js when no config exists', async () => {
	await runTest({}, async () => {
		await patchPostcssConfig();

		const cfg = readFile('postcss.config.js');
		assert.ok(cfg.includes(ZERO), 'Zero-UI plugin missing');
		assert.ok(cfg.includes(TAIL), 'Tailwind plugin missing');
		assert.ok(zeroBeforeTail(cfg), 'Zero-UI must precede Tailwind');
	});
});

/* 2 ▸ create postcss.config.mjs if package.json sets "type":"module"   */
test('patchPostcssConfig creates postcss.config.mjs for ESM package', async () => {
	await runTest({ 'package.json': '{ "name":"x", "type":"module" }' }, async () => {
		await patchPostcssConfig();

		const cfg = readFile('postcss.config.mjs');
		assert.ok(cfg.includes(ZERO), 'Zero-UI plugin missing');
		assert.ok(zeroBeforeTail(cfg), 'Zero-UI must precede Tailwind');
	});
});

/* 3 ▸ update existing config that lacks Zero-UI plugin                 */
test('patchPostcssConfig inserts Zero-UI before Tailwind in existing config', async () => {
	await runTest(
		{
			'postcss.config.js': `module.exports = {
  plugins: {
    "${TAIL}": {},
  },
};`,
		},
		async () => {
			await patchPostcssConfig();

			const cfg = readFile('postcss.config.js');

			assert.ok(cfg.includes(ZERO), 'Zero-UI plugin missing');
			assert.ok(zeroBeforeTail(cfg), 'Zero-UI must precede Tailwind');
		}
	);
});

/* 4 ▸ no-op when Zero-UI already present                               */
test('patchPostcssConfig is idempotent when Zero-UI plugin already present', async () => {
	const original = `module.exports = {
  plugins: {
    ${ZERO}: {},
    ${TAIL}: {},
  },
};`;

	await runTest({ 'postcss.config.js': original }, async () => {
		await patchPostcssConfig();
		assert.strictEqual(readFile('postcss.config.js'), original, 'Zero-UI plugin must be idempotent');
	});
});

test('patchViteConfig creates defineConfig setup when no plugin array exists', async () => {
	await runTest(
		{
			'vite.config.ts': `import { defineConfig } from 'vite';
export default defineConfig({ plugins: [] });`,
		},
		async () => {
			await patchViteConfig();
			const cfg = readFile('vite.config.ts');
			assert.ok(cfg.includes('@react-zero-ui/core/vite'), 'Zero-UI plugin missing');
			assert.ok(!cfg.includes('@tailwindcss/vite'), 'Tailwind should be removed');
		}
	);
});

test('patchViteConfig replaces Tailwind string literal', async () => {
	await runTest({ 'vite.config.js': `export default { plugins: ['${TAIL}'] };` }, async () => {
		await patchViteConfig();
		const cfg = readFile('vite.config.js');
		assert.ok(cfg.includes('@react-zero-ui/core/vite'), 'Zero-UI plugin missing');
		assert.ok(!cfg.includes('@tailwindcss/vite'), 'Tailwind should be removed');
	});
});

test('patchViteConfig replaces tailwindcss() call', async () => {
	await runTest(
		{
			'vite.config.mjs': `import tailwindcss from '${TAIL}';
export default { plugins: [react(),tailwindcss()] };`,
		},
		async () => {
			await patchViteConfig();
			const cfg = readFile('vite.config.mjs');
			assert.ok(cfg.includes('@react-zero-ui/core/vite'), 'Zero-UI plugin missing');
			assert.ok(!cfg.includes('@tailwindcss/vite'), 'Tailwind should be removed');
		}
	);
});
