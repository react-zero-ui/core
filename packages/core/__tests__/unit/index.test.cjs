const postcss = require('postcss');
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const plugin = require('../../src/postcss/index.cjs');
const { patchConfigAlias, toKebabCase, patchPostcssConfig, patchViteConfig } = require('../../src/postcss/helpers.cjs');

function getAttrFile() {
	return path.join(process.cwd(), '.zero-ui', 'attributes.js');
}

// Helper to create temp directory and run test
async function runTest(testName, files, callback) {
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
		'attributes',
		{
			'app/test.jsx': `
      import { useUI } from 'react-zero-ui';
      
      function Component() {
        const [theme, setTheme] = useUI('theme', 'light');
        const [sidebar, setSidebar] = useUI('sidebar', 'expanded');
        return <div>Test</div>;
      }
    `,
		},
		result => {
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
			assert(result.css.includes('@variant theme-light'), 'Should have theme-light variant');
			assert(result.css.includes('@variant sidebar-expanded'), 'Should have sidebar-expanded variant');
		}
	);
});

test('generates body attributes file correctly when kebab-case is used', async () => {
	await runTest(
		'attributes',
		{
			'app/test.jsx': `
      import { useUI } from 'react-zero-ui';
      
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
		result => {
			// Check attributes file exists
			assert(fs.existsSync(getAttrFile()), 'Attributes file should exist');

			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			console.log('result.css: ', result.css);

			// Verify content
			assert(content.includes('export const bodyAttributes'), 'Should export bodyAttributes');
			assert(content.includes('"data-theme-secondary": "light"'), 'Should have theme-secondary attribute');
			assert(content.includes('"data-sidebar-new": "expanded"'), 'Should have sidebar-new attribute');

			// Verify CSS variants
			assert(result.css.includes('@variant theme-secondary-light'), 'Should have theme-secondary-light variant');
			assert(result.css.includes('@variant sidebar-new-expanded'), 'Should have sidebar-new-expanded variant');
		}
	);
});

test('handles TypeScript generic types', async () => {
	await runTest(
		'typescript-generics',
		{
			'src/component.tsx': `
      import { useUI } from 'react-zero-ui';
      
      function Component() {
        const [status, setStatus] = useUI<'idle' | 'loading' | 'success' | 'error'>('status', 'idle');
        return <div>Status: {status}</div>;
      }
    `,
		},
		result => {
			console.log('\n🔍 TypeScript Generic Test:');

			// Check all variants were generated
			const variants = ['idle', 'loading', 'success', 'error'];
			variants.forEach(variant => {
				assert(result.css.includes(`@variant status-${variant}`), `Should have status-${variant} variant`);
			});

			// Check attributes file
			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			console.log('Attributes:', content);
			assert(content.includes('"data-status": "idle"'), 'Should use initial value');
		}
	);
});

test('detects JavaScript setValue calls', async () => {
	await runTest(
		'javascript-detection',
		{
			'src/modal.js': `
      import { useUI } from 'react-zero-ui';
      
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
		result => {
			console.log('\n🔍 JavaScript Detection Test:');

			const states = ['closed', 'open', 'minimized', 'fullscreen'];
			states.forEach(state => {
				assert(result.css.includes(`@variant modal-${state}`), `Should detect modal-${state}`);
			});

			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			console.log('Initial value:', content.match(/"data-modal": "[^"]+"/)[0]);
		}
	);
});

test('handles boolean values', async () => {
	await runTest(
		'boolean-values',
		{
			'app/toggle.tsx': `
      import { useUI } from 'react-zero-ui';
      
      function Toggle() {
        const [isOpen, setIsOpen] = useUI<boolean>('drawer', false);
        const [checked, setChecked] = useUI<boolean>('checkbox', true);
        
        return (
          <button onClick={() => setIsOpen(!isOpen)}>
            Toggle
          </button>
        );
      }
    `,
		},
		result => {
			console.log('\n🔍 Boolean Values Test:');

			assert(result.css.includes('@variant drawer-true'), 'Should have drawer-true');
			assert(result.css.includes('@variant drawer-false'), 'Should have drawer-false');
			assert(result.css.includes('@variant checkbox-true'), 'Should have checkbox-true');
			assert(result.css.includes('@variant checkbox-false'), 'Should have checkbox-false');

			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			console.log('Boolean attributes:', content);
		}
	);
});

test('handles kebab-case conversion', async () => {
	await runTest(
		'kebab-case',
		{
			'src/styles.jsx': `
      import { useUI } from 'react-zero-ui';
      
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
		result => {
			console.log('\n🔍 Kebab-case Test:');

			// Check CSS has kebab-case
			assert(result.css.includes('@variant primary-color-deep-blue'), 'Should convert to kebab-case');
			assert(result.css.includes('@variant primary-color-dark-red'), 'Should convert to kebab-case');
			assert(result.css.includes('@variant background-color-light-gray'), 'Should convert to kebab-case');
			assert(result.css.includes('@variant background-color-pale-yellow'), 'Should convert to kebab-case');

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
		'conditionals',
		{
			'app/conditional.jsx': `
      import { useUI } from 'react-zero-ui';
      
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
		result => {
			console.log('\n🔍 Conditional Expressions Test:');

			const expectedStates = ['default', 'active', 'inactive', 'night', 'day', 'fallback'];
			expectedStates.forEach(state => {
				assert(result.css.includes(`@variant state-${state}`), `Should detect state-${state}`);
			});
		}
	);
});

test('handles multiple files and deduplication', async () => {
	await runTest(
		'multiple-files',
		{
			'src/header.jsx': `
      import { useUI } from 'react-zero-ui';
      function Header() {
        const [theme, setTheme] = useUI('theme', 'light');
        return <button onClick={() => setTheme('dark')}>Dark</button>;
      }
    `,
			'src/footer.jsx': `
      import { useUI } from 'react-zero-ui';
      function Footer() {
        const [theme, setTheme] = useUI('theme', 'light');
        return <button onClick={() => setTheme('blue')}>Blue</button>;
      }
    `,
			'app/sidebar.tsx': `
      import { useUI } from 'react-zero-ui';
      function Sidebar() {
        const [theme, setTheme] = useUI<'light' | 'dark' | 'auto'>('theme', 'light');
        return <div>Sidebar</div>;
      }
    `,
		},
		result => {
			console.log('\n🔍 Multiple Files Test: ', result.css);

			// Should combine all theme values from all files
			const themeVariants = ['light', 'dark', 'blue', 'auto'];
			themeVariants.forEach(variant => {
				assert(result.css.includes(`@variant theme-${variant}`), `Should have theme-${variant}`);
			});

			// Count occurrences - should be deduplicated
			const lightCount = (result.css.match(/@variant theme-light/g) || []).length;
			assert.equal(lightCount, 1, 'Should deduplicate variants');
		}
	);
});

test('handles parsing errors gracefully', async () => {
	await runTest(
		'parse-errors',
		{
			'src/valid.jsx': `
      import { useUI } from 'react-zero-ui';
      function Valid() {
        const [state, setState] = useUI('valid', 'working');
        return <div>Valid</div>;
      }
    `,
			'src/invalid.js': `
      import { useUI } from 'react-zero-ui';
      function Invalid() {
        const [state, setState] = useUI('test' 'missing-comma');
        {{{ invalid syntax
      }
    `,
		},
		result => {
			console.log('\n🔍 Parse Error Test:');
			console.log('result: ', result.css);
			// Should still process valid files
			assert(result.css.includes('@variant valid-working'), 'Should process valid files');

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
		'valid-edge',
		{
			'src/edge.jsx': `
      import { useUI } from 'react-zero-ui';
      function EdgeCases() {
        const [noInitial] = useUI('noInitial_value');
        const [, setOnlySetter] = useUI('only_setter_key', 'yes');
        setOnlySetter('set_later');
        return <div>Edge cases</div>;
      }
    `,
		},
		result => {
			console.log('result: ', result.css);
			assert(result.css.includes('@variant only-setter-key-set-later'));
			assert(!result.css.includes('@variant no-initial-value'));
		}
	);
});

test('watches for file changes', async () => {
	if (process.env.NODE_ENV === 'production') {
		console.log('Skipping watch test in production');
		return;
	}

	await runTest(
		'file-watching',
		{
			'src/initial.jsx': `
      import { useUI } from 'react-zero-ui';
      function Initial() {
        const [state, setState] = useUI('watchTest', 'initial');
        return <div>Initial</div>;e
      }
    `,
		},
		async result => {
			// Initial state
			assert(result.css.includes('@variant watch-test-initial'));

			// Add a new file
			fs.writeFileSync(
				'src/new.jsx',
				`
      import { useUI } from 'react-zero-ui';
      function New() {
        const [state, setState] = useUI('watchTest', 'initial');
        return <button onClick={() => setState('updated')}>Update</button>;
      }
    `
			);

			// Wait for file watcher to process
			await new Promise(resolve => setTimeout(resolve, 500));

			// Re-process to check if watcher picked up changes
			const result2 = await postcss([plugin()]).process('', { from: undefined });

			assert(result2.css.includes('@variant watch-test-updated'), 'Should detect new state');
		}
	);
});

test('ignores node_modules and hidden directories', async () => {
	await runTest(
		'ignored-dirs',
		{
			'src/valid.jsx': `
      import { useUI } from 'react-zero-ui';
      function Valid() {
        const [state] = useUI('valid', 'yes');
        return <div>Valid</div>;
      }
    `,
			'node_modules/package/file.jsx': `
      import { useUI } from 'react-zero-ui';
      function Ignored() {
        const [state] = useUI('ignored', 'shouldNotAppear');
        return <div>Should be ignored</div>;
      }
    `,
			'.next/file.jsx': `
      import { useUI } from 'react-zero-ui';
      function Hidden() {
        const [state] = useUI('hidden', 'shouldNotAppear');
        return <div>Should be ignored</div>;
      }
    `,
		},
		result => {
			console.log('result: ', result.css);
			assert(result.css.includes('@variant valid-yes'), 'Should process valid files');
			assert(!result.css.includes('ignored'), 'Should ignore node_modules');
			assert(!result.css.includes('hidden'), 'Should ignore hidden directories');
		}
	);
});

test('handles deeply nested file structures', async () => {
	await runTest(
		'deep-nesting',
		{
			'src/features/auth/components/login/LoginForm.jsx': `
      import { useUI } from 'react-zero-ui';
      function LoginForm() {
        const [authState, setAuthState] = useUI('authState', 'loggedOut');
        return <button onClick={() => setAuthState('loggedIn')}>Login</button>;
      }
    `,
		},
		result => {
			assert(result.css.includes('@variant auth-state-logged-out'));
			assert(result.css.includes('@variant auth-state-logged-in'));
		}
	);
});

test('handles complex TypeScript scenarios', async () => {
	await runTest(
		'complex-typescript',
		{
			'src/complex.tsx': `
      import { useUI } from 'react-zero-ui';
      
      type Status = 'idle' | 'loading' | 'success' | 'error';
      
      function Complex() {
        // Type reference
        const [status] = useUI<Status>('status', 'idle');
        
        // Inline boolean
        const [open] = useUI<boolean>('modal', false);
        
        // String literal union with many values
        const [size] = useUI<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('size', 'md');
        
        return <div>Complex types</div>;
      }
    `,
		},
		result => {
			// Should extract all size variants
			['xs', 'sm', 'md', 'lg', 'xl', '2xl'].forEach(size => {
				assert(result.css.includes(`@variant size-${size}`), `Should have size-${size}`);
			});
			// Check attributes file
			const content = fs.readFileSync(getAttrFile(), 'utf-8');
			assert(content.includes('"data-size": "md"'), 'Should have size-md');
			assert(content.includes('"data-status": "idle"'), 'Should have status-idle');
			assert(content.includes('"data-modal": "false"'), 'Should have modal-false');
		}
	);
});

test('handles large projects efficiently', async function () {
	const files = {};

	// Generate 50 files
	for (let i = 0; i < 50; i++) {
		files[`src/component${i}.jsx`] = `
      import { useUI } from 'react-zero-ui';
      function Component${i}() {
        const [state${i}] = useUI('state${i}', 'value${i}');
        return <div>Component ${i}</div>;
      }
    `;
	}

	const startTime = Date.now();

	await runTest('performance', files, result => {
		const endTime = Date.now();
		const duration = endTime - startTime;

		console.log(`\n⚡ Performance: Processed 50 files in ${duration}ms`);

		// Should process all files
		assert(result.css.includes('@variant state49-value49'), 'Should process all files');

		// Should complete in reasonable time
		assert(duration < 300, 'Should process 50 files in under 300ms');
	});
});

test('handles special characters in values', async () => {
	await runTest(
		'special-chars',
		{
			'src/special.jsx': `
      import { useUI } from 'react-zero-ui';
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
		result => {
			assert(result.css.includes('@variant special-with-dash'));
			assert(result.css.includes('@variant special-with-underscore'));
			assert(result.css.includes('@variant special-123numeric'));
		}
	);
});

test('handles concurrent file modifications', async () => {
	// Test that rapid changes don't cause issues
	await runTest(
		'concurrent',
		{
			'src/rapid.jsx': `
      import { useUI } from 'react-zero-ui';
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
        import { useUI } from 'react-zero-ui';
        function Rapid() {
          const [count, setCount] = useUI('count', 'zero');
          return <button onClick={() => setCount('${i}')}>Count ${i}</button>;
        }
      `
				);

				// Small delay to simulate real editing
				await new Promise(resolve => setTimeout(resolve, 50));
			}

			// Final processing should work correctly
			const finalResult = await postcss([plugin()]).process('', { from: undefined });

			assert(finalResult.css.includes('AUTO-GENERATED'), 'Should handle rapid changes');
		}
	);
});

test('patchConfigAlias - config file patching', async t => {
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

	test('patchConfigAlias prefers tsconfig.json over jsconfig.json', async () => {
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

		assert(configContent.includes('@austinserb/react-zero-ui/postcss'), 'Should include Zero-UI plugin');
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

		assert(updatedContent.includes('@austinserb/react-zero-ui/postcss'), 'Should add Zero-UI plugin');
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

		assert(updatedContent.includes('@austinserb/react-zero-ui/postcss'), 'Should add Zero-UI plugin');
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
    '@austinserb/react-zero-ui/postcss': {},
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

		assert(updatedContent.includes('@austinserb/react-zero-ui/postcss'), 'Should add Zero-UI plugin');
		assert(updatedContent.includes('postcss-flexbugs-fixes'), 'Should preserve existing plugins');
		assert(updatedContent.includes('postcss-preset-env'), 'Should preserve complex plugin configs');

		// Verify Zero-UI comes before other plugins
		const zeroUiIndex = updatedContent.indexOf('@austinserb/react-zero-ui/postcss');
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

		assert(updatedJsContent.includes('@austinserb/react-zero-ui/postcss'), 'Should modify .js config');
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

		assert(updatedContent.includes('@austinserb/react-zero-ui/vite'), 'Should add Zero-UI import');
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

		assert(updatedContent.includes('@austinserb/react-zero-ui/vite'), 'Should add Zero-UI import');
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
import zeroUI from '@austinserb/react-zero-ui/vite'

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

		assert(updatedContent.includes('@austinserb/react-zero-ui/vite'), 'Should add Zero-UI import');
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

		assert(updatedContent.includes('@austinserb/react-zero-ui/vite'), 'Should add Zero-UI import');
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

		assert(updatedContent.includes('@austinserb/react-zero-ui/vite'), 'Should add Zero-UI import');
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

		assert(updatedContent.includes('@austinserb/react-zero-ui/vite'), 'Should add Zero-UI import');
		assert(updatedContent.includes('zeroUI()'), 'Should add zeroUI plugin to empty array');
	} finally {
		process.chdir(originalCwd);
		fs.rmSync(testDir, { recursive: true, force: true });
	}
});
