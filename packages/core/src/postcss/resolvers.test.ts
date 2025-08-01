import { test } from 'node:test';
import assert from 'node:assert';
import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { literalFromNode, resolveLocalConstIdentifier, resolveTemplateLiteral, resolveMemberExpression, ResolveOpts } from './resolvers.js';
import { runTest } from './utilities.js';
import traverse from './traverse.cjs';

/*
Test Coverage:
1. literalFromNode (8 tests)
- String literals
- Template literals without expressions
- Binary string concatenation with +
- Logical OR expressions (||)
- Nullish coalescing (??)
- Identifiers bound to const
- Template literals with expressions
- Non-literal expressions (returns null)
2. resolveLocalConstIdentifier (6 tests)
- Const string literals
- Const template literals
- Non-identifier inputs (returns null)
- Let/var variables (returns null)
- Inner scope const (returns null)
- Imported variables (throws error)
3. resolveTemplateLiteral (4 tests)
- Simple templates without expressions
- Templates with const expressions
- Nested templates
- Dynamic expressions (throws error)
4. resolveMemberExpression (9 tests)
- Simple object property access (THEMES.dark)
- Computed property access (THEMES["dark"])
- Nested object properties (THEMES.brand.primary)
- Array access (COLORS[1])
- Non-existent properties (throws error)
- Imported objects (throws error)
- Optional member expressions (THEMES?.dark)
- Computed property with const variable
- TypeScript as const assertions
*/

// Helper to find a specific expression node
function findExpression(code: string, predicate: (node: t.Node) => boolean): { node: t.Expression; path: NodePath } | null {
	const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

	let result: { node: t.Expression; path: NodePath } | null = null;

	traverse(ast, {
		Expression: {
			enter(path: NodePath<t.Expression>) {
				if (predicate(path.node) && !result) {
					result = { node: path.node, path };
				}
			},
		},
	});

	return result;
}

// Tests for literalFromNode
test('literalFromNode should resolve string literals', async () => {
	await runTest({}, async () => {
		const code = `const x = "hello world";`;
		const found = findExpression(code, (n) => t.isStringLiteral(n) && n.value === 'hello world');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'hello world');
	});
});

test('literalFromNode should resolve template literals with no expressions', async () => {
	await runTest({}, async () => {
		const code = 'const x = `hello world`;';
		const found = findExpression(code, (n) => t.isTemplateLiteral(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'hello world');
	});
});

test('literalFromNode should resolve binary string concatenation', async () => {
	await runTest({}, async () => {
		const code = `const x = "hello" + " " + "world";`;
		const found = findExpression(code, (n) => t.isBinaryExpression(n) && n.operator === '+');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'hello world');
	});
});

test('literalFromNode should resolve logical OR expressions', async () => {
	await runTest({}, async () => {
		const code = `
			const fallback = "default";
			const x = undefined || fallback;
		`;
		const found = findExpression(code, (n) => t.isLogicalExpression(n) && n.operator === '||');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'default');
	});
});

test('literalFromNode should resolve nullish coalescing', async () => {
	await runTest({}, async () => {
		const code = `
			const fallback = "default";
			const x = null ?? fallback;
		`;
		const found = findExpression(code, (n) => t.isLogicalExpression(n) && n.operator === '??');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'default');
	});
});

test('literalFromNode should resolve identifiers bound to const', async () => {
	await runTest({}, async () => {
		const code = `
			const THEME = "dark";
			const x = THEME;
		`;
		const found = findExpression(code, (n) => t.isIdentifier(n) && n.name === 'THEME');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'dark');
	});
});

test('literalFromNode should resolve template literals with expressions', async () => {
	await runTest({}, async () => {
		const code = `
			const prefix = "hello";
			const suffix = "world";
			const x = \`\${prefix} \${suffix}\`;
		`;
		const found = findExpression(code, (n) => t.isTemplateLiteral(n) && n.expressions.length > 0);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'hello world');
	});
});

test('literalFromNode should return null for non-literal expressions', async () => {
	await runTest({}, async () => {
		const code = `const x = someFunction();`;
		const found = findExpression(code, (n) => t.isCallExpression(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, null);
	});
});

// Tests for resolveLocalConstIdentifier
test('resolveLocalConstIdentifier should resolve const string literals', async () => {
	await runTest({}, async () => {
		const code = `
			const THEME = "dark";
			const x = THEME;
		`;
		const found = findExpression(code, (n) => t.isIdentifier(n) && n.name === 'THEME');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveLocalConstIdentifier(found.node, found.path, opts);
		assert.strictEqual(result, 'dark');
	});
});

test('resolveLocalConstIdentifier should resolve const template literals', async () => {
	await runTest({}, async () => {
		const code = `
			const THEME = \`dark\`;
			const x = THEME;
		`;
		const found = findExpression(code, (n) => t.isIdentifier(n) && n.name === 'THEME');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveLocalConstIdentifier(found.node, found.path, opts);
		assert.strictEqual(result, 'dark');
	});
});

test('resolveLocalConstIdentifier should return null for non-identifier', async () => {
	await runTest({}, async () => {
		const code = `const x = "literal";`;
		const found = findExpression(code, (n) => t.isStringLiteral(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveLocalConstIdentifier(found.node, found.path, opts);
		assert.strictEqual(result, null);
	});
});

test('resolveLocalConstIdentifier should return null for let/var variables', async () => {
	await runTest({}, async () => {
		const code = `
			let THEME = "dark";
			const x = THEME;
		`;
		const found = findExpression(code, (n) => t.isIdentifier(n) && n.name === 'THEME');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveLocalConstIdentifier(found.node, found.path, opts);
		assert.strictEqual(result, null);
	});
});

test('resolveLocalConstIdentifier should return null for inner scope const', async () => {
	await runTest({}, async () => {
		const code = `
			function test() {
				const THEME = "dark";
				const x = THEME;
			}
		`;
		const found = findExpression(code, (n) => t.isIdentifier(n) && n.name === 'THEME');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveLocalConstIdentifier(found.node, found.path, opts);
		assert.strictEqual(result, null);
	});
});

test('resolveLocalConstIdentifier should throw for imported variables', async () => {
	await runTest({}, async () => {
		const code = `
			import { THEME } from './constants';
			const x = THEME;
		`;
		const found = findExpression(code, (n) => t.isIdentifier(n) && n.name === 'THEME' && !(n as any).isDeclaration);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code, hook: 'stateKey' };
		assert.throws(() => {
			resolveLocalConstIdentifier(found.node, found.path, opts);
		}, /Cannot use imported variables/);
	});
});

// Tests for resolveTemplateLiteral
test('resolveTemplateLiteral should resolve simple templates', async () => {
	await runTest({}, async () => {
		const code = 'const x = `hello world`;';
		const found = findExpression(code, (n) => t.isTemplateLiteral(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveTemplateLiteral(found.node as t.TemplateLiteral, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'hello world');
	});
});

test('resolveTemplateLiteral should resolve templates with const expressions', async () => {
	await runTest({}, async () => {
		const code = `
			const PREFIX = "hello";
			const SUFFIX = "world";
			const x = \`\${PREFIX} \${SUFFIX}\`;
		`;
		const found = findExpression(code, (n) => t.isTemplateLiteral(n) && n.expressions.length > 0);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveTemplateLiteral(found.node as t.TemplateLiteral, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'hello world');
	});
});

test('resolveTemplateLiteral should handle nested templates', async () => {
	await runTest({}, async () => {
		const code = `
			const inner = "world";
			const x = \`hello \${inner}\`;
		`;
		const found = findExpression(code, (n) => t.isTemplateLiteral(n) && n.expressions.length > 0);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveTemplateLiteral(found.node as t.TemplateLiteral, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'hello world');
	});
});

test('resolveTemplateLiteral should throw for dynamic expressions', async () => {
	await runTest({}, async () => {
		const code = 'const x = `hello ${someFunction()}`;';
		const found = findExpression(code, (n) => t.isTemplateLiteral(n) && n.expressions.length > 0);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		assert.throws(() => {
			resolveTemplateLiteral(found.node as t.TemplateLiteral, found.path, literalFromNode, opts);
		}, /Template literal must resolve to a space-free string./);
	});
});

// Tests for resolveMemberExpression
test('resolveMemberExpression should resolve simple object property', async () => {
	await runTest({}, async () => {
		const code = `
			const THEMES = { dark: "dark-theme", light: "light-theme" };
			const x = THEMES.dark;
		`;
		const found = findExpression(code, (n) => t.isMemberExpression(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveMemberExpression(found.node as t.MemberExpression, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'dark-theme');
	});
});

test('resolveMemberExpression should resolve computed property access', async () => {
	await runTest({}, async () => {
		const code = `
			const THEMES = { dark: "dark-theme", light: "light-theme" };
			const x = THEMES["dark"];
		`;
		const found = findExpression(code, (n) => t.isMemberExpression(n) && n.computed);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveMemberExpression(found.node as t.MemberExpression, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'dark-theme');
	});
});

test('resolveMemberExpression should resolve nested object properties', async () => {
	await runTest({}, async () => {
		const code = `
			const THEMES = { 
				brand: { 
					primary: "blue",
					secondary: "green"
				}
			};
			const x = THEMES.brand.primary;
		`;
		const found = findExpression(code, (n) => t.isMemberExpression(n) && t.isMemberExpression(n.object));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveMemberExpression(found.node as t.MemberExpression, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'blue');
	});
});

test('resolveMemberExpression should resolve array access', async () => {
	await runTest({}, async () => {
		const code = `
			const COLORS = ["red", "green", "blue"];
			const x = COLORS[1];
		`;
		const found = findExpression(code, (n) => t.isMemberExpression(n) && n.computed);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveMemberExpression(found.node as t.MemberExpression, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'green');
	});
});

test('resolveMemberExpression should throw for non-existent properties', async () => {
	await runTest({}, async () => {
		const code = `
			const THEMES = { dark: "dark-theme" };
			const x = THEMES.nonexistent;
		`;
		const found = findExpression(code, (n) => t.isMemberExpression(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		assert.throws(() => {
			resolveMemberExpression(found.node as t.MemberExpression, found.path, literalFromNode, opts);
		}, /cannot be resolved at build-time/);
	});
});

test('resolveMemberExpression should throw for imported objects', async () => {
	await runTest({}, async () => {
		const code = `
			import { THEMES } from './constants';
			const x = THEMES.dark;
		`;
		const found = findExpression(code, (n) => t.isMemberExpression(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		assert.throws(() => {
			resolveMemberExpression(found.node as t.MemberExpression, found.path, literalFromNode, opts);
		}, /Imports Not Allowed/);
	});
});

test('resolveMemberExpression should handle optional member expressions', async () => {
	await runTest({}, async () => {
		const code = `
			const THEMES = { dark: "dark-theme" };
			const x = THEMES?.dark;
		`;
		const found = findExpression(code, (n) => t.isOptionalMemberExpression(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		// Cast to MemberExpression since the function handles both
		const result = resolveMemberExpression(found.node as any, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'dark-theme');
	});
});

test('resolveMemberExpression should handle computed property with const variable', async () => {
	await runTest({}, async () => {
		const code = `
			const KEY = "dark";
			const THEMES = { dark: "dark-theme" };
			const x = THEMES[KEY];
		`;
		const found = findExpression(code, (n) => t.isMemberExpression(n) && n.computed);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveMemberExpression(found.node as t.MemberExpression, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'dark-theme');
	});
});

test('resolveMemberExpression should handle TS as const assertions', async () => {
	await runTest({}, async () => {
		const code = `
			const THEMES = { dark: "dark-theme" } as const;
			const x = THEMES.dark;
		`;
		const found = findExpression(code, (n) => t.isMemberExpression(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = resolveMemberExpression(found.node as t.MemberExpression, found.path, literalFromNode, opts);
		assert.strictEqual(result, 'dark-theme');
	});
});
