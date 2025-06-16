import { test as base, expect } from '@playwright/test';
import { resetZeroUiState } from './resetProjectState';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const test = base.extend({});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, '../fixtures/vite');

const zeroUiBin = path.resolve(__dirname, '../../src/cli/init.cjs');    // library CLI


test.beforeAll(() => resetZeroUiState(projectDir));


test.describe('Zero-UI Vite CLI', () => {

  test('init CLI scaffolds project', () => {
    // run zero-ui init
    spawnSync('node', [zeroUiBin], { cwd: projectDir, stdio: 'inherit' });

    const attrsPath = path.join(projectDir, '.zero-ui/attributes.js');

    // assert attributes.js exists and has correct exports
    expect(existsSync(attrsPath), '.zero-ui/attributes.js should exist').toBeTruthy();
    const attrsContent = readFileSync(attrsPath, 'utf8');
    expect(attrsContent).toContain('export const bodyAttributes');

    // Vite apps use direct imports, no tsconfig modification needed
    // Users import from './.zero-ui/attributes.js' directly
  });


});