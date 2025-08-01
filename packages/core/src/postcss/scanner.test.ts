import { test } from 'node:test';
import assert from 'node:assert';
import { scanVariantTokens } from './scanner.js';

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

test('scanVariantTokens', () => {
	const src = `
		<div
					className="theme-three-light:bg-gray-100 theme-three-dark:bg-gray-900 theme-three-dark:text-white"
					data-testid="theme-container-3">
					<button
						type="button"
						onClick={() => setThemeThree((prev) => (prev === 'light' ? 'dark' : 'light'))}
						className="border-2 border-red-500"
						data-testid="theme-toggle-3">
						Toggle Theme 3 (w/ camelCase)
					</button>
					<div className="theme-three-light:bg-gray-100 theme-three-dark:bg-gray-900">
						Theme: <span className="theme-three-dark:block hidden">Dark</span> <span className="theme-three-light:block hidden">Light</span>
					</div>
				</div>
	`;
	// should return theme-three-light, theme-three-dark
	const result = scanVariantTokens(src, new Set(['theme-three']));
	assert.deepStrictEqual(result.get('theme-three'), new Set(['light', 'dark']));
});
