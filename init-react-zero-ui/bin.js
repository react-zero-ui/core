#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

(async () => {
  const cwd = process.cwd();
  const targetDir = process.argv[2] ?? '.';
  const full = resolve(cwd, targetDir);

  /* 1️⃣  ensure package.json */
  if (!existsSync(resolve(full, 'package.json'))) {
    spawnSync('npm', ['init', '-y'], { cwd: full, stdio: 'inherit' });
  }

  /* 2️⃣  install runtime lib + peers */
  spawnSync(
    'npm',
    [
      'install', '--save-dev',
      '@austinserb/react-zero-ui',
      'postcss', 'tailwindcss', '@tailwindcss/postcss'
    ],
    { cwd: full, stdio: 'inherit' }
  );

  /* 3️⃣  run the real CLI exported by the runtime */
  const mod = await import('@austinserb/react-zero-ui/cli');
  const cli = typeof mod.default === 'function' ? mod.default : mod;
  if (typeof cli === 'function') {
    cli(process.argv.slice(3));               // pass any extra args
    console.log('\n🎉  Zero-UI installed.  Run `npm run dev`!\n');
  } else {
    console.error('[Zero-UI] CLI entry is not a function.');
    process.exit(1);
  }
})();
