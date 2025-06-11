#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const cwd = process.cwd();
const targetDir = process.argv[2] ?? '.';
const full = resolve(cwd, targetDir);

// 1 — ensure package.json
if (!existsSync(resolve(full, 'package.json'))) {
  spawnSync('npm', ['init', '-y'], { cwd: full, stdio: 'inherit' });
}
// 2 — install runtime + peers (tailwind, postcss)
spawnSync('npm', [
  'install', '-D',
  '@austinserb/react-zero-ui',
  'tailwindcss', 'postcss'
], { cwd: full, stdio: 'inherit' });

import('@austinserb/react-zero-ui/cli').then(run => {
  run.default?.() ?? run();          // supports CJS & ESM export shapes
  console.log('\n🎉  Zero-UI installed.  Run `npm run dev` and start building.\n');
});
