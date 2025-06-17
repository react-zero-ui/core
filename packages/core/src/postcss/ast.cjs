// src/postcss/ast.cjs

// TODO update to esbuild or SWC + run in parallel w/ per changed file only
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { CONFIG } = require('../config.cjs');

// Cache for parsed files
const fileCache = new Map();

function extractVariants(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    if (!code.includes(CONFIG.HOOK_NAME)) return [];
    // Check cache
    const hash = crypto.createHash('md5').update(code).digest('hex');
    const cached = fileCache.get(filePath);
    if (cached && cached.hash === hash) {
      return cached.variants;
    }
    let ast;
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    const variants = CONFIG.SUPPORTED_EXTENSIONS.TYPESCRIPT.includes(path.extname(filePath).toLowerCase())
      ? extractTypeScriptVariants(ast)
      : extractJavaScriptVariants(ast);

    // Update cache
    fileCache.set(filePath, { hash, variants });

    return variants;
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

      if (!callee.isIdentifier() || callee.node.name !== CONFIG.HOOK_NAME) return;

      // useUI('theme', 'light') -> hookArguments = ['theme', 'light']
      const hookArguments = path.node.arguments;
      const typeScriptGenericTypes = path.node.typeParameters ? path.node.typeParameters.params : undefined;

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
        // We do have TypeScript types, and still need to extract initial value
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
      if (path.node.callee.name !== CONFIG.HOOK_NAME) return;

      const hookArguments = path.node.arguments;
      if (hookArguments.length < CONFIG.MIN_HOOK_ARGUMENTS) return;

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



/**
 * Parse a tsconfig/jsconfig JSON file using Babel (handles comments, trailing commas)
 */
function parseJsonWithBabel(source) {
  try {
    const ast = parser.parseExpression(source, {
      sourceType: 'module',
      plugins: ['json'],
    });
    // Convert Babel AST back to plain JS object
    return eval(`(${generate(ast).code})`);
  } catch (err) {
    console.warn(`[Zero-UI] Failed to parse ${source}: ${err.message}`);
    return null;
  }
}


/** 
 * Parse PostCSS config JavaScript file and add Zero-UI plugin if not present
 * Uses Babel AST for robust parsing and modification
 * Supports both CommonJS (.js) and ES Modules (.mjs) formats
 * @param {string} source - The PostCSS config source code
 * @param {string} zeroUiPlugin - The Zero-UI plugin name
 * @param {boolean} isESModule - Whether the config is an ES module
 * @returns {string | null} The modified config code or null if no changes were made
 */
function parseAndUpdatePostcssConfig(source, zeroUiPlugin, isESModule = false) {
  try {
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['commonjs', 'importMeta'],
    });

    let modified = false;

    // Check if Zero-UI plugin already exists
    if (source.includes(zeroUiPlugin)) {
      return source; // Already configured
    }

    traverse(ast, {
      // Handle CommonJS: module.exports = { ... } and exports = { ... }
      AssignmentExpression(path) {
        const { left, right } = path.node;

        // Check for module.exports or exports assignment
        const isModuleExports = left.type === 'MemberExpression' &&
          left.object.name === 'module' &&
          left.property.name === 'exports';
        const isExportsAssignment = left.type === 'Identifier' && left.name === 'exports';

        if ((isModuleExports || isExportsAssignment) && right.type === 'ObjectExpression') {
          const pluginsProperty = right.properties.find(prop =>
            prop.key && prop.key.name === 'plugins'
          );

          if (pluginsProperty) {
            modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
          }
        }
      },

      // Handle ES Modules: export default { ... }
      ExportDefaultDeclaration(path) {
        if (isESModule && path.node.declaration.type === 'ObjectExpression') {
          const pluginsProperty = path.node.declaration.properties.find(prop =>
            prop.key && prop.key.name === 'plugins'
          );

          if (pluginsProperty) {
            modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
          }
        }
      },

      // Handle: const config = { plugins: ... }; export default config
      VariableDeclarator(path) {
        if (isESModule && path.node.init && path.node.init.type === 'ObjectExpression') {
          const pluginsProperty = path.node.init.properties.find(prop =>
            prop.key && prop.key.name === 'plugins'
          );

          if (pluginsProperty) {
            modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
          }
        }
      }
    });

    if (modified) {
      return generate(ast).code;
    } else {
      return null; // Could not automatically modify
    }

  } catch (err) {
    console.warn(`[Zero-UI] Failed to parse PostCSS config: ${err.message}`);
    return null;
  }
}

/**
 * Helper function to add Zero-UI plugin to plugins configuration
 * Handles both object format {plugin: {}} and array format [plugin]
 */
function addZeroUiToPlugins(pluginsNode, zeroUiPlugin) {
  if (pluginsNode.type === 'ObjectExpression') {
    // Object format: { 'plugin': {} }
    pluginsNode.properties.unshift({
      type: 'ObjectProperty',
      key: { type: 'StringLiteral', value: zeroUiPlugin },
      value: { type: 'ObjectExpression', properties: [] }
    });
    return true;
  } else if (pluginsNode.type === 'ArrayExpression') {
    // Array format: ['plugin']
    pluginsNode.elements.unshift({
      type: 'StringLiteral',
      value: zeroUiPlugin
    });
    return true;
  }
  return false;
}

module.exports = {
  extractVariants,
  parseJsonWithBabel,
  parseAndUpdatePostcssConfig,
};