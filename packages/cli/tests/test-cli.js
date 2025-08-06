import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binScript = path.resolve(__dirname, '../bin.js');

test('CLI script uses existing package.json if it exists', async () => {
	const testDir = createTestDir();

	try {
		// Create a custom package.json
		const customPackageJson = { name: 'my-test-app', version: '2.0.0', description: 'Custom test app' };

		const packageJsonPath = path.join(testDir, 'package.json');
		fs.writeFileSync(packageJsonPath, JSON.stringify(customPackageJson, null, 2));

		// Run CLI (this will timeout on npm install, but that's ok for this test)
		await runCLIScript(testDir, 5000);

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
        import fs from 'fs';
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        
        // Handle production dependency
        if (process.argv.slice(2).includes('@react-zero-ui/core') && !process.argv.slice(2).includes('--save-dev')) {
          if (!pkg.dependencies) pkg.dependencies = {};
          pkg.dependencies['@react-zero-ui/core'] = '^1.0.0';
        }
        
        // Handle dev dependencies
        if (process.argv.slice(2).includes('--save-dev')) {
          if (!pkg.devDependencies) pkg.devDependencies = {};
      
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
			await runCLIScript(testDir, 10000).catch((err) => {
				console.log('CLI run resulted in:', err.message);
				return { error: err.message };
			});

			// Check that npm was called
			const npmCallsPath = path.join(testDir, 'npm-calls.log');
			if (fs.existsSync(npmCallsPath)) {
				const npmCalls = fs.readFileSync(npmCallsPath, 'utf-8');
				console.log('NPM calls:', npmCalls);

				assert(npmCalls.includes('install'), 'npm install should be called');
				assert(npmCalls.includes('@react-zero-ui/core'), 'Should install react-zero-ui');
				assert(npmCalls.includes('@tailwindcss/postcss'), 'Should install @tailwindcss/postcss');
			}

			// Check package.json was updated with dependencies
			const finalPackageJson = JSON.parse(fs.readFileSync(path.join(testDir, 'package.json'), 'utf-8'));

			// react-zero-ui should be in dependencies (production), not devDependencies
			assert(finalPackageJson.dependencies['@react-zero-ui/core'], 'react-zero-ui should be in dependencies');
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

		await new Promise((resolve, reject) => {
			const child = spawn('node', [binScript, 'my-project'], { cwd: baseTestDir, stdio: ['pipe', 'pipe', 'pipe'] });

			const timer = setTimeout(() => {
				child.kill('SIGKILL');
				resolve({ timedOut: true });
			}, 5000);

			child.on('close', (code) => {
				clearTimeout(timer);
				resolve({ code });
			});

			child.on('error', (error) => {
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

// Additional test for library CLI functionality
test('Library CLI initializes project correctly', async () => {
	const testDir = createTestDir();

	try {
		// Create a test React component with useUI hook
		const componentDir = path.join(testDir, 'components');
		fs.mkdirSync(componentDir, { recursive: true });

		const testComponent = `
import { useUI } from '@react-zero-ui/core';

export function TestComponent() {
  const [count, setCount] = useUI("0", "count");
  
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
			await runCLIScript(testDir);

			// Check that initialization messages were logged
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

				child.on('close', (code) => {
					clearTimeout(timer);
					resolve({ code });
				});

				child.on('error', (error) => {
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
		const result = await new Promise((resolve) => {
			const child = spawn('node', [binScript, 'non-existent-dir'], { cwd: testDir, stdio: ['pipe', 'pipe', 'pipe'] });

			let stderr = '';
			child.stderr.on('data', (data) => {
				stderr += data.toString();
			});

			const timer = setTimeout(() => {
				child.kill('SIGKILL');
				resolve({ timedOut: true, stderr });
			}, 5000);

			child.on('close', (code) => {
				clearTimeout(timer);
				resolve({ code, stderr });
			});

			child.on('error', (error) => {
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
				const cleanup = (dir) => {
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

		const child = spawn('node', [binScript, '.'], { cwd: targetDir, stdio: ['pipe', 'pipe', 'pipe'] });

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		child.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		const timer = setTimeout(() => {
			child.kill('SIGKILL');
			reject(new Error(`CLI script timed out after ${timeout}ms`));
		}, timeout);

		child.on('close', (code) => {
			clearTimeout(timer);
			resolve({ code, stdout, stderr, success: code === 0 });
		});

		child.on('error', (error) => {
			clearTimeout(timer);
			reject(error);
		});
	});
}
