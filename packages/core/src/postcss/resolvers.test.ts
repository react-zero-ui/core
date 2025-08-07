import { test } from 'node:test';
import assert from 'node:assert';
import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { literalFromNode, resolveLocalConstIdentifier, resolveTemplateLiteral, resolveMemberExpression, ResolveOpts } from './resolvers.js';
import { runTest } from './test-utilities.js';
import traverse from './traverse.cjs';

/*
Test Coverage:
1. literalFromNode 

  LogicalExpressions
  ConditionalExpression
  BinaryExpression
  UnaryExpression
  StringLiteral
  TemplateLiteral
  Identifier
  MemberExpression
	UnaryExpression

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

test('literalFromNode should resolve UnaryExpression that results in a string', async () => {
	await runTest({}, async () => {
		const code = `const x = typeof "hello";`;
		const found = findExpression(
			code,
			(n) => t.isUnaryExpression(n) && n.operator === 'typeof' && t.isStringLiteral(n.argument) && n.argument.value === 'hello'
		);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'string');
	});
});

test('literalFromNode should resolve UnaryExpression coerced in TemplateLiteral', async () => {
	await runTest({}, async () => {
		const code = 'const x = `${!true}`;';
		const found = findExpression(
			code,
			(n) =>
				t.isTemplateLiteral(n) &&
				n.expressions.length === 1 &&
				t.isUnaryExpression(n.expressions[0]) &&
				n.expressions[0].operator === '!' &&
				t.isBooleanLiteral(n.expressions[0].argument) &&
				n.expressions[0].argument.value === true
		);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'false');
	});
});

test('literalFromNode should resolve !false inside TemplateLiteral', async () => {
	await runTest({}, async () => {
		const code = 'const x = `flag is: ${!false}`;';
		const found = findExpression(
			code,
			(n) =>
				t.isTemplateLiteral(n) &&
				n.expressions.length === 1 &&
				t.isUnaryExpression(n.expressions[0]) &&
				n.expressions[0].operator === '!' &&
				t.isBooleanLiteral(n.expressions[0].argument) &&
				n.expressions[0].argument.value === false
		);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'flag is: true');
	});
});

test('literalFromNode should resolve multiple UnaryExpressions inside TemplateLiteral', async () => {
	await runTest({}, async () => {
		const code = 'const x = `${+true}${-2}${typeof null}`;';
		const found = findExpression(
			code,
			(n) =>
				t.isTemplateLiteral(n) &&
				n.expressions.length === 3 &&
				t.isUnaryExpression(n.expressions[0]) &&
				t.isUnaryExpression(n.expressions[1]) &&
				t.isUnaryExpression(n.expressions[2])
		);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, '1-2object');
	});
});

test('literalFromNode should resolve typeof null inside TemplateLiteral', async () => {
	await runTest({}, async () => {
		const code = 'const x = `type: ${typeof null}`;';
		const found = findExpression(
			code,
			(n) => t.isTemplateLiteral(n) && n.expressions.length === 1 && t.isUnaryExpression(n.expressions[0]) && n.expressions[0].operator === 'typeof'
		);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'type: object');
	});
});

test('literalFromNode should resolve !someConst with local const', async () => {
	await runTest({}, async () => {
		const code = `
			const someConst = true;
			const x = \`prefix-\${!someConst}\`;
		`;
		const found = findExpression(
			code,
			(n) =>
				t.isTemplateLiteral(n) &&
				n.expressions.length === 1 &&
				t.isUnaryExpression(n.expressions[0]) &&
				t.isIdentifier(n.expressions[0].argument) &&
				n.expressions[0].operator === '!'
		);
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, 'prefix-false');
	});
});

test('literalFromNode should resolve UnaryExpressions to strings', async () => {
	const cases = [
		{ description: 'typeof "hello"', code: `const x = typeof "hello";`, expected: 'string' },
		{ description: '+42 coerced to string', code: 'const x = `${+42}`;', expected: '42' },
		{ description: '-5 coerced to string', code: 'const x = `${-5}`;', expected: '-5' },
		{ description: '!false coerced to string', code: 'const x = `${!false}`;', expected: 'true' },
		{ description: 'void 0 coerced to string', code: 'const x = `${void 0}`;', expected: 'undefined' },
	];

	await runTest({}, async () => {
		for (const testCase of cases) {
			const { code, expected, description } = testCase;

			const found = findExpression(code, (n) => t.isTemplateLiteral(n) || (t.isUnaryExpression(n) && ['typeof', '+', '-', '!', 'void'].includes(n.operator)));
			assert(found, `Expected expression for: ${description}`);

			const opts: ResolveOpts = { throwOnFail: true, source: code };
			const result = literalFromNode(found.node as t.Expression, found.path, opts);

			assert.strictEqual(result, expected, `Failed: ${description}`);
		}
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

test('literalFromNode should return null or throw on invalid UnaryExpressions', async () => {
	const cases = [
		{ description: 'typeof function call (dynamic)', code: `const x = typeof getValue();`, shouldThrow: false, expectedResult: null },
		{ description: 'typeof runtime identifier (undeclared)', code: `const x = typeof runtimeValue;`, shouldThrow: false, expectedResult: null },
		{ description: '+imported identifier (illegal)', code: `import { value } from './lib.js'; const x = \`\${+value}\`;`, shouldThrow: true },
		{ description: 'Unary ! with non-const identifier', code: `let flag = true; const x = \`\${!flag}\`;`, shouldThrow: false, expectedResult: null },
		{ description: 'typeof Symbol() (non-serializable)', code: `const x = \`\${typeof Symbol()}\`;`, shouldThrow: false, expectedResult: null },
	];

	await runTest({}, async () => {
		for (const testCase of cases) {
			const { code, description, shouldThrow } = testCase;
			const found = findExpression(code, (n) => t.isTemplateLiteral(n) || (t.isUnaryExpression(n) && ['typeof', '+', '-', '!', 'void'].includes(n.operator)));
			assert(found, `Expected expression for: ${description}`);

			const opts: ResolveOpts = { throwOnFail: shouldThrow, source: code };

			let didThrow = false;
			let result: string | null = null;

			try {
				result = literalFromNode(found.node as t.Expression, found.path, opts);
			} catch (e) {
				didThrow = true;
			}

			if (shouldThrow) {
				assert(didThrow, `Expected to throw for: ${description}`);
			} else {
				assert.strictEqual(result, null, `Expected null for: ${description}`);
			}
		}
	});
});

// Conditional Expression
test('literalFromNode should handle ConditionalExpression', async () => {
	await runTest({}, async () => {
		const code = `
			const x = true ? "isTrue" : "isFalse";
		`;
		const found = findExpression(code, (n) => t.isConditionalExpression(n));
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		const result = literalFromNode(found.node as t.ConditionalExpression, found.path, opts);
		assert.strictEqual(result, 'isTrue');
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

test('literalFromNode should resolve various LogicalExpressions to strings', async () => {
	const cases = [
		{ description: 'OR: undefined || "default"', code: `const undef=undefined; const x = undef || "default";`, expected: 'default' },
		{ description: 'OR: "primary" || "fallback"', code: `const x = "primary" || "fallback";`, expected: 'primary' },
		{ description: 'OR: null || undefined || "final"', code: `const n=null; const undef=undefined; const x = n || undef || "final";`, expected: 'final' },
		{ description: 'OR: null || fallback identifier', code: `const fallback = "default"; const x = null || fallback;`, expected: 'default' },
		{ description: 'OR: null || fallback identifier', code: `const fallback = "default"; const x = null || fallback;`, expected: 'default' },
		{ description: 'AND: "truthy" && "final"', code: `const x = "truthy" && "final";`, expected: 'final' },
		{ description: 'Nullish: null ?? "default"', code: `const x = null ?? "default";`, expected: 'default' },
		{ description: 'Nullish: "set" ?? "default"', code: `const x = "set" ?? "default";`, expected: 'set' },
	];

	await runTest({}, async () => {
		for (const testCase of cases) {
			const { code, expected, description } = testCase;

			const found = findExpression(code, (n) => t.isLogicalExpression(n));
			assert(found, `Expected to find LogicalExpression in: ${description}`);

			const opts: ResolveOpts = { throwOnFail: true, source: code };
			const result = literalFromNode(found.node, found.path, opts);

			assert.strictEqual(result, expected, `Failed: ${description}`);
		}
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

test('literalFromNode should resolve ArrayExpression values via static index access', async () => {
	const cases = [
		{ description: 'array access with numeric index', code: `const COLORS = ["red", "green", "blue"]; const x = COLORS[1];`, expected: 'green' },
		{ description: 'array access with numeric index', code: `const idx = 0; const COLORS = ["red", "green", "blue"]; const x = COLORS[idx];`, expected: 'red' },
		// { description: 'nested object in array access', code: `const THEMES = [{ name: "light" }, { name: "dark" }]; const x = THEMES[1].name;`, expected: 'dark' },
		// { description: 'template literal inside array', code: 'const VALUES = [`va${"lue"}`]; const x = VALUES[0];', expected: 'value' },
		// { description: 'computed numeric index from const', code: `const IDX = 2; const LIST = ["a", "b", 'c']; const x = LIST[IDX];`, expected: 'c' },
		// { description: 'array inside object', code: `const DATA = { values: ["a", "b", "c"] }; const x = DATA.values[0];`, expected: 'a' },
	];

	await runTest({}, async () => {
		for (const testCase of cases) {
			const { code, description, expected } = testCase;

			const found = findExpression(code, (n) => t.isMemberExpression(n) || t.isOptionalMemberExpression(n));
			assert(found, `Expected MemberExpression for: ${description}`);

			const opts: ResolveOpts = { throwOnFail: true, source: code };
			const result = literalFromNode(found.node as t.Expression, found.path, opts);
			console.log('result: ', result);

			assert.strictEqual(result, expected, `Failed: ${description}`);
		}
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

test('resolveLocalConstIdentifier should throw for let/var variables', async () => {
	await runTest({}, async () => {
		const code = `
			let THEME = "dark";
			const x = THEME;
		`;
		const found = findExpression(code, (n) => t.isIdentifier(n) && n.name === 'THEME');
		assert(found);

		const opts: ResolveOpts = { throwOnFail: true, source: code };
		assert.throws(() => {
			resolveLocalConstIdentifier(found.node, found.path, opts);
		}, /\[Zero-UI]/);
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

test('resolveMemberExpression should handle valid and invalid member expressions', async () => {
	const cases = [
		{
			description: 'simple object property',
			code: `const THEMES = { dark: "dark-theme", light: "light-theme" }; const x = THEMES.dark;`,
			expected: 'dark-theme',
		},
		{
			description: 'computed property access',
			code: `const THEMES = { dark: "dark-theme", light: "light-theme" }; const x = THEMES["dark"];`,
			expected: 'dark-theme',
		},
		{
			description: 'nested object property',
			code: `const THEMES = { brand: { primary: "blue", secondary: "green" } }; const x = THEMES.brand.primary;`,
			expected: 'blue',
		},
		{ description: 'array access by index', code: `const COLORS = ["red", "green", "blue"]; const x = COLORS[1];`, expected: 'green' },
		{ description: 'optional member expression', code: `const THEMES = { dark: "dark-theme" }; const x = THEMES?.dark;`, expected: 'dark-theme' },
		{
			description: 'computed property using const identifier',
			code: `const KEY = "dark"; const THEMES = { dark: "dark-theme" }; const x = THEMES[KEY];`,
			expected: 'dark-theme',
		},
		{ description: 'TypeScript const assertion', code: `const THEMES = { dark: "dark-theme" } as const; const x = THEMES.dark;`, expected: 'dark-theme' },
		{
			description: 'nonexistent property should throw',
			code: `const THEMES = { dark: "dark-theme" }; const x = THEMES.nonexistent;`,
			shouldThrow: /cannot be resolved at build-time/,
		},
		{ description: 'imported object should throw', code: `import { THEMES } from './constants'; const x = THEMES.dark;`, shouldThrow: /Zero-UI/ },
	];

	await runTest({}, async () => {
		for (const testCase of cases) {
			const { description, code, expected, shouldThrow } = testCase;

			const found = findExpression(code, (n) => t.isMemberExpression(n) || t.isOptionalMemberExpression(n));
			assert(found, `Expected member expression for: ${description}`);

			const opts: ResolveOpts = { throwOnFail: true, source: code };

			if (shouldThrow) {
				assert.throws(
					() => {
						resolveMemberExpression(found.node as any, found.path, literalFromNode, opts);
					},
					shouldThrow,
					`Expected error for: ${description}`
				);
			} else {
				const result = resolveMemberExpression(found.node as any, found.path, literalFromNode, opts);
				assert.strictEqual(result, expected, `Failed: ${description}`);
			}
		}
	});
});

test.skip('literalFromNode should resolve NumericLiterals bound to const identifiers', async () => {
	const cases = [
		{ description: 'const binding to numeric literal', code: `const IDX = 2; const x = IDX;`, expected: '2' },
		{ description: 'numeric const as object key', code: `const idx = 1; const M = { "1": "yes", 2: "no" }; const x = M[idx];`, expected: 'yes' },
		{
			description: 'rejected let-bound numeric literal',
			code: `let IDX = 0; const LIST = ["a", "b"]; const x = LIST[IDX];`,
			shouldThrow: /Only top-level `const` variables are allowed/,
		},
	];

	await runTest({}, async () => {
		for (const testCase of cases) {
			const { code, expected, shouldThrow, description } = testCase;

			const found = findExpression(code, (n) => t.isIdentifier(n) || t.isMemberExpression(n) || t.isTemplateLiteral(n));
			assert(found, `Expected expression for: ${description}`);

			const opts: ResolveOpts = { throwOnFail: true, source: code };

			if (shouldThrow) {
				assert.throws(
					() => {
						literalFromNode(found.node as t.Expression, found.path, opts);
					},
					shouldThrow,
					`Expected failure: ${description}`
				);
			} else {
				const result = literalFromNode(found.node as t.Expression, found.path, opts);
				assert.strictEqual(result, expected, `Failed: ${description}`);
			}
		}
	});
});

test.skip('literalFromNode should resolve NumericLiterals bound to const identifiers', async () => {
	const cases = [
		{
			description: 'object access with boolean identifier',
			code: `const T = true; const M = { "true": "yes", "false": "no" }; const x = M[T];`,
			expected: 'yes',
		},
		// { description: 'boolean literal as key', code: `const x = { true: 'yes' }[true];`, expected: 'yes' },
		{ description: 'boolean const used as key', code: `const FLAG = "false"; const x = { true: 'yes', false: 'no' }[FLAG];`, expected: 'no' },
	];

	await runTest({}, async () => {
		for (const testCase of cases) {
			const { code, expected, description } = testCase;
			const found = findExpression(code, (n) => t.isIdentifier(n) || t.isMemberExpression(n) || t.isTemplateLiteral(n));
			assert(found, `Expected expression for: ${description}`);
			const opts: ResolveOpts = { throwOnFail: true, source: code };

			const result = literalFromNode(found.node as t.Expression, found.path, opts);
			assert.strictEqual(result, expected, `Failed: ${description}`);
		}
	});
});

test('literalFromNode should resolve SequenceExpression values', async () => {
	const cases = [
		{ description: 'sequence returns last string literal', code: `const doSomething = () => {}; const x = (doSomething(), "hello");`, expected: 'hello' },
		{ description: 'sequence returns last numeric literal', code: `const doSomething = () => {}; const x = (doSomething(), "42");`, expected: '42' },
	];

	await runTest({}, async () => {
		for (const testCase of cases) {
			const { code, expected, description } = testCase;
			const found = findExpression(code, (n) => t.isSequenceExpression(n));
			assert(found, `Expected expression for: ${description}`);
			const opts: ResolveOpts = { throwOnFail: true, source: code };

			const result = literalFromNode(found.node as t.Expression, found.path, opts);
			assert.strictEqual(result, expected, `Failed: ${description}`);
		}
	});
});
