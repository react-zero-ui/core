// src/postcss/resolvers.ts
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { throwCodeFrame } from './ast-parsing.js';
import { generate } from '@babel/generator';

const VERBOSE = false;
export interface ResolveOpts {
	throwOnFail?: boolean; // default false
	source?: string; // optional; fall back to path.hub.file.code
	hook?: 'stateKey' | 'initialValue' | 'setterFnName'; // default 'stateKey'
}

/**
 * Higher up the call tree we verify with typescript that the node resolves to a string literal. and has no whitespace.
 * We just have to resolve it at build time.
 *
 * This function will decide which function to call based on the node type (ALL RESOLVE TO STRINGS)
 * StringLiteral
 * TemplateLiteral (both static and dynamic expressions resolved recursively)
 * Identifier (local const)
 * BinaryExpression (+ operator)
 * UnaryExpression (covers numeric/string coercions and logical negation explicitly)
 * LogicalExpression (||, ??)
 * ConditionalExpression (condition ? expr1 : expr2)
 * ArrayExpression (["a", "b"][index])
 * NumericLiteral (coerced)
 * MemberExpression (static, computed, nested objects/arrays)
 * OptionalMemberExpression (a?.b)
 * ObjectExpression (via MemberExpression chains)
 * BooleanLiteral (handled explicitly by isBooleanLiteral)
 SequenceExpression (already handled explicitly by taking last expression)

 * @param node - The node to convert
 * @param path - The path to the node
 * @returns - The string literal resolved or null
 */
export function literalFromNode(node: t.Expression, path: NodePath<t.Node>, opts: ResolveOpts): string | null {
	// StringLiteral
	if (t.isStringLiteral(node)) return node.value;
	// NumericLiteral - convert numbers to strings
	if (t.isNumericLiteral(node)) return String(node.value);
	// BooleanLiteral returned as string
	if (t.isBooleanLiteral(node)) return String(node.value);
	// TemplateLiteral without ${}
	if (t.isTemplateLiteral(node) && node.expressions.length === 0) return node.quasis[0].value.cooked ?? node.quasis[0].value.raw;

	VERBOSE && console.log('48 -> literalFromNode');

	/* ── Fast path via Babel constant-folder ───────────── */
	const ev = fastEval(node, path);

	if (ev.confident && typeof ev.value === 'string') {
		containsIllegalIdentifiers(node, path, opts); // 👈 throws if invalid
		return ev.value;
	}

	VERBOSE && console.log('58 -> literalFromNode -> ev: ');

	// ConditionalExpression
	if (t.isConditionalExpression(node)) {
		const testResult = fastEval(node.test, path);
		if (testResult.confident) {
			const branch = testResult.value ? node.consequent : node.alternate;
			return literalFromNode(branch as t.Expression, path, opts);
		}
		// If test isn't statically evaluable, return null
		return null;
	}

	VERBOSE && console.log('70 -> literalFromNode');

	// BinaryExpression with + operator
	if (t.isBinaryExpression(node) && node.operator === '+') {
		// Resolve left
		const left = literalFromNode(node.left as t.Expression, path, opts);
		// Resolve right
		const right = literalFromNode(node.right as t.Expression, path, opts);
		return left !== null && right !== null ? left + right : null;
	}

	VERBOSE && console.log('82 -> literalFromNode');

	// SequenceExpression (already handled explicitly by taking last expression)
	if (t.isSequenceExpression(node)) {
		const last = node.expressions.at(-1);
		if (last) return literalFromNode(last, path, opts);
	}

	VERBOSE && console.log('89 -> literalFromNode');

	if (t.isUnaryExpression(node)) {
		const arg = literalFromNode(node.argument as t.Expression, path, opts);
		if (arg === null) return null;

		switch (node.operator) {
			case 'typeof':
				return typeof arg;
			case '+':
				return typeof arg === 'number' || !isNaN(Number(arg)) ? String(+arg) : null;
			case '-':
				return typeof arg === 'number' || !isNaN(Number(arg)) ? String(-arg) : null;
			case '!':
				return String(!arg);
			case 'void':
				return 'undefined';
			default:
				return null;
		}
	}

	VERBOSE && console.log('112 -> literalFromNode');

	/* ── Logical fallback  (a || b ,  a ?? b) ───────────── */
	if (t.isLogicalExpression(node) && (node.operator === '||' || node.operator === '??')) {
		// try left; if it resolves, use it, otherwise fall back to right
		const left = literalFromNode(node.left as t.Expression, path, opts);
		if (left === 'true') return left;
		if (left === 'false' || left === 'undefined' || left === 'null') {
			return literalFromNode(node.right as t.Expression, path, opts);
		}
	}
	if (t.isLogicalExpression(node) && node.operator === '&&') {
		const left = literalFromNode(node.left as t.Expression, path, opts);
		if (left === 'false' || left === 'undefined' || left === 'null') return null;
		if (left === 'true') return literalFromNode(node.right as t.Expression, path, opts);
		if (opts.throwOnFail) {
			throwCodeFrame(path, path.opts?.filename, opts.source ?? path.opts?.source?.code, `[Zero-UI] Logical && expression could not be resolved at build time.`);
		}
	}

	VERBOSE && console.log('122 -> literalFromNode');

	// 	"Is this node an Identifier?"
	// "If yes, can I resolve it to a literal value like a string, number, or boolean?"
	const idLit = resolveLocalConstIdentifier(node, path, opts);
	VERBOSE && console.log('127 -> literalFromNode -> idLit: ', idLit);
	if (idLit !== null) return String(idLit);

	VERBOSE && console.log('130 -> literalFromNode');

	// Template literal with ${expr} or ${CONSTANT}
	if (t.isTemplateLiteral(node)) {
		VERBOSE && console.log('135 -> literalFromNode -> template literal');
		return resolveTemplateLiteral(node, path, literalFromNode, opts);
	}

	VERBOSE && console.log('138 -> literalFromNode');

	if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
		//   treat optional-member exactly the same
		return resolveMemberExpression(node as t.MemberExpression, path, literalFromNode, opts);
	}

	VERBOSE && console.log('END -> literalFromNode', node);

	return null;
}

/*──────────────────────────────────────────────────────────*\
  fastEval - a fast path to evaluate a node if it is the current visitor path
  ---------------------------
  If the node *is* the current visitor path, we can evaluate directly.

  Returns {confident, value} or {confident: false}
\*──────────────────────────────────────────────────────────*/
export function fastEval(node: t.Expression, path: NodePath<t.Node>): { confident: boolean; value?: string } {
	// ❶ If the node *is* the current visitor path, we can evaluate directly.
	if (node === path.node && (path as NodePath<t.Node>).evaluate) {
		return path.evaluate(); // safe, returns {confident, value}
	}

	// ❷ Otherwise try to locate a child-path that wraps `node`.
	//    (Babel exposes .get() only for *named* keys, so we must scan.)
	for (const key of Object.keys(path.node)) {
		const sub = (path as NodePath<t.Node>).get?.(key) as NodePath<t.Node> | undefined;
		if (sub?.node === node && sub?.evaluate) {
			return sub.evaluate();
		}
	}

	// ❸ Give up ➡️ undefined (caller falls back to manual resolver)
	return { confident: false };
}

/*──────────────────────────────────────────────────────────*\
  Resolve an **Identifier** node

  1. It is bound in the **same file** (Program scope),
  2. Declared with **`const`** (not `let` / `var`),
  3. Initialized to a **string literal** or a **static template literal**,

  Anything else (inner-scope `const`, dynamic value, imported binding, spaces)
  ➜ return `null` - the caller will decide whether to throw or keep searching.

  If the binding is *imported*, we delegate to `throwCodeFrame()` so the
  developer gets a consistent, actionable error message.
\*──────────────────────────────────────────────────────────*/
export function resolveLocalConstIdentifier(node: t.Expression, path: NodePath<t.Node>, opts: ResolveOpts): string | number | boolean | null {
	VERBOSE && console.log('resolveLocalConstIdentifier -> 190');
	/* Fast-exit when node isn't an Identifier */
	if (!t.isIdentifier(node)) return null;

	const binding = path.scope.getBinding(node.name);
	if (!binding) return null;

	/* 1. Reject imported bindings */
	if (binding.path.isImportSpecifier() || binding.path.isImportDefaultSpecifier() || binding.path.isImportNamespaceSpecifier()) {
		throwCodeFrame(
			path,
			path.opts?.filename,
			opts.source ?? path.opts?.source?.code,
			`[Zero-UI] Cannot use imported variables. Assign to a local const first.\n` +
				`Example:\n import { ${node.name} } from "./filePath";\n ` +
				`const ${node.name}Local = ${node.name};\n ` +
				`${
					opts.hook === 'stateKey'
						? `useUI(${node.name}Local, initialValue);`
						: opts.hook === 'initialValue'
							? `useUI(stateKey, ${node.name}Local);`
							: opts.hook === 'setterFnName'
								? `setterFunction(${node.name}Local)`
								: ''
				}\n`
		);
	}

	/* 2. Allow only top-level `const` */
	if (!binding.path.isVariableDeclarator() || binding.scope.block.type !== 'Program' || (binding.path.parent as t.VariableDeclaration).kind !== 'const') {
		if ((binding.path.parent as t.VariableDeclaration).kind !== 'const') {
			throwCodeFrame(
				path,
				path.opts?.filename,
				opts.source ?? path.opts?.source?.code,
				`[Zero-UI] Only top-level \`const\` variables are allowed. '${node.name}' is not valid.`
			);
		}
		return null;
	}

	/* 3. Inspect initializer */
	let init = binding.path.node.init;
	if (!init) return null;
	/* unwrap  '... as const'  or  <const>foo  */
	// @ts-expect-error Babel lacks helper for TSConstAssertion
	if (t.isTSAsExpression(init) || t.isTSTypeAssertion(init) || init.type === 'TSConstAssertion') {
		init = (init as any).expression; // step into the real value
	}

	let text: string | number | boolean | null = null;

	if (t.isStringLiteral(init)) {
		text = init.value;
	} else if (t.isTemplateLiteral(init)) {
		text = resolveTemplateLiteral(init, binding.path, literalFromNode, opts);
	} else if (t.isNumericLiteral(init)) {
		const raw = String(init.value);
		if (/^\S+$/.test(raw)) text = raw;
	} else if (t.isBooleanLiteral(init)) {
		text = init.value; // ➡️ 'true' or 'false'
	}

	return text;
}

/*──────────────────────────────────────────────────────────*\
  resolveTemplateLiteral - a template literal is a string literal with ${expr} placeholders
  ----------------------
  Accepts a **TemplateLiteral** node that *may* contain `${}` placeholders
  *and* a NodePath for scope look-ups.

  Rules enforced
  --------------
  1. The *final* resolved string **must have zero whitespace** (`/^\S+$/`).
  2. Each `${expr}` must resolve (via `literalFromNode`) to a **local**
	string literal **without spaces**.
  3. If an expression's binding is *imported*, we delegate to
	`throwCodeFrame`.
  4. Any failure ➡️ return `null` so the caller can emit its own error.

  Returned value
  --------------
  • `string`  ➡️ safe, space-free literal.  
  • `null`    ➡️ invalid (dynamic / contains spaces / unresolved).
\*──────────────────────────────────────────────────────────*/
export function resolveTemplateLiteral(
	node: t.TemplateLiteral,
	path: NodePath,
	literalFromNode: (expr: t.Expression, p: NodePath, opts: ResolveOpts) => string | null,
	opts: ResolveOpts
): string | null {
	let result = '';

	// ── fast path: `` `dark` ``
	if (node.expressions.length === 0) {
		const text = node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
		return text;
	}

	// ── slow path: template with ${}
	for (let i = 0; i < node.quasis.length; i++) {
		// 1. Add quasi piece
		const q = node.quasis[i];
		const text = q.value.cooked ?? q.value.raw;
		if (text == null) return null;
		result += text;

		// 2. Add expression piece (if any)
		const expr = node.expressions[i];
		if (expr) {
			const lit = literalFromNode(expr as t.Expression, path, opts);
			if (lit === null && opts.throwOnFail) {
				throwCodeFrame(path, path.opts?.filename, opts.source ?? path.opts?.source?.code, '[Zero-UI] Template literal must resolve to a space-free string.');
			}
			if (lit === null) return null;
			result += lit;
		}
	}

	return result;
}

/*────────────────────────────────────*\
  Resolve a **MemberExpression** like `THEMES.dark` or `THEMES['dark']`
  (optionally nested: `THEMES.brand.primary`) to a **space-free string**
  **if**:
  • The **base identifier** is a top-level `const` **ObjectExpression**  
  • Every hop in the chain exists and is either  
        - another ObjectExpression (➡️ continue) or  
        - a **StringLiteral** terminal value  
  • All keys are static (`Identifier`, `StringLiteral`, or numeric index on
    an ArrayExpression)  
  • No imported bindings are involved.

  Returns `string` on success, otherwise `null`.  Throws via
  `throwCodeFrame` when the base identifier is imported.

  Re-uses:
    • `resolveTemplateLiteral`  - so a template like THEMES[`da${'rk'}`] would
      work if the inner template is static & space-free.
\*──────────────────────────────────────────────────────────*/
export function resolveMemberExpression(
	node: t.MemberExpression,
	path: NodePath<t.Node>,
	literalFromNode: (expr: t.Expression, p: NodePath, opts: ResolveOpts) => string | null,
	opts: ResolveOpts
): string | null {
	VERBOSE && console.log('resolveMemberExpression -> 352');
	/** Collect the property chain (deep ➡️ shallow) */
	const props: (string | number)[] = [];
	let current: t.Expression | t.PrivateName = node;

	// Walk up until we hit the root Identifier
	while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
		const mem = current as t.MemberExpression; // ← common shape

		if (mem.computed) {
			const expr = mem.property as t.Expression;
			// fast paths …
			if (t.isStringLiteral(expr)) {
				props.unshift(expr.value);
			} else if (t.isNumericLiteral(expr)) {
				props.unshift(expr.value);
			} else {
				const lit = literalFromNode(expr, path, { ...opts, throwOnFail: true });
				if (lit === null) {
					throwCodeFrame(
						path,
						path.opts?.filename,
						opts.source ?? path.opts?.source?.code,
						'[Zero-UI] Member expression must resolve to a static space-free string.\n' + 'only use const identifiers as keys.'
					);
				}
				const num = Number(lit);
				props.unshift(Number.isFinite(num) ? num : lit);
			}
		} else {
			const id = mem.property as t.Identifier;
			props.unshift(id.name);
		}

		current = mem.object;
	}

	/* current should now be the base Identifier */
	if (!t.isIdentifier(current)) return null;

	/* Resolve the base identifier to an in-file const object/array literal */
	const binding = path.scope.getBinding(current.name);
	if (!binding) return null;

	// Imported? -> hard error
	if (binding.path.isImportSpecifier() || binding.path.isImportDefaultSpecifier() || binding.path.isImportNamespaceSpecifier()) {
		throwCodeFrame(
			path,
			path.opts?.filename,
			opts.source ?? path.opts?.source?.code,
			`[Zero-UI] Imported variable: '${current.name}'\n\n` +
				`Imported values cannot be statically resolved at build-time.\n` +
				`➡️ Inline the literal or reassign it manually:\n\n`
		);
	}

	// Must be `const` in Program scope
	if (!binding.path.isVariableDeclarator() || binding.scope.block.type !== 'Program' || (binding.path.parent as t.VariableDeclaration).kind !== 'const') {
		return null;
	}

	let value: t.Expression | null | undefined = binding.path.node.init;

	/* ── walk the collected props ─────────────────────────── */
	for (const key of props) {
		if (t.isTSAsExpression(value)) value = value.expression; // unwrap  …as const

		if (t.isObjectExpression(value)) {
			value = resolveObjectValue(value, String(key));
		} else if (t.isArrayExpression(value) && typeof key === 'number') {
			value = value.elements[key] as t.Expression | null | undefined;
		} else {
			value = null; // chain broke - handled below
			break;
		}
	}

	/* ── bail-out with an explicit error if nothing was found ───────── */
	if (value == null) {
		throwCodeFrame(
			path,
			path.opts?.filename,
			opts.source ?? path.opts?.source?.code,
			`[Zero-UI] '${generate(node).code}' cannot be resolved at build-time.\n` + `Only local, fully-static objects/arrays are supported.`
		);
	}
	/* ─────────────────────────────────────────────────────── */

	/* ── existing unwrap ─ */
	if (t.isTSAsExpression(value)) value = value.expression;

	/* ── recursively resolve nested member expressions ─ */
	if (t.isMemberExpression(value)) {
		return resolveMemberExpression(value, path, literalFromNode, opts);
	}

	/* ── support literals ─ */
	if (t.isStringLiteral(value)) return value.value;
	if (t.isTemplateLiteral(value)) {
		return resolveTemplateLiteral(value, path, literalFromNode, opts);
	}

	/* ── NEW: resolve Identifier bindings recursively ─ */
	if (t.isIdentifier(value)) {
		const idBinding = path.scope.getBinding(value.name);
		if (!idBinding || !idBinding.path.isVariableDeclarator()) return null;
		const resolvedInit = idBinding.path.node.init;
		if (!resolvedInit) return null;
		return literalFromNode(resolvedInit as t.Expression, idBinding.path, opts);
	}
	VERBOSE && console.log('resolveMemberExpression -> 460');
	return null;
}

/*──────────────────────────────────────────────────────────*\
  resolveObjectValue - an object expression is an object like `{ dark: 'theme' }` or nested `{ dark: 'theme', brand: { primary: 'blue' } }`
  -------------
  Helper: given an ObjectExpression, return the value associated with `key`
  when that value is a **StringLiteral** | ObjectExpression | ArrayExpression.
\*──────────────────────────────────────────────────────────*/
function resolveObjectValue(obj: t.ObjectExpression, key: string): t.Expression | null | undefined {
	for (const p of obj.properties) {
		// Matches: { dark: 'theme' } - key = 'dark'
		if (t.isObjectProperty(p) && !p.computed && t.isIdentifier(p.key) && p.key.name === key) {
			return p.value as t.Expression;
		}

		// Matches: { ['dark']: 'theme' } - key = 'dark'
		if (t.isObjectProperty(p) && p.computed && t.isStringLiteral(p.key) && p.key.value === key) {
			return p.value as t.Expression;
		}

		// Matches: { "dark": "theme" } or { "1": "theme" } - key = 'dark' or '1'
		// if (t.isObjectProperty(p) && t.isStringLiteral(p.key) && p.key.value === key) {
		// 	return p.value as t.Expression;
		// }

		// // ✅ New: Matches { 1: "theme" } - key = '1'
		// if (t.isObjectProperty(p) && t.isNumericLiteral(p.key) && String(p.key.value) === key) {
		// 	return p.value as t.Expression;
		// }
	}

	return null;
}

function containsIllegalIdentifiers(node: t.Node, path: NodePath, opts: ResolveOpts): void {
	t.traverseFast(node, (subNode) => {
		if (!t.isIdentifier(subNode)) return;

		const binding = path.scope.getBinding(subNode.name);
		if (!binding) {
			throwCodeFrame(
				path,
				path.opts?.filename,
				opts.source ?? path.opts?.source?.code,
				`[Zero-UI] Undeclared identifier: '${subNode.name}'\n\n` +
					`This variable isn't declared in the current file.\n` +
					`➡️ Only top-level \`const\`s defined in the same file are allowed.`
			);
		}

		if (binding.path.isImportSpecifier() || binding.path.isImportDefaultSpecifier() || binding.path.isImportNamespaceSpecifier()) {
			throwCodeFrame(
				path,
				path.opts?.filename,
				opts.source ?? path.opts?.source?.code,
				`[Zero-UI] Imported variable: '${subNode.name}'\n\n` +
					`Imported values cannot be statically resolved at build-time.\n` +
					`➡️ Inline the literal or reassign it manually:\n\n`
			);
		}

		if (binding.scope.block.type !== 'Program' || (binding.path.parent as t.VariableDeclaration).kind !== 'const') {
			throwCodeFrame(
				path,
				path.opts?.filename,
				opts.source ?? path.opts?.source?.code,
				`[Zero-UI] Invalid scope: '${subNode.name}' is not defined at the top level.\n\n` +
					`➡️ Move this variable to the top of the file, outside any functions or blocks.`
			);
		}
	});
}
