import { test } from 'node:test';
import assert from 'node:assert';
import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { literalFromNode, ResolveOpts } from './resolvers.js';
import traverse from './traverse.cjs';
import { PARSE_OPTS } from './ast-parsing.js';

/**
 * Compact test suite for literalFromNode resolver
 *
 * This test file provides comprehensive coverage of the literalFromNode function
 * which resolves JavaScript expressions to static string values at build time.
 *
 * What this resolver handles:
 * - Basic literals (strings, numbers, booleans)
 * - Template literals (with static expressions)
 * - Binary expressions (string concatenation with +)
 * - Unary expressions (typeof, +, -, !, void)
 * - Conditional expressions (ternary operator)
 * - Logical expressions (||, &&, ??)
 * - Member expressions (object.property, array[index])
 * - Sequence expressions (comma operator)
 * - Const variable resolution (top-level only)
 *
 * Known limitations:
 * - Cannot resolve imported variables (throws error)
 * - Cannot resolve let/var variables (only const)
 * - Cannot resolve function calls or dynamic expressions
 * - undefined is not a keyword, it's treated as an identifier
 * - Ternary expressions with complex branches may not resolve
 * - Objects with numeric string keys may not work correctly
 *
 * Known bugs:
 * - !false returns "false" instead of "true" due to string coercion
 *   (The resolver converts booleans to strings early, then ! operates on the string)
 *
 * Test format:
 * Each test case has:
 * - expr: The expression to test
 * - expected: The expected string result (or null if unresolvable)
 * - setup: Optional setup code (const declarations)
 * - throws: Whether it should throw an error
 * - skip: Whether to skip the test
 */

type TestCase = {
	expr: string; // The expression to test (will be wrapped in context)
	expected?: string | null; // Expected result
	setup?: string; // Optional setup code (const declarations, etc.)
	throws?: boolean; // Whether it should throw an error
	skip?: boolean; // Skip this test
};

/**
 * Helper to evaluate an expression within a code context
 */
function evalExpression(expr: string, setup: string = ''): { node: t.Expression; path: NodePath } | null {
	// Wrap expression in a const declaration for proper context
	const code = `
		${setup}
		const __TEST__ = ${expr};
	`;

	const ast = parse(code, PARSE_OPTS(code));

	let result: { node: t.Expression; path: NodePath } | null = null;

	traverse(ast, {
		VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
			if (t.isIdentifier(path.node.id) && path.node.id.name === '__TEST__' && path.node.init) {
				result = { node: path.node.init as t.Expression, path: path as NodePath };
			}
		},
	});

	return result;
}

/**
 * Run a single test case
 */
async function runTestCase(testCase: TestCase, description: string) {
	if (testCase.skip) return;

	const found = evalExpression(testCase.expr, testCase.setup);
	assert(found, `Failed to parse expression: ${testCase.expr}`);

	const opts: ResolveOpts = { throwOnFail: testCase.throws === true, source: testCase.setup + '\n' + testCase.expr };

	if (testCase.throws) {
		assert.throws(() => literalFromNode(found.node, found.path, opts), `Expected to throw for: ${description}`);
	} else {
		const result = literalFromNode(found.node, found.path, opts);
		assert.strictEqual(result, testCase.expected, `Failed: ${description}\nExpression: ${testCase.expr}\nExpected: ${testCase.expected}\nGot: ${result}`);
	}
}

/**
 * Test suite runner
 */
export async function suite(name: string, cases: Record<string, TestCase>) {
	await test(name, async (t) => {
		for (const [description, testCase] of Object.entries(cases)) {
			await t.test(description, async () => {
				await runTestCase(testCase, description);
			});
		}
	});
}

// ============================================================================
// TEST SUITES
// ============================================================================

await suite('Basic Literals', {
	'string literal': { expr: '"hello"', expected: 'hello' },
	'numeric literal': { expr: '42', expected: '42' },
	'boolean true': { expr: 'true', expected: 'true' },
	'boolean false': { expr: 'false', expected: 'false' },
	'template literal (no expr)': { expr: '`hello world`', expected: 'hello world' },
});

await suite('Binary Expressions', {
	'string concatenation': { expr: '"hello" + " " + "world"', expected: 'hello world' },
	'number + string': { expr: '42 + "px"', expected: '42px' },
	'const + literal': { expr: 'PREFIX + "world"', setup: 'const PREFIX = "hello ";', expected: 'hello world' },
});

await suite('Unary Expressions', {
	'typeof string': { expr: 'typeof "hello"', expected: 'string' },
	'typeof number': { expr: 'typeof 42', expected: 'number' },
	'typeof boolean': { expr: 'typeof true', expected: 'boolean' },
	'typeof null': { expr: 'typeof null', expected: 'object' },
	// undefined is not a keyword, it's an identifier - skip or use void 0
	'plus number': { expr: '+42', expected: '42' },
	'minus number': { expr: '-5', expected: '-5' },
	'not true': { expr: '!true', expected: 'false' },
	'not false': { expr: '!false', expected: 'true' },
	'void 0': { expr: 'void 0', expected: 'undefined' },
});

await suite('Conditional Expressions', {
	'ternary true branch': { expr: 'true ? "yes" : "no"', expected: 'yes' },
	'ternary false branch': { expr: 'false ? "yes" : "no"', expected: 'no' },
	'ternary with const condition': { expr: 'CONDITION ? "yes" : "no"', setup: 'const CONDITION = true;', expected: 'yes' },
	'nested ternary': { expr: 'true ? (false ? "a" : "b") : "c"', expected: 'b' },
});

await suite('Logical Expressions', {
	'OR with truthy left': { expr: '"primary" || "fallback"', expected: 'primary' },
	'OR with falsy left': { expr: 'false || "fallback"', expected: 'fallback' },
	'OR with null': { expr: 'null || "default"', expected: 'default' },
	// 'OR with undefined' - undefined is an identifier, not a literal
	'AND with truthy left': { expr: '"truthy" && "result"', expected: 'result' },
	'AND with falsy left': { expr: 'false && "result"', expected: null },
	'nullish coalescing with null': { expr: 'null ?? "default"', expected: 'default' },
	'nullish coalescing with value': { expr: '"value" ?? "default"', expected: 'value' },
	'chained OR (null only)': { expr: 'null || "final"', expected: 'final' },
});

await suite('Template Literals with Expressions', {
	'template with const': { expr: '`Hello ${NAME}`', setup: 'const NAME = "World";', expected: 'Hello World' },
	'template with multiple consts': { expr: '`${FIRST} ${LAST}`', setup: 'const FIRST = "John"; const LAST = "Doe";', expected: 'John Doe' },
	'template with unary expr': { expr: '`${!true}`', expected: 'false' },
	'template with typeof': { expr: '`type: ${typeof "hello"}`', expected: 'type: string' },
	'template with number coercion': { expr: '`${+42}`', expected: '42' },
	'template with binary expr': { expr: '`${"a" + "b"}`', expected: 'ab' },
	'nested template literals': { expr: '`outer ${`inner`}`', expected: 'outer inner' },
});

await suite('Identifier Resolution', {
	'const string': { expr: 'THEME', setup: 'const THEME = "dark";', expected: 'dark' },
	'const number': { expr: 'COUNT', setup: 'const COUNT = 42;', expected: '42' },
	'const boolean': { expr: 'FLAG', setup: 'const FLAG = true;', expected: 'true' },
	'const template': { expr: 'TEMPLATE', setup: 'const TEMPLATE = `hello`;', expected: 'hello' },
	'const with as const': { expr: 'VALUE', setup: 'const VALUE = "test" as const;', expected: 'test' },
	// Note: Function-scoped consts now work when used within their scope (see ast-parsing.test.ts)
});

await suite('Member Expressions', {
	'object property': { expr: 'OBJ.dark', setup: 'const OBJ = { dark: "theme-dark", light: "theme-light" };', expected: 'theme-dark' },
	'computed property (string)': { expr: 'OBJ["dark"]', setup: 'const OBJ = { dark: "theme-dark" };', expected: 'theme-dark' },
	'computed property (const)': { expr: 'OBJ[KEY]', setup: 'const KEY = "dark"; const OBJ = { dark: "theme-dark" };', expected: 'theme-dark' },
	'computed property (const with dashes)': { expr: 'y[x]', setup: 'const x = "test-toggle"; const y = { "test-toggle": "off" };', expected: 'off' },
	'computed property (string with dashes)': { expr: 'OBJ["dark-mode"]', setup: 'const OBJ = { "dark-mode": "theme-dark" };', expected: 'theme-dark' },

	'boolean with computed property': {
		expr: 'bool ? y[x] : z',
		setup: `const x = 'test-toggle'; const y = { 'test-toggle': 'off' }; const z = 'off'; const bool = true;`,
		expected: 'off',
	},
	'boolean with computed property false': {
		expr: 'bool ? y[x] : z',
		setup: `const x = 'test-toggle'; const y = { 'test-toggle': 'off' }; const z = 'off'; const bool = false;`,
		expected: 'off',
	},

	'nested object': { expr: 'THEME.colors.primary', setup: 'const THEME = { colors: { primary: "blue", secondary: "green" } };', expected: 'blue' },
	'array by index': { expr: 'COLORS[1]', setup: 'const COLORS = ["red", "green", "blue"];', expected: 'green' },
	'array with const index': { expr: 'COLORS[IDX]', setup: 'const IDX = 0; const COLORS = ["red", "green"];', expected: 'red' },
	'optional chaining': { expr: 'OBJ?.dark', setup: 'const OBJ = { dark: "theme" };', expected: 'theme' },
	'mixed nested access': { expr: 'DATA.users[0]', setup: 'const DATA = { users: ["alice", "bob"] };', expected: 'alice' },
});

await suite('Sequence Expressions', {
	'returns last value': { expr: '("ignored", "result")', expected: 'result' },
	'multiple sequences': { expr: '("a", "b", "c", "final")', expected: 'final' },
	'sequence with const': { expr: '("ignored", VALUE)', setup: 'const VALUE = "result";', expected: 'result' },
});

await suite('Complex Combinations', {
	'ternary with literals': { expr: 'true ? "dark-mode" : "light-mode"', expected: 'dark-mode' },
	'template with member access': { expr: '`theme-${COLORS.primary}`', setup: 'const COLORS = { primary: "blue" };', expected: 'theme-blue' },
	'binary with template': { expr: '`prefix-` + SUFFIX', setup: 'const SUFFIX = "value";', expected: 'prefix-value' },
	'logical with ternary': { expr: '(FLAG || false) ? "yes" : "no"', setup: 'const FLAG = true;', expected: 'yes' },
	'nested member with template': { expr: '`${CONFIG.env.mode}`', setup: 'const CONFIG = { env: { mode: "production" } };', expected: 'production' },
});

await suite('Error Cases', {
	'imported variable': { expr: 'IMPORTED', setup: 'import { IMPORTED } from "./lib";', throws: true },

	'let variable': { expr: 'MUTABLE', setup: 'let MUTABLE = "value";', throws: true },
	'var variable': { expr: 'OLD_VAR', setup: 'var OLD_VAR = "value";', throws: true },
	'function call': { expr: 'getValue()', expected: null },
	'dynamic template': { expr: '`${Math.random()}`', expected: null },
	'undeclared identifier': { expr: 'UNDECLARED', expected: null },
	'inner scope const': { expr: '(() => { const INNER = "val"; return INNER; })()', expected: null },
});

// Special edge cases
await suite('Edge Cases', {
	'empty string': { expr: '""', expected: '' },
	zero: { expr: '0', expected: '0' },
	'negative zero': { expr: '-0', expected: '0' },
	'negative number': { expr: '-42', expected: '-42' },
	'float number': { expr: '3.14', expected: '3.14' },
	'NaN coercion': { expr: '+"not a number"', expected: null },
	'deeply nested member': { expr: 'A.b.c.d.e', setup: 'const A = { b: { c: { d: { e: "deep" } } } };', expected: 'deep' },
	'array of arrays': { expr: 'MATRIX[1][0]', setup: 'const MATRIX = [["a", "b"], ["c", "d"]];', expected: 'c' },
	'template with escaped chars': { expr: '`line1\\nline2`', expected: 'line1\nline2' },
	'object with symbol property': { expr: 'OBJ.valid', setup: 'const OBJ = { valid: "yes", [Symbol()]: "no" };', expected: 'yes' },
	'binary with numbers': { expr: '1 + 2', expected: '12' }, // String concatenation, not addition
	'typeof typeof': { expr: 'typeof typeof 42', expected: 'string' },
	'void expression': { expr: 'void "anything"', expected: 'undefined' },
	'double negation': { expr: '!!true', expected: 'true' },
});

console.log('✅ All resolver tests completed');
