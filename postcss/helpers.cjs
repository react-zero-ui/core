
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const SUPPORTED_EXTENSIONS = {
  TYPESCRIPT: ['.ts', '.tsx'],
  JAVASCRIPT: ['.js', '.jsx']
};

const HOOK_NAME = 'useUI';
const MIN_HOOK_ARGUMENTS = 2;

function toKebabCase(str) {
  if (typeof str !== 'string') {
    throw new Error(`Expected string but got: ${typeof str}`);
  }
  // Disallow invalid characters: only letters, numbers, underscore, and dash allowed
  if (!/^[a-zA-Z0-9_-]+$/.test(str)) {
    throw new Error(
      `Invalid state key/value "${str}". Only alphanumerics, underscores, and dashes are allowed.`
    );
  }

  // Replace underscores with dashes, and convert camelCase to kebab-case
  return str
    .replace(/_/g, '-') // underscores → dashes
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase → kebab
    .toLowerCase();
}


function getAllSourceFiles(base) {
  let files = [];
  if (!fs.existsSync(base)) throw new Error(`Directory not found: ${base}`);

  fs.readdirSync(base).forEach((file) => {
    const full = path.join(base, file);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getAllSourceFiles(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(full)) {
      files.push(full);
    }
  });
  return files;
}

function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    isTypeScript: SUPPORTED_EXTENSIONS.TYPESCRIPT.includes(ext),
    isJavaScript: SUPPORTED_EXTENSIONS.JAVASCRIPT.includes(ext),
  };
}

/**
 * Extracts UI state variants from a source file by analyzing useUI hook usage
 * @param {string} filePath - Path to the source file
 * @returns {Array<{key: string, values: string[], initialValue: string|null}>} Extracted variants
 * @throws {Error} If file cannot be read
 */
function extractVariants(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    if (!code.includes(HOOK_NAME)) return [];

    const fileType = detectFileType(filePath);

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
    } catch (e) {
      console.warn(`⚠️ Skipping ${filePath}: parse error: ${e.message}`);
      return [];
    }

    if (fileType.isTypeScript) {
      return extractTypeScriptVariants(ast);
    } else {
      return extractJavaScriptVariants(ast);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return [];

  }
}



function extractTypeScriptVariants(ast) {
  const extractedUIStates = [];

  traverse(ast, {
    CallExpression(path) {
      const callee = path.get('callee');
      if (!callee.isIdentifier() || callee.node.name !== HOOK_NAME) return;

      // useUI('theme', 'light') -> hookArguments = ['theme', 'light']
      const hookArguments = path.node.arguments;
      const typeScriptGenericTypes = path.node.typeParameters ? path.node.typeParameters.params : undefined;
      if (hookArguments.length < MIN_HOOK_ARGUMENTS) return;

      // First arg: the state key (e.g., 'theme', 'modal', 'sidebar')
      const stateKeyArgument = hookArguments[0];
      if (stateKeyArgument.type !== 'StringLiteral') return;
      const stateKey = stateKeyArgument.value;

      let possibleStateValues = [];
      let initialStateValue = null;

      // First, try to get values from TypeScript generic type
      if (typeScriptGenericTypes && typeScriptGenericTypes[0]) {
        const genericType = typeScriptGenericTypes[0];

        if (genericType.type === 'TSBooleanKeyword') {
          possibleStateValues = ['true', 'false'];
        } else if (genericType.type === 'TSUnionType') {
          // useUI<'light' | 'dark' | 'auto'>
          possibleStateValues = genericType.types
            .filter((unionMember) => unionMember.type === 'TSLiteralType')
            .map((unionMember) => unionMember.literal.value)
            .filter(Boolean)
            .map(String);
        }
      }

      // If no TypeScript types found, infer from initial value
      if (possibleStateValues.length === 0) {
        // Second arg: the initial value (e.g., 'light', false, 'closed')
        const initialValueArgument = hookArguments[1];

        if (initialValueArgument.type === 'BooleanLiteral') {
          possibleStateValues = ['true', 'false'];
          initialStateValue = String(initialValueArgument.value);
        } else if (initialValueArgument.type === 'StringLiteral') {
          possibleStateValues = [initialValueArgument.value];
          initialStateValue = initialValueArgument.value;
        }
      } else {
        // We have TypeScript types, but still need to extract initial value
        const initialValueArgument = hookArguments[1];
        if (initialValueArgument.type === 'StringLiteral') {
          initialStateValue = initialValueArgument.value;
        } else if (initialValueArgument.type === 'BooleanLiteral') {
          initialStateValue = String(initialValueArgument.value);
        }
      }

      if (possibleStateValues.length > 0) {
        extractedUIStates.push({
          key: stateKey,
          values: possibleStateValues,
          initialValue: initialStateValue // Track initial value explicitly
        });
      }
    },
  });

  return extractedUIStates;
}

function extractJavaScriptVariants(ast) {
  const stateKeyToPossibleValues = new Map();
  const setterFunctionNameToStateKey = new Map();
  const stateKeyToInitialValue = new Map(); // Track initial values

  // First pass: Find all useUI calls and extract initial setup
  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.name !== HOOK_NAME) return;

      const hookArguments = path.node.arguments;
      if (hookArguments.length < MIN_HOOK_ARGUMENTS) return;

      // useUI('theme', 'light') -> stateKey = 'theme', initialValue = 'light'
      const stateKeyArgument = hookArguments[0];
      const initialValueArgument = hookArguments[1];

      if (stateKeyArgument.type !== 'StringLiteral') return;
      const stateKey = stateKeyArgument.value;

      // Initialize the set for this state key
      if (!stateKeyToPossibleValues.has(stateKey)) {
        stateKeyToPossibleValues.set(stateKey, new Set());
      }

      // Store the initial value
      if (initialValueArgument.type === 'StringLiteral') {
        const initialValue = initialValueArgument.value;
        stateKeyToPossibleValues.get(stateKey).add(initialValue);
        stateKeyToInitialValue.set(stateKey, initialValue);
      } else if (initialValueArgument.type === 'BooleanLiteral') {
        stateKeyToPossibleValues.set(stateKey, new Set(['true', 'false']));
        stateKeyToInitialValue.set(stateKey, String(initialValueArgument.value));
      }

      // Track the setter function name
      // const [theme, setTheme] = useUI(...) -> setterName = 'setTheme'
      const parentDeclaration = path.parent;
      if (parentDeclaration.type === 'VariableDeclarator' &&
        parentDeclaration.id.type === 'ArrayPattern' &&
        parentDeclaration.id.elements[1]) {
        const setterElement = parentDeclaration.id.elements[1];
        if (setterElement.type === 'Identifier') {
          const setterFunctionName = setterElement.name;
          setterFunctionNameToStateKey.set(setterFunctionName, stateKey);
        }
      }
    }
  });

  // Second pass: Find all setter function calls to discover possible values
  traverse(ast, {
    CallExpression(path) {
      const { callee, arguments: callArguments } = path.node;

      // Direct setter call: setTheme('dark')
      if (callee.type === 'Identifier' && setterFunctionNameToStateKey.has(callee.name)) {
        const stateKey = setterFunctionNameToStateKey.get(callee.name);
        const setterArgumentValues = extractArgumentValues(callArguments[0], path);
        setterArgumentValues.forEach(value => stateKeyToPossibleValues.get(stateKey).add(value));
      }
    },

    // Check event handlers: onClick={() => setTheme('dark')}
    JSXAttribute(path) {
      if (path.node.name.name.startsWith('on')) {
        const jsxAttributeValue = path.node.value;
        if (jsxAttributeValue.type === 'JSXExpressionContainer') {
          checkExpressionForSetters(
            jsxAttributeValue.expression,
            setterFunctionNameToStateKey,
            stateKeyToPossibleValues,
            path
          );
        }
      }
    }
  });

  // Convert to final format with initial values
  return Array.from(stateKeyToPossibleValues.entries()).map(([stateKey, possibleValuesSet]) => ({
    key: stateKey,
    values: Array.from(possibleValuesSet),
    initialValue: stateKeyToInitialValue.get(stateKey) || null
  }));
}

function checkExpressionForSetters(node, setterToKey, variants, path) {
  if (node.type === 'ArrowFunctionExpression') {
    const body = node.body;

    const expressions = body.type === 'BlockStatement'
      ? findCallExpressionsInBlock(body)
      : [body];

    expressions.forEach(expr => {
      if (expr.type === 'CallExpression' &&
        expr.callee.type === 'Identifier' &&
        setterToKey.has(expr.callee.name)) {
        const key = setterToKey.get(expr.callee.name);
        const values = extractArgumentValues(expr.arguments[0], path);
        values.forEach(v => variants.get(key).add(v));
      }
    });
  }
}

function findCallExpressionsInBlock(block) {
  const calls = [];
  block.body.forEach(statement => {
    if (statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'CallExpression') {
      calls.push(statement.expression);
    }
  });
  return calls;
}

function extractArgumentValues(node, path) {
  const values = new Set();

  if (!node) return values;

  switch (node.type) {
    case 'StringLiteral':
      values.add(node.value);
      break;
    case 'BooleanLiteral':
      values.add(String(node.value));
      break;

    case 'NumericLiteral':
      values.add(String(node.value));
      break;

    case 'ConditionalExpression':
      // isActive ? 'react' : 'zero'
      extractArgumentValues(node.consequent, path).forEach(v => values.add(v));
      extractArgumentValues(node.alternate, path).forEach(v => values.add(v));
      break;

    case 'LogicalExpression':
      if (node.operator === '||' || node.operator === '??') {
        extractArgumentValues(node.left, path).forEach(v => values.add(v));
        extractArgumentValues(node.right, path).forEach(v => values.add(v));
      }
      break;

    case 'Identifier': {
      const binding = path.scope.getBinding(node.name);
      if (binding && binding.path.isVariableDeclarator()) {
        const init = binding.path.node.init;
        if (init.type === 'StringLiteral') {
          values.add(init.value);
        }
      }
    }
      break;

    case 'MemberExpression':
      if (node.property.type === 'Identifier') {
        values.add(node.property.name.toLowerCase());
      }
      break;
  }

  return values;
}

function buildCss(variants, header) {
  let css = header + '\n';
  for (const { key, values } of variants) {
    const keySlug = toKebabCase(key);
    for (const val of values) {
      const valSlug = toKebabCase(val);
      css += `@variant ${keySlug}-${valSlug} (body[data-${keySlug}="${valSlug}"] &);\n`;
    }
  }
  return css;
}


/**
 * Parse a tsconfig/jsconfig JSON file using Babel (handles comments, trailing commas)
 */
function parseJsonWithBabel(source, filePath) {
  try {
    const ast = parser.parseExpression(source, {
      sourceType: 'module',
      plugins: ['json'],
    });
    // Convert Babel AST back to plain JS object
    return eval(`(${generate(ast).code})`);
  } catch (err) {
    console.warn(`[Zero-UI] Failed to parse ${filePath}: ${err.message}`);
    return null;
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




/**
 * Generates body attributes file and TypeScript definitions from UI state variants.
 * Creates .zero-ui/attributes.js and .zero-ui/attributes.d.ts files with initial values
 * 
 * @param {Array<{key: string, values: string[], initialValue: string|null}>} finalVariants - Array of UI state variants with their possible values
 * @param {Object<string, string>} initialValues - Object mapping data attributes to their initial values 
 * @returns {void} - Writes files to disk, no return value
 * 
 * @example
 * const variants = [
 *   { key: 'theme', values: ['light', 'dark'], initialValue: 'light' },
 *   { key: 'sidebar', values: ['open', 'closed'], initialValue: 'closed' }
 * ];
 * const initialValues = { 'data-theme': 'light', 'data-sidebar': 'closed' };
 * generateAttributesFile(variants, initialValues);
 *  Creates:
 *  .zero-ui/attributes.js - exports bodyAttributes object
 *  .zero-ui/attributes.d.ts - TypeScript definitions
 */
function generateAttributesFile(finalVariants, initialValues) {
  const ATTR_DIR = path.join(process.cwd(), '.zero-ui');
  const ATTR_FILE = path.join(ATTR_DIR, 'attributes.js');

  // Generate JavaScript export
  const attrExport = `/* AUTO-GENERATED - DO NOT EDIT */\nexport const bodyAttributes = ${JSON.stringify(initialValues, null, 2)};\n`;

  // Generate TypeScript definitions
  const toLiteral = (v) =>
    typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : v;

  const lines = [];
  lines.push('/* AUTO-GENERATED - DO NOT EDIT */');
  lines.push('export declare const bodyAttributes: {');

  for (const { key, values } of finalVariants) {
    const slug = `data-${toKebabCase(key)}`;
    const union = values.map(toLiteral).join(' | ');
    lines.push(`  "${slug}": ${union};`);
  }
  lines.push('};\n');
  const attrTypeExport = lines.join('\n');

  // Only write if content has changed (prevents unnecessary file system writes)
  const existingContent = fs.existsSync(ATTR_FILE) ? fs.readFileSync(ATTR_FILE, 'utf-8') : '';
  if (existingContent !== attrExport) {
    fs.mkdirSync(ATTR_DIR, { recursive: true });
    const ATTR_TYPE_FILE = path.join(ATTR_DIR, 'attributes.d.ts');

    fs.writeFileSync(ATTR_FILE, attrExport);
    fs.writeFileSync(ATTR_TYPE_FILE, attrTypeExport);
  }
}

module.exports = {
  toKebabCase,
  getAllSourceFiles,
  detectFileType,
  extractVariants,
  buildCss,
  patchConfigAlias,
  generateAttributesFile
};



