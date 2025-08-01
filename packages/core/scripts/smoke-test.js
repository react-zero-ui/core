import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tmp = mkdtempSync(join(tmpdir(), 'rzui-smoke-'));
let tarPath;
try {
	// 1. pack the current workspace
	const coreDir = resolve(__dirname, '..');
	const packOutput = execSync('npm pack --ignore-scripts --silent', { cwd: coreDir }).toString().trim();
	const tar = packOutput.split('\n').pop().trim();
	tarPath = resolve(coreDir, tar);
	console.log('tarPath: ', tarPath);

	// 2. init an empty project & install ONLY the tarball
	execSync('npm init -y', { cwd: tmp, stdio: 'ignore' });
	execSync(`npm install --ignore-scripts --silent ${tarPath}`, { cwd: tmp, stdio: 'inherit' });

	// 3. test postcss plugin
	execSync('node -e "require(\'@react-zero-ui/core/postcss\')"', { cwd: tmp, stdio: 'inherit' });

	// 4. test postcss plugin
	execSync(
		"node -e \"const postcss = require('postcss'); " +
			"const rz = require('@react-zero-ui/core/postcss'); " +
			"postcss([rz]).process('h1{}', { from: undefined })" +
			".then(()=>console.log('postcss ok'))\"",
		{ cwd: tmp, stdio: 'inherit' }
	);

	console.log('✅ smoke-test passed');
} finally {
	rmSync(tmp, { recursive: true, force: true });
	rmSync(tarPath, { force: true });
}
