// src/postcss/resolvers.ts
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { throwCodeFrame } from './ast-parsing.js';
import { generate } from '@babel/generator';
export interface ResolveOpts {
	throwOnFail?: boolean; // default false
	source?: string; // optional; fall back to path.hub.file.code
	hook?: 'stateKey' | 'initialValue' | 'setterFnName'; // default 'stateKey'
}

/**
 * This function will decide which function to call based on the node type
 *
 * 1. String literal
 * 2. Template literal with no expressions
 * 3. Binary expression (a + b)
 * 4. Logical expression (a || b, a ?? b)
 * 5. Identifier bound to local const
 * 6. Template literal with expressions
 * 7. Member expression
 * 8. Optional member expression
 * 9. Everything else is illegal
 * @param node - The node to convert
 * @param path - The path to the node
 * @returns The string literal or null if the node is not a string literal or template literal with no expressions or identifier bound to local const
 */
export function literalFromNode(node: t.Expression, path: NodePath<t.Node>, opts: ResolveOpts): string | null {
	/* ── Fast path via Babel constant-folder ───────────── */
	const ev = fastEval(node, path);
	if (ev.confident && typeof ev.value === 'string') return ev.value;

	// String / template (no ${})
	if (t.isStringLiteral(node)) return node.value;
	if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
		const text = node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
		return text;
	}
	if (t.isBinaryExpression(node) && node.operator === '+') {
		const left = literalFromNode(node.left as t.Expression, path, opts);
		const right = literalFromNode(node.right as t.Expression, path, opts);
		return left !== null && right !== null ? left + right : null;
	}

	/* ── Logical fallback  (a || b ,  a ?? b) ───────────── */
	if (t.isLogicalExpression(node) && (node.operator === '||' || node.operator === '??')) {
		// try left; if it resolves, use it, otherwise fall back to right
		const left = literalFromNode(node.left as t.Expression, path, opts);
		if (left !== null) return left;
		return literalFromNode(node.right as t.Expression, path, opts);
	}

	// Identifier bound to local const (also handles object/array literals
	// via the recursive call inside resolveLocalConstIdentifier)
	const idLit = resolveLocalConstIdentifier(node, path, opts);
	if (idLit !== null) return idLit;

	// Template literal with ${expr} or ${CONSTANT}
	if (t.isTemplateLiteral(node)) {
		return resolveTemplateLiteral(node, path, literalFromNode, opts);
	}

	if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
		//   treat optional-member exactly the same
		return resolveMemberExpression(node as t.MemberExpression, path, literalFromNode, opts);
	}

	return null;
}

/*──────────────────────────────────────────────────────────*\
  fastEval - a fast path to evaluate a node if it is the current visitor path
  ---------------------------
  If the node *is* the current visitor path, we can evaluate directly.

  Returns {confident, value} or {confident: false}
\*──────────────────────────────────────────────────────────*/
export function fastEval(node: t.Expression, path: NodePath<t.Node>) {
	// ❶ If the node *is* the current visitor path, we can evaluate directly.
	if (node === path.node && (path as any).evaluate) {
		return (path as any).evaluate(); // safe, returns {confident, value}
	}

	// ❷ Otherwise try to locate a child-path that wraps `node`.
	//    (Babel exposes .get() only for *named* keys, so we must scan.)
	for (const key of Object.keys(path.node)) {
		const sub = (path as any).get?.(key);
		if (sub?.node === node && sub.evaluate) {
			return sub.evaluate();
		}
	}

	// ❸ Give up → undefined (caller falls back to manual resolver)
	return { confident: false };
}

/*──────────────────────────────────────────────────────────*\
  resolveLocalConstIdentifier
  ---------------------------
  Resolve an **Identifier** node to a *space-free string literal* **only when**

  1. It is bound in the **same file** (Program scope),
  2. Declared with **`const`** (not `let` / `var`),
  3. Initialised to a **string literal** or a **static template literal**,
  4. The final string has **no whitespace** (`/^\S+$/`).

  Anything else (inner-scope `const`, dynamic value, imported binding, spaces)
  ➜ return `null` — the caller will decide whether to throw or keep searching.

  If the binding is *imported*, we delegate to `throwCodeFrame()` so the
  developer gets a consistent, actionable error message.
\*──────────────────────────────────────────────────────────*/
export function resolveLocalConstIdentifier(
	node: t.Expression, // <- widened
	path: NodePath<t.Node>,
	opts: ResolveOpts
): string | null {
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

	let text: string | null = null;

	if (t.isStringLiteral(init)) {
		text = init.value;
	} else if (t.isTemplateLiteral(init)) {
		text = resolveTemplateLiteral(init, binding.path, literalFromNode, opts);
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
  4. Any failure → return `null` so the caller can emit its own error.

  Returned value
  --------------
  • `string`  → safe, space-free literal.  
  • `null`    → invalid (dynamic / contains spaces / unresolved).
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
  resolveMemberExpression - a member expression is an object access like `THEMES.dark` or `THEMES['dark']` or `THEMES.brand.primary`
  -----------------------
  Resolve a **MemberExpression** like `THEMES.dark` or `THEMES['dark']`
  (optionally nested: `THEMES.brand.primary`) to a **space-free string**
  **iff**:

  • The **base identifier** is a top-level `const` **ObjectExpression**  
  • Every hop in the chain exists and is either  
        - another ObjectExpression (→ continue) or  
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
	/** Collect the property chain (deep → shallow) */
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
				const lit = literalFromNode(expr, path, opts);
				if (lit === null)
					throwCodeFrame(
						path,
						path.opts?.filename,
						opts.source ?? path.opts?.source?.code,
						'[Zero-UI] Member expression must resolve to a static space-free string.'
					);

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
			`[Zero-UI] Imports Not Allowed:\n Inline it or alias to a local const first.`
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

	/* ── NEW: bail-out with an explicit error if nothing was found ───────── */
	if (value == null) {
		throwCodeFrame(
			path,
			path.opts?.filename,
			opts.source ?? path.opts?.source?.code,
			`[Zero-UI] '${generate(node).code}' cannot be resolved at build-time.\n` + `Only local, fully-static objects/arrays are supported.`
		);
	}
	/* ─────────────────────────────────────────────────────── */

	/* existing tail logic (unwrap, recurse, return string)… */
	if (t.isTSAsExpression(value)) value = value.expression;

	if (t.isMemberExpression(value)) {
		return resolveMemberExpression(value, path, literalFromNode, opts);
	}

	if (t.isStringLiteral(value)) return value.value;
	if (t.isTemplateLiteral(value)) {
		return resolveTemplateLiteral(value, path, literalFromNode, opts);
	}
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
		if (t.isObjectProperty(p) && !p.computed && t.isIdentifier(p.key) && p.key.name === key) {
			return p.value as t.Expression;
		}
		if (t.isObjectProperty(p) && p.computed && t.isStringLiteral(p.key) && p.key.value === key) {
			return p.value as t.Expression;
		}
	}
	return null;
}
