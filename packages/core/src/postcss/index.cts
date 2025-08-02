// src/postcss/index.cts
/**
 * @type {import('postcss').PluginCreator}
 */
import { buildCss, generateAttributesFile, isZeroUiInitialized } from './helpers';
import { runZeroUiInit } from '../cli/postInstall.js';
import type { PluginCreator, Root, Result } from 'postcss';
import { processVariants } from './ast-parsing';
import { CONFIG } from '../config';
import { formatError, registerDeps } from './utilities.js';

const zeroUIPlugin = CONFIG.PLUGIN_NAME;

const plugin: PluginCreator<void> = () => {
	return {
		postcssPlugin: zeroUIPlugin,
		async Once(root: Root, { result }: { result: Result }) {
			try {
				const { finalVariants, initialGlobalValues, sourceFiles } = await processVariants();

				const cssBlock = buildCss(finalVariants);
				if (cssBlock?.trim()) root.prepend(cssBlock + '\n');

				/* ── register file-dependencies for HMR ─────────────────── */
				registerDeps(result, zeroUIPlugin, sourceFiles, result.opts.from ?? '');

				/* ── first-run bootstrap ────────────────────────────────── */
				if (!isZeroUiInitialized()) {
					console.log('[Zero-UI] Auto-initializing (first-time setup)…');
					await runZeroUiInit();
				}
				await generateAttributesFile(finalVariants, initialGlobalValues);
			} catch (err: unknown) {
				const { friendly, loc } = formatError(err);
				if (process.env.NODE_ENV !== 'production') {
					if (loc?.file) registerDeps(result, zeroUIPlugin, [loc.file], result.opts.from ?? '');
					result.warn(friendly, { plugin: zeroUIPlugin, ...loc });
					console.error('[Zero-UI] Full error (dev-only)\n', err);
					return; // keep dev-server alive
				}
				throw new Error(`[Zero-UI] PostCSS plugin error: ${friendly}`);
			}
		},
	};
};

plugin.postcss = true;
export = plugin;
