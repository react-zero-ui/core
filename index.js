/**
 * @type {import('postcss').PluginCreator}
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const chokidar = require('chokidar');

const HEADER = '/* AUTO-GENERATED - DO NOT EDIT */';

// Helper functions
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function getAllSourceFiles(base) {
  let files = [];
  if (!fs.existsSync(base)) return files;

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
    isTypeScript: ['.ts', '.tsx'].includes(ext),
    isJavaScript: ['.js', '.jsx'].includes(ext),
  };
}

function extractVariants(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  if (!code.includes('useUI')) return [];

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
}

function extractTypeScriptVariants(ast) {
  const extractedUIStates = [];

  traverse(ast, {
    CallExpression(path) {
      const callee = path.get('callee');
      if (!callee.isIdentifier() || callee.node.name !== 'useUI') return;

      // useUI('theme', 'light') -> hookArguments = ['theme', 'light']
      const hookArguments = path.node.arguments;
      const typeScriptGenericTypes = path.node.typeParameters.params;

      if (hookArguments.length < 2) return;

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
      if (path.node.callee.name !== 'useUI') return;

      const hookArguments = path.node.arguments;
      if (hookArguments.length < 2) return;

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


function buildCss(variants) {
  let css = HEADER + '\n';
  for (const { key, values } of variants) {
    const keySlug = toKebabCase(key);
    for (const val of values) {
      const valSlug = toKebabCase(val);
      css += `@variant ${keySlug}-${valSlug} (body[data-${keySlug}="${valSlug}"] &);\n`;
    }
  }
  console.log(css);
  return css;
}

// module.exports = (opts = {}) => {
module.exports = () => {

  let watcher;
  let timeout;
  let isProcessing = false;

  return {
    postcssPlugin: 'postcss-react-zero-ui',

    Once(root, postcss) {
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
        const cssBlock = buildCss(finalVariants);

        // Clear existing zero-ui generated content
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

        // Inject new CSS
        root.append('\n' + cssBlock);

        // Generate body attributes file
        const ATTR_FILE = path.resolve(cwd, '.zero-ui/attributes.js');

        const attrExport = `export const bodyAttributes = ${JSON.stringify(initialValues, null, 2)};\n`;
        console.log('attrExport: ', attrExport);
        fs.mkdirSync(path.dirname(ATTR_FILE), { recursive: true });
        fs.writeFileSync(ATTR_FILE, attrExport);
        console.log(`✔ ------------ Zero UI: Generated ${finalVariants.length} variants ------------`);
        isProcessing = false;
      };
      // Initial processing
      processFiles();

      // Set up file watching (only in development)
      if (process.env.NODE_ENV !== 'production') {
        const watchDirs = ['src', 'app']
          .filter(dir => fs.existsSync(path.resolve(cwd, dir)))
          .map(dir => path.resolve(cwd, dir));

        console.log('✔ Zero UI: Watching directories:', watchDirs.map(d => path.relative(cwd, d)));

        watcher = chokidar.watch(
          watchDirs.map(dir => `${dir}/**/*.{js,jsx,ts,tsx}`),
          {
            persistent: true,
            ignoreInitial: true,
            ignored: /node_modules/
          }
        );

        watcher.on('all', (eventType, filepath) => {
          if (filepath && /\.(ts|tsx|js|jsx)$/.test(filepath)) {
            console.log(`✔ Zero UI: ${eventType} ${path.relative(cwd, filepath)}`);

            clearTimeout(timeout);
            timeout = setTimeout(() => {
              processFiles();

              // Trigger PostCSS rebuild
              if (postcss.result) {
                postcss.result.messages.push({
                  type: 'dependency',
                  plugin: 'postcss-react-zero-ui',
                  file: filepath,
                  parent: postcss.result.opts.from
                });
              }
            }, 300);
          }
        });
      }
    },

    OnceExit() {
      if (watcher) {
        watcher.close();
      }
    }
  }
}

module.exports.postcss = true;