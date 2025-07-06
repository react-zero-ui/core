// src/core/postcss/ast-v2.cts

import { parse, parseExpression } from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import { Binding, NodePath, Node } from '@babel/traverse';
import * as t from '@babel/types';
import { CONFIG } from '../config.cjs';
import { createHash } from 'crypto';
import { generate } from '@babel/generator';
import * as fs from 'fs';
import * as path from 'path';
import { literalFromNode, ResolveOpts } from './resolvers.cjs';
import { codeFrameColumns } from '@babel/code-frame';
const traverse = (babelTraverse as any).default;
import { LRUCache as LRU } from 'lru-cache';

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

// /**
//  * Check if the file imports useUI (or the configured hook name)
//  * @param ast - The parsed AST
//  * @returns true if useUI is imported, false otherwise
//  */
// function hasUseUIImport(ast: t.File): boolean {
// 	let hasImport = false;

// 	traverse(ast, {
// 		ImportDeclaration(path: any) {
// 			const source = path.node.source.value;

// 			// Check if importing from @react-zero-ui/core
// 			if (source === CONFIG.IMPORT_NAME) {
// 				// Only look for named import: import { useUI } from '...'
// 				const hasUseUISpecifier = path.node.specifiers.some(
// 					(spec: any) => t.isImportSpecifier(spec) && t.isIdentifier(spec.imported) && spec.imported.name === CONFIG.HOOK_NAME
// 				);

// 				if (hasUseUISpecifier) {
// 					hasImport = true;
// 					path.stop(); // Early exit
// 				}
// 			}
// 		},
// 	});

// 	return hasImport;
// }
/**
 * Collect every `[ value, setterFn ] = useUI('key', 'initial')` in a file.
 * Re-uses `literalFromNode` so **initialArg** can be:
 *   • literal           `'dark'`
 *   • local const       `DARK`
 *   • static template   `` `da${'rk'}` ``
 * Throws if the key is dynamic or if the initial value cannot be
 * reduced to a space-free string.
 */
export function collectUseUISetters(ast: t.File, sourceCode: string): SetterMeta[] {
	const setters: SetterMeta[] = [];
	/* ---------- cache resolved literals per AST node ---------- */
	const memo = new WeakMap<t.Node, string | null>();
	const optsBase = { throwOnFail: false, source: sourceCode } as ResolveOpts;

	function lit(node: t.Expression, p: NodePath<t.Node>, hook: ResolveOpts['hook']): string | null {
		if (memo.has(node)) return memo.get(node)!;

		// clone instead of mutate
		const localOpts: ResolveOpts = { ...optsBase, hook };

		const ev = (p as NodePath).evaluate?.();
		const value = ev?.confident && typeof ev.value === 'string' ? ev.value : literalFromNode(node, p, localOpts);

		memo.set(node, value);
		return value;
	}

	traverse(ast, {
		VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
			const { id, init } = path.node;

			// match: const [ , setX ] = useUI(...)
			if (!t.isArrayPattern(id) || !t.isCallExpression(init) || !t.isIdentifier(init.callee, { name: CONFIG.HOOK_NAME })) return;

			if (id.elements.length !== 2) {
				throwCodeFrame(path, path.opts?.filename, sourceCode, `[Zero-UI] useUI() must destructure two values: [value, setterFn].`);
			}

			const [, setterEl] = id.elements;

			if (!setterEl || !t.isIdentifier(setterEl)) {
				throwCodeFrame(path, path.opts?.filename, sourceCode, `[Zero-UI] useUI() setterFn must be a variable name.`);
			}

			const [keyArg, initialArg] = init.arguments;

			// resolve state key with new helpers
			const stateKey = lit(keyArg as t.Expression, path as NodePath<t.Node>, 'stateKey');

			if (stateKey === null) {
				throwCodeFrame(
					keyArg,
					path.opts?.filename,
					sourceCode,
					// TODO add link to docs
					`[Zero-UI] State key cannot be resolved at build-time.\n` + `Only local, fully-static strings are supported. - collectUseUISetters-stateKey`
				);
			}

			// resolve initial value with new helpers
			const initialValue = lit(initialArg as t.Expression, path as NodePath<t.Node>, 'initialValue');

			if (initialValue === null) {
				throwCodeFrame(
					initialArg,
					path.opts?.filename,
					sourceCode,
					// TODO add link to docs
					`[Zero-UI] initial value cannot be resolved at build-time.\n` +
						`Only local, fully-static objects/arrays are supported. - collectUseUISetters-initialValue`
				);
			}

			const binding = path.scope.getBinding(setterEl.name);
			if (!binding) {
				throwCodeFrame(path, path.opts?.filename, sourceCode, `[Zero-UI] Could not resolve binding for setter "${setterEl.name}".`);
			}

			setters.push({ binding, setterName: setterEl.name, stateKey, initialValue });
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
// ────────────────────────────────────────────────────────────
//  Pass 2 – harvest every literal that can possibly flow
//           through a setter call ​setX(...)
// ────────────────────────────────────────────────────────────
export function harvestSetterValues(
	setters: SetterMeta[],
	fileSource: string // for code-frame errors
): Map<string, Set<string>> {
	/* 1 ─ bootstrap with the initial values found in Pass 1 ───────── */
	const variants = new Map<string, Set<string>>();
	for (const { stateKey, initialValue } of setters) {
		if (!variants.has(stateKey)) variants.set(stateKey, new Set());
		if (initialValue) variants.get(stateKey)!.add(initialValue);
	}

	/* 2 ─ one-shot memoised literal resolver ──────────────────────── */
	const memo = new WeakMap<t.Node, string | null>();
	const litOpt = { throwOnFail: false, source: fileSource, hook: 'setterName' } as const;

	const lit = (node: t.Expression, path: NodePath) => {
		if (memo.has(node)) return memo.get(node)!;
		const v = literalFromNode(node, path, litOpt);
		memo.set(node, v);
		return v;
	};

	/* 3 ─ helper: extract every literal hidden in an *expression* ─── */
	function extract(expr: t.Expression, p: NodePath, bucket: Set<string>) {
		/* direct literal / identifier / member / template */
		const vDir = lit(expr, p);
		if (vDir) {
			bucket.add(vDir);
			return;
		}

		/* ternary  cond ? x : y  */
		if (t.isConditionalExpression(expr)) {
			extract(expr.consequent, p, bucket);
			extract(expr.alternate, p, bucket);
			return;
		}

		/* logical  a || b   a ?? b   */
		if (t.isLogicalExpression(expr) && (expr.operator === '||' || expr.operator === '??')) {
			extract(expr.left, p, bucket);
			extract(expr.right, p, bucket);
			return;
		}

		/* binary   'a' + 'b'  (only +) */
		if (t.isBinaryExpression(expr) && expr.operator === '+') {
			extract(expr.left as t.Expression, p, bucket);
			extract(expr.right as t.Expression, p, bucket);
			return;
		}

		/* nothing else produces compile-time strings */
	}

	/* 4 ─ walk every reference (call-site) of each setter ─────────── */
	for (const { binding, stateKey } of setters) {
		const bucket = variants.get(stateKey)!;

		binding.referencePaths.forEach((ref) => {
			const call = ref.parentPath;
			if (!call?.isCallExpression() || call.node.callee !== ref.node) return;

			const arg = call.node.arguments[0] as t.Expression | undefined;
			if (!arg) return;

			/* 4-a ▸ INLINE  () => …   function() {…}  ------------------ */
			if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
				consumeFunctionBody(arg, call, bucket);
				return;
			}

			/* 4-b ▸ IDENTIFIER  setX(toggle)  -------------------------- */
			if (t.isIdentifier(arg)) {
				const bind = call.scope.getBinding(arg.name);
				if (!bind) return; // unresolved → ignore

				// ‼️ imported function ‼️
				if (bind.path.isImportSpecifier() || bind.path.isImportDefaultSpecifier() || bind.path.isImportNamespaceSpecifier()) {
					throwCodeFrame(call, call.opts?.filename, fileSource, `[Zero-UI] Setter functions must be defined locally – ` + `“${arg.name}” is imported.`);
				}

				// variable like  const toggle = () => 'dark'
				if (
					bind.path.isVariableDeclarator() &&
					bind.path.node.init &&
					(t.isArrowFunctionExpression(bind.path.node.init) || t.isFunctionExpression(bind.path.node.init))
				) {
					consumeFunctionBody(bind.path.node.init, bind.path, bucket);
					return;
				}

				// plain identifier that eventually resolves to a literal
				const v = lit(arg, call);
				if (v) bucket.add(v);
				return;
			}

			/* 4-c ▸ everything else (direct literals, ternaries, …) ----- */
			extract(arg, call, bucket);
		});
	}

	return variants;

	/* ───────── local helper ── visits every `return …` ─────────── */
	function consumeFunctionBody(fn: t.ArrowFunctionExpression | t.FunctionExpression, p: NodePath, set: Set<string>) {
		if (t.isBlockStatement(fn.body)) {
			fn.body.body.forEach((stmt) => {
				if (t.isReturnStatement(stmt) && stmt.argument) {
					extract(stmt.argument as t.Expression, p, set);
				}
			});
		} else {
			// concise body  () => expr
			extract(fn.body as t.Expression, p, set);
		}
	}
}

/**
 * Recursively collect every *string literal value* that can be proven at
 * build-time inside `expr` (ternaries, logical fallbacks, arrow & fn bodies …).
 *
 * memo-ized per-node → O(N) over the whole file.
 */
export function gatherLiterals(
	expr: t.Expression,
	path: NodePath<t.Expression>,
	opts: ResolveOpts,
	/** WeakMap cache seeded once per file  */
	memo: WeakMap<t.Node, string[]>
): string[] {
	/* ─── memo fast path ──────────────────────────────── */
	if (memo.has(expr)) return memo.get(expr)!;

	/* ─── confident string via Babel-s partial evaluator ─*/
	const evalRes = path.evaluate?.() ?? { confident: false };
	if (evalRes.confident && typeof evalRes.value === 'string') {
		memo.set(expr, [evalRes.value]);
		return [evalRes.value];
	}

	/* ─── try single-step literal resolver ────────────── */
	const lit = literalFromNode(expr, path, opts);
	if (lit !== null) {
		memo.set(expr, [lit]);
		return [lit];
	}

	/* ─── recursive syntactic cases  ─────────────────────*/
	let out: string[] = [];

	/* 1. a ? b : c */
	if (t.isConditionalExpression(expr)) {
		out = [...gatherLiterals(expr.consequent, path, opts, memo), ...gatherLiterals(expr.alternate, path, opts, memo)];
	} else if (t.isLogicalExpression(expr) && (expr.operator === '||' || expr.operator === '??')) {
		/* 2. a || b   or   a ?? b */
		out = [...gatherLiterals(expr.left, path, opts, memo), ...gatherLiterals(expr.right, path, opts, memo)];
	} else if (t.isBinaryExpression(expr, { operator: '+' })) {
		/* 3. 'a' + 'b'  (pure string concatenation)          */
		const left = gatherLiterals(expr.left as t.Expression, path, opts, memo);
		const right = gatherLiterals(expr.right as t.Expression, path, opts, memo);
		// concat only when each side collapses to exactly ONE literal
		if (left.length === 1 && right.length === 1) {
			out = [left[0] + right[0]];
		}
	} else if ((t.isArrowFunctionExpression(expr) || t.isFunctionExpression(expr)) && expr.body) {
		/* 4. () => 'x'   /   prev => prev==='a'?'b':'a'       */
		const bodies: t.Expression[] = [];

		if (t.isExpression(expr.body)) {
			bodies.push(expr.body);
		} else if (t.isBlockStatement(expr.body)) {
			// every `return <expr>`
			expr.body.body.forEach((stmt) => {
				if (t.isReturnStatement(stmt) && stmt.argument) {
					bodies.push(stmt.argument as t.Expression);
				}
			});
		}

		for (const b of bodies) {
			out.push(...gatherLiterals(b, path, opts, memo));
		}
	} else if (t.isSequenceExpression(expr)) {
		/* 5. SequenceExpression (rare but cheap to support)   */
		expr.expressions.forEach((e) => {
			out.push(...gatherLiterals(e as t.Expression, path, opts, memo));
		});
	}

	/* ─── finalise ───────────────────────────────────────*/
	memo.set(expr, out);
	return out;
}

/**
 * Convert the harvested variants map to the final output format
 */
export function normalizeVariants(variants: Map<string, Set<string>>, setters: SetterMeta[], shouldSort = true): VariantData[] {
	const setterMap = new Map(setters.map((s) => [s.stateKey, s]));
	const result: VariantData[] = [];

	for (const [stateKey, valueSet] of variants) {
		const initialValue = setterMap.get(stateKey)?.initialValue || null;
		const values = Array.from(valueSet);
		if (shouldSort) values.sort();
		result.push({ key: stateKey, values, initialValue });
	}

	if (shouldSort) result.sort((a, b) => a.key.localeCompare(b.key));
	return result;
}

// File cache to avoid re-parsing unchanged files
export interface CacheEntry {
	hash: string;
	variants: VariantData[];
}

const fileCache = new LRU<string, CacheEntry>({ max: 5000 });

export function extractVariants(filePath: string): VariantData[] {
	// console.log(`[CACHE] Checking: ${filePath}`);

	try {
		const { mtimeMs, size } = fs.statSync(filePath);
		const sig = `${mtimeMs}:${size}`;

		const cached = fileCache.get(filePath);
		if (cached && cached.hash === sig) {
			// console.log(`[CACHE] HIT (sig): ${filePath}`);
			return cached.variants; // Fast path: file unchanged
		}

		const source = fs.readFileSync(filePath, 'utf8');
		const hash = createHash('md5').update(source).digest('hex');

		// Fallback: content unchanged despite mtime/size change
		if (cached && cached.hash === hash) {
			// console.log(`[CACHE] HIT (hash): ${filePath}`);
			// Update cache with new sig for next time
			const entry = { hash: sig, variants: cached.variants };
			fileCache.set(filePath, entry);
			return cached.variants;
		}

		// console.log(`[CACHE] MISS: ${filePath} (parsing...)`);
		// Parse the file
		const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript', 'decorators-legacy'], sourceFilename: filePath });

		// Collect useUI setters
		const setters = collectUseUISetters(ast, source);
		if (!setters.length) return [];

		// Normalize variants
		const variants = normalizeVariants(harvestSetterValues(setters, source), setters);

		// Store with signature for fast future lookups
		fileCache.set(filePath, { hash: sig, variants });
		return variants;
	} catch (error) {
		// console.log(`[CACHE] ERROR (fallback): ${filePath}`);
		// Fallback for virtual/non-existent files - use content hash only
		const source = fs.readFileSync(filePath, 'utf8');
		const hash = createHash('md5').update(source).digest('hex');

		const cached = fileCache.get(filePath);
		if (cached && cached.hash === hash) {
			return cached.variants;
		}

		// Parse and cache...
		const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript', 'decorators-legacy'], sourceFilename: filePath });
		const setters = collectUseUISetters(ast, source);
		if (!setters.length) return [];

		// final normalization of variants
		const variants = normalizeVariants(harvestSetterValues(setters, source), setters);

		fileCache.set(filePath, { hash, variants });
		return variants;
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
export function throwCodeFrame(nodeOrPath: Node | NodePath, filename: string, source: string, msg: string): never {
	// Accept either a raw node or a NodePath
	const node = (nodeOrPath as NodePath).node ?? (nodeOrPath as Node);

	if (!node.loc) throw new Error(msg); // defensive

	const { start, end } = node.loc;
	const header = `${filename ?? ''}:${start.line}:${start.column}\n`;
	const frame = codeFrameColumns(source, { start, end }, { highlightCode: true, linesAbove: 1, linesBelow: 1 });

	throw new Error(`${header}${msg}\n${frame}`);
}
