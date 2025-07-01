import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

/*──────────────────────────────────────────────────────────*\
  importedVariableErr
  -------------------
  Centralized error helper: **always** throw the same, actionable message
  whenever we detect a value coming from an *imported* binding.

  Why centralize?
  • We'll call this from `resolveTemplateLiteral`, `literalFromNode`, and the
    setter-value pass — consistency matters.
\*──────────────────────────────────────────────────────────*/
export function importedVariableErr(path: NodePath, ident: t.Identifier): never {
	throw path.buildCodeFrameError(
		`[Zero-UI] "${ident.name}" is imported.  ` +
			'Inline it or alias to a local const first:\n' +
			'  import { theme } from "lib";\n' +
			'  const THEME = theme;\n' +
			'  useUI("theme", THEME);'
	);
}

/*──────────────────────────────────────────────────────────*\
  resolveTemplateLiteral
  ----------------------
  Accepts a **TemplateLiteral** node that *may* contain `${}` placeholders
  *and* a NodePath for scope look-ups.

  Rules enforced
  --------------
  1. The *final* resolved string **must have zero whitespace** (`/^\S+$/`).
  2. Each `${expr}` must resolve (via `literalFromNode`) to a **local**
     string literal **without spaces**.
  3. If an expression's binding is *imported*, we delegate to
      `importedVariableErr`.
  4. Any failure → return `null` so the caller can emit its own error.

  Returned value
  --------------
  • `string`  → safe, space-free literal.  
  • `null`    → invalid (dynamic / contains spaces / unresolved).
\*──────────────────────────────────────────────────────────*/
export function resolveTemplateLiteral(
	node: t.TemplateLiteral,
	path: NodePath,
	literalFromNode: (expr: t.Expression, p: NodePath) => string | null
): string | null {
	let result = '';

	// ── fast path: `` `dark` ``
	if (node.expressions.length === 0) {
		const text = node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
		return text && /^\S+$/.test(text) ? text : null;
	}

	// ── slow path: template with ${}
	for (let i = 0; i < node.quasis.length; i++) {
		// 1. Add quasi piece
		const q = node.quasis[i];
		const text = q.value.cooked ?? q.value.raw;
		if (!text || /\s/.test(text)) return null; // contains space
		result += text;

		// 2. Add expression piece (if any)
		const expr = node.expressions[i];
		if (expr) {
			const lit = literalFromNode(expr as t.Expression, path);
			if (lit === null) return null; // dynamic or invalid

			if (/\s/.test(lit)) return null; // space inside expr literal
			result += lit;
		}
	}

	// Guard: final string still space-free?
	return /^\S+$/.test(result) ? result : null;
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

  If the binding is *imported*, we delegate to `importedVariableErr()` so the
  developer gets a consistent, actionable error message.
\*──────────────────────────────────────────────────────────*/
export function resolveLocalConstIdentifier(
	node: t.Expression, // <- widened
	path: NodePath<t.Node>
): string | null {
	/* Fast-exit when node isn't an Identifier */
	if (!t.isIdentifier(node)) return null;

	const binding = path.scope.getBinding(node.name);
	if (!binding) return null;

	/* 1. Reject imported bindings */
	if (binding.path.isImportSpecifier() || binding.path.isImportDefaultSpecifier() || binding.path.isImportNamespaceSpecifier()) {
		importedVariableErr(path, node); // throws
	}

	/* 2. Allow only top-level `const` */
	if (!binding.path.isVariableDeclarator() || binding.scope.block.type !== 'Program' || (binding.path.parent as t.VariableDeclaration).kind !== 'const') {
		return null;
	}

	/* 3. Inspect initializer */
	const init = binding.path.node.init;
	if (!init) return null;

	let text: string | null = null;

	if (t.isStringLiteral(init)) {
		text = init.value;
	} else if (t.isTemplateLiteral(init)) {
		text = resolveTemplateLiteral(init, binding.path, resolveLocalConstIdentifier);
	}

	/* 4. Final space-free check */
	return text && /^\S+$/.test(text) ? text : null;
}

/**
 * This function will decide which function to call based on the node type
 *
 * 1. String literal
 * 2. Template literal with no expressions
 * 3. Identifier bound to local const
 * 4. Template literal with expressions
 * 5. Everything else is illegal
 * @param node - The node to convert
 * @param path - The path to the node
 * @returns The string literal or null if the node is not a string literal or template literal with no expressions or identifier bound to local const
 */
export function literalFromNode(node: t.Expression, path: NodePath<t.Node>): string | null {
	// String / template (no ${})
	if (t.isStringLiteral(node)) return /^\S+$/.test(node.value) ? node.value : null;
	if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
		const text = node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
		return text && /^\S+$/.test(text) ? text : null;
	}

	// Identifier bound to local const (also handles object/array literals
	// via the recursive call inside resolveLocalConstIdentifier)
	const idLit = resolveLocalConstIdentifier(node, path);
	if (idLit !== null) return idLit;

	// Template literal with ${expr}
	if (t.isTemplateLiteral(node)) {
		return resolveTemplateLiteral(node, path, literalFromNode);
	}

	if (t.isMemberExpression(node)) {
		return resolveMemberExpression(node, path, literalFromNode);
	}

	return null; // everything else is illegal
}

/*────────────────────────────────────*\
  resolveMemberExpression
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
  `importedVariableErr` when the base identifier is imported.

  Re-uses:
    • `resolveTemplateLiteral`  - so a template like THEMES[`da${'rk'}`] would
      work if the inner template is static & space-free.
\*──────────────────────────────────────────────────────────*/
export function resolveMemberExpression(
	node: t.MemberExpression,
	path: NodePath<t.Node>,
	literalFromNode: (expr: t.Expression, p: NodePath) => string | null
): string | null {
	/** Collect the property chain (deep → shallow) */
	const props: (string | number)[] = [];
	let current: t.Expression | t.PrivateName = node;

	// Walk up until we hit the root Identifier
	while (t.isMemberExpression(current)) {
		// ── Step 1: push property key
		if (current.computed) {
			// obj['prop']  or  obj[0]
			if (t.isStringLiteral(current.property)) {
				if (/\s/.test(current.property.value)) return null;
				props.unshift(current.property.value);
			} else if (t.isNumericLiteral(current.property)) {
				props.unshift(current.property.value);
			} else if (t.isTemplateLiteral(current.property)) {
				const lit = resolveTemplateLiteral(current.property, path, literalFromNode);
				if (lit === null) return null;
				props.unshift(lit);
			} else {
				return null; // dynamic key
			}
		} else {
			// obj.prop
			const pn = current.property as t.Identifier;
			props.unshift(pn.name);
			if (/\s/.test(pn.name)) return null;
		}

		current = current.object;
	}

	/* current should now be the base Identifier */
	if (!t.isIdentifier(current)) return null;

	/* Resolve the base identifier to an in-file const object/array literal */
	const binding = path.scope.getBinding(current.name);
	if (!binding) return null;

	// Imported? -> hard error
	if (binding.path.isImportSpecifier() || binding.path.isImportDefaultSpecifier() || binding.path.isImportNamespaceSpecifier()) {
		importedVariableErr(path, current);
	}

	// Must be `const` in Program scope
	if (!binding.path.isVariableDeclarator() || binding.scope.block.type !== 'Program' || (binding.path.parent as t.VariableDeclaration).kind !== 'const') {
		return null;
	}

	let value: t.Expression | null | undefined = binding.path.node.init;

	/* Traverse the collected property chain */
	for (const key of props) {
		if (t.isObjectExpression(value)) {
			const objLit = value;
			value = resolveObjectValue(objLit, String(key));
		} else if (t.isArrayExpression(value) && typeof key === 'number') {
			value = value.elements[key] as t.Expression | null | undefined;
		} else {
			return null; // chain breaks (not an object/array)
		}
		if (!value) return null;
	}

	/* Final value must be a space-free string */
	if (t.isStringLiteral(value)) {
		return /^\S+$/.test(value.value) ? value.value : null;
	}
	if (t.isTemplateLiteral(value)) {
		return resolveTemplateLiteral(value, path, literalFromNode);
	}

	return null; // not a string
}

/*──────────────────────────────────────────────────────────*\
  resolveObjectValue
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
