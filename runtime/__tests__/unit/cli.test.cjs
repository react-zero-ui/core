const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('node:child_process');
const { fileURLToPath } = require('url');

// Helper to create isolated test directory
function createTestDir() {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-ui-cli-test-'));
  return testDir;
}

// Helper to clean up test directory
function cleanupTestDir(testDir) {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

// Helper to run CLI script and capture output
function runCLIScript(targetDir, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const binScript = path.resolve(__dirname, '../../bin.js');

    const child = spawn('node', [binScript, '.'], {
      cwd: targetDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

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
      resolve({
        code,
        stdout,
        stderr,
        success: code === 0
      });
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

// Helper to check if packages are installed
function checkPackageInstalled(testDir, packageName) {
  const packageJsonPath = path.join(testDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return false;

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return !!(packageJson.devDependencies && packageJson.devDependencies[packageName]);
}

test('CLI script creates package.json if it does not exist', async () => {
  const testDir = createTestDir();

  try {
    // Ensure no package.json exists
    const packageJsonPath = path.join(testDir, 'package.json');
    assert(!fs.existsSync(packageJsonPath), 'package.json should not exist initially');

    // Run CLI (this will timeout on npm install, but that's ok for this test)
    const result = await runCLIScript(testDir, 5000).catch(err => {
      // We expect this to timeout/fail during npm install
      return { timedOut: true };
    });

    // Check that package.json was created
    assert(fs.existsSync(packageJsonPath), 'package.json should be created');

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    assert(packageJson.name, 'package.json should have a name field');
    assert(packageJson.version, 'package.json should have a version field');

    console.log('✅ package.json created successfully');

  } finally {
    cleanupTestDir(testDir);
  }
});

test('CLI script uses existing package.json if it exists', async () => {
  const testDir = createTestDir();

  try {
    // Create a custom package.json
    const customPackageJson = {
      name: 'my-test-app',
      version: '2.0.0',
      description: 'Custom test app'
    };

    const packageJsonPath = path.join(testDir, 'package.json');
    fs.writeFileSync(packageJsonPath, JSON.stringify(customPackageJson, null, 2));

    // Run CLI (this will timeout on npm install, but that's ok for this test)
    const result = await runCLIScript(testDir, 5000).catch(err => {
      // We expect this to timeout/fail during npm install
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
    const packageJson = {
      name: 'test-app',
      version: '1.0.0',
      scripts: {},
      devDependencies: {}
    };
    fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Mock npm by creating a fake npm script that logs what would be installed
    const mockNpmScript = `#!/bin/bash
    echo "Mock npm called with: $@" >> npm-calls.log
    
    # Simulate package installation by updating package.json
    if [[ "$*" == *"install"* ]]; then
      node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        if (!pkg.devDependencies) pkg.devDependencies = {};
        pkg.devDependencies['@austinserb/react-zero-ui'] = '^1.0.0';
        pkg.devDependencies['tailwindcss'] = '^4.0.0';
        pkg.devDependencies['postcss'] = '^8.4.27';
        pkg.devDependencies['@tailwindcss/postcss'] = '^4.1.8';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
      "
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
      const result = await runCLIScript(testDir, 10000).catch(err => {
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

      assert(finalPackageJson.devDependencies['@austinserb/react-zero-ui'], 'react-zero-ui should be in devDependencies');
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
    const binScript = path.resolve(__dirname, '../../bin.js');

    const result = await new Promise((resolve, reject) => {
      const child = spawn('node', [binScript, 'my-project'], {
        cwd: baseTestDir,
        stdio: ['pipe', 'pipe', 'pipe']
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

    // Create mock CLI module
    const mockCLI = `
      module.exports = function() {
        console.log('Mock CLI executed successfully');
        return Promise.resolve();
      };
    `;

    fs.writeFileSync(path.join(nodeModulesDir, 'cli.cjs'), mockCLI);

    // Create package.json for the mock module
    const mockPackageJson = {
      name: '@austinserb/react-zero-ui',
      main: 'cli.cjs',
      exports: {
        './cli': './cli.cjs'
      }
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
      const result = await runCLIScript(testDir, 10000);

      // Check that CLI was executed
      assert(result.stdout.includes('Mock CLI executed successfully') ||
        result.stdout.includes('Zero-UI installed'),
        'CLI should execute library CLI function');

      console.log('✅ CLI script successfully imports and executes library CLI');

    } finally {
      process.env.PATH = originalPath;
    }

  } finally {
    cleanupTestDir(testDir);
  }
}); 