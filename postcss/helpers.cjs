// postcss/helpers.cjs
const fs = require('fs');
const path = require('path');
const { CONFIG, IGNORE_DIRS } = require('../core.config.cjs');
const { extractVariants, parseJsonWithBabel, } = require('./ast.cjs');

function toKebabCase(str) {
  if (typeof str !== 'string') {
    throw new Error(`Expected string but got: ${typeof str}`);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(str)) {
    throw new Error(
      `Invalid state key/value "${str}". Only alphanumerics, underscores, and dashes are allowed.`
    );
  }
  return str
    .replace(/_/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function findAllSourceFiles(rootDirs = ['src', 'app']) {
  const exts = ['.ts', '.tsx', '.js', '.jsx'];
  const files = [];
  const cwd = process.cwd();

  rootDirs.forEach((dir) => {
    const dirPath = path.join(cwd, dir);
    if (!fs.existsSync(dirPath)) return;

    const walk = (current) => {
      try {
        for (const entry of fs.readdirSync(current)) {
          const full = path.join(current, entry);
          const stat = fs.statSync(full);
          // TODO upgrade to fast-glob
          if (stat.isDirectory() && !entry.startsWith('.') && !IGNORE_DIRS.has(entry)) {
            walk(full);
          } else if (stat.isFile() && exts.some(ext => full.endsWith(ext))) {
            files.push(full);
          }
        }
      } catch (error) {
        console.warn(`[Zero-UI] Error reading directory ${current}:`, error.message);
      }
    };

    walk(dirPath);
  });

  return files;
}

/**
 * Process all variants from source files and return deduplicated, sorted variants
 * This is the core processing logic used by both PostCSS plugin and init script
 * @param {string[]} files - Array of file paths to process - if not provided, all source files will be found and processed
 * @returns {Object} - Object containing final variants, initial values, and source files
 */
function processVariants(files = null) {
  const sourceFiles = files || findAllSourceFiles();
  const allVariants = sourceFiles.flatMap(file => {
    return extractVariants(file);
  });

  // Deduplicate and merge variants
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

  // Convert to final format
  const finalVariants = Array.from(variantMap.entries())
    .map(([key, set]) => ({
      key,
      values: Array.from(set).sort(),
      initialValue: initialValueMap.get(key)
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  // Generate initial values object
  const initialValues = {};
  for (const { key, values, initialValue } of finalVariants) {
    const keySlug = toKebabCase(key);
    initialValues[`data-${keySlug}`] = initialValue || values[0] || '';
  }

  return { finalVariants, initialValues, sourceFiles };
}



function buildCss(variants) {
  let css = CONFIG.HEADER + '\n';
  for (const { key, values } of variants) {
    const keySlug = toKebabCase(key);
    for (const val of values) {
      const valSlug = toKebabCase(val);
      css += `@variant ${keySlug}-${valSlug} (body[data-${keySlug}="${valSlug}"] &);\n`;
    }
  }
  return css;
}

function generateAttributesFile(finalVariants, initialValues) {
  const cwd = process.cwd();
  const ATTR_DIR = path.join(cwd, CONFIG.ZERO_UI_DIR);
  const ATTR_FILE = path.join(ATTR_DIR, 'attributes.js');
  const ATTR_TYPE_FILE = path.join(ATTR_DIR, 'attributes.d.ts');

  // Generate JavaScript export
  const attrExport = `${CONFIG.HEADER}\nexport const bodyAttributes = ${JSON.stringify(initialValues, null, 2)};\n`;

  // Generate TypeScript definitions
  const toLiteral = (v) => typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : v;
  const typeLines = [
    CONFIG.HEADER,
    'export declare const bodyAttributes: {',
    ...finalVariants.map(({ key, values }) => {
      const slug = `data-${toKebabCase(key)}`;
      const union = values.map(toLiteral).join(' | ');
      return `  "${slug}": ${union};`;
    }),
    '};',
    ''
  ];
  const attrTypeExport = typeLines.join('\n');

  // Create directory if it doesn't exist
  fs.mkdirSync(ATTR_DIR, { recursive: true });

  // Only write if content has changed
  const writeIfChanged = (file, content) => {
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
    if (existing !== content) {
      fs.writeFileSync(file, content);
      return true;
    }
    return false;
  };

  const jsChanged = writeIfChanged(ATTR_FILE, attrExport);
  const tsChanged = writeIfChanged(ATTR_TYPE_FILE, attrTypeExport);

  return { jsChanged, tsChanged };
}

function isZeroUiInitialized() {
  const cwd = process.cwd();
  const ATTR_DIR = path.join(cwd, CONFIG.ZERO_UI_DIR);
  const ATTR_FILE = path.join(ATTR_DIR, 'attributes.js');
  const ATTR_TYPE_FILE = path.join(ATTR_DIR, 'attributes.d.ts');

  if (!fs.existsSync(ATTR_FILE) || !fs.existsSync(ATTR_TYPE_FILE)) {
    return false;
  }

  try {
    const attrContent = fs.readFileSync(ATTR_FILE, 'utf-8');
    const typeContent = fs.readFileSync(ATTR_TYPE_FILE, 'utf-8');

    return attrContent.includes('export const bodyAttributes') &&
      typeContent.includes('export declare const bodyAttributes');
  } catch (error) {
    return false;
  }
}

/**
 * Adds @zero-ui/attributes path alias to tsconfig or jsconfig.
 * Ensures correct module resolution for the generated attributes file.
 * No-op if already present or config is missing.
 */
function patchConfigAlias() {
  const cwd = process.cwd();

  const configFile =
    fs.existsSync(path.join(cwd, 'tsconfig.json'))
      ? 'tsconfig.json'
      : fs.existsSync(path.join(cwd, 'jsconfig.json'))
        ? 'jsconfig.json'
        : null;

  if (!configFile) return console.warn(`[Zero-UI] No tsconfig.json or jsconfig.json found in ${cwd}`);

  const configPath = path.join(cwd, configFile);
  const raw = fs.readFileSync(configPath, 'utf-8');
  const config = parseJsonWithBabel(raw, configPath);
  if (!config) return console.warn(`[Zero-UI] Could not parse ${configFile}`);

  config.compilerOptions = config.compilerOptions || {};
  config.compilerOptions.baseUrl = config.compilerOptions.baseUrl || '.';
  config.compilerOptions.paths = config.compilerOptions.paths || {};

  const expected = ['./.zero-ui/attributes.js'];
  const current = config.compilerOptions.paths['@zero-ui/attributes'];

  if (
    !Array.isArray(current) ||
    JSON.stringify(current) !== JSON.stringify(expected)
  ) {
    config.compilerOptions.paths['@zero-ui/attributes'] = expected;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`[Zero-UI] Patched ${configFile} with @zero-ui/attributes`);
  }
}



module.exports = {
  toKebabCase,
  findAllSourceFiles,
  extractVariants,
  buildCss,
  patchConfigAlias,
  generateAttributesFile,
  processVariants,
  isZeroUiInitialized,

};