/**
 * @type {import('postcss').PluginCreator}
 */
const fs = require('fs');
const path = require('path');
const { toKebabCase, getAllSourceFiles, extractVariants, buildCss, generateAttributesFile } = require('./helpers.cjs');
const { runZeroUiInit } = require('../scripts/postInstall.cjs');

/**
 * Checks if Zero-UI has been properly initialized by verifying the existence
 * of required generated files and config patches.
 * 
 * @returns {boolean} - true if initialization is complete, false otherwise
 */
function isZeroUiInitialized() {
  const cwd = process.cwd();
  const ATTR_DIR = path.join(cwd, '.zero-ui');
  const ATTR_FILE = path.join(ATTR_DIR, 'attributes.js');
  const ATTR_TYPE_FILE = path.join(ATTR_DIR, 'attributes.d.ts');

  // Check if core files exist
  if (!fs.existsSync(ATTR_FILE) || !fs.existsSync(ATTR_TYPE_FILE)) {
    return false;
  }

  // Check if files have valid content (not empty/corrupted)
  try {
    const attrContent = fs.readFileSync(ATTR_FILE, 'utf-8');
    const typeContent = fs.readFileSync(ATTR_TYPE_FILE, 'utf-8');

    // Basic validation - files should contain expected exports
    if (!attrContent.includes('export const bodyAttributes') ||
      !typeContent.includes('export declare const bodyAttributes')) {
      return false;
    }

    return true;
  } catch (error) {
    // If we can't read the files, consider initialization incomplete
    return false;
  }
}

/**
 * Runs Zero-UI initialization only if it hasn't been completed yet.
 * This ensures the init process runs once automatically as a fallback
 * if the user hasn't run `npx zero-ui init` manually.
 */
function runInitializationOnce() {
  if (!isZeroUiInitialized()) {
    console.log('[Zero-UI] Auto-initializing (first time setup)...');
    runZeroUiInit();
  }
}

const HEADER = '/* AUTO-GENERATED - DO NOT EDIT */';

module.exports = () => {
  return {
    postcssPlugin: 'postcss-react-zero-ui',

    // Once runs BEFORE Root, so Tailwind will see our variants
    Once(root, { result }) {
      const cwd = process.cwd();

      const candidateDirs = ['src', 'app'].filter(dir =>
        fs.existsSync(path.resolve(cwd, dir))
      );

      const allFiles = candidateDirs.flatMap((dir) =>
        getAllSourceFiles(path.resolve(cwd, dir))
      );

      const allVariants = allFiles.flatMap(extractVariants);

      // Deduplicate + sort
      const variantMap = new Map();
      const initialValueMap = new Map();

      for (const variant of allVariants) {
        const { key, values, initialValue } = variant;

        if (!variantMap.has(key)) {
          variantMap.set(key, new Set());
          if (initialValue !== null && initialValue !== undefined) {
            initialValueMap.set(key, initialValue);
          }
        }

        if (Array.isArray(values)) {
          values.forEach((v) => variantMap.get(key).add(v));
        }
      }

      const finalVariants = Array.from(variantMap.entries())
        .map(([key, set]) => ({
          key,
          values: Array.from(set).sort(),
          initialValue: initialValueMap.get(key)
        }))
        .sort((a, b) => a.key.localeCompare(b.key));

      // Generate body attributes
      const initialValues = {};
      for (const { key, values, initialValue } of finalVariants) {
        const keySlug = toKebabCase(key);
        initialValues[`data-${keySlug}`] = initialValue || values[0] || '';
      }

      // Generate CSS
      const cssBlock = buildCss(finalVariants, HEADER);

      // Remove existing generated content
      root.walkComments((comment) => {
        if (comment.text.includes('AUTO-GENERATED')) {
          let next = comment.next();
          while (next && next.type === 'atrule' && next.name === 'variant') {
            const toRemove = next;
            next = next.next();
            toRemove.remove();
          }
          comment.remove();
        }
      });

      // Inject new CSS - prepend so it's before any @tailwind directives
      if (cssBlock.trim()) {
        root.prepend(cssBlock + '\n');
      }

      // Register dependencies - CRITICAL for file watching
      allFiles.forEach(file => {
        result.messages.push({
          type: 'dependency',
          plugin: 'postcss-react-zero-ui',
          file: file,
          parent: result.opts.from
        });
      });

      // Run initialization only once (fallback if user hasn't run npx zero-ui init)
      runInitializationOnce();

      // Generate body attributes file and TypeScript definitions
      generateAttributesFile(finalVariants, initialValues);
    }
  };
};

module.exports.postcss = true;

