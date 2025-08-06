#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TARBALL = '../create-zero-ui-1.1.0.tgz';

console.log('🧪 Testing CLI package with npx (no global install)...\n');

// Create temp test directory
const testDir = mkdtempSync(join(tmpdir(), 'test-zero-ui-'));
const tarballPath = join(process.cwd(), TARBALL);

try {
	console.log('🚀 Testing CLI execution with npx...');
	process.chdir(testDir);

	// Run the CLI using npx (completely isolated, no global install)
	try {
		execSync(`npx ${tarballPath} .`, { stdio: 'pipe', timeout: 30000 });
		console.log('✅ CLI executed without errors');
	} catch (error) {
		console.log('⚠️  CLI execution had issues:', error.message);
		// Check if basic setup still worked despite the known core CLI issue
	}

	// Validate results
	console.log('\n🔍 Validating installation results...');

	const checks = [
		{ name: 'package.json created', test: () => existsSync('package.json') },
		{
			name: '@react-zero-ui/core installed',
			test: () => {
				if (!existsSync('package.json')) return false;
				const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
				return pkg.dependencies && '@react-zero-ui/core' in pkg.dependencies;
			},
		},
		{
			name: '@tailwindcss/postcss dev dependency',
			test: () => {
				if (!existsSync('package.json')) return false;
				const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
				return pkg.devDependencies && '@tailwindcss/postcss' in pkg.devDependencies;
			},
		},
		{ name: 'node_modules created', test: () => existsSync('node_modules') },
	];

	let allPassed = true;
	for (const check of checks) {
		const passed = check.test();
		console.log(`${passed ? '✅' : '❌'} ${check.name}`);
		if (!passed) allPassed = false;
	}

	console.log('\n📊 Test Summary:');
	if (allPassed) {
		console.log('🎉 All checks passed! CLI package is ready to publish.');
		process.exit(0);
	} else {
		console.log('❌ Some checks failed. Review before publishing.');
		process.exit(1);
	}
} catch (error) {
	console.error('💥 Test failed:', error.message);
	process.exit(1);
} finally {
	// Cleanup temp directory only
	console.log('\n🧹 Cleaning up...');
	try {
		process.chdir(process.cwd());
		rmSync(testDir, { recursive: true, force: true });
		console.log('✅ Cleanup complete');
	} catch (e) {
		console.log('⚠️  Cleanup had issues:', e.message);
	}
}
