// src/postcss/index.cts
import { buildCss, generateAttributesFile, isZeroUiInitialized } from './helpers.js';
import { runZeroUiInit } from '../cli/postInstall.js';
import { processVariants } from './ast-parsing.js';
import { CONFIG } from '../config.js';
import { formatError, registerDeps } from './utilities.js';
import type { Root, Result } from 'postcss';

const PLUGIN = CONFIG.PLUGIN_NAME;
const DEV = process.env.NODE_ENV !== 'production';

const plugin = () => ({
	postcssPlugin: PLUGIN,

	async Once(root: Root, { result }: { result: Result }) {
		try {
			/* ① cold-start bootstrap --------------------------------------- */
			if (!isZeroUiInitialized()) {
				console.log('[Zero-UI] Auto-initializing (first-time setup)…');
				await runZeroUiInit();
			}

			/* ② variants → CSS + attributes ------------------------------- */
			const { finalVariants, initialGlobalValues, sourceFiles } = await processVariants();

			const cssBlock = buildCss(finalVariants);
			if (cssBlock.trim()) root.prepend(cssBlock + '\n');

			/* ③ HMR dependencies ------------------------------------------ */
			registerDeps(result, PLUGIN, sourceFiles, result.opts.from);

			/* ④ write .zero-ui files -------------------------------------- */
			await generateAttributesFile(finalVariants, initialGlobalValues);
		} catch (err) {
			const { friendly, loc } = formatError(err);

			if (DEV) {
				if (loc?.file) registerDeps(result, PLUGIN, [loc.file], result.opts.from);
				result.warn(friendly, { plugin: PLUGIN, ...loc });
				console.error('[Zero-UI] Full error (dev-only)\n', err);
				return;
			}
			throw new Error(`[Zero-UI] PostCSS plugin error: ${friendly}`);
		}
	},
});

plugin.postcss = true;
export = plugin;
