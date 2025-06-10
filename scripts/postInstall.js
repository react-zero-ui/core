const fs = require('fs');
const path = require('path');
const { extractVariants, toKebabCase, buildCss, patchConfigAlias } = require('../postcss/helpers');

const HEADER = '/* AUTO-GENERATED - DO NOT EDIT */';

function findAllSourceFiles(rootDirs = ['src', 'app']) {
  const exts = ['.ts', '.tsx', '.js', '.jsx'];
  const files = [];

  rootDirs.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) return;

    const walk = (current) => {
      for (const entry of fs.readdirSync(current)) {
        const full = path.join(current, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full);
        else if (exts.some(ext => full.endsWith(ext))) files.push(full);
      }
    };

    walk(dirPath);
  });

  return files;
}

function runZeroUiInit() {
  const cwd = process.cwd();
  const allFiles = findAllSourceFiles();

  const allVariants = allFiles.flatMap(extractVariants);

  const variantMap = new Map();
  const initialValueMap = new Map();

  for (const { key, values, initialValue } of allVariants) {
    if (!variantMap.has(key)) {
      variantMap.set(key, new Set());
      if (initialValue !== null && initialValue !== undefined) {
        initialValueMap.set(key, initialValue);
      }
    }

    values.forEach((v) => variantMap.get(key).add(v));
  }

  const finalVariants = Array.from(variantMap.entries()).map(([key, set]) => ({
    key,
    values: Array.from(set).sort(),
    initialValue: initialValueMap.get(key),
  }));

  const initialValues = {};
  for (const { key, values, initialValue } of finalVariants) {
    const keySlug = toKebabCase(key);
    initialValues[`data-${keySlug}`] = initialValue || values[0] || '';
  }

  const ATTR_DIR = path.join(cwd, '.zero-ui');
  const ATTR_FILE = path.join(ATTR_DIR, 'attributes.js');
  const ATTR_TYPE_FILE = path.join(ATTR_DIR, 'attributes.d.ts');

  fs.mkdirSync(ATTR_DIR, { recursive: true });

  fs.writeFileSync(
    ATTR_FILE,
    `/* AUTO-GENERATED - DO NOT EDIT */\nexport const bodyAttributes = ${JSON.stringify(initialValues, null, 2)};\n`
  );

  buildCss(finalVariants, HEADER);

  const typeLines = ['/* AUTO-GENERATED - DO NOT EDIT */', 'export declare const bodyAttributes: {'];
  for (const { key, values } of finalVariants) {
    const slug = `data-${toKebabCase(key)}`;
    const union = values.map(v => `"${v}"`).join(' | ');
    typeLines.push(`  "${slug}": ${union};`);
  }
  typeLines.push('};\n');
  fs.writeFileSync(ATTR_TYPE_FILE, typeLines.join('\n'));

  patchConfigAlias();
  console.log('[Zero-UI] ✅ Initialized .zero-ui/attributes.js and updated config');
}



module.exports = {
  runZeroUiInit
}

