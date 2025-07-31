import { test } from 'node:test';
import assert from 'node:assert';
import { collectUseUIHooks, processVariants } from './ast-parsing.js';
import { parse } from '@babel/parser';
import { readFile, runTest } from '../utilities.js';

test('collectUseUIHooks should collect setters from a component', async () => {
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
			const src = readFile('app/boolean-edge-cases.tsx');
			const ast = parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
			const setters = collectUseUIHooks(ast, src);
			assert(setters[0].binding !== null, 'binding should not be null');
			assert(setters[0].initialValue === 'false');
			assert(setters[0].stateKey === 'modal-visible');
			assert(setters[0].setterFnName === 'setIsVisible');
			assert(setters[1].binding !== null, 'binding should not be null');
			assert(setters[1].initialValue === 'true');
			assert(setters[1].stateKey === 'feature-enabled');
			assert(setters[1].setterFnName === 'setIsEnabled');

			const { finalVariants } = await processVariants(['app/boolean-edge-cases.tsx']);
			assert(finalVariants[0].key === 'feature-enabled');
			assert(finalVariants[0].values.includes('false'));
			assert(finalVariants[0].initialValue === 'true');
			assert(finalVariants[1].key === 'modal-visible');
			assert(finalVariants[1].values.includes('true'));
			assert(finalVariants[1].initialValue === 'false', 'initialValue should be false');
		}
	);
});

test('collectUseUIHooks should resolve const-based args for useScopedUI', async () => {
	await runTest(
		{
			'app/tabs.tsx': `
        import { useScopedUI } from '@react-zero-ui/core';

        const KEY = 'tabs';
        const DEFAULT = 'first';

        export function Tabs() {
          const [, setTab] = useScopedUI(KEY, DEFAULT);
          return <div ref={setTab.ref} />;
        }
      `,
		},
		async () => {
			const src = readFile('app/tabs.tsx');
			const ast = parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
			const [meta] = collectUseUIHooks(ast, src);

			assert.equal(meta.stateKey, 'tabs');
			assert.equal(meta.initialValue, 'first');
			assert.equal(meta.scope, 'scoped');
		}
	);
});
