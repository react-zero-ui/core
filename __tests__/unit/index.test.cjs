const postcss = require('postcss')
const { test } = require('node:test')
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const plugin = require('../../src/postcss/index.cjs')
const { patchConfigAlias, toKebabCase } = require('../../src/postcss/helpers.cjs')

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
    const result = await postcss([plugin()])
      .process('', { from: undefined });

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
  await runTest('attributes', {
    'app/test.jsx': `
      import { useUI } from 'react-zero-ui';
      
      function Component() {
        const [theme, setTheme] = useUI('theme', 'light');
        const [sidebar, setSidebar] = useUI('sidebar', 'expanded');
        return <div>Test</div>;
      }
    `
  }, (result) => {
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
  });
});






test('handles TypeScript generic types', async () => {
  await runTest('typescript-generics', {
    'src/component.tsx': `
      import { useUI } from 'react-zero-ui';
      
      function Component() {
        const [status, setStatus] = useUI<'idle' | 'loading' | 'success' | 'error'>('status', 'idle');
        return <div>Status: {status}</div>;
      }
    `
  }, (result) => {
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
  });
});

test('detects JavaScript setValue calls', async () => {
  await runTest('javascript-detection', {
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
    `
  }, (result) => {
    console.log('\n🔍 JavaScript Detection Test:');

    const states = ['closed', 'open', 'minimized', 'fullscreen'];
    states.forEach(state => {
      assert(result.css.includes(`@variant modal-${state}`), `Should detect modal-${state}`);
    });

    const content = fs.readFileSync(getAttrFile(), 'utf-8');
    console.log('Initial value:', content.match(/"data-modal": "[^"]+"/)[0]);
  });
});

test('handles boolean values', async () => {
  await runTest('boolean-values', {
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
    `
  }, (result) => {
    console.log('\n🔍 Boolean Values Test:');

    assert(result.css.includes('@variant drawer-true'), 'Should have drawer-true');
    assert(result.css.includes('@variant drawer-false'), 'Should have drawer-false');
    assert(result.css.includes('@variant checkbox-true'), 'Should have checkbox-true');
    assert(result.css.includes('@variant checkbox-false'), 'Should have checkbox-false');

    const content = fs.readFileSync(getAttrFile(), 'utf-8');
    console.log('Boolean attributes:', content);
  });
});

test('handles kebab-case conversion', async () => {
  await runTest('kebab-case', {
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
    `
  }, (result) => {
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
  });
});

test('handles conditional expressions', async () => {
  await runTest('conditionals', {
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
    `
  }, (result) => {
    console.log('\n🔍 Conditional Expressions Test:');

    const expectedStates = ['default', 'active', 'inactive', 'night', 'day', 'fallback'];
    expectedStates.forEach(state => {
      assert(result.css.includes(`@variant state-${state}`), `Should detect state-${state}`);
    });
  });
});

test('handles multiple files and deduplication', async () => {
  await runTest('multiple-files', {
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
  }, (result) => {
    console.log('\n🔍 Multiple Files Test: ', result.css);

    // Should combine all theme values from all files
    const themeVariants = ['light', 'dark', 'blue', 'auto'];
    themeVariants.forEach(variant => {
      assert(result.css.includes(`@variant theme-${variant}`), `Should have theme-${variant}`);
    });

    // Count occurrences - should be deduplicated
    const lightCount = (result.css.match(/@variant theme-light/g) || []).length;
    assert.equal(lightCount, 1, 'Should deduplicate variants');
  });
});

test('handles parsing errors gracefully', async () => {
  await runTest('parse-errors', {
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
    `
  }, (result) => {
    console.log('\n🔍 Parse Error Test:');
    console.log('result: ', result.css);
    // Should still process valid files
    assert(result.css.includes('@variant valid-working'), 'Should process valid files');

    // Should not crash on invalid files
    assert(result.css.includes('AUTO-GENERATED'), 'Should complete processing');
  });
});

test('throws on empty string initial value', () => {
  assert.throws(() => toKebabCase(''));
});

test('valid edge cases: underscores + missing initial', async () => {
  await runTest('valid-edge', {
    'src/edge.jsx': `
      import { useUI } from 'react-zero-ui';
      function EdgeCases() {
        const [noInitial] = useUI('noInitial_value');
        const [, setOnlySetter] = useUI('only_setter_key', 'yes');
        setOnlySetter('set_later');
        return <div>Edge cases</div>;
      }
    `
  }, (result) => {
    console.log('result: ', result.css);
    assert(result.css.includes('@variant only-setter-key-set-later'));
    assert(!result.css.includes('@variant no-initial-value'));
  });
});



test('watches for file changes', async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping watch test in production');
    return;
  }

  await runTest('file-watching', {
    'src/initial.jsx': `
      import { useUI } from 'react-zero-ui';
      function Initial() {
        const [state, setState] = useUI('watchTest', 'initial');
        return <div>Initial</div>;e
      }
    `
  }, async (result) => {
    // Initial state
    assert(result.css.includes('@variant watch-test-initial'));

    // Add a new file
    fs.writeFileSync('src/new.jsx', `
      import { useUI } from 'react-zero-ui';
      function New() {
        const [state, setState] = useUI('watchTest', 'initial');
        return <button onClick={() => setState('updated')}>Update</button>;
      }
    `);

    // Wait for file watcher to process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Re-process to check if watcher picked up changes
    const result2 = await postcss([plugin()])
      .process('', { from: undefined });

    assert(result2.css.includes('@variant watch-test-updated'), 'Should detect new state');
  });
});

test('ignores node_modules and hidden directories', async () => {
  await runTest('ignored-dirs', {
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
    `
  }, (result) => {
    console.log('result: ', result.css);
    assert(result.css.includes('@variant valid-yes'), 'Should process valid files');
    assert(!result.css.includes('ignored'), 'Should ignore node_modules');
    assert(!result.css.includes('hidden'), 'Should ignore hidden directories');
  });
});

test('handles deeply nested file structures', async () => {
  await runTest('deep-nesting', {
    'src/features/auth/components/login/LoginForm.jsx': `
      import { useUI } from 'react-zero-ui';
      function LoginForm() {
        const [authState, setAuthState] = useUI('authState', 'loggedOut');
        return <button onClick={() => setAuthState('loggedIn')}>Login</button>;
      }
    `
  }, (result) => {
    assert(result.css.includes('@variant auth-state-logged-out'));
    assert(result.css.includes('@variant auth-state-logged-in'));
  });
});

test('handles complex TypeScript scenarios', async () => {
  await runTest('complex-typescript', {
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
    `
  }, (result) => {
    // Should extract all size variants
    ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].forEach(size => {
      assert(result.css.includes(`@variant size-${size}`), `Should have size-${size}`);
    });
    // Check attributes file
    const content = fs.readFileSync(getAttrFile(), 'utf-8');
    assert(content.includes('"data-size": "md"'), 'Should have size-md');
    assert(content.includes('"data-status": "idle"'), 'Should have status-idle');
    assert(content.includes('"data-modal": "false"'), 'Should have modal-false');
  });
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

  await runTest('performance', files, (result) => {
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
  await runTest('special-chars', {
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
    `
  }, (result) => {
    assert(result.css.includes('@variant special-with-dash'));
    assert(result.css.includes('@variant special-with-underscore'));
    assert(result.css.includes('@variant special-123numeric'));
  });
});

test('handles concurrent file modifications', async () => {
  // Test that rapid changes don't cause issues
  await runTest('concurrent', {
    'src/rapid.jsx': `
      import { useUI } from 'react-zero-ui';
      function Rapid() {
        const [count] = useUI('count', 'zero');
        return <div>Initial</div>;
      }
    `
  }, async () => {
    // Simulate rapid file changes
    for (let i = 0; i < 5; i++) {
      fs.writeFileSync('src/rapid.jsx', `
        import { useUI } from 'react-zero-ui';
        function Rapid() {
          const [count, setCount] = useUI('count', 'zero');
          return <button onClick={() => setCount('${i}')}>Count ${i}</button>;
        }
      `);

      // Small delay to simulate real editing
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Final processing should work correctly
    const finalResult = await postcss([plugin()])
      .process('', { from: undefined });

    assert(finalResult.css.includes('AUTO-GENERATED'), 'Should handle rapid changes');
  });
});


test('patchConfigAlias - config file patching', async (t) => {

  await t.test('patches tsconfig.json when it exists', async () => {
    const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-config-test'));
    const originalCwd = process.cwd();

    try {
      process.chdir(testDir);

      // Create a basic tsconfig.json
      const tsconfigContent = {
        compilerOptions: {
          target: "ES2015",
          module: "ESNext"
        }
      };
      fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigContent, null, 2));

      // Run patchConfigAlias
      patchConfigAlias();

      // Read the updated config
      const updatedConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
      // Verify the path alias was added
      assert(updatedConfig.compilerOptions.baseUrl === '.', 'Should set baseUrl');
      assert(updatedConfig.compilerOptions.paths, 'Should have paths object');
      assert(
        JSON.stringify(updatedConfig.compilerOptions.paths['@zero-ui/attributes']) ===
        JSON.stringify(['./.zero-ui/attributes.js']),
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
      const jsconfigContent = {
        compilerOptions: {
          target: "ES2015"
        }
      };
      fs.writeFileSync('jsconfig.json', JSON.stringify(jsconfigContent, null, 2));

      // Run patchConfigAlias
      patchConfigAlias();

      // Read the updated config
      const updatedConfig = JSON.parse(fs.readFileSync('jsconfig.json', 'utf-8'));

      // Verify the path alias was added
      assert(updatedConfig.compilerOptions.baseUrl === '.', 'Should set baseUrl');
      assert(updatedConfig.compilerOptions.paths, 'Should have paths object');
      assert(
        JSON.stringify(updatedConfig.compilerOptions.paths['@zero-ui/attributes']) ===
        JSON.stringify(['./.zero-ui/attributes.js']),
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
          baseUrl: ".",
          paths: {
            "@zero-ui/attributes": ["./.zero-ui/attributes.js"],
            "@/*": ["./src/*"]
          }
        }
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
      const tsconfigContent = {
        include: ["src/**/*"]
      };
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
        JSON.stringify(updatedConfig.compilerOptions.paths['@zero-ui/attributes']) ===
        JSON.stringify(['./.zero-ui/attributes.js']),
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
        JSON.stringify(updatedConfig.compilerOptions.paths['@zero-ui/attributes']) ===
        JSON.stringify(['./.zero-ui/attributes.js']),
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
      assert(
        tsconfigContent.compilerOptions.paths['@zero-ui/attributes'],
        'Should add alias to tsconfig.json'
      );

      // Verify jsconfig.json was not modified
      const jsconfigContent = JSON.parse(fs.readFileSync('jsconfig.json', 'utf-8'));
      assert(!jsconfigContent.compilerOptions.paths, 'Should not modify jsconfig.json');

    } finally {
      process.chdir(originalCwd);
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
});

