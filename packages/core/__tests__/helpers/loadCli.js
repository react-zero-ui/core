// __tests__/helpers/loadCli.js
import { createRequire } from 'node:module';
import path from 'node:path';

export async function loadCliFromFixture(fixtureDir) {
  const r = createRequire(path.join(fixtureDir, 'package.json'));
  const modulePath = r.resolve('../../../src/cli/init.cjs');   // get the path
  const mod = r(modulePath);  // actually require the module

  // Return a wrapper function that changes directory before running CLI
  const wrappedCli = async (args = []) => {
    const originalCwd = process.cwd();
    try {
      process.chdir(fixtureDir);  // Change to fixture directory

      // The init.cjs exports a cli function, so call it
      if (typeof mod === 'function') {
        return await Promise.resolve(mod(args));  // run the CLI
      } else if (typeof mod.default === 'function') {
        return await Promise.resolve(mod.default(args));  // run the CLI (ESM default export)
      } else {
        throw new Error('Could not find CLI function in init.cjs');
      }
    } finally {
      process.chdir(originalCwd);  // Always restore original directory
    }
  };

  return wrappedCli;
}
