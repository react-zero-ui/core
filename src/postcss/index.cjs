// postcss/index.cjs
/**
 * @type {import('postcss').PluginCreator}
 */
const {
  processVariants,
  buildCss,
  generateAttributesFile,
  isZeroUiInitialized,

} = require('./helpers.cjs');
const { runZeroUiInit } = require('../cli/postInstall.cjs');

module.exports = () => {
  return {
    postcssPlugin: 'postcss-react-zero-ui',

    // Once runs BEFORE Root, so Tailwind will see our variants
    Once(root, { result }) {
      const startTime = Date.now();

      try {
        // Process all variants using the shared helper
        const { finalVariants, initialValues, sourceFiles } = processVariants();

        // Generate CSS
        const cssBlock = buildCss(finalVariants);

        // Inject new CSS - prepend so it's before any @tailwind directives
        if (cssBlock.trim()) {
          root.prepend(cssBlock + '\n');
        }

        // Register dependencies - CRITICAL for file watching
        sourceFiles.forEach(file => {
          result.messages.push({
            type: 'dependency',
            plugin: 'postcss-react-zero-ui',
            file: file,
            parent: result.opts.from
          });
        });

        // Run initialization only once (fallback if user hasn't run npx zero-ui init)
        if (!isZeroUiInitialized()) {
          console.log('[Zero-UI] Auto-initializing (first time setup)...');
          runZeroUiInit();
        }

        // Generate body attributes file and TypeScript definitions
        const { jsChanged, tsChanged } = generateAttributesFile(finalVariants, initialValues);

        // Optional: Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          const processingTime = Date.now() - startTime;
          console.log(`[Zero-UI] Processed ${sourceFiles.length} files in ${processingTime}ms`);
          if (jsChanged || tsChanged) {
            console.log(`[Zero-UI] Updated: ${jsChanged ? 'attributes.js' : ''} ${tsChanged ? 'attributes.d.ts' : ''}`);
          }
        }

      } catch (error) {
        console.error('[Zero-UI] PostCSS plugin error: ', error.message);
        // Don't throw to prevent build failures
      }
    }
  };
};

module.exports.postcss = true;