// __tests__/helpers/resetProjectState.js
import fs from 'node:fs';
import path from 'node:path';
import { rmSync } from 'node:fs';

/**
 * Reset everything the Zero-UI CLI generates inside a fixture.
 *
 * @param projectDir absolute path to the fixture root
 * @param isNext     true  → Next.js fixture (tsconfig + postcss)
 *                   false → Vite fixture   (vite.config.ts)
 */
export async function resetZeroUiState(projectDir, isNext = false) {
	console.log(`[Reset] Starting Zero-UI state reset for ${isNext ? 'Next.js' : 'Vite'} project`);
	console.log(`[Reset] Project directory: ${projectDir}`);

	/* ─── 1. wipe .zero-ui  ─────────────────────────────────────────────── */
	const zeroUiDir = path.join(projectDir, '.zero-ui');
	if (fs.existsSync(zeroUiDir)) {
		rmSync(zeroUiDir, { recursive: true, force: true });
		console.log('[Reset] ✅ Removed .zero-ui directory');
	} else {
		console.log('[Reset] ⏭️  .zero-ui directory not found, skipping');
	}

	/* ─── 2. Next.js cleanup (tsconfig + postcss)  ──────────────────────── */
	if (isNext) {
		console.log('[Reset] 🔧 Running Next.js cleanup');
		const tsconfigPath = path.join(projectDir, 'tsconfig.json');
		const postcssConfigPath = path.join(projectDir, 'postcss.config.mjs');

		/* tsconfig.json → remove path alias */
		if (fs.existsSync(tsconfigPath)) {
			console.log('[Reset] ✅ Processing tsconfig.json');
			const tsconf = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
			if (tsconf.compilerOptions?.paths?.['@zero-ui/attributes']) {
				console.log('[Reset]   - Removing @zero-ui/attributes path alias');
				delete tsconf.compilerOptions.paths['@zero-ui/attributes'];
				fs.writeFileSync(tsconfigPath, JSON.stringify(tsconf, null, 2));
			} else {
				console.log('[Reset]   - No @zero-ui/attributes alias found');
			}
		} else {
			console.log('[Reset] ⏭️  tsconfig.json not found, skipping');
		}

		/* postcss.config.mjs → strip Zero-UI plugin */
		if (fs.existsSync(postcssConfigPath)) {
			console.log('[Reset] ✅ Processing postcss.config.mjs');
			const originalSrc = fs.readFileSync(postcssConfigPath, 'utf8');
			const cleanedSrc = originalSrc
				// Remove import line
				.replace(/import\s+.*react-zero-ui\/postcss['"].*\r?\n?/g, '')
				// Remove plugin from object format: '@austinserb/react-zero-ui/postcss': {}
				.replace(/['"]@austinserb\/react-zero-ui\/postcss['"]:\s*\{[^}]*\},?\s*/g, '')
				// Remove plugin from array format: '@austinserb/react-zero-ui/postcss'
				.replace(/['"]@austinserb\/react-zero-ui\/postcss['"],?\s*/g, '')
				// Remove function call format: zeroUI()
				.replace(/,?\s*zeroUI\(\)\s*,?/g, '')
				// Clean up empty lines and trailing commas
				.replace(/,(\s*[}\]])/g, '$1')
				.replace(/\n\s*\n/g, '\n');

			if (originalSrc !== cleanedSrc) {
				console.log('[Reset]   - Removed Zero-UI plugin references');
				fs.writeFileSync(postcssConfigPath, cleanedSrc);
			} else {
				console.log('[Reset]   - No Zero-UI plugin references found');
			}
		} else {
			console.log('[Reset] ⏭️  postcss.config.mjs not found, skipping');
		}
	} else {
		console.log('[Reset] ⏭️  Skipping Next.js cleanup (not a Next.js project)');
	}

	/* ─── 3. Vite cleanup (vite.config.ts)  ─────────────────────────────── */
	if (!isNext) {
		console.log('[Reset] ⚡ Running Vite cleanup');
		const viteCfg = path.join(projectDir, 'vite.config.ts');
		if (fs.existsSync(viteCfg)) {
			console.log('[Reset] ✅ Processing vite.config.ts');
			const originalContent = fs.readFileSync(viteCfg, 'utf8');
			const cleanedContent = originalContent
				// Remove import line
				.replace(/import\s+.*react-zero-ui\/vite['"].*\r?\n?/g, '')
				// Remove plugin call from plugins array (handle different positions)
				.replace(/,\s*zeroUI\(\)\s*/g, '') // middle/end position
				.replace(/zeroUI\(\)\s*,\s*/g, '') // start position
				.replace(/zeroUI\(\)/g, '') // only plugin
				// Clean up empty lines
				.replace(/\n\s*\n/g, '\n');

			if (originalContent !== cleanedContent) {
				console.log('[Reset]   - Removed Zero-UI plugin references');
				fs.writeFileSync(viteCfg, cleanedContent);
			} else {
				console.log('[Reset]   - No Zero-UI plugin references found');
			}
		} else {
			console.log('[Reset] ⏭️  vite.config.ts not found, skipping');
		}
	} else {
		console.log('[Reset] ⏭️  Skipping Vite cleanup (not a Vite project)');
	}

	console.log('[Reset] ✨ Reset complete!');
	return;
}
