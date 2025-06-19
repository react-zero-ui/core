#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const cwd = process.cwd();
const target = resolve(cwd, process.argv[2] ?? '.');

/* 🔍 pick the package manager */
const pm = existsSync(resolve(target, 'pnpm-lock.yaml')) ? 'pnpm' : existsSync(resolve(target, 'yarn.lock')) ? 'yarn' : 'npm';

const exec = (cmd, args) => spawnSync(pm, [cmd, ...args], { cwd: target, stdio: 'inherit' });

/* 1️⃣ ensure package.json */
if (!existsSync(resolve(target, 'package.json'))) exec('init', ['-y']);

/* 2️⃣ runtime dependency */
exec(pm === 'yarn' ? 'add' : 'install', ['@austinserb/react-zero-ui']);

/* 3️⃣ dev deps */
exec(pm === 'yarn' ? 'add' : 'install', ['postcss', 'tailwindcss', '@tailwindcss/postcss', '--save-dev']);

/* 4️⃣ handoff */
const { default: zeroUiCli } = await import('@austinserb/react-zero-ui/cli');
if (typeof zeroUiCli === 'function') {
	zeroUiCli(process.argv.slice(3));
	console.log(`\n🎉  Zero-UI installed. Run \`${pm} run dev\`!\n`);
} else {
	console.error('[Zero-UI] CLI entry is not a function.');
	process.exit(1);
}
