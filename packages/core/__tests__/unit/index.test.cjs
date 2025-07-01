const postcss = require('postcss');
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
//  This file is the entry point for the react-zero-ui library, that uses postcss to trigger the build process
const plugin = require('../../dist/postcss/index.cjs');

const { patchConfigAlias, toKebabCase, patchPostcssConfig, patchViteConfig } = require('../../dist/postcss/helpers.cjs');

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
			console.log(content);

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
			console.log('result.css: ', result.css);

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

test('detects JavaScript setValue calls', async () => {
	await runTest(
		{
			'src/modal.js': `
      import { useUI } from '@react-zero-ui/core';
      
      function Modal() {
        const [modal, setModal] = useUI('modal', 'closed');
        
        return (
          <div>
            <button onClick={() => setModal('open')}>Open</button>
            <button onClick={() => setModal('minimized')}>Minimize</button>
            <button onClick={() => {
              // Complex handler
              if (someCondition) {
                setModal('fullscreen');
              } else {
                setModal('closed');
              }
            }}>Toggle</button>
          </div>
        );
      }
    `,
		},
		(result) => {
			console.log('\n🔍 JavaScript Detection Test:');

			const states = ['closed', 'open', 'minimized', 'fullscreen'];
			states.forEach((state) => {
				assert(result.css.includes(`@custom-variant modal-${state}`), `Should detect modal-${state}`);
			});

			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			console.log('Initial value:', content.match(/"data-modal": "[^"]+"/)[0]);
		}
	);
});

test('handles string boolean values', async () => {
	await runTest(
		{
			'app/toggle.tsx': `
      import { useUI } from '@react-zero-ui/core';
      
      function Toggle() {
        const [isOpen, setIsOpen] = useUI<'true' | 'false'>('drawer', 'false');
        const [checked, setChecked] = useUI<'true' | 'false'>('checkbox', 'true');
        
        return (
          <div>
            <button onClick={() => setIsOpen(isOpen === 'false' ? 'true' : 'false')}>
              Toggle Drawer
          </button>
            <button onClick={() => setChecked(checked === 'true' ? 'false' : 'true')}>
              Toggle Checkbox
            </button>
          </div>
        );
      }
    `,
		},
		(result) => {
			console.log('\n🔍 String Boolean Values Test:');

			assert(result.css.includes('@custom-variant drawer-true'), 'Should have drawer-true');
			assert(result.css.includes('@custom-variant drawer-false'), 'Should have drawer-false');
			assert(result.css.includes('@custom-variant checkbox-true'), 'Should have checkbox-true');
			assert(result.css.includes('@custom-variant checkbox-false'), 'Should have checkbox-false');

			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			console.log('String boolean attributes:', content);
		}
	);
});

test('handles kebab-case conversion', async () => {
	await runTest(
		{
			'src/styles.jsx': `
      import { useUI } from '@react-zero-ui/core';
      
      function StyledComponent() {
        const [primaryColor, setPrimaryColor] = useUI('primaryColor', 'deepBlue');
        const [bgStyle, setBgStyle] = useUI('backgroundColor', 'lightGray');
        
        return (
          <div>
            <button onClick={() => setPrimaryColor('darkRed')}>Red</button>
            <button onClick={() => setBgStyle('paleYellow')}>Yellow</button>
          </div>
        );
      }
    `,
		},
		(result) => {
			console.log('\n🔍 Kebab-case Test:');

			// Check CSS has kebab-case
			assert(result.css.includes('@custom-variant primary-color-deep-blue'), 'Should convert to kebab-case');
			assert(result.css.includes('@custom-variant primary-color-dark-red'), 'Should convert to kebab-case');
			assert(result.css.includes('@custom-variant background-color-light-gray'), 'Should convert to kebab-case');
			assert(result.css.includes('@custom-variant background-color-pale-yellow'), 'Should convert to kebab-case');

			// Check attributes use kebab-case keys
			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			assert(content.includes('"data-primary-color"'), 'Attribute key should be kebab-case');
			assert(content.includes('"data-background-color"'), 'Attribute key should be kebab-case');
			console.log('Kebab-case attributes:', content);
		}
	);
});

test('handles conditional expressions', async () => {
	await runTest(
		{
			'app/conditional.jsx': `
      import { useUI } from '@react-zero-ui/core';
      
      function ConditionalComponent({ isActive, mode }) {
        const [state, setState] = useUI('state', 'default');
        
        return (
          <div>
            <button onClick={() => setState(isActive ? 'active' : 'inactive')}>
              Toggle Active
            </button>
            <button onClick={() => setState(mode === 'dark' ? 'night' : 'day')}>
              Toggle Mode
            </button>
            <button onClick={() => setState(someVar || 'fallback')}>
              Fallback
            </button>
          </div>
        );
      }
    `,
		},
		(result) => {
			console.log('\n🔍 Conditional Expressions Test:');

			const expectedStates = ['default', 'active', 'inactive', 'night', 'day', 'fallback'];
			expectedStates.forEach((state) => {
				assert(result.css.includes(`@custom-variant state-${state}`), `Should detect state-${state}`);
			});
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
        return <button onClick={() => setTheme('dark')}>Dark</button>;
      }
    `,
			'src/footer.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Footer() {
        const [theme, setTheme] = useUI('theme', 'light');
        return <div>
				<button onClick={() => setTheme('blue')}>Blue</button>
				<button onClick={() => setTheme('dark')}>Dark</button>
				<button onClick={() => setTheme('light')}>Light</button>
				Footer
			</div>;
      }
    `,
			'app/sidebar.tsx': `
      import { useUI } from '@react-zero-ui/core';
      function Sidebar() {
        const [theme, setTheme] = useUI<'light' | 'dark' | 'auto'>('theme', 'light');
        return <div>
				<button onClick={() => setTheme('auto')}>Auto</button>
				<button onClick={() => setTheme('blue')}>Blue</button>
				<button onClick={() => setTheme('dark')}>Dark</button>
				<button onClick={() => setTheme('light')}>Light</button>
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

test('handles parsing errors gracefully', async () => {
	await runTest(
		{
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
		},
		(result) => {
			console.log('\n🔍 Parse Error Test:');
			// Should still process valid files
			assert(result.css.includes('@custom-variant valid-working'), 'Should process valid files');

			// Should not crash on invalid files
			assert(result.css.includes('AUTO-GENERATED'), 'Should complete processing');
		}
	);
});

test('throws on empty string initial value', () => {
	assert.throws(() => toKebabCase(''));
});

test('valid edge cases: underscores + missing initial', async () => {
	await runTest(
		{
			'src/edge.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function EdgeCases() {
        const [noInitial] = useUI('noInitial_value');
        const [, setOnlySetter] = useUI('only_setter_key', 'yes');
        setOnlySetter('set_later');
        return <div>Edge cases</div>;
      }
    `,
		},
		(result) => {
			console.log('result: ', result.css);
			assert(result.css.includes('@custom-variant only-setter-key-set-later'));
			assert(!result.css.includes('@custom-variant no-initial-value'));
		}
	);
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
        const [state, setState] = useUI('watchTest', 'initial');
        return <div>Initial</div>;e
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
        const [state, setState] = useUI('watchTest', 'initial');
        return <button onClick={() => setState('updated')}>Update</button>;
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

test('handles deeply nested file structures', async () => {
	await runTest(
		{
			'src/features/auth/components/login/LoginForm.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function LoginForm() {
        const [authState, setAuthState] = useUI('authState', 'loggedOut');
        return <button onClick={() => setAuthState('loggedIn')}>Login</button>;
      }
    `,
		},
		(result) => {
			assert(result.css.includes('@custom-variant auth-state-logged-out'));
			assert(result.css.includes('@custom-variant auth-state-logged-in'));
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

test('handles special characters in values', async () => {
	await runTest(
		{
			'src/special.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Special() {
        const [state, setState] = useUI('special', 'default');
        return (
          <div>
            <button onClick={() => setState('with-dash')}>Dash</button>
            <button onClick={() => setState('with_underscore')}>Underscore</button>
            <button onClick={() => setState('123numeric')}>Numeric</button>
          </div>
        );
      }
    `,
		},
		(result) => {
			assert(result.css.includes('@custom-variant special-with-dash'));
			assert(result.css.includes('@custom-variant special-with-underscore'));
			assert(result.css.includes('@custom-variant special-123numeric'));
		}
	);
});

test('handles concurrent file modifications', async () => {
	// Test that rapid changes don't cause issues
	await runTest(
		{
			'src/rapid.jsx': `
      import { useUI } from '@react-zero-ui/core';
      function Rapid() {
        const [count] = useUI('count', 'zero');
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

test('patchConfigAlias - config file patching', async (t) => {
	await t.test('patches tsconfig.json when it exists', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Create a basic tsconfig.json
			const tsconfigContent = { compilerOptions: { target: 'ES2015', module: 'ESNext' } };
			fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigContent, null, 2));

			// Run patchConfigAlias
			patchConfigAlias();

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

			// Run patchConfigAlias
			patchConfigAlias();

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

			// Run patchConfigAlias (should not throw)
			patchConfigAlias();

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

			// Run patchConfigAlias
			patchConfigAlias();

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

			// Run patchConfigAlias
			patchConfigAlias();

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

			// Run patchConfigAlias
			patchConfigAlias();

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

	await t.test('patchConfigAlias prefers tsconfig.json over jsconfig.json', async () => {
		const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
		const originalCwd = process.cwd();

		try {
			process.chdir(testDir);

			// Create both config files
			fs.writeFileSync('tsconfig.json', JSON.stringify({ compilerOptions: {} }, null, 2));
			fs.writeFileSync('jsconfig.json', JSON.stringify({ compilerOptions: {} }, null, 2));

			// Run patchConfigAlias
			patchConfigAlias();

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

test('Vite config - handles parse errors gracefully', async () => {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-vite-test'));
	const originalCwd = process.cwd();

	try {
		process.chdir(testDir);

		// Create invalid Vite config with syntax errors
		const invalidConfig = `import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss( // missing closing parenthesis
  ]
  // missing closing brace`;
		fs.writeFileSync('vite.config.ts', invalidConfig);
		const originalContent = fs.readFileSync('vite.config.ts', 'utf-8');

		// Run patchViteConfig (should not throw)
		patchViteConfig();

		// Verify config was not modified due to parse error
		const updatedContent = fs.readFileSync('vite.config.ts', 'utf-8');
		assert.equal(originalContent, updatedContent, 'Should not modify config with parse errors');
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
			console.log(result.css);

			assert(result.css.includes('@custom-variant theme-light'));
		}
	);
});

test('handles complex string boolean toggle patterns', async () => {
	await runTest(
		{
			'app/boolean-edge-cases.tsx': `
        import { useUI } from '@react-zero-ui/core';
        
        function Component() {
          const [isVisible, setIsVisible] = useUI('modal-visible', 'false');
          const [isEnabled, setIsEnabled] = useUI('feature-enabled', 'true');
          
          // Complex string boolean patterns that should result in true/false
          const handleToggle = () => setIsVisible(prev => prev === 'false' ? 'true' : 'false');
          const handleConditional = () => setIsVisible(condition ? 'true' : 'false');
          const handleLogical = () => setIsEnabled(loading ? 'false' : 'true');
          
          return <div>Test</div>;
        }
      `,
		},
		(result) => {
			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			console.log('\n📄 String boolean edge cases:');
			console.log(content);

			// Should only have true/false variants for string booleans
			assert(result.css.includes('@custom-variant modal-visible-true'));
			assert(result.css.includes('@custom-variant modal-visible-false'));
			assert(result.css.includes('@custom-variant feature-enabled-true'));
			assert(result.css.includes('@custom-variant feature-enabled-false'));

			// Should NOT have any other variants
			assert(!result.css.includes('@custom-variant modal-visible-prev'));
			assert(!result.css.includes('@custom-variant modal-visible-condition'));
		}
	);
});

test.skip('extracts values from deeply nested function calls', async () => {
	await runTest(
		{
			'app/nested-calls.jsx': `
        import { useUI } from '@react-zero-ui/core';
        
        function Component() {
          const [theme, setTheme] = useUI('theme', 'light');
          
          // Nested in useEffect
          useEffect(() => {
            if (darkMode) {
              setTheme('dark');
            } else {
              setTheme('auto');
            }
          }, [darkMode]);
          
          // Nested in event handler
          const handleClick = useCallback(() => {
            const newTheme = calculateTheme();
            setTheme(newTheme === 'system' ? 'system' : 'manual');
          }, []);
          
          // Nested in JSX
          return (
            <div>
              <button onClick={() => setTheme('contrast')}>
                High Contrast
              </button>
              <select onChange={e => setTheme(e.target.value)}>
                <option value="neon">Neon</option>
                <option value="retro">Retro</option>
              </select>
            </div>
          );
        }
      `,
		},
		(result) => {
			console.log('\n📄 Nested calls extraction:');
			console.log(result.css);

			// Should extract all literal values
			assert(result.css.includes('@custom-variant theme-light')); // initial
			assert(result.css.includes('@custom-variant theme-dark')); // from useEffect
			assert(result.css.includes('@custom-variant theme-auto')); // from useEffect
			assert(result.css.includes('@custom-variant theme-system')); // from ternary
			assert(result.css.includes('@custom-variant theme-manual')); // from ternary
			assert(result.css.includes('@custom-variant theme-contrast')); // from onClick
			assert(result.css.includes('@custom-variant theme-neon')); // from onChange
			assert(result.css.includes('@custom-variant theme-retro')); // from onChange
			// Note: 'neon' and 'retro' from option values won't be extracted since they're not setter calls
		}
	);
});

test('handles ternary and logical expressions', async () => {
	await runTest(
		{
			'app/expressions.tsx': `
        import { useUI } from '@react-zero-ui/core';
        
        function Component({ isDark, isLoading, userPreference }) {
          const [status, setStatus] = useUI('status', 'idle');
          const [mode, setMode] = useUI('display-mode', 'normal');
          
          // Ternary expressions
          const updateStatus = () => {
            setStatus(isLoading ? 'loading' : 'ready');
          };
          
          // Nested ternary
          const updateMode = () => {
            setMode(isDark ? 'dark' : (userPreference === 'auto' ? 'auto' : 'light'));
          };
          
          // Logical expressions
          const handleError = () => {
            setStatus(error && 'error' || 'success');
          };
          
          // Complex logical
          const handleComplex = () => {
            setMode(loading && 'disabled' || ready && 'active' || 'pending');
          };
          
          return <div>Test</div>;
        }
      `,
		},
		(result) => {
			console.log('\n📄 Expression handling:');
			console.log(result.css);

			// Ternary values
			assert(result.css.includes('@custom-variant status-loading'));
			assert(result.css.includes('@custom-variant status-ready'));
			assert(result.css.includes('@custom-variant status-error'));
			assert(result.css.includes('@custom-variant status-success'));

			// Nested ternary values
			assert(result.css.includes('@custom-variant display-mode-dark'));
			assert(result.css.includes('@custom-variant display-mode-auto'));
			assert(result.css.includes('@custom-variant display-mode-light'));

			// Complex logical values
			assert(result.css.includes('@custom-variant display-mode-disabled'));
			assert(result.css.includes('@custom-variant display-mode-active'));
			assert(result.css.includes('@custom-variant display-mode-pending'));
		}
	);
});

test('resolves constants', async () => {
	await runTest(
		{
			'app/constants-resolve.jsx': `
			import { useUI } from '@react-zero-ui/core';
export const THEME_DARK = 'dark';
export const THEME_LIGHT = 'light';
export const SIZES = { SMALL: 'sm', LARGE: 'lg' };
const isDark = true;
const isSmall = true;
export function Pages() {
	const [theme, setTheme] = useUI('theme', 'default');
	const [size, setSize] = useUI('size', 'medium');
	// Using constants
	const toggleTheme = () => {
		setTheme(isDark ? THEME_LIGHT : THEME_DARK);
	};
	// Using object properties
	const updateSize = () => {
		setSize(isSmall ? SIZES.SMALL : SIZES.LARGE);
	};
	// Local constants
	const STATUS_PENDING = 'pending-state';
	const handleStatus = () => {
		setTheme(STATUS_PENDING);
	};
	return <div>Test</div>;
}

			`,
		},
		(result) => {
			console.log('\n📄 Constants:');
			console.log(result.css);

			assert(result.css.includes('@custom-variant theme-dark'));
			assert(result.css.includes('@custom-variant theme-default'));
			assert(result.css.includes('@custom-variant theme-light'));
			// Does not work for VARIABLE.PROPERTY
			assert(result.css.includes('@custom-variant size-sm'));
			assert(result.css.includes('@custom-variant size-medium'));
			assert(result.css.includes('@custom-variant size-lg'));
			assert(result.css.includes('@custom-variant theme-pending-state'));
		}
	);
});

test('resolves constants and imported values -- COMPLEX --', async () => {
	await runTest(
		{
			'app/constants.ts': `
        export const THEME_DARK = 'dark';
        export const THEME_LIGHT = 'light';
        export const SIZES = {
          SMALL: 'sm',
          LARGE: 'lg'
        };
      `,
			'app/component.jsx': `
        import { useUI } from '@react-zero-ui/core';
        import { THEME_DARK, THEME_LIGHT, SIZES } from './constants';
        console.log('THEME_DARK', THEME_DARK);
        function Component() {
          const [theme, setTheme] = useUI('theme', 'default');
          const [size, setSize] = useUI('size', 'medium');
          
          // Using constants
          const toggleTheme = () => {
            setTheme(isDark ? THEME_LIGHT : THEME_DARK);
          };
          
          // Using object properties
          const updateSize = () => {
            setSize(isSmall ? SIZES.SMALL : SIZES.LARGE);
          };
          
          // Local constants
          const STATUS_PENDING = 'pending-state';
          const handleStatus = () => {
            setTheme(STATUS_PENDING);
          };
          
          return <div>Test</div>;
        }
      `,
		},
		(result) => {
			console.log('\n📄 Constants resolution:');
			console.log(result.css);

			// Should resolve local constants
			assert(result.css.includes('@custom-variant theme-pending-state'));
			assert(result.css.includes('@custom-variant theme-dark'));
			assert(result.css.includes('@custom-variant theme-light'));
			assert(result.css.includes('@custom-variant size-small'));
			assert(result.css.includes('@custom-variant size-large'));

			// Note: Import resolution is complex and might not work initially
			// This test documents the expected behavior for future enhancement
		}
	);
});

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
			console.log(result.css);

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

test('handles arrow functions and function expressions', async () => {
	await runTest(
		{
			'app/functions.jsx': `
        import { useUI } from '@react-zero-ui/core';
        
        function Component() {
          const [state, setState] = useUI('component-state', 'initial');
          
          // Arrow function with expression body
          const quickSet = () => setState('quick');
          
          // Arrow function with block body
          const blockSet = () => {
            return setState('block');
          };
          
          // Function expression
          const funcExpr = function() {
            setState('function');
          };
          
          // Immediately invoked
          (() => setState('immediate'))();
          
          // Passed as callback
          setTimeout(() => setState('delayed'), 1000);
          
          // Complex return logic
          const conditionalSet = () => {
            if (condition) return setState('conditional-true');
            return setState('conditional-false');
          };
          
          return <div>Test</div>;
        }
      `,
		},
		(result) => {
			console.log('\n📄 Function expressions:');
			console.log(result.css);

			assert(result.css.includes('@custom-variant component-state-quick'));
			assert(result.css.includes('@custom-variant component-state-block'));
			assert(result.css.includes('@custom-variant component-state-function'));
			assert(result.css.includes('@custom-variant component-state-immediate'));
			assert(result.css.includes('@custom-variant component-state-delayed'));
			assert(result.css.includes('@custom-variant component-state-conditional-true'));
			assert(result.css.includes('@custom-variant component-state-conditional-false'));
		}
	);
});

test('handles multiple setters for same state key', async () => {
	await runTest(
		{
			'app/multiple-setters.jsx': `
        import { useUI } from '@react-zero-ui/core';
        
        function ComponentA() {
          const [theme, setTheme] = useUI('global-theme', 'light');
          const handleClick = () => setTheme('dark');
          return <div>A</div>;
        }
        
        function ComponentB() {
          const [theme, setGlobalTheme] = useUI('global-theme', 'light');
          const handleToggle = () => setGlobalTheme('auto');
          return <div>B</div>;
        }
        
        function ComponentC() {
          const [, updateTheme] = useUI('global-theme', 'light');
          const handleSystem = () => updateTheme('system');
          return <div>C</div>;
        }
      `,
		},
		(result) => {
			console.log('\n📄 Multiple setters:');
			console.log(result.css);

			// Should combine all values from different setters for same key
			assert(result.css.includes('@custom-variant global-theme-light'));
			assert(result.css.includes('@custom-variant global-theme-dark'));
			assert(result.css.includes('@custom-variant global-theme-auto'));
			assert(result.css.includes('@custom-variant global-theme-system'));
		}
	);
});

test('ignores dynamic and non-literal values', async () => {
	await runTest(
		{
			'app/dynamic-values.jsx': `
        import { useUI } from '@react-zero-ui/core';
        
        function Component({ userTheme, config }) {
          const [theme, setTheme] = useUI('theme', 'default');
          const [status, setStatus] = useUI('status', 'idle');
          
          // Dynamic values that should be ignored
          const handleDynamic = () => {
            setTheme(userTheme); // prop value
            setTheme(config.theme); // object property
            setTheme(calculateTheme()); // function call
            setTheme(\`theme-\${mode}\`); // template literal with expression
            setTheme(themes[index]); // array access
          };
          
          // But still catch literals mixed in
          const handleMixed = () => {
            setStatus(error ? 'error' : userStatus); // only 'error' should be caught
            setTheme(loading ? 'loading' : calculated); // only 'loading' should be caught
          };
          
          return <div>Test</div>;
        }
      `,
		},
		(result) => {
			console.log('\n📄 Dynamic values filtering:');
			console.log(result.css);

			// Should only have literals
			assert(result.css.includes('@custom-variant theme-default')); // initial
			assert(result.css.includes('@custom-variant status-idle')); // initial
			assert(result.css.includes('@custom-variant status-error')); // from ternary
			assert(result.css.includes('@custom-variant theme-loading')); // from ternary

			// Should NOT have dynamic values
			assert(!result.css.includes('@custom-variant theme-userTheme'));
			assert(!result.css.includes('@custom-variant theme-calculateTheme'));
			assert(!result.css.includes('@custom-variant theme-theme-'));
		}
	);
});

test('handles edge cases with unusual syntax', async () => {
	await runTest(
		{
			'app/edge-cases.jsx': `
        import { useUI } from '@react-zero-ui/core';
        
        function Component() {
          const [state, setState] = useUI('edge-state', 'normal');
          
          // Destructured setter
          const { setState: altSetState } = { setState };
          
          // Setter in array
          const setters = [setState];
          
          // Multiple calls in one expression
          const multi = () => (setState('first'), setState('second'));
          
          // Chained calls (unusual but possible)
          const chained = () => setState('chain') && setState('link');
          
          // In try/catch
          const safe = () => {
            try {
              setState('trying');
            } catch {
              setState('caught');
            }
          };
          
          // Template literal without expressions
          const template = () => setState(\`static\`);
          
          return <div>Test</div>;
        }
      `,
		},
		(result) => {
			console.log('\n📄 Edge cases:');
			console.log(result.css);

			// Basic cases that should work
			assert(result.css.includes('@custom-variant edge-state-first'));
			assert(result.css.includes('@custom-variant edge-state-second'));
			assert(result.css.includes('@custom-variant edge-state-chain'));
			assert(result.css.includes('@custom-variant edge-state-link'));
			assert(result.css.includes('@custom-variant edge-state-trying'));
			assert(result.css.includes('@custom-variant edge-state-caught'));
			assert(result.css.includes('@custom-variant edge-state-static'));
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
          
          const handler${i} = () => {
            setState${i}('value-${i}-a');
            setState${i}('value-${i}-b');
            setState${i}('value-${i}-c');
            setToggle${i}(prev => prev === 'true' ? 'false' : 'true');
          };
          
          return <div>Component ${i}</div>;
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
		assert(result.css.includes('@custom-variant state-49-value-49-c'));
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
