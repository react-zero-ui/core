import traverse from './traverse.cjs';
import { test } from 'node:test';
import assert from 'node:assert';

test('babel traverse wrapper works', () => {
	assert.strictEqual(typeof traverse, 'function');
});
