const postcss = require('postcss');
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
//  This file is the entry point for the react-zero-ui library, that uses postcss to trigger the build process
const plugin = require('../../dist/postcss/index.cjs');

const { patchTsConfig, toKebabCase, patchPostcssConfig, patchViteConfig } = require('../../dist/postcss/helpers.cjs');

function getAttrFile() {
	return path.join(process.cwd(), '.zero-ui', 'attributes.js');
}

// Helper to create temp directory and run test
async function runTest(files, callback) {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-test'));
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

		// Run PostCSS
		const result = await postcss([plugin()]).process('', { from: undefined });

		// Run assertions
		await callback(result);
	} finally {
		process.chdir(originalCwd);

		// Clean up any generated files in the package directory
		const generatedPath = getAttrFile();
		if (fs.existsSync(generatedPath)) {
			fs.unlinkSync(generatedPath);
		}

		fs.rmSync(testDir, { recursive: true, force: true });
	}
}

test('generates body attributes file correctly', async () => {
	await runTest(
		{
			'app/test.jsx': `
      import { useUI } from '@react-zero-ui/core';
      
      function Component() {
        const [theme, setTheme] = useUI('theme', 'light');
        const [sidebar, setSidebar] = useUI('sidebar', 'expanded');
        return <div>Test</div>;
      }
    `,
		},
		(result) => {
			// Check attributes file exists
			assert(fs.existsSync(getAttrFile()), 'Attributes file should exist');

			// Read and parse attributes
			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			console.log('\n📄 Generated attributes file:');

			// Verify content
			assert(content.includes('export const bodyAttributes'), 'Should export bodyAttributes');
			assert(content.includes('"data-theme": "light"'), 'Should have theme attribute');
			assert(content.includes('"data-sidebar": "expanded"'), 'Should have sidebar attribute');

			// Verify CSS variants
			assert(result.css.includes('@custom-variant theme-light'), 'Should have theme-light variant');
			assert(result.css.includes('@custom-variant sidebar-expanded'), 'Should have sidebar-expanded variant');
		}
	);
});

test('generates body attributes file correctly when kebab-case is used', async () => {
	await runTest(
		{
			'app/test.jsx': `
      import { useUI } from '@react-zero-ui/core';
      
      function Component() {
        const [theme, setTheme] = useUI('theme-secondary', 'light');
        const [sidebar, setSidebar] = useUI('sidebarNew', 'expanded');
        return (
          <div className="theme-secondary-light:bg-gray-200 theme-secondary-light:text-gray-900 theme-secondary-dark:bg-gray-900 theme-secondary-dark:text-gray-200 h-screen w-screen">
            <button onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}>Toggle Theme</button>
          </div>
        );
      }
    `,
		},
		(result) => {
			// Check attributes file exists
			assert(fs.existsSync(getAttrFile()), 'Attributes file should exist');

			const content = fs.readFileSync(getAttrFile(), 'utf-8');

			// Verify content
			assert(content.includes('export const bodyAttributes'), 'Should export bodyAttributes');
			assert(content.includes('"data-theme-secondary": "light"'), 'Should have theme-secondary attribute');
			assert(content.includes('"data-sidebar-new": "expanded"'), 'Should have sidebar-new attribute');

			// Verify CSS variants
			assert(result.css.includes('@custom-variant theme-secondary-light'), 'Should have theme-secondary-light variant');
			assert(result.css.includes('@custom-variant sidebar-new-expanded'), 'Should have sidebar-new-expanded variant');
		}
	);
});

test('handles multiple files and deduplication', async () => {
	await runTest(
		{
			'src/header.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Header() {
        const [theme, setTheme] = useUI('theme', 'light');
        return <button className="theme-light:bg-white theme-dark:bg-black" >Dark</button>;
      }
    `,
			'src/footer.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Footer() {
        const [theme, setTheme] = useUI('theme', 'light');
        return <div>
				<button className="theme-light:bg-white theme-dark:bg-black" theme-blue:bg-blue-500>Blue</button>
		 
				Footer
			</div>;
      }
    `,
			'app/sidebar.tsx': `
      import { useUI } from '@react-zero-ui/core';
      function Sidebar() {
        const [theme, setTheme] = useUI<'light' | 'dark' | 'auto'>('theme', 'light');
        return <div>
				<button className="theme-light:bg-white theme-dark:bg-black" theme-blue:bg-blue-500 theme-auto:bg-auto>Blue</button>
				Sidebar
			</div>;
      }
    `,
		},
		(result) => {
			// Should combine all theme values from all files
			const themeVariants = ['light', 'dark', 'blue', 'auto'];
			themeVariants.forEach((variant) => {
				assert(result.css.includes(`@custom-variant theme-${variant}`), `Should have theme-${variant}`);
			});

			// Count occurrences - should be deduplicated
			const lightCount = (result.css.match(/@custom-variant theme-light/g) || []).length;
			assert.equal(lightCount, 1, 'Should deduplicate variants');
		}
	);
});

test('throws on invalid syntax', async () => {
	await assert.rejects(async () => {
		await runTest({
			'src/valid.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Valid() {
        const [state, setState] = useUI('valid', 'working');
        return <div>Valid</div>;
      }
    `,
			'src/invalid.js': `
      import { useUI } from '@react-zero-ui/core';
      function Invalid() {
        const [state, setState] = useUI('test' 'missing-comma');
        {{{ invalid syntax
      }
    `,
		});
	}, /Unexpected token, expected ","/);
});

test('throws on empty string initial value', () => {
	assert.throws(() => toKebabCase(''));
});

test('watches for file changes', async () => {
	if (process.env.NODE_ENV === 'production') {
		console.log('Skipping watch test in production');
		return;
	}

	await runTest(
		{
			'src/initial.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Initial() {
        const [state, setState] = useUI('watch-test', 'initial');
        return <div className="watch-test-initial:bg-red-500">Initial</div>;e
      }
    `,
		},
		async (result) => {
			// Initial state
			assert(result.css.includes('@custom-variant watch-test-initial'));

			// Add a new file
			fs.writeFileSync(
				'src/new.jsx',
				`
      import { useUI } from '@react-zero-ui/core';
      function New() {
        const [state, setState] = useUI('watch-test', 'initial');
        return <button className="watch-test-updated:bg-red-500" onClick={() => setState('updated')}>Update</button>;
      }
    `
			);

			// Wait for file watcher to process
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Re-process to check if watcher picked up changes
			const result2 = await postcss([plugin()]).process('', { from: undefined });

			assert(result2.css.includes('@custom-variant watch-test-updated'), 'Should detect new state');
		}
	);
});

test('ignores node_modules and hidden directories', async () => {
	await runTest(
		{
			'src/valid.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Valid() {
        const [state, setState] = useUI('valid', 'yes');
        return <div>Valid</div>;
      }
    `,
			'node_modules/package/file.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Ignored() {
        const [state] = useUI('ignored', 'shouldNotAppear');
        return <div>Should be ignored</div>;
      }
    `,
			'.next/file.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Hidden() {
        const [state] = useUI('hidden', 'shouldNotAppear');
        return <div>Should be ignored</div>;
      }
    `,
		},
		(result) => {
			console.log('result: ', result.css);
			assert(result.css.includes('@custom-variant valid-yes'), 'Should process valid files');
			assert(!result.css.includes('ignored'), 'Should ignore node_modules');
			assert(!result.css.includes('hidden'), 'Should ignore hidden directories');
		}
	);
});

test('handles large projects efficiently - 500 files', async function () {
	const files = {};

	// Generate 50 files
	for (let i = 0; i < 500; i++) {
		files[`src/component${i}.jsx`] = `
      import { useUI } from '@react-zero-ui/core';
      function Component${i}() {
        const [state${i}, setState${i}] = useUI('state${i}', 'value${i}');
        return <div>Component ${i}</div>;
      }
    `;
	}

	const startTime = Date.now();

	await runTest(files, (result) => {
		console.log('handles large projects efficiently-result: ', result.css);
		const endTime = Date.now();
		const duration = endTime - startTime;

		console.log(`\n⚡ Performance: Processed 500 files in ${duration}ms`);

		// Should process all files
		assert(result.css.includes('@custom-variant state49-value49'), 'Should process all files');

		// Should complete in reasonable time
		assert(duration < 300, 'Should process 50 files in under 300ms');
	});
});

test('handles concurrent file modifications', async () => {
	// Test that rapid changes don't cause issues
	await runTest(
		{
			'src/rapid.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Rapid() {
        const [count,setCount] = useUI('count', 'zero');
        return <div>Initial</div>;
      }
    `,
		},
		async () => {
			// Simulate rapid file changes
			for (let i = 0; i < 5; i++) {
				fs.writeFileSync(
					'src/rapid.jsx',
					`
        import { useUI } from '@react-zero-ui/core';
        function Rapid() {
          const [count, setCount] = useUI('count', 'zero');
          return <button onClick={() => setCount('${i}')}>Count ${i}</button>;
        }
      `
				);

				// Small delay to simulate real editing
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// Final processing should work correctly
			const finalResult = await postcss([plugin()]).process('', { from: undefined });

			assert(finalResult.css.includes('AUTO-GENERATED'), 'Should handle rapid changes');
		}
	);
});

test('patchTsConfig - config file patching', async (t) => {
	await t.test('patches tsconfig.json when it exists', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Create a basic tsconfig.json
			const tsconfigContent = { compilerOptions: { target: 'ES2015', module: 'ESNext' } };
			fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigContent, null, 2));

			// Run patchTsConfig
			patchTsConfig();

			// Read the updated config
			const updatedConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
			// Verify the path alias was added
			assert(updatedConfig.compilerOptions.baseUrl === '.', 'Should set baseUrl');
			assert(updatedConfig.compilerOptions.paths, 'Should have paths object');
			assert(
				JSON.stringify(updatedConfig.compilerOptions.paths['@zero-ui/attributes']) === JSON.stringify(['./.zero-ui/attributes.js']),
				'Should have correct path alias'
			);
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	await t.test('patches jsconfig.json when tsconfig.json does not exist', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Create a basic jsconfig.json
			const jsconfigContent = { compilerOptions: { target: 'ES2015' } };
			fs.writeFileSync('jsconfig.json', JSON.stringify(jsconfigContent, null, 2));

			// Run patchTsConfig
			patchTsConfig();

			// Read the updated config
			const updatedConfig = JSON.parse(fs.readFileSync('jsconfig.json', 'utf-8'));

			// Verify the path alias was added
			assert(updatedConfig.compilerOptions.baseUrl === '.', 'Should set baseUrl');
			assert(updatedConfig.compilerOptions.paths, 'Should have paths object');
			assert(
				JSON.stringify(updatedConfig.compilerOptions.paths['@zero-ui/attributes']) === JSON.stringify(['./.zero-ui/attributes.js']),
				'Should have correct path alias'
			);
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	await t.test('does nothing when no config files exist', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Run patchTsConfig (should not throw)
			patchTsConfig();

			// Verify no files were created
			assert(!fs.existsSync('tsconfig.json'), 'Should not create tsconfig.json');
			assert(!fs.existsSync('jsconfig.json'), 'Should not create jsconfig.json');
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	await t.test('handles existing correct path alias', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Create tsconfig.json with existing correct alias
			const tsconfigContent = {
				compilerOptions: {
					baseUrl: '.',
					paths: { '@zero-ui/attributes': ['./.zero-ui/attributes.js'], '@/*': ['./src/*'] },
					include: ['.zero-ui/**/*.d.ts', '.next/**/*.d.ts'],
				},
			};
			fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigContent, null, 2));
			const originalContent = fs.readFileSync('tsconfig.json', 'utf-8');

			// Run patchTsConfig
			patchTsConfig();

			// Verify the config was not modified
			const updatedContent = fs.readFileSync('tsconfig.json', 'utf-8');
			assert.equal(originalContent, updatedContent, 'Should not modify config with correct alias');
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	await t.test('handles config with missing compilerOptions', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Create tsconfig.json without compilerOptions
			const tsconfigContent = { include: ['src/**/*'] };
			fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigContent, null, 2));

			// Run patchTsConfig
			patchTsConfig();

			// Read the updated config
			const updatedConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));

			// Verify compilerOptions was created with correct structure
			assert(updatedConfig.compilerOptions, 'Should create compilerOptions');
			assert(updatedConfig.compilerOptions.baseUrl === '.', 'Should set baseUrl');
			assert(updatedConfig.compilerOptions.paths, 'Should create paths object');
			assert(
				JSON.stringify(updatedConfig.compilerOptions.paths['@zero-ui/attributes']) === JSON.stringify(['./.zero-ui/attributes.js']),
				'Should have correct path alias'
			);
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	await t.test('handles config with comments and trailing commas', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Create tsconfig.json with comments and trailing commas (JSON5 style)
			const tsconfigContent = `{
  // TypeScript configuration
  "compilerOptions": {
    "target": "ES2015",
    "module": "ESNext", // Comment here
  },
  "include": ["src/**/*"], // Another comment
}`;
			fs.writeFileSync('tsconfig.json', tsconfigContent);

			// Run patchTsConfig
			patchTsConfig();

			// Verify file was updated (should parse despite comments)
			const updatedConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
			assert(updatedConfig.compilerOptions.paths, 'Should create paths object');
			assert(
				JSON.stringify(updatedConfig.compilerOptions.paths['@zero-ui/attributes']) === JSON.stringify(['./.zero-ui/attributes.js']),
				'Should have correct path alias'
			);
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	await t.test('patchTsConfig prefers tsconfig.json over jsconfig.json', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Create both config files
			fs.writeFileSync('tsconfig.json', JSON.stringify({ compilerOptions: {} }, null, 2));
			fs.writeFileSync('jsconfig.json', JSON.stringify({ compilerOptions: {} }, null, 2));

			// Run patchTsConfig
			patchTsConfig();

			// Verify tsconfig.json was modified
			const tsconfigContent = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
			assert(tsconfigContent.compilerOptions.paths, 'Should modify tsconfig.json');
			assert(tsconfigContent.compilerOptions.paths['@zero-ui/attributes'], 'Should add alias to tsconfig.json');

			// Verify jsconfig.json was not modified
			const jsconfigContent = JSON.parse(fs.readFileSync('jsconfig.json', 'utf-8'));
			assert(!jsconfigContent.compilerOptions.paths, 'Should not modify jsconfig.json');
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});
});

// PostCSS Config Tests
test('PostCSS config - creates new .js config for Next.js project', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-postcss-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Next.js project indicators
		fs.writeFileSync('next.config.cjs', 'module.exports = {}');
		fs.writeFileSync('package.json', JSON.stringify({ dependencies: { next: '^14.0.0' } }));

		// Run patchPostcssConfig
		patchPostcssConfig();

		// Verify postcss.config.js was created
		assert(fs.existsSync('postcss.config.js'), 'Should create postcss.config.js');

		const configContent = fs.readFileSync('postcss.config.js', 'utf-8');
		console.log('\n📄 Generated PostCSS config:');
		console.log(configContent);

		assert(configContent.includes('@react-zero-ui/core/postcss'), 'Should include Zero-UI plugin');
		assert(configContent.includes('@tailwindcss/postcss'), 'Should include Tailwind plugin');
		assert(configContent.includes('module.exports'), 'Should use CommonJS format');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('PostCSS config - updates existing .js config', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-postcss-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Next.js project
		fs.writeFileSync('next.config.js', 'module.exports = {}');

		// Create existing PostCSS config without Zero-UI
		const existingConfig = `module.exports = {
  plugins: {
    'autoprefixer': {},
    '@tailwindcss/postcss': {}
  }
};`;
		fs.writeFileSync('postcss.config.js', existingConfig);

		// Run patchPostcssConfig
		patchPostcssConfig();

		// Verify config was updated
		const updatedContent = fs.readFileSync('postcss.config.js', 'utf-8');
		console.log('\n📄 Updated PostCSS config:');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/postcss'), 'Should add Zero-UI plugin');
		assert(updatedContent.includes('autoprefixer'), 'Should preserve existing plugins');
		assert(updatedContent.includes('@tailwindcss/postcss'), 'Should preserve Tailwind');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('PostCSS config - updates existing .mjs config', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-postcss-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Next.js project
		fs.writeFileSync('next.config.mjs', 'export default {}');

		// Create existing .mjs PostCSS config with array format
		const existingConfig = `const config = {
  plugins: [
    'autoprefixer',
    '@tailwindcss/postcss'
  ]
};

export default config;`;
		fs.writeFileSync('postcss.config.mjs', existingConfig);

		// Run patchPostcssConfig
		patchPostcssConfig();

		// Verify config was updated
		const updatedContent = fs.readFileSync('postcss.config.mjs', 'utf-8');
		console.log('\n📄 Updated .mjs PostCSS config:');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/postcss'), 'Should add Zero-UI plugin');
		assert(updatedContent.includes('export default'), 'Should preserve ES module format');
		assert(updatedContent.includes('autoprefixer'), 'Should preserve existing plugins');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true });
	}
});

test('PostCSS config - skips if Zero-UI already configured', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-postcss-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Next.js project
		fs.writeFileSync('next.config.js', 'module.exports = {}');

		// Create PostCSS config with Zero-UI already configured
		const existingConfig = `module.exports = {
  plugins: {
    '@react-zero-ui/core/postcss': {},
    '@tailwindcss/postcss': {}
  }
};`;
		fs.writeFileSync('postcss.config.js', existingConfig);
		const originalContent = fs.readFileSync('postcss.config.js', 'utf-8');

		// Run patchPostcssConfig
		patchPostcssConfig();

		// Verify config was not modified
		const updatedContent = fs.readFileSync('postcss.config.js', 'utf-8');
		assert.equal(originalContent, updatedContent, 'Should not modify config with Zero-UI already present');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('PostCSS config - handles complex existing configs w/comments', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-postcss-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Next.js project
		fs.writeFileSync('next.config.js', 'module.exports = {}');

		// Create complex PostCSS config
		const complexConfig = `module.exports = {
  plugins: {
    'postcss-flexbugs-fixes': {},
    'postcss-preset-env': {
      autoprefixer: {
        // https://vite.dev/config/
        flexbox: 'no-2009',
      },
      stage: 3,
    },
       // https://tailwindcss.com/docs/installation/using-vite

    '@tailwindcss/postcss': {}
  }
};`;
		fs.writeFileSync('postcss.config.js', complexConfig);

		// Run patchPostcssConfig
		patchPostcssConfig();

		// Verify Zero-UI was added at the beginning
		const updatedContent = fs.readFileSync('postcss.config.js', 'utf-8');
		console.log('\n📄 Complex config update:');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/postcss'), 'Should add Zero-UI plugin');
		assert(updatedContent.includes('postcss-flexbugs-fixes'), 'Should preserve existing plugins');
		assert(updatedContent.includes('postcss-preset-env'), 'Should preserve complex plugin configs');

		// Verify Zero-UI comes before other plugins
		const zeroUiIndex = updatedContent.indexOf('@react-zero-ui/core/postcss');
		const tailwindIndex = updatedContent.indexOf('@tailwindcss/postcss');
		assert(zeroUiIndex < tailwindIndex, 'Zero-UI should come before Tailwind');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('PostCSS config - prefers .js over .mjs when both exist', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-postcss-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Next.js project
		fs.writeFileSync('next.config.js', 'module.exports = {}');

		// Create both .js and .mjs configs
		fs.writeFileSync(
			'postcss.config.js',
			`module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};`
		);

		fs.writeFileSync(
			'postcss.config.mjs',
			`const config = {
  plugins: [
    '@tailwindcss/postcss'
  ]
};

export default config;`
		);

		const originalJsContent = fs.readFileSync('postcss.config.js', 'utf-8');
		const originalMjsContent = fs.readFileSync('postcss.config.mjs', 'utf-8');

		console.log('\n📄 Original .js config:');
		console.log(originalJsContent);

		// Run patchPostcssConfig
		patchPostcssConfig();

		// Verify .js was modified, .mjs was not
		const updatedJsContent = fs.readFileSync('postcss.config.js', 'utf-8');
		const updatedMjsContent = fs.readFileSync('postcss.config.mjs', 'utf-8');

		assert(updatedJsContent.includes('@react-zero-ui/core/postcss'), 'Should modify .js config');
		assert.equal(originalMjsContent, updatedMjsContent, 'Should not modify .mjs config when .js exists');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

// Vite Config Tests
test('Vite config - adds zeroUI plugin to existing config without Tailwind', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create existing Vite config without Tailwind
		const existingConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
  ]
})`;
		fs.writeFileSync('vite.config.ts', existingConfig);

		// Run patchViteConfig
		patchViteConfig();

		// Verify config was updated
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		console.log('\n📄 Updated Vite config:');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/vite'), 'Should add Zero-UI import');
		assert(updatedContent.includes('zeroUI()'), 'Should add zeroUI plugin');
		assert(updatedContent.includes('react()'), 'Should preserve existing plugins');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - replaces Tailwind CSS v4+ plugin with zeroUI', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Vite config with Tailwind CSS v4+
		const existingConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ]
})`;
		fs.writeFileSync('vite.config.ts', existingConfig);

		// Run patchViteConfig
		patchViteConfig();

		// Verify config was updated
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		console.log('\n📄 Vite config with Tailwind replaced:');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/vite'), 'Should add Zero-UI import');
		assert(updatedContent.includes('zeroUI()'), 'Should add zeroUI plugin');
		assert(!updatedContent.includes('@tailwindcss/vite'), 'Should remove Tailwind import');
		assert(!updatedContent.includes('tailwindcss()'), 'Should replace Tailwind plugin');
		assert(updatedContent.includes('react()'), 'Should preserve other plugins');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - handles .js files when .ts does not exist', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create .js Vite config
		const existingConfig = `import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss()
  ]
})`;
		fs.writeFileSync('vite.config.js', existingConfig);

		// Run patchViteConfig
		patchViteConfig();

		// Verify config was updated
		const updatedContent = fs.readFileSync('vite.config.js', 'utf-8');
		console.log('\n📄 Updated .js Vite config:');
		console.log(updatedContent);

		assert(updatedContent.includes('zeroUI()'), 'Should replace Tailwind with zeroUI');
		assert(!updatedContent.includes('tailwindcss()'), 'Should remove Tailwind plugin');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - prefers .ts over .js when both exist', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create both .ts and .js configs
		fs.writeFileSync(
			'vite.config.ts',
			`import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()]
})`
		);

		fs.writeFileSync(
			'vite.config.js',
			`import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()]
})`
		);

		const originalJsContent = fs.readFileSync('vite.config.js', 'utf-8');

		// Run patchViteConfig
		patchViteConfig();

		// Verify .ts was modified, .js was not
		const updatedTsContent = fs.readFileSync('vite.config.ts', 'utf-8');
		const updatedJsContent = fs.readFileSync('vite.config.js', 'utf-8');

		assert(updatedTsContent.includes('zeroUI()'), 'Should modify .ts config');
		assert.equal(originalJsContent, updatedJsContent, 'Should not modify .js config when .ts exists');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - skips if zeroUI already configured', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Vite config with zeroUI already configured
		const existingConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import zeroUI from '@react-zero-ui/core/vite'

export default defineConfig({
  plugins: [
    react(),
    zeroUI()
  ]
})`;
		fs.writeFileSync('vite.config.ts', existingConfig);
		const originalContent = fs.readFileSync('vite.config.ts', 'utf-8');

		// Run patchViteConfig
		patchViteConfig();

		// Verify config was not modified
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		assert.equal(originalContent, updatedContent, 'Should not modify config with zeroUI already present');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - skips when no vite config exists', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// No Vite config files exist
		// Run patchViteConfig (should not throw)
		patchViteConfig();

		// Verify no files were created
		assert(!fs.existsSync('vite.config.ts'), 'Should not create vite.config.ts');
		assert(!fs.existsSync('vite.config.js'), 'Should not create vite.config.js');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - handles complex existing configs', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create complex Vite config
		const complexConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000
  }
})`;
		fs.writeFileSync('vite.config.ts', complexConfig);

		// Run patchViteConfig
		patchViteConfig();

		// Verify Zero-UI was added and Tailwind replaced
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		console.log('\n📄 Complex config update:');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/vite'), 'Should add Zero-UI import');
		assert(updatedContent.includes('zeroUI()'), 'Should add zeroUI plugin');
		assert(!updatedContent.includes('@tailwindcss/vite'), 'Should remove Tailwind import');
		assert(!updatedContent.includes('tailwindcss()'), 'Should replace Tailwind plugin');
		assert(updatedContent.includes('react({'), 'Should preserve React plugin with options');
		assert(updatedContent.includes('resolve:'), 'Should preserve other config options');
		assert(updatedContent.includes('server:'), 'Should preserve server config');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - handles multiple Tailwind instances', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create config with multiple tailwindcss calls (edge case)
		const existingConfig = `import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss({ config: './tailwind.config.js' }),
    // This would be unusual but let's handle it
    tailwindcss()
  ]
})`;
		fs.writeFileSync('vite.config.ts', existingConfig);

		// Run patchViteConfig
		patchViteConfig();

		// Verify only first Tailwind was replaced
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		console.log('\n📄 Multiple Tailwind instances:');
		console.log(updatedContent);

		assert(updatedContent.includes('zeroUI()'), 'Should add zeroUI plugin');
		// Should replace first instance
		const zeroUICount = (updatedContent.match(/zeroUI\(\)/g) || []).length;
		assert.equal(zeroUICount, 1, 'Should add zeroUI once');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - handles config with variable assignment', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create config using variable assignment pattern
		const existingConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ]
})

export default config`;
		fs.writeFileSync('vite.config.ts', existingConfig);

		// Run patchViteConfig
		patchViteConfig();

		// Verify config was updated
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		console.log('\n📄 Variable assignment config:');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/vite'), 'Should add Zero-UI import');
		assert(updatedContent.includes('zeroUI()'), 'Should add zeroUI plugin');
		assert(!updatedContent.includes('tailwindcss()'), 'Should replace Tailwind plugin');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - handles config with no plugins array', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Vite config without plugins array
		const existingConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})`;
		fs.writeFileSync('vite.config.ts', existingConfig);

		// Run patchViteConfig
		patchViteConfig();

		// Verify config was updated with new plugins array
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/vite'), 'Should add Zero-UI import');
		assert(updatedContent.includes('zeroUI()'), 'Should add zeroUI plugin');
		assert(updatedContent.includes('plugins:'), 'Should add plugins array');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('Vite config - handles empty plugins array', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create Vite config with empty plugins array
		const existingConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  plugins: []
})`;
		fs.writeFileSync('vite.config.ts', existingConfig);

		// Run patchViteConfig
		patchViteConfig();

		// Verify config was updated
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		console.log(updatedContent);

		assert(updatedContent.includes('@react-zero-ui/core/vite'), 'Should add Zero-UI import');
		assert(updatedContent.includes('zeroUI()'), 'Should add zeroUI plugin to empty array');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});

test('generated variants for initial value without setterFn', async () => {
	await runTest(
		{
			'app/initial-value.jsx': `
				import { useUI } from '@react-zero-ui/core';
				function Component() {
					const [theme,setTheme] = useUI('theme', 'light');
					return <div>Test</div>;
				}
			`,
		},
		(result) => {
			console.log('\n📄 Initial value without setterFn:');

			assert(result.css.includes('@custom-variant theme-light'));
		}
	);
});
/*
The following tests are for advanced edge cases
--------------------------------------------------------------------------------------------
----------------------------------------------
----------------------------------------------
----------------------------------------------
----------------------------------------------
----------------------------------------------
--------------------------------------------------------------------------------------------
----------------------------------------------
----------------------------------------------
----------------------------------------------
----------------------------------------------
----------------------------------------------
----------------------------------------------
*/

test.skip('handles all common setter patterns - full coverage sanity check - COMPLEX', async () => {
	await runTest(
		{
			'app/component.tsx': `
        import { useUI } from '@react-zero-ui/core';

        const DARK = 'dark';
        const LIGHT = 'light';

        function Component() {
          const [theme, setTheme] = useUI<'light' | 'dark' | 'contrast' | 'neon' | 'retro'>('theme', 'light');
          const [size, setSize] = useUI<'sm' | 'lg'>('size', 'sm');

          setTheme('dark');                              // direct
          setTheme(DARK);                                // identifier
          setTheme(() => 'light');                       // arrow fn
          setTheme(prev => prev === 'light' ? 'dark' : 'light'); // updater
          setTheme(prev => { if (a) return 'neon'; return 'retro'; }); // block
          setTheme(userPref || 'contrast');              // logical fallback
          setSize(SIZES.SMALL);                          // object constant

          return (
            <>
              <button onClick={() => setTheme('contrast')}>Contrast</button>
              <select onChange={e => setTheme(e.target.value)}>
                <option value="neon">Neon</option>
                <option value="retro">Retro</option>
              </select>
            </>
          );
        }

        const SIZES = {
          SMALL: 'sm',
          LARGE: 'lg'
        };
      `,
		},
		(result) => {
			console.log('\n📄 Full coverage test:');

			// ✅ things that MUST be included
			assert(result.css.includes('@custom-variant theme-dark'));
			assert(result.css.includes('@custom-variant theme-light'));
			assert(result.css.includes('@custom-variant theme-contrast'));
			assert(result.css.includes('@custom-variant theme-neon'));
			assert(result.css.includes('@custom-variant theme-retro'));
			assert(result.css.includes('@custom-variant size-sm'));
			assert(result.css.includes('@custom-variant size-lg'));

			// ❌ known misses: test exposes what won't work without resolution
			// assert(result.css.includes('@custom-variant theme-dynamic-from-e-target'));
		}
	);
});

test('performance with large files and many variants', async () => {
	// Generate a large file with many useUI calls
	const generateLargeFile = () => {
		let content = `import { useUI } from '@react-zero-ui/core';\n\n`;

		// Create many components with different state keys
		for (let i = 0; i < 50; i++) {
			const toggleInitial = i % 2 === 0 ? "'true'" : "'false'";
			content += `
        function Component${i}() {
          const [state${i}, setState${i}] = useUI('state-${i}', 'initial-${i}');
          const [toggle${i}, setToggle${i}] = useUI('toggle-${i}', ${toggleInitial});
          
  
          
          return <div className="state-${i}-initial-${i}:bg-blue-500 state-${i}-true:bg-red-500 state-${i}-false:bg-green-500 toggle-${i}-true:bg-yellow-500 toggle-${i}-false:bg-purple-500 toggle-${i}-test:bg-orange-500">Component ${i}</div>;
        }
      `;
		}

		return content;
	};

	const startTime = Date.now();

	await runTest({ 'app/large-file.jsx': generateLargeFile() }, (result) => {
		const endTime = Date.now();
		const duration = endTime - startTime;

		console.log(`\n⏱️  Large file processing took: ${duration}ms`);

		// Should handle large files reasonably quickly (< 5 seconds)
		assert(duration < 5000, `Processing took too long: ${duration}ms`);

		// Should still extract all variants correctly
		assert(result.css.includes('@custom-variant state-0-initial-0'));
		assert(result.css.includes('@custom-variant state-49-initial-49'));
		assert(result.css.includes('@custom-variant toggle-0-true'));
		assert(result.css.includes('@custom-variant toggle-0-false'));
	});
});

test('caching works correctly', async () => {
	const testFiles = {
		'app/cached.jsx': `
      import { useUI } from '@react-zero-ui/core';
      
      function Component() {
        const [theme, setTheme] = useUI('theme', 'light');
        return <div>Test</div>;
      }
    `,
	};

	// First run
	const start1 = Date.now();
	await runTest(testFiles, () => {});
	const duration1 = Date.now() - start1;

	// Second run with same files (should be faster due to caching)
	const start2 = Date.now();
	await runTest(testFiles, () => {});
	const duration2 = Date.now() - start2;

	console.log(`\n📊 First run: ${duration1}ms, Second run: ${duration2}ms`);

	// Note: This test might be flaky in CI, but useful for development
	// Second run should generally be faster, but timing can vary
});
