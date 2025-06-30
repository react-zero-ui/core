import { parse } from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { CONFIG } from '../../config.cjs';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import parser from '@babel/parser';
import { generate } from '@babel/generator';
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

				setters.push({
					binding: path.scope.getBinding(setterEl.name)!, // never null here
					setterName: setterEl.name,
					stateKey: keyArg.value,
					initialValue: literalToString(initialArg as t.Expression),
				});
			}
		},
	});

	return setters;
}

export interface VariantData {
	key: string;
	values: string[];
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

		// Boolean optimization: if initial value is 'true' or 'false',
		// we know all possible values without traversing
		if (setter.initialValue === 'true' || setter.initialValue === 'false') {
			valueSet.add('true');
			valueSet.add('false');
			continue; // Skip traversal for this setter
		}

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

	return null;
}

/**
 * Recursively extract literal values from an expression
 * Handles: literals, ternaries, logical expressions, functions, identifiers
 */
function extractLiteralsRecursively(node: t.Expression, path: NodePath): string[] {
	const results: string[] = [];

	// Base case: direct literals
	const literal = literalToString(node);
	if (literal !== null) {
		results.push(literal);
		return results;
	}

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
			results.push(...extractFromBlockStatement(node.body, path));
		}
	}

	// Function expressions: function() { return 'value'; }
	else if (t.isFunctionExpression(node)) {
		results.push(...extractFromBlockStatement(node.body, path));
	}

	// Identifiers: resolve to their values if possible
	else if (t.isIdentifier(node)) {
		const resolved = resolveIdentifier(node, path);
		if (resolved) {
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
			results.push(...extractLiteralsRecursively(node.left as t.Expression, path));
			results.push(...extractLiteralsRecursively(node.right as t.Expression, path));
		}
	}

	return results;
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
		return null;
	}

	// Function declaration: function getName() { return 'value'; }
	if (bindingPath.isFunctionDeclaration()) {
		// Could try to extract return values, but that's complex
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
 * Convert various literal types to strings
 */
function literalToString(node: t.Expression): string | null {
	if (t.isStringLiteral(node) || t.isNumericLiteral(node)) {
		return String(node.value);
	}
	if (t.isBooleanLiteral(node)) {
		return node.value ? 'true' : 'false';
	}
	if (t.isNullLiteral(node)) {
		return 'null';
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
		console.error(`Error extracting variants from ${filePath}:`, error);
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
