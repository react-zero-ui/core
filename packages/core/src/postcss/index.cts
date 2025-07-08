// src/postcss/index.cts
/**
 * @type {import('postcss').PluginCreator}
 */
import { processVariants, buildCss, generateAttributesFile, isZeroUiInitialized } from './helpers.cjs';
import { runZeroUiInit } from '../cli/postInstall.cjs';
import type { Result, Root } from 'postcss';

const plugin = (): { postcssPlugin: string; Once: (root: Root, { result }: { result: Result }) => Promise<void> } => {
	return {
		postcssPlugin: 'postcss-react-zero-ui',

		// Once runs BEFORE Root, so Tailwind will see our variants
		async Once(root: Root, { result }: { result: Result }) {
			try {
				// Process all variants using the shared helper
				const { finalVariants, initialValues, sourceFiles } = await processVariants();

				// Generate CSS
				const cssBlock = buildCss(finalVariants);
				// Inject new CSS - prepend so it's before any @tailwind directives
				if (cssBlock.trim()) {
					root.prepend(cssBlock + '\n');
				}

				// Register dependencies - CRITICAL for file watching
				sourceFiles.forEach((file: string) => {
					result.messages.push({ type: 'dependency', plugin: 'postcss-react-zero-ui', file: file, parent: result.opts.from });
				});

				// Run initialization only once (fallback if user hasn't run npx zero-ui init)
				if (!isZeroUiInitialized()) {
					console.log('[Zero-UI] Auto-initializing (first time setup)...');
					await runZeroUiInit();
				}

				// Generate body attributes file and TypeScript definitions
				await generateAttributesFile(finalVariants, initialValues);
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				throw new Error(`[Zero-UI] PostCSS plugin error: ${errorMessage}`);
			}
		},
	};
};

// PostCSS plugin marker
plugin.postcss = true;

// For CommonJS compatibility when loaded as a string in PostCSS config
export = plugin;
