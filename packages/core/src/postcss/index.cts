// src/postcss/index.cts
/**
 * @type {import('postcss').PluginCreator}
 */
import { processVariants, buildCss, generateAttributesFile, isZeroUiInitialized } from './helpers.cjs';
import { runZeroUiInit } from '../cli/postInstall.cjs';
import type { Result, Root } from 'postcss';

const DEV = process.env.NODE_ENV !== 'production';

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
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);

				// ⏩ 1. Always surface the real stack in the dev console
				if (DEV) console.error(err);

				// ⏩ 2. Warn (dev) or throw (prod)
				if (DEV) {
					result.warn(`[Zero-UI] ${msg}`, { plugin: 'postcss-react-zero-ui' });
				} else {
					throw new Error(`[Zero-UI] PostCSS plugin error: ${msg}`);
				}
				const e = err as { loc?: { file?: string } } & Error;
				// ⏩ 3. Keep the file hot-watched so a save un-bricks the build
				if (e?.loc?.file) {
					result.messages.push({ type: 'dependency', plugin: 'postcss-react-zero-ui', file: e.loc.file, parent: result.opts.from });
				}

				return; // bail out without killing dev-server
			}
		},
	};
};

// PostCSS plugin marker
plugin.postcss = true;

// For CommonJS compatibility when loaded as a string in PostCSS config
export = plugin;
