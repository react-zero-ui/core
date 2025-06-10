/**
 * @type {import('postcss').PluginCreator}
 */
const fs = require('fs');
const path = require('path');
const { toKebabCase, getAllSourceFiles, extractVariants, buildCss } = require('./helpers');

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

      // Generate body attributes file
      const ATTR_FILE = path.join(__dirname, 'generated-attributes.js');
      const attrExport = `/* AUTO-GENERATED - DO NOT EDIT */\nexport const bodyAttributes = ${JSON.stringify(initialValues, null, 2)};\n`;

      const existingContent = fs.existsSync(ATTR_FILE) ? fs.readFileSync(ATTR_FILE, 'utf-8') : '';
      if (existingContent !== attrExport) {
        fs.mkdirSync(path.dirname(ATTR_FILE), { recursive: true });
        fs.writeFileSync(ATTR_FILE, attrExport);
      }
    }
  };
};

module.exports.postcss = true;