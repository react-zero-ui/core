import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { collectUseUISetters, extractVariants, normalizeVariants } from './ast-parsing.cts';
import { parse } from '@babel/parser';
import { runTest } from '../utilities.ts';

test('collectUseUISetters should collect setters from a component', async () => {
	await runTest(
		{
			'app/boolean-edge-cases.tsx': `
      import { useUI } from '@react-zero-ui/core';

			const featureEnabled = 'feature-enabled';
			const bool = false;

			const theme = ['true'];

export function Component() {
	const [isVisible, setIsVisible] = useUI('modal-visible', 'false');
	const [isEnabled, setIsEnabled] = useUI(bool ?? featureEnabled, theme[0]);
return (
	<div>
		<div
			className="modal-visible-true:block md:feature-enabled-false:hidden">
			Open Modal
		</div>
	</div>
); }`,
		},

		async () => {
			const src = fs.readFileSync('app/boolean-edge-cases.tsx', 'utf8');
			const ast = parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
			const setters = collectUseUISetters(ast, src);
			assert(setters[0].binding !== null);
			assert(setters[0].initialValue === 'false');
			assert(setters[0].stateKey === 'modal-visible');
			assert(setters[0].setterName === 'setIsVisible');
			assert(setters[1].binding !== null);
			assert(setters[1].initialValue === 'true');
			assert(setters[1].stateKey === 'feature-enabled');
			assert(setters[1].setterName === 'setIsEnabled');

			const variants = normalizeVariants(new Map(), setters, false);
			// variants:  [
			//   { key: 'modal-visible', values: [ 'false' ], initialValue: 'false' },
			//   { key: 'feature-enabled', values: [ 'true' ], initialValue: 'true' }
			// ]
			assert(variants.length === 2);
			assert(variants[0].key === 'modal-visible');
			assert(variants[0].values[0] === 'false');
			assert(variants[1].key === 'feature-enabled');
			assert(variants[1].values[0] === 'true');

			const finalVariants = extractVariants('app/boolean-edge-cases.tsx');

			assert(finalVariants[0].key === 'feature-enabled');
			assert(finalVariants[0].values.includes('true'));
			assert(finalVariants[1].key === 'modal-visible');
			assert(finalVariants[1].values.includes('false'));
		}
	);
});
