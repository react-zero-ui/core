// src/cli/postInstall.ts
import { patchNextBodyTag } from '../postcss/ast-generating.js';
import { generateAttributesFile, patchTsConfig, patchPostcssConfig, patchViteConfig, hasViteConfig } from '../postcss/helpers.js';
import { processVariants } from '../postcss/ast-parsing.js';

export async function runZeroUiInit() {
	try {
		console.log('[Zero-UI] Initializing...');

		// Patch Vite config for Vite projects
		if (hasViteConfig()) {
			await patchViteConfig();
		}

		if (!hasViteConfig()) {
			// Patch config for module resolution
			await patchTsConfig();
			// Patch PostCSS config for Next.js projects
			await patchPostcssConfig();
		}

		// Process all variants using the shared helper
		const { finalVariants, initialGlobalValues, sourceFiles } = await processVariants();

		// Generate attribute files using the shared helper
		await generateAttributesFile(finalVariants, initialGlobalValues);

		console.log(`[Zero-UI] ✅ Initialized with ${finalVariants.length} variants from ${sourceFiles.length} files`);

		if (!hasViteConfig()) {
			await patchNextBodyTag();
		}

		if (finalVariants.length === 0) {
			console.log('[Zero-UI] ℹ️  No useUI hooks found yet. Files will be updated when you add them.');
		}
	} catch (error) {
		console.error('[Zero-UI] ❌ Initialization failed:', error);
		process.exit(1);
	}
}
