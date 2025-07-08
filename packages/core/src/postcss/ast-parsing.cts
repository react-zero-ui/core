// src/core/postcss/ast-parsing.cts

import { parse } from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import { Binding, NodePath, Node } from '@babel/traverse';
import * as t from '@babel/types';
import { CONFIG } from '../config.cjs';
import { createHash } from 'crypto';
import * as fs from 'fs';
import { literalFromNode, ResolveOpts } from './resolvers.cjs';
import { codeFrameColumns } from '@babel/code-frame';
const traverse = (babelTraverse as any).default;
import { LRUCache as LRU } from 'lru-cache';
import { scanVariantTokens } from './scanner.cjs';

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
/**
 * Convert the harvested variants map to the final output format
 */
export function normalizeVariants(scanned: Map<string, Set<string>>, setters: SetterMeta[], sort = true): VariantData[] {
	// key → initialValue  (may be null)
	const initialMap = new Map(setters.map((s) => [s.stateKey, s.initialValue ?? null]));

	const out: VariantData[] = [];

	// 1️⃣  merge scan-results with initial values
	for (const [key, init] of initialMap) {
		// ensure we have a bucket
		if (!scanned.has(key)) scanned.set(key, new Set());

		if (init) scanned.get(key)!.add(init);
	}

	// 2️⃣  convert to the public shape
	for (const [key, set] of scanned) {
		const values = Array.from(set);
		if (sort) values.sort();

		out.push({ key, values, initialValue: initialMap.get(key) ?? null });
	}

	if (sort) out.sort((a, b) => a.key.localeCompare(b.key));
	return out;
}

// File cache to avoid re-parsing unchanged files
export interface CacheEntry {
	hash: string;
	variants: VariantData[];
}

const fileCache = new LRU<string, CacheEntry>({ max: 5000 });

function keysFrom(setters: SetterMeta[]): Set<string> {
	return new Set(setters.map((s) => s.stateKey)); // already kebab-cased by collectUseUISetters
}

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
		const variants = normalizeVariants(scanVariantTokens(source, keysFrom(setters)), setters);

		// Store with signature for fast future lookups
		fileCache.set(filePath, { hash: sig, variants });
		return variants;
	} catch (error) {
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
		const variants = normalizeVariants(scanVariantTokens(source, keysFrom(setters)), setters);
		console.log('variants extractVariants: ', variants);

		fileCache.set(filePath, { hash, variants });
		return variants;
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
