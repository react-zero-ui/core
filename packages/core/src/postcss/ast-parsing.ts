// src/core/postcss/ast-parsing.cts
import os from 'os';
import { parse, ParserOptions } from '@babel/parser';
import * as t from '@babel/types';
import { CONFIG } from '../config.js';
import * as fs from 'fs';
import { literalFromNode, ResolveOpts } from './resolvers.js';
import { codeFrameColumns } from '@babel/code-frame';
import { LRUCache as LRU } from 'lru-cache';
import { scanVariantTokens } from './scanner.js';
import { findAllSourceFiles, mapLimit, toKebabCase } from './helpers.js';
import { NodePath, Node } from '@babel/traverse';
import traverse from './traverse.cjs';

const PARSE_OPTS = (f: string): Partial<ParserOptions> => ({
	sourceType: 'module',
	plugins: ['jsx', 'typescript', 'decorators-legacy', 'topLevelAwait'],
	sourceFilename: f,
});

export interface HookMeta {
	/** Babel binding object — use `binding.referencePaths` */
	// binding: Binding;
	/** Variable name (`setTheme`) */
	setterFnName: string;
	/** State key passed to `useUI` (`'theme'`) */
	stateKey: string;
	/** Literal initial value as string, or `null` if non-literal */
	initialValue: string | null;
	/** Whether the hook is scoped to a specific element or global */
	scope: 'global' | 'scoped';
}

/**
 * Collect every `[ value, setterFn ] = useUI('key', 'initial')` in a file.
 * Re-uses `literalFromNode` so **initialArg** can be:
 *   • literal           `'dark'`
 *   • local const       `DARK`
 *   • static template   `` `da${'rk'}` ``
 * Throws if the key is dynamic or if the initial value cannot be
 * reduced to a space-free string.
 */
const ALL_HOOK_NAMES = new Set([CONFIG.HOOK_NAME, CONFIG.LOCAL_HOOK_NAME]);

const OBJ_NAMES = new Set([CONFIG.SSR_HOOK_NAME, CONFIG.SSR_HOOK_NAME_SCOPED]);

export function collectUseUIHooks(ast: t.File, sourceCode: string): HookMeta[] {
	const hooks: HookMeta[] = [];
	/* ---------- cache resolved literals per AST node ---------- */
	const memo = new WeakMap<t.Node, string | null>();

	const optsBase = { throwOnFail: true, source: sourceCode } as ResolveOpts;

	function lit(node: t.Expression, p: NodePath<t.Node>, hook: ResolveOpts['hook']): string | null {
		if (memo.has(node)) return memo.get(node)!;

		// clone instead of mutate
		const localOpts: ResolveOpts = { ...optsBase, hook };

		/**
		 * @param node - The node to convert
		 * @param path - The path to the node
		 * @returns The string literal or null if the node is not a string literal or template literal with no expressions or identifier bound to local const  */
		const value = literalFromNode(node, p, localOpts);

		memo.set(node, value);
		return value;
	}

	traverse(ast, {
		VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
			const { id, init } = path.node;

			// a) must be   const [ , setX ] = <hook>(…)
			if (!t.isArrayPattern(id) || !t.isCallExpression(init)) return;

			// b) callee must be one of our hook names
			if (!(t.isIdentifier(init.callee) && ALL_HOOK_NAMES.has(init.callee.name as any))) return;

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
					`[Zero-UI] State key cannot be resolved at build-time.\n` + `Only local, fully-static strings are supported. - collectUseUIHooks-stateKey`
				);
			}

			// resolve initial value with helpers
			const initialValue = lit(initialArg as t.Expression, path as NodePath<t.Node>, 'initialValue');

			if (initialValue === null) {
				throwCodeFrame(
					initialArg,
					path.opts?.filename,
					sourceCode,
					// TODO add link to docs
					`[Zero-UI] initial value cannot be resolved at build-time.\n` +
						`Only local, fully-static objects/arrays are supported. - collectUseUIHooks-initialValue`
				);
			}

			// const binding = path.scope.getBinding(setterEl.name);
			// if (!binding) {
			// 	throwCodeFrame(path, path.opts?.filename, sourceCode, `[Zero-UI] Could not resolve binding for setter "${setterEl.name}".`);
			// }

			const scope: 'global' | 'scoped' = init.callee.name === CONFIG.HOOK_NAME ? 'global' : 'scoped';

			hooks.push({ setterFnName: setterEl.name, stateKey, initialValue, scope });
		},
		/* ────────────────────────────────────────────────────────────────
    2. NEW: zeroSSR.onClick('key', ['v1','v2'])
    ───────────────────────────────────────────────────────────────── */

		CallExpression(path) {
			const callee = path.node.callee;
			if (
				!t.isMemberExpression(callee) ||
				!t.isIdentifier(callee.object) ||
				!OBJ_NAMES.has(callee.object.name as any) ||
				!t.isIdentifier(callee.property, { name: 'onClick' })
			)
				return;

			const isScoped = callee.object.name === CONFIG.SSR_HOOK_NAME_SCOPED;

			const [keyArg, arrArg] = path.node.arguments;

			/* --- resolve key ------------------------------------------------ */
			const stateKey = lit(keyArg as t.Expression, path, 'stateKey');
			if (stateKey === null) {
				throwCodeFrame(keyArg, path.opts?.filename, sourceCode, `[Zero-UI] zeroSSR.onClick("key"): key must be a fully-static string.`);
			}

			/* --- resolve array of values ----------------------------------- */
			if (!t.isArrayExpression(arrArg)) {
				throwCodeFrame(
					arrArg,
					path.opts?.filename,
					sourceCode,
					`[Zero-UI] zeroSSR.onClick("${stateKey}",[string]): second argument must be a literal string array.`
				);
			}
			const values: string[] = [];
			for (const el of arrArg.elements) {
				const v = lit(el as t.Expression, path, 'initialValue');
				if (v === null) {
					throwCodeFrame(el!, path.opts?.filename, sourceCode, `[Zero-UI] zeroSSR.onClick("${stateKey}",[string]): array values must be static strings.`);
				}
				values.push(v);
			}
			if (values.length === 0) {
				throwCodeFrame(arrArg, path.opts?.filename, sourceCode, `[Zero-UI] zeroSSR.onClick("${stateKey}",[" "]): array cannot be empty.`);
			}

			/* --- push synthetic HookMeta ----------------------------------- */
			hooks.push({
				setterFnName: '_', // placeholder
				stateKey,
				initialValue: values[0], // first element becomes default
				scope: isScoped ? 'scoped' : 'global',
			});
		},
	});
	return hooks;
}

export interface VariantData {
	/** The state key (e.g., 'theme') */
	key: string;
	/** Array of unique values discovered in the file */
	values: string[];
	/** Literal initial value as string, or `null` if non-literal */
	initialValue: string | null;
	/** Whether the variant is global or scoped */
	scope: 'global' | 'scoped';
}

/* ── LRU cache keyed by absolute file path ──────────────────────────── */
interface CacheEntry {
	hash: string; // mtime:size
	hooks: HookMeta[]; // Phase-A result
	tokens: Map<string, Set<string>>; // Phase-B result
}
const fileCache = new LRU<string, CacheEntry>({ max: 1_000 });

/**
 * Clear the global file cache - useful for testing
 */
export function clearCache(): void {
	fileCache.clear();
}

/* ── Main compiler ──────────────────────────────────────────────────── */
export interface ProcessVariantsResult {
	/** Array of deduplicated and sorted variant data */
	finalVariants: VariantData[];
	/** Object mapping data attributes to their initial values for body tag */
	initialGlobalValues: Record<string, string>;
	/** Array of source file paths that were processed */
	sourceFiles: string[];
}

/**
 * Scans all source files for `useUI` hooks and variant tokens.
 * Pass `null` (or omit arg) for a cold build (re-process all files).
 * @param changedFiles - The files that have changed (optional).
 * @returns A promise that resolves to the ProcessVariantsResult.
 */

export async function processVariants(changedFiles: string[] | null = null): Promise<ProcessVariantsResult> {
	const srcFiles = changedFiles ?? findAllSourceFiles();

	/* Phase A — refresh hooks in cache (no token scan yet) */

	// Count the number of CPUs and use 1 less than that for concurrency
	const cpu = Math.max(os.cpus().length - 1, 1);

	// Process files concurrently
	await mapLimit(srcFiles, cpu, async (fp) => {
		const { mtimeMs, size } = fs.statSync(fp);
		const sig = `${mtimeMs}:${size}`;

		// Fast-path: unchanged file
		if (fileCache.get(fp)?.hash === sig) return;

		// Read the file
		const code = fs.readFileSync(fp, 'utf8');

		// AST Parse the file
		const ast = parse(code, PARSE_OPTS(fp));

		// Collect the useUI hooks
		const hooks = collectUseUIHooks(ast, code);

		// Temporarily store empty token map; we'll fill it after we know all keys
		fileCache.set(fp, { hash: sig, hooks, tokens: new Map() });
	});

	/* Phase B — build global key set */
	const keySet = new Set<string>();
	for (const { hooks } of fileCache.values()) hooks.forEach((h) => keySet.add(h.stateKey));

	/* Phase C — ensure every cache entry has up-to-date tokens */
	for (const [fp, entry] of fileCache) {
		// Re-scan if tokens missing OR if keySet now contains keys we didn't scan for
		const needsRescan = entry.tokens.size === 0 || [...keySet].some((k) => !entry.tokens.has(k));

		if (!needsRescan) continue;

		const code = fs.readFileSync(fp, 'utf8'); // cheap: regex only
		entry.tokens = scanVariantTokens(code, keySet);
	}

	/* Phase D — aggregate variant & initial-value maps */
	const variantMap = new Map<string, Set<string>>();
	const initMap = new Map<string, string>();
	const scopeMap = new Map<string, 'global' | 'scoped'>();

	for (const { hooks, tokens } of fileCache.values()) {
		hooks.forEach((h) => {
			/* initial-value aggregation */
			if (h.initialValue) {
				const prev = initMap.get(h.stateKey);
				if (prev && prev !== h.initialValue) {
					throw new Error(`[Zero-UI] Conflicting initial values for '${h.stateKey}': '${prev}' vs '${h.initialValue}'`);
				}
				initMap.set(h.stateKey, h.initialValue);
			}

			/* scope aggregation — always run */
			const prevScope = scopeMap.get(h.stateKey);
			if (prevScope && prevScope !== h.scope) {
				throw new Error(`[Zero-UI] Key "${h.stateKey}" used with both global and scoped hooks.`);
			}
			scopeMap.set(h.stateKey, h.scope);
		});

		// tokens → variantMap
		tokens.forEach((vals, k) => {
			if (!variantMap.has(k)) variantMap.set(k, new Set());
			vals.forEach((v) => variantMap.get(k)!.add(v));
		});
	}

	/* Phase E — final assembly */
	const finalVariants: VariantData[] = [...variantMap]
		.map(([key, set]) => ({ key, values: [...set].sort(), initialValue: initMap.get(key) ?? null, scope: scopeMap.get(key)! }))
		.sort((a, b) => a.key.localeCompare(b.key));

	const initialGlobalValues = Object.fromEntries(
		// only include global variants in the initialGlobalValues object because scoped variants are handled by the component data-attributes
		finalVariants.filter((v) => v.scope === 'global').map((v) => [`data-${toKebabCase(v.key)}`, v.initialValue ?? v.values[0] ?? ''])
	);

	return { finalVariants, initialGlobalValues, sourceFiles: srcFiles };
}

/**
 * @param nodeOrPath - The node or node path to throw the code frame for.
 * @param filename - The filename to include in the code frame.
 * @param source - The source code to include in the code frame.
 * @param msg - The message to include in the code frame.
 * @returns A never value.
 */

export function throwCodeFrame(nodeOrPath: Node | NodePath, filename: string, source: string, msg: string): never {
	// Accept either a raw node or a NodePath
	const node = (nodeOrPath as NodePath).node ?? (nodeOrPath as Node);

	if (!node.loc) throw new Error(msg); // defensive

	const { start, end } = node.loc;
	const header = `${filename ?? ''}:${start.line}:${start.column}\n`;
	const frame = codeFrameColumns(source, { start, end }, { highlightCode: true, linesAbove: 1, linesBelow: 1 });

	throw new Error(`${header}${msg}\n${frame}`);
}
