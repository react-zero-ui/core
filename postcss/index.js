/**
 * @type {import('postcss').PluginCreator}
 */
const fs = require('fs');
const path = require('path');
const { toKebabCase, getAllSourceFiles, extractVariants, buildCss } = require('./helpers');

const HEADER = '/* AUTO-GENERATED - DO NOT EDIT */';

module.exports = () => {

  let isProcessing = false;
  let processedInThisRun = false;

  return {
    postcssPlugin: 'postcss-react-zero-ui',

    Root(root, { result }) {
      // Prevent multiple executions in the same PostCSS run
      if (processedInThisRun) return;
      processedInThisRun = true;

      const cwd = process.cwd();

      const processFiles = () => {
        if (isProcessing) return;
        isProcessing = true;

        const candidateDirs = ['src', 'app'].filter(dir =>
          fs.existsSync(path.resolve(cwd, dir))
        );

        const allFiles = candidateDirs.flatMap((dir) =>
          getAllSourceFiles(path.resolve(cwd, dir))
        );
        const allVariants = allFiles.flatMap(extractVariants);

        // Deduplicate + sort
        const variantMap = new Map();
        const initialValueMap = new Map(); // Track initial values separately

        for (const variant of allVariants) {
          const { key, values, initialValue } = variant;

          if (!variantMap.has(key)) {
            variantMap.set(key, new Set());
            // Store the first initial value we encounter for this key
            if (initialValue !== null && initialValue !== undefined) {
              initialValueMap.set(key, initialValue);
            }
          }

          if (Array.isArray(values)) {
            values.forEach((v) => variantMap.get(key).add(v));
          }
        }

        // Update the finalVariants creation:
        const finalVariants = Array.from(variantMap.entries())
          .map(([key, set]) => ({
            key,
            values: Array.from(set).sort(),
            initialValue: initialValueMap.get(key) // Include the preserved initial value
          }))
          .sort((a, b) => a.key.localeCompare(b.key));

        // Then when generating body attributes:
        const initialValues = {};
        for (const { key, values, initialValue } of finalVariants) {
          const keySlug = toKebabCase(key);
          // Use the actual initial value, not the first sorted value
          initialValues[`data-${keySlug}`] = initialValue || values[0] || '';
        }

        // Generate and inject CSS
        const cssBlock = buildCss(finalVariants, HEADER);



        // Only inject if there's actual new content or it's the first run
        root.append('\n' + cssBlock);

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
        isProcessing = false;
      };
      // Initial processing
      processFiles();


    },
    RootExit() {
      processedInThisRun = false;
    }


  }
}

module.exports.postcss = true;