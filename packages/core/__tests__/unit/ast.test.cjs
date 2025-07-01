const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { findAllSourceFiles } = require('../../dist/postcss/helpers.cjs');
const { collectUseUISetters, extractVariants } = require('../../dist/postcss/ast-v2.cjs');

const { parse } = require('@babel/parser');

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
			console.log('sourceFiles: ', sourceFiles);
			assert.ok(sourceFiles.length > 0);
		}
	);
});

test('collectUseUISetters - basic functionality', async () => {
	const sourceCode = `
		import { useUI } from '@react-zero-ui/core';

		const Component = () => {
			const [theme, setTheme] = useUI('theme', 'light');
			const [size, setSize] = useUI('size', 'medium');
			return <>
        <Button theme={theme} setTheme={setTheme("light")} />
        <Button size={size} setSize={setSize("medium")} />
      </>;
		}
	`;

	const ast = parse(sourceCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
	const setters = collectUseUISetters(ast);
	console.log('setters: ', setters);

	assert.strictEqual(setters[0].stateKey, 'theme');
	assert.strictEqual(setters[0].initialValue, 'light');
	assert.strictEqual(setters[1].stateKey, 'size');
	assert.strictEqual(setters[1].initialValue, 'medium');
});

test('Extract Variants', async () => {
	await runTest(
		{
			'src/app/Component.jsx': `
  import { useUI } from '@react-zero-ui/core';
const Component = () => {
	const [, setTheme] = useUI('theme', 'light');
	const [, setSize] = useUI('size', 'medium');
	return (
		<div>
			<button onClick={() => setTheme('dark')}>setTheme</button>
			<button onClick={() => setSize('large')}>setSize</button>
		</div>
	);
};
export default Component;
  `,
		},

		async () => {
			const variants = extractVariants('src/app/Component.jsx');
			console.log('variants: ', variants);
			assert.strictEqual(variants.length, 2);
			assert.ok(variants.some((v) => v.key === 'theme' && v.values.includes('light') && v.values.includes('dark')));
			assert.ok(variants.some((v) => v.key === 'size' && v.values.includes('medium') && v.values.includes('large')));
		}
	);
});

test('Extract Variant without setter', async () => {
	await runTest(
		{
			'src/app/Component.jsx': `
  import { useUI } from '@react-zero-ui/core';
const Component = () => {
	const [, setTheme] = useUI('theme', 'light');
	const [, setSize] = useUI('size', 'medium');
	return (
		<div>
			 
		</div>
	);
};
export default Component;
  `,
		},

		async () => {
			const variants = extractVariants('src/app/Component.jsx');
			console.log('variants without setter: ', variants);
			assert.strictEqual(variants.length, 2);
			assert.ok(variants.some((v) => v.key === 'theme' && v.values.includes('light')));
			assert.ok(variants.some((v) => v.key === 'size' && v.values.includes('medium')));
		}
	);
});
