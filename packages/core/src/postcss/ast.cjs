// src/postcss/ast.cjs

// TODO update to esbuild or SWC + run in parallel w/ per changed file only
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { CONFIG } = require('../config.cjs');

// Cache for parsed files
const fileCache = new Map();

// function extractVariants(filePath) {
// 	try {
// 		const code = fs.readFileSync(filePath, 'utf-8');
// 		if (!code.includes(CONFIG.HOOK_NAME)) return [];
// 		// Check cache
// 		const hash = crypto.createHash('md5').update(code).digest('hex');
// 		const cached = fileCache.get(filePath);
// 		if (cached && cached.hash === hash) {
// 			return cached.variants;
// 		}
// 		let ast;
// 		ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
// 		const variants = CONFIG.SUPPORTED_EXTENSIONS.TYPESCRIPT.includes(path.extname(filePath).toLowerCase())
// 			? extractTypeScriptVariants(ast)
// 			: extractJavaScriptVariants(ast);

// 		// Update cache
// 		fileCache.set(filePath, { hash, variants });

// 		return variants;
// 	} catch (error) {
// 		console.error(`Error processing ${filePath}:`, error.message);
// 		return [];
// 	}
// }

// function extractTypeScriptVariants(ast) {
// 	const extractedUIStates = [];

// 	traverse(ast, {
// 		CallExpression(path) {
// 			const callee = path.get('callee');

// 			if (!callee.isIdentifier() || callee.node.name !== CONFIG.HOOK_NAME) return;

// 			// useUI('theme', 'light') -> hookArguments = ['theme', 'light']
// 			const hookArguments = path.node.arguments;
// 			const typeScriptGenericTypes = path.node.typeParameters ? path.node.typeParameters.params : undefined;

// 			// First arg: the state key (e.g., 'theme', 'modal', 'sidebar')
// 			const stateKeyArgument = hookArguments[0];
// 			if (stateKeyArgument.type !== 'StringLiteral') return;
// 			const stateKey = stateKeyArgument.value;

// 			let possibleStateValues = [];
// 			let initialStateValue = null;

// 			// First, try to get values from TypeScript generic type
// 			if (typeScriptGenericTypes && typeScriptGenericTypes[0]) {
// 				const genericType = typeScriptGenericTypes[0];

// 				if (genericType.type === 'TSBooleanKeyword') {
// 					possibleStateValues = ['true', 'false'];
// 				} else if (genericType.type === 'TSUnionType') {
// 					// useUI<'light' | 'dark' | 'auto'>
// 					possibleStateValues = genericType.types
// 						.filter(unionMember => unionMember.type === 'TSLiteralType')
// 						.map(unionMember => unionMember.literal.value)
// 						.filter(Boolean)
// 						.map(String);
// 				}
// 			}

// 			// If no TypeScript types found, infer from initial value
// 			if (possibleStateValues.length === 0) {
// 				// Second arg: the initial value (e.g., 'light', false, 'closed')
// 				const initialValueArgument = hookArguments[1];

// 				if (initialValueArgument.type === 'BooleanLiteral') {
// 					possibleStateValues = ['true', 'false'];
// 					initialStateValue = String(initialValueArgument.value);
// 				} else if (initialValueArgument.type === 'StringLiteral') {
// 					possibleStateValues = [initialValueArgument.value];
// 					initialStateValue = initialValueArgument.value;
// 				}
// 			} else {
// 				// We do have TypeScript types, and still need to extract initial value
// 				const initialValueArgument = hookArguments[1];
// 				if (initialValueArgument.type === 'StringLiteral') {
// 					initialStateValue = initialValueArgument.value;
// 				} else if (initialValueArgument.type === 'BooleanLiteral') {
// 					initialStateValue = String(initialValueArgument.value);
// 				}
// 			}

// 			if (possibleStateValues.length > 0) {
// 				extractedUIStates.push({
// 					key: stateKey,
// 					values: possibleStateValues,
// 					initialValue: initialStateValue, // Track initial value explicitly
// 				});
// 			}
// 		},
// 	});

// 	return extractedUIStates;
// }

function extractVariants(filePath) {
	const code = fs.readFileSync(filePath, 'utf8');
	if (!code.includes(CONFIG.HOOK_NAME)) return [];

	const hash = crypto.createHash('md5').update(code).digest('hex');
	const cached = fileCache.get(filePath);
	if (cached && cached.hash === hash) return cached.variants;

	// Parse TS but treat it as 'JS with types'
	const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

	const variants = extractJavaScriptVariants(ast);

	fileCache.set(filePath, { hash, variants });
	return variants;
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
			if (parentDeclaration.type === 'VariableDeclarator' && parentDeclaration.id.type === 'ArrayPattern' && parentDeclaration.id.elements[1]) {
				const setterElement = parentDeclaration.id.elements[1];
				if (setterElement.type === 'Identifier') {
					const setterFunctionName = setterElement.name;
					setterFunctionNameToStateKey.set(setterFunctionName, stateKey);
				}
			}
		},
	});

	// Second pass: Find all setter function calls to discover possible values
	traverse(ast, {
		CallExpression(path) {
			const { callee, arguments: callArguments } = path.node;

			// Direct setter call: setTheme('dark')
			if (callee.type === 'Identifier' && setterFunctionNameToStateKey.has(callee.name)) {
				const stateKey = setterFunctionNameToStateKey.get(callee.name);
				const setterArgumentValues = extractArgumentValues(callArguments[0], path);
				setterArgumentValues.forEach((value) => stateKeyToPossibleValues.get(stateKey).add(value));
			}
		},

		// Check event handlers: onClick={() => setTheme('dark')}
		JSXAttribute(path) {
			if (path.node.name.name.startsWith('on')) {
				const jsxAttributeValue = path.node.value;
				if (jsxAttributeValue.type === 'JSXExpressionContainer') {
					checkExpressionForSetters(jsxAttributeValue.expression, setterFunctionNameToStateKey, stateKeyToPossibleValues, path);
				}
			}
		},
	});

	// Convert to final format with SORTED values (crucial for CSS stability)
	return Array.from(stateKeyToPossibleValues.entries()).map(([stateKey, possibleValuesSet]) => ({
		key: stateKey,
		values: Array.from(possibleValuesSet).sort(), // Sort
		initialValue: stateKeyToInitialValue.get(stateKey) || null,
	}));
}

function checkExpressionForSetters(node, setterToKey, variants, path) {
	if (node.type === 'ArrowFunctionExpression') {
		const body = node.body;

		const expressions = body.type === 'BlockStatement' ? findCallExpressionsInBlock(body) : [body];

		expressions.forEach((expr) => {
			if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier' && setterToKey.has(expr.callee.name)) {
				const key = setterToKey.get(expr.callee.name);
				const values = extractArgumentValues(expr.arguments[0], path);
				values.forEach((v) => variants.get(key).add(v));
			}
		});
	}
}

function findCallExpressionsInBlock(block) {
	const calls = [];
	block.body.forEach((statement) => {
		if (statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression') {
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
			extractArgumentValues(node.consequent, path).forEach((v) => values.add(v));
			extractArgumentValues(node.alternate, path).forEach((v) => values.add(v));
			break;

		case 'LogicalExpression':
			if (node.operator === '||' || node.operator === '??') {
				extractArgumentValues(node.left, path).forEach((v) => values.add(v));
				extractArgumentValues(node.right, path).forEach((v) => values.add(v));
			}
			break;

		case 'Identifier':
			{
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
		const ast = parser.parseExpression(source, { sourceType: 'module', plugins: ['json'] });
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
		const ast = parser.parse(source, { sourceType: 'module', plugins: ['commonjs', 'importMeta'] });

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
				const isModuleExports = left.type === 'MemberExpression' && left.object.name === 'module' && left.property.name === 'exports';
				const isExportsAssignment = left.type === 'Identifier' && left.name === 'exports';

				if ((isModuleExports || isExportsAssignment) && right.type === 'ObjectExpression') {
					const pluginsProperty = right.properties.find((prop) => prop.key && prop.key.name === 'plugins');

					if (pluginsProperty) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},

			// Handle ES Modules: export default { ... }
			ExportDefaultDeclaration(path) {
				if (isESModule && path.node.declaration.type === 'ObjectExpression') {
					const pluginsProperty = path.node.declaration.properties.find((prop) => prop.key && prop.key.name === 'plugins');

					if (pluginsProperty) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},

			// Handle: const config = { plugins: ... }; export default config
			VariableDeclarator(path) {
				if (isESModule && path.node.init && path.node.init.type === 'ObjectExpression') {
					const pluginsProperty = path.node.init.properties.find((prop) => prop.key && prop.key.name === 'plugins');

					if (pluginsProperty) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},
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
			value: { type: 'ObjectExpression', properties: [] },
		});
		return true;
	} else if (pluginsNode.type === 'ArrayExpression') {
		// Array format: ['plugin']
		pluginsNode.elements.unshift({ type: 'StringLiteral', value: zeroUiPlugin });
		return true;
	}
	return false;
}

/**
 * Helper to create a zeroUI() call AST node
 */
function createZeroUICallNode() {
	return { type: 'CallExpression', callee: { type: 'Identifier', name: 'zeroUI' }, arguments: [] };
}

/**
 * Helper to create a zeroUI import AST node
 */
function createZeroUIImportNode(importPath) {
	return {
		type: 'ImportDeclaration',
		specifiers: [{ type: 'ImportDefaultSpecifier', local: { type: 'Identifier', name: 'zeroUI' } }],
		source: { type: 'StringLiteral', value: importPath },
	};
}

/**
 * Helper to process a plugins array - replaces Tailwind with zeroUI or adds zeroUI
 */
function processPluginsArray(pluginsArray) {
	let tailwindIndex = -1;
	let zeroUIIndex = -1;

	// Find existing plugins
	pluginsArray.forEach((element, index) => {
		if (element && element.type === 'CallExpression') {
			if (element.callee.name === 'tailwindcss') {
				tailwindIndex = index;
			} else if (element.callee.name === 'zeroUI') {
				zeroUIIndex = index;
			}
		}
	});

	// Replace Tailwind with Zero-UI
	if (tailwindIndex >= 0) {
		pluginsArray[tailwindIndex] = createZeroUICallNode();
		return true;
	}
	// Add Zero-UI if not present
	else if (zeroUIIndex === -1) {
		pluginsArray.push(createZeroUICallNode());
		return true;
	}

	return false;
}

/**
 * Helper to handle config object (creates plugins array if needed)
 */
function processConfigObject(configObject) {
	const pluginsProperty = configObject.properties.find((prop) => prop.key && prop.key.name === 'plugins');

	if (pluginsProperty && pluginsProperty.value.type === 'ArrayExpression') {
		// Process existing plugins array
		return processPluginsArray(pluginsProperty.value.elements);
	} else if (!pluginsProperty) {
		// Create new plugins array with zeroUI
		configObject.properties.push({
			type: 'ObjectProperty',
			key: { type: 'Identifier', name: 'plugins' },
			value: { type: 'ArrayExpression', elements: [createZeroUICallNode()] },
		});
		return true;
	}

	return false;
}

/**
 * Helper to add zeroUI import to program
 * Uses the FAANG approach: add at the beginning and let tooling handle organization
 */
function addZeroUIImport(programPath, zeroUiPlugin) {
	const zeroUIImport = createZeroUIImportNode(zeroUiPlugin);
	// Simple approach: add at the beginning
	programPath.node.body.unshift(zeroUIImport);
}

/**
 * Parse Vite config TypeScript/JavaScript file and add Zero-UI plugin
 * Replaces @tailwindcss/vite plugin if present, otherwise adds zeroUI plugin
 * @param {string} source - The Vite config source code
 * @param {string} zeroUiPlugin - The Zero-UI plugin import path
 * @returns {string | null} The modified config code or null if no changes were made
 */
function parseAndUpdateViteConfig(source, zeroUiPlugin) {
	try {
		// Quick check - if already configured correctly, return original
		const hasZeroUIImport = source.includes(zeroUiPlugin);
		const hasZeroUIPlugin = source.includes('zeroUI()');
		const hasTailwindPlugin = source.includes('@tailwindcss/vite');

		if (hasZeroUIImport && hasZeroUIPlugin && !hasTailwindPlugin) {
			return source;
		}

		const ast = parser.parse(source, { sourceType: 'module', plugins: ['typescript', 'importMeta'] });

		let modified = false;

		traverse(ast, {
			Program(path) {
				if (!hasZeroUIImport) {
					addZeroUIImport(path, zeroUiPlugin);
					modified = true;
				}
			},

			// Handle both direct export and variable assignment patterns
			CallExpression(path) {
				if (path.node.callee.name === 'defineConfig' && path.node.arguments.length > 0 && path.node.arguments[0].type === 'ObjectExpression') {
					if (processConfigObject(path.node.arguments[0])) {
						modified = true;
					}
				}
			},

			// Remove Tailwind import if we're replacing it
			ImportDeclaration(path) {
				if (path.node.source.value === '@tailwindcss/vite' && hasTailwindPlugin) {
					path.remove();
					modified = true;
				}
			},
		});

		return modified ? generate(ast).code : null;
	} catch (err) {
		console.warn(`[Zero-UI] Failed to parse Vite config: ${err.message}`);
		return null;
	}
}

function findLayoutWithBody(root = process.cwd()) {
	const matches = [];
	function walk(dir) {
		for (const file of fs.readdirSync(dir)) {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);
			if (stat.isDirectory()) {
				walk(fullPath);
			} else if (/^layout\.(tsx|jsx|js|ts)$/.test(file)) {
				const source = fs.readFileSync(fullPath, 'utf8');
				if (source.includes('<body')) {
					matches.push(fullPath);
				}
			}
		}
	}
	walk(root);
	return matches;
}

async function patchNextBodyTag() {
	const matches = findLayoutWithBody();

	if (matches.length !== 1) {
		console.warn(`[Zero-UI] ⚠️ Found ${matches.length} layout files with <body> tags. ` + `Expected exactly one. Skipping automatic injection.`);
		return;
	}

	const filePath = matches[0];
	const code = fs.readFileSync(filePath, 'utf8');

	// Parse the file into an AST
	const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

	let hasImport = false;
	traverse(ast, {
		ImportDeclaration(path) {
			const specifiers = path.node.specifiers;
			const source = path.node.source.value;
			if (source === '@zero-ui/attributes') {
				for (const spec of specifiers) {
					if (t.isImportSpecifier(spec) && spec.imported.name === 'bodyAttributes') {
						hasImport = true;
					}
				}
			}
		},
	});

	traverse(ast, {
		Program(path) {
			if (!hasImport) {
				const importDecl = t.importDeclaration(
					[t.importSpecifier(t.identifier('bodyAttributes'), t.identifier('bodyAttributes'))],
					t.stringLiteral('@zero-ui/attributes')
				);
				path.node.body.unshift(importDecl);
			}
		},
	});

	// Inject JSX spread into <body>
	let injected = false;
	traverse(ast, {
		JSXOpeningElement(path) {
			if (!injected && t.isJSXIdentifier(path.node.name, { name: 'body' })) {
				// Prevent duplicate injection
				const hasSpread = path.node.attributes.some((attr) => t.isJSXSpreadAttribute(attr) && t.isIdentifier(attr.argument, { name: 'bodyAttributes' }));
				if (!hasSpread) {
					path.node.attributes.unshift(t.jsxSpreadAttribute(t.identifier('bodyAttributes')));
					injected = true;
				}
			}
		},
	});

	const output = generate(
		ast,
		{
			/* retain lines, formatting */
		},
		code
	).code;
	fs.writeFileSync(filePath, output, 'utf8');
	console.log(`[Zero-UI] ✅ Patched <body> in ${filePath} with {...bodyAttributes}`);
}

module.exports = { extractVariants, parseJsonWithBabel, parseAndUpdatePostcssConfig, parseAndUpdateViteConfig, patchNextBodyTag };
