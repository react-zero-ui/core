// scripts/postInstall.cjs
const {
  processVariants,
  generateAttributesFile,
  patchConfigAlias,
  patchPostcssConfig
} = require('../postcss/helpers.cjs');

function runZeroUiInit() {
  try {
    console.log('[Zero-UI] Initializing...');

    // Process all variants using the shared helper
    const { finalVariants, initialValues, sourceFiles } = processVariants();

    // Generate attribute files using the shared helper
    generateAttributesFile(finalVariants, initialValues);

    // Patch config for module resolution 
    patchConfigAlias();

    // Patch PostCSS config for Next.js projects
    patchPostcssConfig();

    console.log(`[Zero-UI] ✅ Initialized with ${finalVariants.length} variants from ${sourceFiles.length} files`);

    if (finalVariants.length === 0) {
      console.log('[Zero-UI] ℹ️  No useUI hooks found yet. Files will be updated when you add them.');
    }

  } catch (error) {
    console.error('[Zero-UI] ❌ Initialization failed:', error);
    process.exit(1);
  }
}

module.exports = {
  runZeroUiInit
};