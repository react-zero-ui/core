import { test } from 'node:test';
import assert from 'node:assert';
import { scanVariantTokens } from './scanner.cts';

test('scanVariantTokens', () => {
	const src = `
		<div className="modal-visible-true:block md:feature-enabled-false:hidden">
			Open Modal
		</div>
	`;
	// should return modal-visible-true, feature-enabled-false
	const keys = new Set(['modal-visible', 'feature-enabled']);
	const result = scanVariantTokens(src, keys);

	assert.deepStrictEqual(result.get('modal-visible'), new Set(['true']));
	assert.deepStrictEqual(result.get('feature-enabled'), new Set(['false']));
});
