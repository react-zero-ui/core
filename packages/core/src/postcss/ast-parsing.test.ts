import { test } from 'node:test';
import assert from 'node:assert';
import { collectUseUIHooks, processVariants } from './ast-parsing.js';
import { parse } from '@babel/parser';
import { readFile, runTest } from './test-utilities.js';

test('collectUseUIHooks should collect setters from a component', async () => {
	await runTest(
		{
			'app/boolean-edge-cases.tsx': `
      import { useUI } from '@react-zero-ui/core';

			const featureEnabled = 'feature-enabled';
			const bool = false;

			const theme = ['true'];

export function Component() {
	const [isVisible, setIsVisible] = useUI<'modal-visible', 'false'>('modal-visible', 'false');
	const [isEnabled, setIsEnabled] = useUI<'feature-enabled', 'true'>(bool ?? featureEnabled, theme[0]);
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
			// assert(setters[0].binding !== null, 'binding should not be null');
			assert(setters[0].initialValue === 'false');
			assert(setters[0].stateKey === 'modal-visible');
			assert(setters[0].setterFnName === 'setIsVisible');
			// assert(setters[1].binding !== null, 'binding should not be null');
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
          const [, setTab] = useScopedUI<'tabs', 'first'>(KEY, DEFAULT);
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

test('collectUseUIHooks handles + both hooks', async () => {
	const code = `
    import { useUI, useScopedUI } from '@react-zero-ui/core';
    export function Comp() {
      const [, setTheme] = useUI<'theme', 'dark'>('theme','dark');
      const [, setAcc] = useScopedUI<'accordion', 'closed'>('accordion','closed');
      return <section ref={setAcc.ref} />;
    }
  `;
	const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
	const hooks = collectUseUIHooks(ast, code);
	console.log('hooks: ', hooks);

	assert.equal(hooks.length, 2);
	assert.deepEqual(
		hooks.map((h) => [h.stateKey, h.scope]),
		[
			['theme', 'global'],
			['accordion', 'scoped'],
		]
	);
});

test('collectUseUIHooks NumericLiterals bound to const identifiers', async () => {
	const code = `
    import { useUI, useScopedUI } from '@react-zero-ui/core';
		const T = "true"; const M = { "true": "dark", "false": "light" }; const x = M[T]
    export function Comp() {
      const [, setTheme] = useUI<'theme', 'dark'>('theme', x);
      const [, setAcc] = useScopedUI<'accordion', 'closed'>('accordion','closed');
      return <section ref={setAcc.ref} />;
    }
  `;
	const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
	const hooks = collectUseUIHooks(ast, code);

	assert.equal(hooks.length, 2);
	assert.deepEqual(
		hooks.map((h) => [h.stateKey, h.scope]),
		[
			['theme', 'global'],
			['accordion', 'scoped'],
		]
	);
});
