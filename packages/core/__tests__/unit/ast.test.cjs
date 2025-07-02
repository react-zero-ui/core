const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// const { findAllSourceFiles } = require('../../dist/postcss/helpers.cjs');
const { collectUseUISetters } = require('../../dist/postcss/ast-v2.cjs');

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

// test('findAllSourceFiles', async () => {
// 	await runTest(
// 		{
// 			'src/components/Button.tsx': `
// 			import { Button } from '@zero-ui/core';
// 			export default Button;
// 		`,
// 			'src/components/Button.jsx': `
// 			import { Button } from '@zero-ui/core';
// 			export default Button;
// 		`,
// 		},
// 		async () => {
// 			const sourceFiles = findAllSourceFiles();
// 			assert.ok(sourceFiles.length > 0);
// 		}
// 	);
// });

// test('collectUseUISetters - basic functionality', async () => {
// 	const sourceCode = `
// 		import { useUI } from '@react-zero-ui/core';

// 		const Component = () => {
// 			const [theme, setTheme] = useUI('theme', 'light');
// 			const [size, setSize] = useUI('size', 'medium');
// 			return <>
//         <Button theme={theme} setTheme={setTheme("light")} />
//         <Button size={size} setSize={setSize("medium")} />
//       </>;
// 		}
// 	`;

// 	const ast = parse(sourceCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
// 	const setters = collectUseUISetters(ast);

// 	assert.strictEqual(setters[0].stateKey, 'theme');
// 	assert.strictEqual(setters[0].initialValue, 'light');
// 	assert.strictEqual(setters[1].stateKey, 'size');
// 	assert.strictEqual(setters[1].initialValue, 'medium');
// });

// test('Extract Variants', async () => {
// 	// Read fixture file for proper syntax highlighting
// 	const fixtureContent = fs.readFileSync(path.join(__dirname, './fixtures/TestComponent1.jsx'), 'utf-8');

// 	await runTest(
// 		{ 'src/app/Component.jsx': fixtureContent },

// 		async () => {
// 			const variants = extractVariants('src/app/Component.jsx');
// 			assert.strictEqual(variants.length, 2);
// 			assert.ok(variants.some((v) => v.key === 'theme' && v.values.includes('light') && v.values.includes('dark')));
// 			assert.ok(variants.some((v) => v.key === 'size' && v.values.includes('medium') && v.values.includes('large')));
// 		}
// 	);
// });

// test('Extract Variant without setter', async () => {
// 	// Read fixture file for proper syntax highlighting
// 	const fixtureContent = fs.readFileSync(path.join(__dirname, './fixtures/TestComponent2.jsx'), 'utf-8');

// 	await runTest(
// 		{ 'src/app/Component.jsx': fixtureContent },

// 		async () => {
// 			const variants = extractVariants('src/app/Component.jsx');
// 			assert.strictEqual(variants.length, 2);
// 			assert.ok(variants.some((v) => v.key === 'theme' && v.values.includes('light')));
// 			assert.ok(variants.some((v) => v.key === 'size' && v.values.includes('medium')));
// 		}
// 	);
// });

test('Extract Variant with imports and throw error', async () => {
	await runTest({ 'src/app/Component.jsx': ComponentImports }, async () => {
		assert.throws(() => {
			collectUseUISetters(parse(ComponentImports, { sourceType: 'module', plugins: ['jsx', 'typescript'] }), ComponentImports);
			// tests that the error message contains the correct text
		}, /const VARSLocal = VARS/);
	});
});

test('testKeyInitialValue', async () => {
	await runTest({ 'src/app/Component.jsx': AllPatternsComponent }, async () => {
		const setters = collectUseUISetters(parse(AllPatternsComponent, { sourceType: 'module', plugins: ['jsx', 'typescript'] }), AllPatternsComponent);
		console.log('setters: ', setters);
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
		assert.strictEqual(setters[6].stateKey, 'variant');
		assert.strictEqual(setters[6].initialValue, 'th-dark');
		assert.strictEqual(setters[7].stateKey, 'variant');
		assert.strictEqual(setters[7].initialValue, 'th-blue');
	});
});
