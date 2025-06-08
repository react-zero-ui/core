const postcss = require('postcss')
const { test } = require('node:test')
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const plugin = require('.')

// Helper to create temp directory and run test
async function runTest(testName, files, callback) {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-test-'));
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
    await callback(result, testDir);

  } finally {
    process.chdir(originalCwd);
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
  }, (result, testDir) => {
    // Check attributes file exists

    const attrPath = '.zero-ui/attributes.js';
    assert(fs.existsSync(attrPath), 'Attributes file should exist');

    // Read and parse attributes
    const content = fs.readFileSync(attrPath, 'utf-8');
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
  }, (result, testDir) => {
    console.log('\n🔍 TypeScript Generic Test:');

    // Check all variants were generated
    const variants = ['idle', 'loading', 'success', 'error'];
    variants.forEach(variant => {
      assert(result.css.includes(`@variant status-${variant}`), `Should have status-${variant} variant`);
    });

    // Check attributes file
    const content = fs.readFileSync('.zero-ui/attributes.js', 'utf-8');
    console.log('Attributes:', content);
    assert(content.includes('"data-status": "idle"'), 'Should use initial value');
  });
});

// test('detects JavaScript setValue calls', async () => {
//   await runTest('javascript-detection', {
//     'src/modal.js': `
//       import { useUI } from 'react-zero-ui';
      
//       function Modal() {
//         const [modal, setModal] = useUI('modal', 'closed');
        
//         return (
//           <div>
//             <button onClick={() => setModal('open')}>Open</button>
//             <button onClick={() => setModal('minimized')}>Minimize</button>
//             <button onClick={() => {
//               // Complex handler
//               if (someCondition) {
//                 setModal('fullscreen');
//               } else {
//                 setModal('closed');
//               }
//             }}>Toggle</button>
//           </div>
//         );
//       }
//     `
//   }, (result, testDir) => {
//     console.log('\n🔍 JavaScript Detection Test:');

//     const states = ['closed', 'open', 'minimized', 'fullscreen'];
//     states.forEach(state => {
//       assert(result.css.includes(`@variant modal-${state}`), `Should detect modal-${state}`);
//     });

//     const content = fs.readFileSync('.zero-ui/attributes.js', 'utf-8');
//     console.log('Initial value:', content.match(/"data-modal": "[^"]+"/)?.[0]);
//   });
// });

// test('handles boolean values', async () => {
//   await runTest('boolean-values', {
//     'app/toggle.tsx': `
//       import { useUI } from 'react-zero-ui';
      
//       function Toggle() {
//         const [isOpen, setIsOpen] = useUI<boolean>('drawer', false);
//         const [checked, setChecked] = useUI('checkbox', true);
        
//         return (
//           <button onClick={() => setIsOpen(!isOpen)}>
//             Toggle
//           </button>
//         );
//       }
//     `
//   }, (result, testDir) => {
//     console.log('\n🔍 Boolean Values Test:');

//     assert(result.css.includes('@variant drawer-true'), 'Should have drawer-true');
//     assert(result.css.includes('@variant drawer-false'), 'Should have drawer-false');
//     assert(result.css.includes('@variant checkbox-true'), 'Should have checkbox-true');
//     assert(result.css.includes('@variant checkbox-false'), 'Should have checkbox-false');

//     const content = fs.readFileSync('.zero-ui/attributes.js', 'utf-8');
//     console.log('Boolean attributes:', content);
//   });
// });

// test('handles kebab-case conversion', async () => {
//   await runTest('kebab-case', {
//     'src/styles.jsx': `
//       import { useUI } from 'react-zero-ui';
      
//       function StyledComponent() {
//         const [primaryColor, setPrimaryColor] = useUI('primaryColor', 'deepBlue');
//         const [bgStyle, setBgStyle] = useUI('backgroundColor', 'lightGray');
        
//         return (
//           <div>
//             <button onClick={() => setPrimaryColor('darkRed')}>Red</button>
//             <button onClick={() => setBgStyle('paleYellow')}>Yellow</button>
//           </div>
//         );
//       }
//     `
//   }, (result, testDir) => {
//     console.log('\n🔍 Kebab-case Test:');

//     // Check CSS has kebab-case
//     assert(result.css.includes('@variant primary-color-deep-blue'), 'Should convert to kebab-case');
//     assert(result.css.includes('@variant primary-color-dark-red'), 'Should convert to kebab-case');
//     assert(result.css.includes('@variant background-color-light-gray'), 'Should convert to kebab-case');
//     assert(result.css.includes('@variant background-color-pale-yellow'), 'Should convert to kebab-case');

//     // Check attributes use kebab-case keys
//     const content = fs.readFileSync('.zero-ui/attributes.js', 'utf-8');
//     assert(content.includes('"data-primary-color"'), 'Attribute key should be kebab-case');
//     assert(content.includes('"data-background-color"'), 'Attribute key should be kebab-case');
//     console.log('Kebab-case attributes:', content);
//   });
// });

// test('handles conditional expressions', async () => {
//   await runTest('conditionals', {
//     'app/conditional.jsx': `
//       import { useUI } from 'react-zero-ui';
      
//       function ConditionalComponent({ isActive, mode }) {
//         const [state, setState] = useUI('state', 'default');
        
//         return (
//           <div>
//             <button onClick={() => setState(isActive ? 'active' : 'inactive')}>
//               Toggle Active
//             </button>
//             <button onClick={() => setState(mode === 'dark' ? 'night' : 'day')}>
//               Toggle Mode
//             </button>
//             <button onClick={() => setState(someVar || 'fallback')}>
//               Fallback
//             </button>
//           </div>
//         );
//       }
//     `
//   }, (result, testDir) => {
//     console.log('\n🔍 Conditional Expressions Test:');

//     const expectedStates = ['default', 'active', 'inactive', 'night', 'day', 'fallback'];
//     expectedStates.forEach(state => {
//       assert(result.css.includes(`@variant state-${state}`), `Should detect state-${state}`);
//     });
//   });
// });

// test('handles multiple files and deduplication', async () => {
//   await runTest('multiple-files', {
//     'src/header.jsx': `
//       import { useUI } from 'react-zero-ui';
//       function Header() {
//         const [theme, setTheme] = useUI('theme', 'light');
//         return <button onClick={() => setTheme('dark')}>Dark</button>;
//       }
//     `,
//     'src/footer.jsx': `
//       import { useUI } from 'react-zero-ui';
//       function Footer() {
//         const [theme, setTheme] = useUI('theme', 'light');
//         return <button onClick={() => setTheme('blue')}>Blue</button>;
//       }
//     `,
//     'app/sidebar.tsx': `
//       import { useUI } from 'react-zero-ui';
//       function Sidebar() {
//         const [theme, setTheme] = useUI<'light' | 'dark' | 'auto'>('theme', 'light');
//         return <div>Sidebar</div>;
//       }
//     `
//   }, (result, testDir) => {
//     console.log('\n🔍 Multiple Files Test:');

//     // Should combine all theme values from all files
//     const themeVariants = ['light', 'dark', 'blue', 'auto'];
//     themeVariants.forEach(variant => {
//       assert(result.css.includes(`@variant theme-${variant}`), `Should have theme-${variant}`);
//     });

//     // Count occurrences - should be deduplicated
//     const lightCount = (result.css.match(/@variant theme-light/g) || []).length;
//     assert.equal(lightCount, 1, 'Should deduplicate variants');
//   });
// });

// test('handles parsing errors gracefully', async () => {
//   await runTest('parse-errors', {
//     'src/valid.jsx': `
//       import { useUI } from 'react-zero-ui';
//       function Valid() {
//         const [state, setState] = useUI('valid', 'working');
//         return <div>Valid</div>;
//       }
//     `,
//     'src/invalid.js': `
//       import { useUI } from 'react-zero-ui';
//       function Invalid() {
//         const [state, setState] = useUI('test' 'missing-comma');
//         {{{ invalid syntax
//       }
//     `
//   }, (result, testDir) => {
//     console.log('\n🔍 Parse Error Test:');

//     // Should still process valid files
//     assert(result.css.includes('@variant valid-working'), 'Should process valid files');

//     // Should not crash on invalid files
//     assert(result.css.includes('AUTO-GENERATED'), 'Should complete processing');
//   });
// });

// test('handles empty and missing values', async () => {
//   await runTest('edge-cases', {
//     'src/edge.jsx': `
//       import { useUI } from 'react-zero-ui';
      
//       function EdgeCases() {
//         const [empty, setEmpty] = useUI('empty', '');
//         const [noInitial] = useUI('noInitial');
//         const [, setOnlySetter] = useUI('onlySetter', 'value');
        
//         return <div>Edge cases</div>;
//       }
//     `
//   }, (result, testDir) => {
//     console.log('\n🔍 Edge Cases Test:');

//     // Should handle only setter pattern
//     assert(result.css.includes('@variant only-setter-value'), 'Should handle only setter pattern');

//     const content = fs.readFileSync('.zero-ui/attributes.js', 'utf-8');
//     console.log('Edge case attributes:', content);
//   });
// });

// // Run all tests
// console.log('🧪 Running Zero UI PostCSS Plugin Tests...\n');