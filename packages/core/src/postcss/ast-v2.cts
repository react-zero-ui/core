import { parse, parseExpression } from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { CONFIG } from '../config.cjs';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { generate } from '@babel/generator';
import * as fs from 'fs';
import * as path from 'path';
const traverse = (babelTraverse as any).default;

export interface SetterMeta {
	/** Babel binding object — use `binding.referencePaths` in Pass 2 */
	binding: Binding;
	/** Variable name (`setTheme`) */
	setterName: string;
	/** State key passed to `useUI` (`'theme'`) */
	stateKey: string;
	/** Literal initial value as string, or `null` if non-literal */
	initialValue: string | null;
}

/**
 * Check if the file imports useUI (or the configured hook name)
 * @param ast - The parsed AST
 * @returns true if useUI is imported, false otherwise
 */
function hasUseUIImport(ast: t.File): boolean {
	let hasImport = false;

	traverse(ast, {
		ImportDeclaration(path: any) {
			const source = path.node.source.value;

			// Check if importing from @react-zero-ui/core
			if (source === CONFIG.IMPORT_NAME) {
				// Only look for named import: import { useUI } from '...'
				const hasUseUISpecifier = path.node.specifiers.some(
					(spec: any) => t.isImportSpecifier(spec) && t.isIdentifier(spec.imported) && spec.imported.name === CONFIG.HOOK_NAME
				);

				if (hasUseUISpecifier) {
					hasImport = true;
					path.stop(); // Early exit
				}
			}
		},
	});

	return hasImport;
}

/**
 * Collects every `[ staleValue, setterFn ] = useUI('key', 'initial')` in a file.
 * @returns SetterMeta[]
 */
export function collectUseUISetters(ast: t.File): SetterMeta[] {
	const setters: SetterMeta[] = [];

	traverse(ast, {
		VariableDeclarator(path: any) {
			const { id, init } = path.node;

			// Match: const [ , setX ] = useUI(...)
			if (t.isArrayPattern(id) && id.elements.length === 2 && t.isCallExpression(init) && t.isIdentifier(init.callee, { name: CONFIG.HOOK_NAME })) {
				const [, setterEl] = id.elements;
				if (!t.isIdentifier(setterEl)) return; // hole or non-identifier

				// Validate & grab hook args
				const [keyArg, initialArg] = init.arguments;
				if (!t.isStringLiteral(keyArg)) return; // dynamic keys are ignored

				// Since useUI now only accepts strings, validate initial value
				const initialValue = literalToString(initialArg as t.Expression);
				if (initialValue === null) {
					console.error(`[Zero-UI] Non-string initial value found for key "${keyArg.value}". Only string literals are supported.`);
					return;
				}

				setters.push({
					binding: path.scope.getBinding(setterEl.name)!, // never null here
					setterName: setterEl.name,
					stateKey: keyArg.value,
					initialValue,
				});
			}
		},
	});

	return setters;
}

export interface VariantData {
	/** The state key (e.g., 'theme') */
	key: string;
	/** Array of unique values discovered in the file */
	values: string[];
	/** Literal initial value as string, or `null` if non-literal */
	initialValue: string | null;
}

/**
 * Pass 2: Harvest all values from setter calls by examining their reference paths
 * @param setters - Array of SetterMeta from Pass 1
 * @returns Map of stateKey -> Set of discovered values
 */
export function harvestSetterValues(setters: SetterMeta[]): Map<string, Set<string>> {
	const variants = new Map<string, Set<string>>();

	// Initialize with initial values from Pass 1
	for (const setter of setters) {
		if (!variants.has(setter.stateKey)) {
			variants.set(setter.stateKey, new Set());
		}
		if (setter.initialValue) {
			variants.get(setter.stateKey)!.add(setter.initialValue);
		}
	}

	// Examine each setter's reference paths
	for (const setter of setters) {
		const valueSet = variants.get(setter.stateKey)!;

		// Look at every place this setter is referenced
		for (const referencePath of setter.binding.referencePaths) {
			// Check if this reference is being called as a function
			const callPath = findCallExpression(referencePath);
			if (callPath) {
				// Extract values from the first argument of the call
				const firstArg = callPath.node.arguments[0];
				if (firstArg) {
					const extractedValues = extractLiteralsRecursively(firstArg as t.Expression, callPath);
					extractedValues.forEach((value) => valueSet.add(value));
				}
			}
		}
	}

	return variants;
}

/**
 * Check if a reference path is part of a function call
 * Handles: setTheme('dark'), obj.setTheme('dark'), etc.
 */
function findCallExpression(referencePath: NodePath): NodePath<t.CallExpression> | null {
	try {
		const parent = referencePath.parent;

		// Direct call: setTheme('dark')
		if (t.isCallExpression(parent) && parent.callee === referencePath.node) {
			return referencePath.parentPath as NodePath<t.CallExpression>;
		}

		// Member expression call: obj.setTheme('dark')
		if (t.isMemberExpression(parent) && parent.property === referencePath.node) {
			const grandParent = referencePath.parentPath?.parent;
			if (t.isCallExpression(grandParent) && grandParent.callee === parent) {
				return referencePath.parentPath?.parentPath as NodePath<t.CallExpression>;
			}
		}
		console.warn(`[Zero-UI] Failed to find call expression for ${referencePath.node.type} in ${referencePath.opts?.filename}`);

		return null;
	} catch (error) {
		console.warn(`[Zero-UI] Failed to find call expression for ${referencePath.node.type} in ${referencePath.opts?.filename}`);
		return null;
	}
}

/**
 * Recursively extract string literal values from an expression
 * Optimized for common useUI patterns:
 * - Direct strings: 'light', 'dark'
 * - Ternaries: condition ? 'light' : 'dark'
 * - Constants: THEMES.LIGHT
 * - Functions: prev => prev === 'light' ? 'dark' : 'light'
 * - Member expressions: obj.prop, obj.prop.prop, etc.
 */
function extractLiteralsRecursively(node: t.Expression, path: NodePath): string[] {
	const results: string[] = [];

	// Base case: direct literals
	const literal = literalToString(node);
	if (literal !== null) {
		results.push(literal);
		return results;
	}
	try {
		// Ternary: condition ? 'value1' : 'value2'
		if (t.isConditionalExpression(node)) {
			results.push(...extractLiteralsRecursively(node.consequent, path));
			results.push(...extractLiteralsRecursively(node.alternate, path));
		}

		// Logical expressions: a && 'value' || 'default'
		else if (t.isLogicalExpression(node)) {
			results.push(...extractLiteralsRecursively(node.left, path));
			results.push(...extractLiteralsRecursively(node.right, path));
		}

		// Arrow functions: () => 'value' or prev => prev==='a' ? 'b':'a'
		else if (t.isArrowFunctionExpression(node)) {
			if (t.isExpression(node.body)) {
				results.push(...extractLiteralsRecursively(node.body, path));
			} else if (t.isBlockStatement(node.body)) {
				// Look for return statements
				// example: const a = () => 'a' + 'b'
				results.push(...extractFromBlockStatement(node.body, path));
			}
		}

		// Function expressions: function() { return 'value'; }
		else if (t.isFunctionExpression(node)) {
			// example: function() { return 'a' + 'b' }
			results.push(...extractFromBlockStatement(node.body, path));
		}

		// Identifiers: resolve to their values if possible
		else if (t.isIdentifier(node)) {
			const resolved = resolveIdentifier(node, path);
			if (resolved) {
				// example: const a = 'a' + 'b'
				results.push(...extractLiteralsRecursively(resolved, path));
			}
		}

		// Member expressions: SIZES.SMALL, obj.prop, etc.
		else if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
			const objectResolved = resolveIdentifier(node.object as t.Identifier, path);
			if (objectResolved && t.isObjectExpression(objectResolved)) {
				// Look for the property in the object
				const propertyName = node.property.name;
				for (const prop of objectResolved.properties) {
					if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === propertyName) {
						const propertyValue = literalToString(prop.value as t.Expression);
						if (propertyValue !== null) {
							// example: const a = { b: 'c' }
							results.push(propertyValue);
						}
					}
				}
			}
		}

		// Binary expressions: might contain literals in some cases
		else if (t.isBinaryExpression(node)) {
			// Only extract if it's a simple concatenation that might resolve to a literal
			if (node.operator === '+') {
				// example: 'a' + 'b'
				results.push(...extractLiteralsRecursively(node.left as t.Expression, path));
				results.push(...extractLiteralsRecursively(node.right as t.Expression, path));
			}
		}
	} catch (error) {
		console.warn(`[Zero-UI] Failed to extract literals from ${node.type} in ${path?.opts?.filename}`, error);
		return [];
	} finally {
		return results;
	}
}

/**
 * Extract literals from block statements by finding return statements
 */
function extractFromBlockStatement(block: t.BlockStatement, path: NodePath): string[] {
	const results: string[] = [];

	for (const stmt of block.body) {
		if (t.isReturnStatement(stmt) && stmt.argument) {
			results.push(...extractLiteralsRecursively(stmt.argument as t.Expression, path));
		}
	}

	return results;
}

/**
 * Try to resolve an identifier to its value within the current scope
 * @param node - The identifier to resolve
 * @param path - The path to the identifier
 * @returns The value of the identifier, or null if it cannot be resolved
 */
function resolveIdentifier(node: t.Identifier, path: NodePath): t.Expression | null {
	const binding = path.scope.getBinding(node.name);
	if (!binding) return null;

	const bindingPath = binding.path;

	// Variable declarator: const x = 'value'
	if (bindingPath.isVariableDeclarator() && bindingPath.node.init) {
		return bindingPath.node.init as t.Expression;
	}

	// Import specifier: import { THEME_DARK } from './constants'
	if (bindingPath.isImportSpecifier() || bindingPath.isImportDefaultSpecifier()) {
		// For now, we can't easily resolve cross-file imports
		// But we could enhance this later to parse the imported file
		// TODO: Implement this
		return null;
	}

	// Function declaration: function getName() { return 'value'; }
	if (bindingPath.isFunctionDeclaration()) {
		// Could try to extract return values, but that's complex
		// TODO: Implement this
		return null;
	}

	// Try to look at the scope for block-scoped variables
	// that might be defined higher up
	let currentScope = path.scope;
	while (currentScope) {
		const scopeBinding = currentScope.getOwnBinding(node.name);
		if (scopeBinding && scopeBinding.path.isVariableDeclarator() && scopeBinding.path.node.init) {
			return scopeBinding.path.node.init as t.Expression;
		}
		currentScope = currentScope.parent;
	}

	return null;
}

/**
 * Convert string literals to strings (only strings are supported)
 */
function literalToString(node: t.Expression): string | null {
	if (t.isStringLiteral(node)) {
		return node.value;
	}
	if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
		// Simple template literal with no expressions: `hello`
		return node.quasis[0]?.value.cooked || null;
	}
	return null;
}

/**
 * Convert the harvested variants map to the final output format
 */
export function normalizeVariants(variants: Map<string, Set<string>>, setters: SetterMeta[]): VariantData[] {
	const result: VariantData[] = [];

	for (const [stateKey, valueSet] of variants) {
		// Find the initial value from the original setter
		const setter = setters.find((s) => s.stateKey === stateKey);
		const initialValue = setter?.initialValue || null;

		// Sort values for deterministic output
		const sortedValues = Array.from(valueSet).sort();

		result.push({ key: stateKey, values: sortedValues, initialValue });
	}

	// Sort by key for deterministic output
	return result.sort((a, b) => a.key.localeCompare(b.key));
}

// File cache to avoid re-parsing unchanged files
interface CacheEntry {
	hash: string;
	variants: VariantData[];
}

const fileCache = new Map<string, CacheEntry>();

/**
 * Main function: Extract all variant tokens from a JS/TS file
 * @param filePath - Path to the source file
 * @returns Array of variant data objects
 */
export function extractVariants(filePath: string): VariantData[] {
	try {
		// Read and hash the file for caching
		const sourceCode = readFileSync(filePath, 'utf-8');
		const fileHash = createHash('md5').update(sourceCode).digest('hex');

		// Check cache first
		const cached = fileCache.get(filePath);
		if (cached && cached.hash === fileHash) {
			return cached.variants;
		}

		// Parse the file once
		const ast = parse(sourceCode, {
			sourceType: 'module',
			plugins: ['jsx', 'typescript', 'decorators-legacy'],
			allowImportExportEverywhere: true,
			allowReturnOutsideFunction: true,
		});

		// Pass 1: Collect all useUI setters and their initial values
		const setters = collectUseUISetters(ast);

		// Early return if no setters found
		if (setters.length === 0) {
			const result: VariantData[] = [];
			fileCache.set(filePath, { hash: fileHash, variants: result });
			return result;
		}

		// Pass 2: Harvest all values from setter calls
		const variantsMap = harvestSetterValues(setters);

		// Normalize to final format
		const variants = normalizeVariants(variantsMap, setters);

		// Cache and return
		fileCache.set(filePath, { hash: fileHash, variants });
		return variants;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.warn(`[Zero-UI] Failed to parse ${filePath}: ${errorMessage}`);
		console.warn(`[Zero-UI] Ensure useUI calls use string literals only: useUI('key', 'value')`);
		return [];
	}
}

/**
 * Extract variants from multiple files
 * @param filePaths - Array of file paths to analyze
 * @returns Combined and deduplicated variant data
 */
export function extractVariantsFromFiles(filePaths: string[]): VariantData[] {
	const allVariants = new Map<string, Set<string>>();
	const initialValues = new Map<string, string | null>();

	for (const filePath of filePaths) {
		const fileVariants = extractVariants(filePath);

		for (const variant of fileVariants) {
			if (!allVariants.has(variant.key)) {
				allVariants.set(variant.key, new Set());
				initialValues.set(variant.key, variant.initialValue);
			}

			// Merge values
			variant.values.forEach((value) => allVariants.get(variant.key)!.add(value));
		}
	}

	// Convert back to VariantData format
	return Array.from(allVariants.entries())
		.map(([key, valueSet]) => ({ key, values: Array.from(valueSet).sort(), initialValue: initialValues.get(key) || null }))
		.sort((a, b) => a.key.localeCompare(b.key));
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
export function parseAndUpdatePostcssConfig(source: string, zeroUiPlugin: string, isESModule: boolean = false): string | null {
	try {
		const ast = parse(source, { sourceType: 'module', plugins: ['jsonStrings'] });

		let modified = false;

		// Check if Zero-UI plugin already exists
		if (source.includes(zeroUiPlugin)) {
			return source; // Already configured
		}

		traverse(ast, {
			// Handle CommonJS: module.exports = { ... } and exports = { ... }
			AssignmentExpression(path: NodePath<t.AssignmentExpression>) {
				const { left, right } = path.node;

				// Check for module.exports or exports assignment
				const isModuleExports =
					t.isMemberExpression(left) && t.isIdentifier(left.object, { name: 'module' }) && t.isIdentifier(left.property, { name: 'exports' });
				const isExportsAssignment = t.isIdentifier(left, { name: 'exports' });

				if ((isModuleExports || isExportsAssignment) && t.isObjectExpression(right)) {
					const pluginsProperty = right.properties.find(
						(prop): prop is t.ObjectProperty => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'plugins' })
					);

					if (pluginsProperty && t.isExpression(pluginsProperty.value)) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},

			// Handle ES Modules: export default { ... }
			ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
				if (isESModule && t.isObjectExpression(path.node.declaration)) {
					const pluginsProperty = path.node.declaration.properties.find(
						(prop): prop is t.ObjectProperty => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'plugins' })
					);

					if (pluginsProperty && t.isExpression(pluginsProperty.value)) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},

			// Handle: const config = { plugins: ... }; export default config
			VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
				if (isESModule && path.node.init && t.isObjectExpression(path.node.init)) {
					const pluginsProperty = path.node.init.properties.find(
						(prop): prop is t.ObjectProperty => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'plugins' })
					);

					if (pluginsProperty && t.isExpression(pluginsProperty.value)) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},
		});

		if (modified) {
			return generate(ast).code;
		} else {
			console.warn(`[Zero-UI] Failed to automatically modify PostCSS config: ${source}`);
			return null; // Could not automatically modify
		}
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.warn(`[Zero-UI] Failed to parse PostCSS config: ${errorMessage}`);
		return null;
	}
}

/**
 * Helper function to add Zero-UI plugin to plugins configuration
 * Handles both object format {plugin: {}} and array format [plugin]
 */
function addZeroUiToPlugins(pluginsNode: t.Expression, zeroUiPlugin: string): boolean {
	if (t.isObjectExpression(pluginsNode)) {
		// Object format: { 'plugin': {} }
		pluginsNode.properties.unshift(t.objectProperty(t.stringLiteral(zeroUiPlugin), t.objectExpression([])));
		return true;
	} else if (t.isArrayExpression(pluginsNode)) {
		// Array format: ['plugin']
		pluginsNode.elements.unshift(t.stringLiteral(zeroUiPlugin));
		return true;
	}
	return false;
}

/**
 * Helper to create a zeroUI() call AST node
 */
function createZeroUICallNode(): t.CallExpression {
	return t.callExpression(t.identifier('zeroUI'), []);
}

/**
 * Helper to create a zeroUI import AST node
 */
function createZeroUIImportNode(importPath: string): t.ImportDeclaration {
	return t.importDeclaration([t.importDefaultSpecifier(t.identifier('zeroUI'))], t.stringLiteral(importPath));
}

/**
 * Helper to process a plugins array - replaces Tailwind with zeroUI or adds zeroUI
 */
function processPluginsArray(pluginsArray: (t.Expression | t.SpreadElement | null)[]): boolean {
	let tailwindIndex = -1;
	let zeroUIIndex = -1;

	// Find existing plugins
	pluginsArray.forEach((element, index) => {
		if (element && t.isCallExpression(element)) {
			if (t.isIdentifier(element.callee, { name: 'tailwindcss' })) {
				tailwindIndex = index;
			} else if (t.isIdentifier(element.callee, { name: 'zeroUI' })) {
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
function processConfigObject(configObject: t.ObjectExpression): boolean {
	const pluginsProperty = configObject.properties.find(
		(prop): prop is t.ObjectProperty => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'plugins' })
	);

	if (pluginsProperty && t.isArrayExpression(pluginsProperty.value)) {
		// Process existing plugins array
		return processPluginsArray(pluginsProperty.value.elements);
	} else if (!pluginsProperty) {
		// Create new plugins array with zeroUI
		configObject.properties.push(t.objectProperty(t.identifier('plugins'), t.arrayExpression([createZeroUICallNode()])));
		return true;
	}

	return false;
}

/**
 * Helper to add zeroUI import to program
 * Uses the FAANG approach: add at the beginning and let tooling handle organization
 */
function addZeroUIImport(programPath: NodePath<t.Program>, zeroUiPlugin: string): void {
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
export function parseAndUpdateViteConfig(source: string, zeroUiPlugin: string): string | null {
	try {
		// Quick check - if already configured correctly, return original
		const hasZeroUIImport = source.includes(zeroUiPlugin);
		const hasZeroUIPlugin = source.includes('zeroUI()');
		const hasTailwindPlugin = source.includes('@tailwindcss/vite');

		if (hasZeroUIImport && hasZeroUIPlugin && !hasTailwindPlugin) {
			return source;
		}

		const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'importMeta'] });

		let modified = false;

		traverse(ast, {
			Program(path: NodePath<t.Program>) {
				if (!hasZeroUIImport) {
					addZeroUIImport(path, zeroUiPlugin);
					modified = true;
				}
			},

			// Handle both direct export and variable assignment patterns
			CallExpression(path: NodePath<t.CallExpression>) {
				if (t.isIdentifier(path.node.callee, { name: 'defineConfig' }) && path.node.arguments.length > 0 && t.isObjectExpression(path.node.arguments[0])) {
					if (processConfigObject(path.node.arguments[0])) {
						modified = true;
					}
				}
			},

			// Remove Tailwind import if we're replacing it
			ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
				if (path.node.source.value === '@tailwindcss/vite' && hasTailwindPlugin) {
					path.remove();
					modified = true;
				}
			},
		});

		return modified ? generate(ast).code : null;
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.warn(`[Zero-UI] Failed to parse Vite config: ${errorMessage}`);
		return null;
	}
}

function findLayoutWithBody(root = process.cwd()): string[] {
	const matches: string[] = [];
	function walk(dir: string): void {
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

export async function patchNextBodyTag(): Promise<void> {
	const matches = findLayoutWithBody();

	if (matches.length !== 1) {
		console.warn(`[Zero-UI] ⚠️ Found ${matches.length} layout files with <body> tags. ` + `Expected exactly one. Skipping automatic injection.`);
		return;
	}

	const filePath = matches[0];
	const code = fs.readFileSync(filePath, 'utf8');

	// Parse the file into an AST
	const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

	let hasImport = false;
	traverse(ast, {
		ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
			const specifiers = path.node.specifiers;
			const source = path.node.source.value;
			if (source === '@zero-ui/attributes') {
				for (const spec of specifiers) {
					if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported) && spec.imported.name === 'bodyAttributes') {
						hasImport = true;
					}
				}
			}
		},
	});

	traverse(ast, {
		Program(path: NodePath<t.Program>) {
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
		JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
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

/**
 * Parse a tsconfig/jsconfig JSON file using Babel (handles comments, trailing commas)
 */
export function parseJsonWithBabel(source: string): any {
	try {
		const ast = parseExpression(source, { sourceType: 'module', plugins: ['jsonStrings'] });
		// Convert Babel AST back to plain JS object
		return eval(`(${generate(ast).code})`);
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.warn(`[Zero-UI] Failed to parse ${source}: ${errorMessage}`);
		return null;
	}
}
