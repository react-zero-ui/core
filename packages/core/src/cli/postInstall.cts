// src/cli/postInstall.cts
import { patchNextBodyTag } from '../postcss/ast-generating.cjs';
import { processVariants, generateAttributesFile, patchTsConfig, patchPostcssConfig, patchViteConfig, hasViteConfig } from '../postcss/helpers.cjs';

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
		const { finalVariants, initialValues, sourceFiles } = await processVariants();

		// Generate attribute files using the shared helper
		await generateAttributesFile(finalVariants, initialValues);

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
