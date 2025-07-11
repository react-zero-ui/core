const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('node:perf_hooks');
const { findAllSourceFiles } = require('../../dist/postcss/helpers.cjs');
const { collectUseUIHooks, extractVariants } = require('../../dist/postcss/ast-parsing.cjs');

const ComponentImports = readFile(path.join(__dirname, './fixtures/test-components.jsx'));
const AllPatternsComponent = readFile(path.join(__dirname, './fixtures/ts-test-components.tsx'));

const { parse } = require('@babel/parser');

// a helper to read a file and return the content
function readFile(path) {
	return fs.readFileSync(path, 'utf-8');
}
// Helper to create temp directory and run test
async function runTest(files, callback) {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-test-ast'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create test files
		for (const [filePath, content] of Object.entries(files)) {
			const dir = path.dirname(filePath);
			if (dir !== '.') {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(filePath, content);
		}

		// Run assertions
		await callback();
	} finally {
		process.chdir(originalCwd);

		// Clean up any generated files in the package directory
		fs.rmSync(testDir, { recursive: true, force: true });
	}
}

test('findAllSourceFiles', async () => {
	await runTest(
		{
			'src/components/Button.tsx': `
			import { Button } from '@zero-ui/core';
			export default Button;
		`,
			'src/components/Button.jsx': `
			import { Button } from '@zero-ui/core';
			export default Button;
		`,
		},
		async () => {
			const sourceFiles = findAllSourceFiles();
			assert.ok(sourceFiles.length > 0);
		}
	);
});

test('collectUseUIHooks - basic functionality', async () => {
	const sourceCode = `
		import { useUI } from '@react-zero-ui/core';

		const Component = () => {
			const [theme, setTheme] = useUI('theme', 'light');
			const [size, setSize] = useUI('size', 'medium');
			return <>
        <Button theme={theme} setTheme={setTheme("light")}  />
        <Button size={size} setSize={setSize("medium")} />
      </>;
		}
	`;

	const ast = parse(sourceCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
	const setters = collectUseUIHooks(ast);

	assert.strictEqual(setters[0].stateKey, 'theme');
	assert.strictEqual(setters[0].initialValue, 'light');
	assert.strictEqual(setters[1].stateKey, 'size');
	assert.strictEqual(setters[1].initialValue, 'medium');
});

test('Extract Variant without setter', async () => {
	// Read fixture file for proper syntax highlighting
	await runTest(
		{
			'src/app/Component.jsx': `
export function ComponentSimple() {
	const [, setTheme] = useUI('theme', 'light');
	const [, setSize] = useUI('size', 'medium');
	return (
		<div>
			<button onClick={() => setTheme('dark')} className="theme-light:bg-red-500 theme-dark:bg-blue-500 theme-blue:bg-green-500 theme-purple:bg-purple-500">setTheme</button>
			<button onClick={() => setSize('large')} className="size-medium:bg-red-500 size-large:bg-blue-500">setSize</button>
		</div>
	);
}
`,
		},

		async () => {
			const variants = extractVariants('src/app/Component.jsx');
			assert.strictEqual(variants.length, 2);
			assert.strictEqual(variants.length, 2);

			assert.ok(variants.some((v) => v.key === 'theme' && ['light', 'dark', 'blue', 'purple'].every((c) => v.values.includes(c))));

			assert.ok(variants.some((v) => v.key === 'size' && ['medium', 'large'].every((c) => v.values.includes(c))));
		}
	);
});

test('Extract Variant with imports and throw error', async () => {
	await runTest({ 'src/app/Component.jsx': ComponentImports }, async () => {
		assert.throws(() => {
			collectUseUIHooks(parse(ComponentImports, { sourceType: 'module', plugins: ['jsx', 'typescript'] }), ComponentImports);
			// tests that the error message contains the correct text
		}, /const VARSLocal = VARS/);
	});
});

test('testKeyInitialValue', async () => {
	await runTest({ 'src/app/Component.jsx': AllPatternsComponent }, async () => {
		const setters = collectUseUIHooks(parse(AllPatternsComponent, { sourceType: 'module', plugins: ['jsx', 'typescript'] }), AllPatternsComponent);
		assert.strictEqual(setters[0].stateKey, 'theme');
		assert.strictEqual(setters[0].initialValue, 'light');
		assert.strictEqual(setters[1].stateKey, 'altTheme');
		assert.strictEqual(setters[1].initialValue, 'dark');
		assert.strictEqual(setters[2].stateKey, 'variant');
		assert.strictEqual(setters[2].initialValue, 'th-dark');
		assert.strictEqual(setters[3].stateKey, 'size');
		assert.strictEqual(setters[3].initialValue, 'lg');
		assert.strictEqual(setters[4].stateKey, 'mode');
		assert.strictEqual(setters[4].initialValue, 'auto');
		assert.strictEqual(setters[5].stateKey, 'color');
		assert.strictEqual(setters[5].initialValue, 'bg-blue');
		assert.strictEqual(setters[6].initialValue, 'th-dark');
		assert.strictEqual(setters[7].initialValue, 'th-blue');
		assert.strictEqual(setters[8].initialValue, 'th-blue-inverse');
		assert.strictEqual(setters[9].initialValue, 'blue-inverse');
		assert.strictEqual(setters[10].initialValue, 'blue-th-dark');
		assert.strictEqual(setters[11].initialValue, 'th-blue-th-dark');
		assert.strictEqual(setters[12].initialValue, 'th-light');
		assert.strictEqual(setters[13].initialValue, 'blue');
	});
});

test('conditional setterFn value', async () => {
	await runTest(
		{
			'src/app/Component.jsx': `
const COLORS = { primary: 'blue', secondary: 'green' } as const;
const VARIANTS = { dark: \`th-\${DARK}\`, light: COLORS.primary } as const;

const isMobile = false;

function TestComponent() {
	const [theme, setTheme] = useUI('theme', 'light');
	const [variant, setVariant] = useUI('variant', 'th-light');
	const [variant2, setVariant2] = useUI('variant2', 'th-light');


			setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
			setVariant(isMobile ? VARIANTS.light : 'th-light');
		  setVariant2(isMobile ? VARIANTS?.light : 'th-light');
}
`,
		},
		async () => {
			const variants = extractVariants('src/app/Component.jsx');
			assert.strictEqual(variants.length, 3);
		}
	);
});

test('cache performance', async () => {
	// Simple inline component with a few useUI hooks, no conflicting constants
	const simpleComponent = `
		import { useUI } from '@zero-ui/core';
		const DARK = 'dark' as const;
		const PREFIX = \`th-\${DARK}\` as const;
		const SIZES = { small: 'sm', large: 'lg' } as const;
		const MODES = ['auto', 'manual'] as const;

		const COLORS = { primary: 'blue', secondary: 'green' } as const;
		const VARIANTS = { dark: \`th-\${DARK}\`, light: COLORS.primary } as const;
		function TestComponent() {
		/* ① literal */
	const [theme, setTheme] = useUI('theme', 'light');
	/* ② identifier */
	const [altTheme, setAltTheme] = useUI('altTheme', DARK);
	/* ③ static template literal */
	const [variant, setVariant] = useUI('variant', PREFIX);
	/* ④ object-member */
	const [size, setSize] = useUI('size', SIZES.large);
	/* ⑤ array-index */
	const [mode, setMode] = useUI('mode', MODES[0]);
	/* ⑥ nested template + member */
	const [color, setColor] = useUI('color', \`bg-\${COLORS.primary}\`);
	/* ⑦ object-member */
	const [variant2, setVariant2] = useUI('variant', VARIANTS.dark);

	

			return <div onClick={() => setTheme('dark')}>Test</div>;
		}
	`;

	await runTest({ 'src/Component.jsx': simpleComponent }, async () => {
		const filePath = 'src/Component.jsx';

		console.log('=== FIRST CALL ===');
		const start1 = performance.now();
		const result1 = extractVariants(filePath);
		const firstCall = performance.now() - start1;

		console.log('=== SECOND CALL ===');
		const start2 = performance.now();
		const result2 = extractVariants(filePath);
		const secondCall = performance.now() - start2;

		console.log('=== THIRD CALL ===');
		const start3 = performance.now();
		const result3 = extractVariants(filePath);
		const thirdCall = performance.now() - start3;

		console.log(`First call: ${firstCall.toFixed(2)}ms`);
		console.log(`Second call: ${secondCall.toFixed(2)}ms`);
		console.log(`Third call: ${thirdCall.toFixed(2)}ms`);

		if (secondCall < firstCall) {
			console.log(`Speedup: ${(firstCall / secondCall).toFixed(1)}x faster`);
		}

		assert.strictEqual(result1, result2);
		assert.strictEqual(result2, result3);
	});
});
