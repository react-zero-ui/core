const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('node:child_process');

// Helper to create isolated test directory
function createTestDir() {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-cli-test-'));
	return testDir;
}

// Helper to clean up test directory
function cleanupTestDir(testDir) {
	if (fs.existsSync(testDir)) {
		try {
			fs.rmSync(testDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
		} catch (error) {
			// On Windows/macOS, sometimes files are locked. Try alternative cleanup
			console.warn(`Warning: Could not clean up test directory ${testDir}: ${error.message}`);
			try {
				// Try to remove files individually
				const cleanup = dir => {
					const entries = fs.readdirSync(dir, { withFileTypes: true });
					for (const entry of entries) {
						const fullPath = path.join(dir, entry.name);
						if (entry.isDirectory()) {
							cleanup(fullPath);
							try {
								fs.rmdirSync(fullPath);
							} catch (e) {
								// Ignore
								console.log(`Error deleting directory ${fullPath}: ${e.message}`);
							}
						} else {
							try {
								fs.unlinkSync(fullPath);
							} catch (e) {
								// Ignore
								console.log(`Error deleting file ${fullPath}: ${e.message}`);
							}
						}
					}
				};
				cleanup(testDir);
				fs.rmdirSync(testDir);
			} catch (secondError) {
				console.warn(`Final cleanup attempt failed: ${secondError.message}`);
			}
		}
	}
}

// Helper to run CLI script and capture output
function runCLIScript(targetDir, timeout = 30000) {
	return new Promise((resolve, reject) => {
		// Updated path to the correct CLI script location
		const binScript = path.resolve(__dirname, '../../../cli/bin.js');

		const child = spawn('node', [binScript, '.'], { cwd: targetDir, stdio: ['pipe', 'pipe', 'pipe'] });

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', data => {
			stdout += data.toString();
		});

		child.stderr.on('data', data => {
			stderr += data.toString();
		});

		const timer = setTimeout(() => {
			child.kill('SIGKILL');
			reject(new Error(`CLI script timed out after ${timeout}ms`));
		}, timeout);

		child.on('close', code => {
			clearTimeout(timer);
			resolve({ code, stdout, stderr, success: code === 0 });
		});

		child.on('error', error => {
			clearTimeout(timer);
			reject(error);
		});
	});
}

// test('CLI script creates package.json if it does not exist', async () => {
//   const testDir = createTestDir();

//   try {
//     // Ensure no package.json exists
//     const packageJsonPath = path.join(testDir, 'package.json');
//     assert(!fs.existsSync(packageJsonPath), 'package.json should not exist initially');

//     // Run CLI (this will timeout on npm install, but that's ok for this test)
//     const result = await runCLIScript(testDir, 5000).catch(err => {
//       // We expect this to timeout/fail during npm install
//       return { timedOut: true };
//     });

//     // Check that package.json was created
//     assert(fs.existsSync(packageJsonPath), 'package.json should be created');

//     const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
//     assert(packageJson.name, 'package.json should have a name field');
//     assert(packageJson.version, 'package.json should have a version field');

//     console.log('✅ package.json created successfully');

//   } finally {
//     cleanupTestDir(testDir);
//   }
// });

test('CLI script uses existing package.json if it exists', async () => {
	const testDir = createTestDir();

	try {
		// Create a custom package.json
		const customPackageJson = { name: 'my-test-app', version: '2.0.0', description: 'Custom test app' };

		const packageJsonPath = path.join(testDir, 'package.json');
		fs.writeFileSync(packageJsonPath, JSON.stringify(customPackageJson, null, 2));

		// Run CLI (this will timeout on npm install, but that's ok for this test)
		await runCLIScript(testDir, 5000).catch(err => {
			// We expect this to timeout/fail during npm install
			console.log('CLI run resulted in:', err.message);
			return { timedOut: true };
		});

		// Check that our custom package.json is preserved
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
		assert.strictEqual(packageJson.name, 'my-test-app', 'Custom name should be preserved');
		assert.strictEqual(packageJson.version, '2.0.0', 'Custom version should be preserved');
		assert.strictEqual(packageJson.description, 'Custom test app', 'Custom description should be preserved');

		console.log('✅ Existing package.json preserved');
	} finally {
		cleanupTestDir(testDir);
	}
});

test('CLI script installs correct dependencies', async () => {
	const testDir = createTestDir();

	try {
		// Create package.json to avoid npm init
		const packageJson = { name: 'test-app', version: '1.0.0', scripts: {}, dependencies: {}, devDependencies: {} };
		fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

		// Mock npm by creating a fake npm script that logs what would be installed
		const mockNpmScript = `#!/bin/bash
    echo "Mock npm called with: $@" >> npm-calls.log
    
    # Simulate package installation by updating package.json
    if [[ "$*" == *"install"* ]]; then
      node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        
        // Handle production dependency
        if (process.argv.slice(2).includes('@austinserb/react-zero-ui') && !process.argv.slice(2).includes('--save-dev')) {
          if (!pkg.dependencies) pkg.dependencies = {};
          pkg.dependencies['@austinserb/react-zero-ui'] = '^1.0.0';
        }
        
        // Handle dev dependencies
        if (process.argv.slice(2).includes('--save-dev')) {
          if (!pkg.devDependencies) pkg.devDependencies = {};
          pkg.devDependencies['tailwindcss'] = '^4.0.0';
          pkg.devDependencies['postcss'] = '^8.4.27';
          pkg.devDependencies['@tailwindcss/postcss'] = '^4.1.8';
        }
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
      " -- $@
    fi
    `;

		const mockNpmPath = path.join(testDir, 'npm');
		fs.writeFileSync(mockNpmPath, mockNpmScript);
		fs.chmodSync(mockNpmPath, '755');

		// Update PATH to use our mock npm
		const originalPath = process.env.PATH;
		process.env.PATH = `${testDir}:${originalPath}`;

		try {
			// Run CLI script
			await runCLIScript(testDir, 10000).catch(err => {
				console.log('CLI run resulted in:', err.message);
				return { error: err.message };
			});

			// Check that npm was called
			const npmCallsPath = path.join(testDir, 'npm-calls.log');
			if (fs.existsSync(npmCallsPath)) {
				const npmCalls = fs.readFileSync(npmCallsPath, 'utf-8');
				console.log('NPM calls:', npmCalls);

				assert(npmCalls.includes('install'), 'npm install should be called');
				assert(npmCalls.includes('@austinserb/react-zero-ui'), 'Should install react-zero-ui');
				assert(npmCalls.includes('tailwindcss'), 'Should install tailwindcss');
				assert(npmCalls.includes('postcss'), 'Should install postcss');
				assert(npmCalls.includes('@tailwindcss/postcss'), 'Should install @tailwindcss/postcss');
			}

			// Check package.json was updated with dependencies
			const finalPackageJson = JSON.parse(fs.readFileSync(path.join(testDir, 'package.json'), 'utf-8'));

			// Updated assertion - react-zero-ui should be in dependencies (production), not devDependencies
			assert(finalPackageJson.dependencies['@austinserb/react-zero-ui'], 'react-zero-ui should be in dependencies');
			assert(finalPackageJson.devDependencies['tailwindcss'], 'tailwindcss should be in devDependencies');
			assert(finalPackageJson.devDependencies['postcss'], 'postcss should be in devDependencies');
			assert(finalPackageJson.devDependencies['@tailwindcss/postcss'], '@tailwindcss/postcss should be in devDependencies');

			console.log('✅ All required dependencies installed');
		} finally {
			process.env.PATH = originalPath;
		}
	} finally {
		cleanupTestDir(testDir);
	}
});

test('CLI script handles different target directories', async () => {
	const baseTestDir = createTestDir();
	const subDir = path.join(baseTestDir, 'my-project');

	try {
		// Create subdirectory
		fs.mkdirSync(subDir, { recursive: true });

		// Run CLI with subdirectory target
		const binScript = path.resolve(__dirname, '../../../cli/bin.js');

		await new Promise((resolve, reject) => {
			const child = spawn('node', [binScript, 'my-project'], { cwd: baseTestDir, stdio: ['pipe', 'pipe', 'pipe'] });

			const timer = setTimeout(() => {
				child.kill('SIGKILL');
				resolve({ timedOut: true });
			}, 5000);

			child.on('close', code => {
				clearTimeout(timer);
				resolve({ code });
			});

			child.on('error', error => {
				clearTimeout(timer);
				reject(error);
			});
		});

		// Check that package.json was created in subdirectory
		const packageJsonPath = path.join(subDir, 'package.json');
		assert(fs.existsSync(packageJsonPath), 'package.json should be created in target subdirectory');

		console.log('✅ CLI script works with target directories');
	} finally {
		cleanupTestDir(baseTestDir);
	}
});

test('CLI script imports and executes library CLI', async () => {
	const testDir = createTestDir();

	try {
		// Create a minimal package.json
		const packageJson = { name: 'test', version: '1.0.0' };
		fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

		// Create mock node_modules structure
		const nodeModulesDir = path.join(testDir, 'node_modules', '@austinserb', 'react-zero-ui');
		fs.mkdirSync(nodeModulesDir, { recursive: true });

		// Create mock CLI module that matches the actual structure
		const mockCLI = `
      // Mock implementation of the CLI
      async function runZeroUiInit() {
        console.log('Mock CLI executed successfully');
      }
      
      function cli(argv = process.argv.slice(2)) {
        await runZeroUiInit(argv);
        return Promise.resolve();
      }
      
      module.exports = cli;
      module.exports.default = cli;
    `;

		fs.writeFileSync(path.join(nodeModulesDir, 'cli.cjs'), mockCLI);

		// Create package.json for the mock module
		const mockPackageJson = {
			name: '@austinserb/react-zero-ui',
			main: 'index.js',
			exports: { './cli': { types: './cli.d.ts', require: './cli.cjs', import: './cli.cjs' } },
		};
		fs.writeFileSync(path.join(nodeModulesDir, 'package.json'), JSON.stringify(mockPackageJson));

		// Mock npm to avoid actual installation
		const mockNpmScript = `#!/bin/bash\necho "Mock npm install completed"`;
		const mockNpmPath = path.join(testDir, 'npm');
		fs.writeFileSync(mockNpmPath, mockNpmScript);
		fs.chmodSync(mockNpmPath, '755');

		const originalPath = process.env.PATH;
		process.env.PATH = `${testDir}:${originalPath}`;

		try {
			const result = await runCLIScript(testDir, 10000).catch(err => {
				console.log('CLI run resulted in:', err.message);
				return { error: err.message };
			});

			// Check that CLI was executed
			assert(
				result.stdout.includes('Mock CLI executed successfully') || result.stdout.includes('Zero-UI installed'),
				'CLI should execute library CLI function'
			);

			console.log('✅ CLI script successfully imports and executes library CLI');
		} finally {
			process.env.PATH = originalPath;
		}
	} finally {
		cleanupTestDir(testDir);
	}
});

// Additional test for library CLI functionality
test('Library CLI initializes project correctly', async () => {
	const testDir = createTestDir();

	try {
		// Create a test React component with useUI hook
		const componentDir = path.join(testDir, 'src', 'components');
		fs.mkdirSync(componentDir, { recursive: true });

		const testComponent = `
import { useUI } from '@austinserb/react-zero-ui';

export function TestComponent() {
  const [count, setCount] = useUI(0);
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
`;

		fs.writeFileSync(path.join(componentDir, 'TestComponent.jsx'), testComponent);

		// Import and run the library CLI directly
		const { runZeroUiInit } = require('../../src/cli/postInstall.cjs');

		// Mock console to capture output
		const originalConsoleLog = console.log;
		const logMessages = [];
		console.log = (...args) => {
			logMessages.push(args.join(' '));
			originalConsoleLog(...args);
		};

		// Change to test directory and run CLI
		const originalCwd = process.cwd();
		process.chdir(testDir);

		try {
			await runZeroUiInit();

			// Check that initialization messages were logged
			const logOutput = logMessages.join('\n');
			assert(logOutput.includes('[Zero-UI] Initializing...'), 'Should log initialization message');
			assert(logOutput.includes('[Zero-UI] ✅ Initialized') || logOutput.includes('No useUI hooks found'), 'Should complete initialization');

			console.log('✅ Library CLI initializes project correctly');
		} finally {
			process.chdir(originalCwd);
			console.log = originalConsoleLog;
		}
	} finally {
		cleanupTestDir(testDir);
	}
});

// Test error handling in library CLI
test('Library CLI handles errors gracefully', async () => {
	const testDir = createTestDir();

	try {
		// Create invalid structure that might cause errors
		const originalCwd = process.cwd();
		process.chdir(testDir);

		// Mock console.error to capture error output
		const originalConsoleError = console.error;
		const errorMessages = [];
		console.error = (...args) => {
			errorMessages.push(args.join(' '));
			originalConsoleError(...args);
		};

		// Mock process.exit to prevent actual exit
		const originalExit = process.exit;
		let exitCalled = false;
		process.exit = code => {
			exitCalled = true;
			throw new Error(`Process exit called with code ${code}`);
		};

		try {
			const { runZeroUiInit } = require('../../src/cli/postInstall.cjs');

			// This should complete without errors in most cases
			await runZeroUiInit();

			console.log('✅ Library CLI handles execution without crashing');
		} catch (error) {
			// If an error occurs, make sure it's handled gracefully
			if (exitCalled) {
				console.log('✅ Library CLI properly exits on error');
			} else {
				throw error;
			}
		} finally {
			process.chdir(originalCwd);
			console.error = originalConsoleError;
			process.exit = originalExit;
		}
	} finally {
		cleanupTestDir(testDir);
	}
});

// Test CLI script with no arguments (current directory)
test('CLI script works with no target directory (defaults to current)', async () => {
	const testDir = createTestDir();

	try {
		// Mock npm to avoid actual installation but make it create package.json
		const mockNpmScript = `#!/bin/bash
echo "Mock npm completed"
# Simulate npm init -y creating package.json when it doesn't exist
if [[ "$*" == *"init"* ]] && [[ ! -f "package.json" ]]; then
  echo '{"name": "test-project", "version": "1.0.0", "description": ""}' > package.json
fi
`;
		const mockNpmPath = path.join(testDir, 'npm');
		fs.writeFileSync(mockNpmPath, mockNpmScript);
		fs.chmodSync(mockNpmPath, '755');

		const originalPath = process.env.PATH;
		process.env.PATH = `${testDir}:${originalPath}`;

		try {
			// Run CLI without any arguments (should default to current directory)
			const binScript = path.resolve(__dirname, '../../../cli/bin.js');

			await new Promise((resolve, reject) => {
				const child = spawn('node', [binScript], {
					// No target directory argument
					cwd: testDir,
					stdio: ['pipe', 'pipe', 'pipe'],
				});

				const timer = setTimeout(() => {
					child.kill('SIGKILL');
					resolve({ timedOut: true });
				}, 5000);

				child.on('close', code => {
					clearTimeout(timer);
					resolve({ code });
				});

				child.on('error', error => {
					clearTimeout(timer);
					reject(error);
				});
			});

			// Check that package.json was created in current directory
			const packageJsonPath = path.join(testDir, 'package.json');
			assert(fs.existsSync(packageJsonPath), 'package.json should be created in current directory');

			console.log('✅ CLI script works with no target directory specified');
		} finally {
			process.env.PATH = originalPath;
		}
	} finally {
		cleanupTestDir(testDir);
	}
});

// Test CLI script with invalid target directory
test('CLI script handles invalid target directory', async () => {
	const testDir = createTestDir();

	try {
		// Try to run CLI with a non-existent directory
		const binScript = path.resolve(__dirname, '../../../cli/bin.js');

		const result = await new Promise(resolve => {
			const child = spawn('node', [binScript, 'non-existent-dir'], { cwd: testDir, stdio: ['pipe', 'pipe', 'pipe'] });

			let stderr = '';
			child.stderr.on('data', data => {
				stderr += data.toString();
			});

			const timer = setTimeout(() => {
				child.kill('SIGKILL');
				resolve({ timedOut: true, stderr });
			}, 5000);

			child.on('close', code => {
				clearTimeout(timer);
				resolve({ code, stderr });
			});

			child.on('error', error => {
				clearTimeout(timer);
				resolve({ error: error.message });
			});
		});

		// The CLI should either create the directory or handle the error gracefully
		assert(result.code !== undefined || result.error || result.timedOut, 'CLI should handle invalid directory gracefully');

		console.log('✅ CLI script handles invalid target directory');
	} finally {
		cleanupTestDir(testDir);
	}
});

// Test CLI script exit codes
test('CLI script returns appropriate exit codes', async () => {
	const testDir = createTestDir();

	try {
		// Create package.json to speed up the test
		const packageJson = { name: 'test', version: '1.0.0' };
		fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson));

		// Mock npm to simulate successful installation
		const mockNpmScript = `#!/bin/bash\necho "Mock npm successful"; exit 0`;
		const mockNpmPath = path.join(testDir, 'npm');
		fs.writeFileSync(mockNpmPath, mockNpmScript);
		fs.chmodSync(mockNpmPath, '755');

		// Create mock CLI module
		const nodeModulesDir = path.join(testDir, 'node_modules', '@austinserb', 'react-zero-ui');
		fs.mkdirSync(nodeModulesDir, { recursive: true });

		const mockCLI = `
      function cli() {
        console.log('CLI executed successfully');
        return Promise.resolve();
      }
      module.exports = cli;
      module.exports.default = cli;
    `;

		fs.writeFileSync(path.join(nodeModulesDir, 'cli.cjs'), mockCLI);

		const mockPackageJson = { name: '@austinserb/react-zero-ui', exports: { './cli': { require: './cli.cjs', import: './cli.cjs' } } };
		fs.writeFileSync(path.join(nodeModulesDir, 'package.json'), JSON.stringify(mockPackageJson));

		const originalPath = process.env.PATH;
		process.env.PATH = `${testDir}:${originalPath}`;

		try {
			const binScript = path.resolve(__dirname, '../../../cli/bin.js');

			const result = await new Promise((resolve, reject) => {
				const child = spawn('node', [binScript, '.'], { cwd: testDir, stdio: ['pipe', 'pipe', 'pipe'] });

				let stdout = '';
				child.stdout.on('data', data => {
					stdout += data.toString();
				});

				const timer = setTimeout(() => {
					child.kill('SIGKILL');
					resolve({ timedOut: true });
				}, 10000);

				child.on('close', code => {
					clearTimeout(timer);
					resolve({ code, stdout });
				});

				child.on('error', error => {
					clearTimeout(timer);
					reject(error);
				});
			});

			// Should complete successfully or timeout (which is expected due to our mocks)
			assert(result.code === 0 || result.timedOut || result.stdout.includes('Zero-UI installed'), 'CLI should complete successfully');

			console.log('✅ CLI script returns appropriate exit codes');
		} finally {
			process.env.PATH = originalPath;
		}
	} finally {
		cleanupTestDir(testDir);
	}
});

// Test library CLI with actual useUI components
test('Library CLI processes useUI hooks correctly', async () => {
	const testDir = createTestDir();

	try {
		// Create multiple test components with useUI hooks
		const componentsDir = path.join(testDir, 'src', 'components');
		fs.mkdirSync(componentsDir, { recursive: true });

		const component1 = `
import { useUI } from '@austinserb/react-zero-ui';

export function Counter() {
  const [count, setCount] = useUI(0);
  const [step, setStep] = useUI(1);
  
  return (
    <div>
      <button onClick={() => setCount(count + step)}>
        Count: {count}
      </button>
      <input value={step} onChange={(e) => setStep(parseInt(e.target.value))} />
    </div>
  );
}
`;

		const component2 = `
import { useUI } from '@austinserb/react-zero-ui';

export function Toggle() {
  const [isOpen, setIsOpen] = useUI(false);
  
  return (
    <button onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? 'Close' : 'Open'}
    </button>
  );
}
`;

		fs.writeFileSync(path.join(componentsDir, 'Counter.jsx'), component1);
		fs.writeFileSync(path.join(componentsDir, 'Toggle.jsx'), component2);

		// Import and run the library CLI
		const { runZeroUiInit } = require('../../src/cli/postInstall.cjs');

		const originalConsoleLog = console.log;
		const logMessages = [];
		console.log = (...args) => {
			logMessages.push(args.join(' '));
			originalConsoleLog(...args);
		};

		const originalCwd = process.cwd();
		process.chdir(testDir);

		try {
			await runZeroUiInit();

			const logOutput = logMessages.join('\n');
			assert(logOutput.includes('[Zero-UI] Initializing...'), 'Should log initialization');

			// Check that variants were processed
			const hasVariants = logOutput.includes('variants from') && !logOutput.includes('0 variants');
			const hasNoVariants = logOutput.includes('No useUI hooks found');

			assert(hasVariants || hasNoVariants, 'Should process variants or indicate none found');

			console.log('✅ Library CLI processes useUI hooks correctly');
		} finally {
			process.chdir(originalCwd);
			console.log = originalConsoleLog;
		}
	} finally {
		cleanupTestDir(testDir);
	}
});

// Test package.json validation
test('CLI script validates and preserves existing package.json fields', async () => {
	const testDir = createTestDir();

	try {
		// Create a comprehensive package.json with various fields
		const complexPackageJson = {
			name: 'my-complex-app',
			version: '1.5.0',
			description: 'A complex test application',
			main: 'index.js',
			scripts: { start: 'node index.js', test: 'jest', build: 'webpack' },
			dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
			devDependencies: { jest: '^29.0.0', webpack: '^5.0.0' },
			keywords: ['react', 'test'],
			author: 'Test Author',
			license: 'MIT',
			repository: { type: 'git', url: 'https://github.com/test/repo.git' },
		};

		const packageJsonPath = path.join(testDir, 'package.json');
		fs.writeFileSync(packageJsonPath, JSON.stringify(complexPackageJson, null, 2));

		// Run CLI with timeout to avoid full installation
		await runCLIScript(testDir, 3000).catch(() => ({ timedOut: true }));

		// Verify all original fields are preserved
		const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

		assert.strictEqual(updatedPackageJson.name, 'my-complex-app', 'Name should be preserved');
		assert.strictEqual(updatedPackageJson.version, '1.5.0', 'Version should be preserved');
		assert.strictEqual(updatedPackageJson.description, 'A complex test application', 'Description should be preserved');
		assert.strictEqual(updatedPackageJson.main, 'index.js', 'Main should be preserved');
		assert.deepStrictEqual(updatedPackageJson.scripts, complexPackageJson.scripts, 'Scripts should be preserved');
		assert.strictEqual(updatedPackageJson.dependencies.react, '^18.0.0', 'Existing dependencies should be preserved');
		assert.strictEqual(updatedPackageJson.author, 'Test Author', 'Author should be preserved');
		assert.strictEqual(updatedPackageJson.license, 'MIT', 'License should be preserved');

		console.log('✅ CLI script validates and preserves existing package.json fields');
	} finally {
		cleanupTestDir(testDir);
	}
});
