import { test, expect } from '@playwright/test';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projectDir = path.resolve(__dirname, '../fixtures/next');

test('Next CLI scaffolds .zero-ui + tsconfig + postcss', async () => {
	// CLI setup is handled by global setup, just verify the results
	const attrs = path.join(projectDir, '.zero-ui/attributes.js');
	const tsc = path.join(projectDir, 'tsconfig.json');
	const post = path.join(projectDir, 'postcss.config.mjs');

	await expect.poll(() => existsSync(attrs)).toBeTruthy();
	await expect.poll(() => readFileSync(attrs, 'utf8')).toContain('export const bodyAttributes');

	await expect
		.poll(() => {
			if (!existsSync(tsc)) return false;
			const conf = JSON.parse(readFileSync(tsc, 'utf8'));
			return conf.compilerOptions?.paths?.['@zero-ui/attributes']?.[0] === './.zero-ui/attributes.js';
		})
		.toBeTruthy();

	await expect
		.poll(() => {
			if (!existsSync(post)) return false;
			return readFileSync(post, 'utf8').includes('@austinserb/react-zero-ui/postcss');
		})
		.toBeTruthy();
});
