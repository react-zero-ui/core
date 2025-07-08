// eslint-disable-next-line import/named
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projectDir = path.resolve(__dirname, '../fixtures/vite');

test('Vite CLI scaffolds .zero-ui + vite.config', async () => {
	// CLI setup is handled by global setup, just verify the results
	const attrs = path.join(projectDir, '.zero-ui/attributes.js');
	const vite = path.join(projectDir, 'vite.config.ts');
	const attrsContent = readFileSync(attrs, 'utf8');

	await expect.poll(() => existsSync(attrs)).toBeTruthy();
	console.log('[Vite CLI] attrs', attrsContent);
	await expect.poll(() => attrsContent).toContain('export const bodyAttributes');
	console.log('[Vite CLI] vite', vite);

	await expect
		.poll(() => {
			if (!existsSync(vite)) return false;
			const src = readFileSync(vite, 'utf8');
			return /from ['"]@react-zero-ui\/core\/vite['"]/.test(src) && /\bplugins:\s*\[.*zeroUI\(\).*]/s.test(src);
		})
		.toBeTruthy();
	console.log('[Vite CLI] vite CLI completed');
});
