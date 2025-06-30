// src/postcss/index.cjs
/**
 * @type {import('postcss').PluginCreator}
 */
const { processVariants, buildCss, generateAttributesFile, isZeroUiInitialized } = require('./helpers.cjs');
const { runZeroUiInit } = require('../cli/postInstall.cjs');

module.exports = () => {
	return {
		postcssPlugin: 'postcss-react-zero-ui',

		// Once runs BEFORE Root, so Tailwind will see our variants
		async Once(root, { result }) {
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
				sourceFiles.forEach((file) => {
					result.messages.push({ type: 'dependency', plugin: 'postcss-react-zero-ui', file: file, parent: result.opts.from });
				});

				// Run initialization only once (fallback if user hasn't run npx zero-ui init)
				if (!isZeroUiInitialized()) {
					console.log('[Zero-UI] Auto-initializing (first time setup)...');
					await runZeroUiInit();
				}

				// Generate body attributes file and TypeScript definitions
				await generateAttributesFile(finalVariants, initialValues);
			} catch (error) {
				throw new Error('[Zero-UI] PostCSS plugin error: ', error.message);
			}
		},
	};
};

module.exports.postcss = true;
