// src/postcss/index.cts
/**
 * @type {import('postcss').PluginCreator}
 */
import { buildCss, generateAttributesFile, isZeroUiInitialized } from './helpers.cjs';
import { runZeroUiInit } from '../cli/postInstall.cjs';
import type { PluginCreator, Root } from 'postcss';
import { processVariants } from './ast-parsing.cjs';

const plugin: PluginCreator<void> = () => {
	const DEV = process.env.NODE_ENV !== 'production';

	return {
		postcssPlugin: 'postcss-react-zero-ui',

		async Once(root: Root, { result }) {
			try {
				/* ── generate + inject variants ─────────────────────────── */
				/*
					finalVariants: VariantData[] // = { key: string; values: string[]; initialValue: string | null;}
					initialValues: Record<string, string>; // key: initialValue
					sourceFiles: string[]; // file paths (absolute)
	      */
				const { finalVariants, initialValues, sourceFiles } = await processVariants();

				const cssBlock = buildCss(finalVariants);
				if (cssBlock.trim()) root.prepend(cssBlock + '\n');

				/* ── register file-dependencies for HMR ─────────────────── */
				sourceFiles.forEach((file) => result.messages.push({ type: 'dependency', plugin: 'postcss-react-zero-ui', file, parent: result.opts.from }));

				/* ── first-run bootstrap ────────────────────────────────── */
				if (!isZeroUiInitialized()) {
					console.log('[Zero-UI] Auto-initializing (first-time setup)…');
					await runZeroUiInit();
				}

				await generateAttributesFile(finalVariants, initialValues);
			} catch (err: unknown) {
				/* ───────────────── error handling ─────────────────────── */
				const error = err instanceof Error ? err : new Error(String(err));
				const eWithLoc = error as Error & { loc?: { file?: string; line?: number; column?: number } };

				/* ❶ Special-case throwCodeFrame errors (they always contain "^") */
				const isCodeFrame = /[\n\r]\s*\^/.test(error.message);

				/* ❷ Broader categories for non-frame errors (kept from your code) */
				const isSyntaxError =
					!isCodeFrame &&
					(error.message.includes('State key cannot be resolved') ||
						error.message.includes('initial value cannot be resolved') ||
						error.message.includes('SyntaxError'));
				const isFileError = !isCodeFrame && (error.message.includes('ENOENT') || error.message.includes('Cannot find module'));

				let friendly = error.message;
				if (isCodeFrame)
					friendly = error.message; // already perfect
				else if (isSyntaxError) friendly = `Syntax error in Zero-UI usage: ${error.message}`;
				else if (isFileError) friendly = `File system error: ${error.message}`;

				/* ❸ Dev = warn + keep server alive  |  Prod = fail build */
				if (DEV) {
					if (eWithLoc.loc?.file) {
						result.messages.push({ type: 'dependency', plugin: 'postcss-react-zero-ui', file: eWithLoc.loc.file, parent: result.opts.from });
					}

					result.warn(friendly, { plugin: 'postcss-react-zero-ui', ...(eWithLoc.loc && { line: eWithLoc.loc.line, column: eWithLoc.loc.column }) });

					console.error('[Zero-UI] Full error (dev-only):\n', error);
					return; // ← do **not** abort dev-server
				}

				// production / CI
				throw new Error(`[Zero-UI] PostCSS plugin error: ${friendly}`);
			}
		},
	};
};

plugin.postcss = true;
export = plugin;
