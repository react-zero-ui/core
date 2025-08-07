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

			const feat = 'feature-enabled';
			const bool = false;
			const bool2 = true;
			const feat2 = 'feature-enabled-2';

			const theme = ['true'];

export function Component() {
	const [isVisible, setIsVisible] = useUI<'modal-visible', 'false'>('modal-visible', 'false');
	const [isEnabled, setIsEnabled] = useUI<'feature-enabled', 'true'>(bool ?? feat, theme[0]);
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

			assert(setters[0].initialValue === 'false', 'initialValue should be false');
			assert(setters[0].stateKey === 'modal-visible', 'stateKey should be modal-visible');
			assert(setters[0].setterFnName === 'setIsVisible', 'setterFnName should be setIsVisible');

			assert(setters[1].initialValue === 'true', 'initialValue should be true');
			assert(setters[1].stateKey === 'feature-enabled', 'stateKey should be feature-enabled');
			assert(setters[1].setterFnName === 'setIsEnabled', 'setterFnName should be setIsEnabled');

			const { finalVariants } = await processVariants(['app/boolean-edge-cases.tsx']);
			assert(finalVariants[0].key === 'feature-enabled', 'key should be feature-enabled');
			assert(finalVariants[0].values.includes('false'), 'values should include false');
			assert(finalVariants[0].initialValue === 'true', 'initialValue should be true');
			assert(finalVariants[1].key === 'modal-visible', 'key should be modal-visible');
			assert(finalVariants[1].values.includes('true'), 'values should include true');
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
      const [, setThemeM] = useUI<'light' | 'dark'>('theme-m', x);
       return <section ref={setAcc.ref} />;
    }
  `;
	const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

	assert.throws(() => {
		collectUseUIHooks(ast, code);
	}, /Only local, fully-static/i);
});

test('collectUseUIHooks should Resolve Logical Expressions &&', async () => {
	const code = `
    import { useUI, useScopedUI } from '@react-zero-ui/core';

		const bool2 = true;
		const feat2 = 'feature-enabled-2';

    export function Comp() {
     	const [isEnabled2, setIsEnabled2] = useUI<'feature-enabled-2', 'true'>(bool2 && feat2, 'dark');

    }
  `;
	const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
	const hooks = collectUseUIHooks(ast, code);

	assert.equal(hooks.length, 1);
	assert.equal(hooks[0].stateKey, 'feature-enabled-2', 'stateKey should be feature-enabled-2');
	assert.equal(hooks[0].initialValue, 'dark', 'initialValue should be true');
});

test('collectUseUIHooks should resolve function-scoped const variables', async () => {
	const code = `
import { useUI } from '@react-zero-ui/core';

export const Dashboard: React.FC = () => {
	const theme = 'theme-test';
	const themeValues = ['dark', 'light'];
	const [theme2, setTheme2] = useUI(theme, themeValues[0]);
	return (
		<div >
		</div>
	);
};
  `;
	const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
	const hooks = collectUseUIHooks(ast, code);

	assert.equal(hooks.length, 1);
	assert.equal(hooks[0].stateKey, 'theme-test', 'stateKey should be theme-test');
	assert.equal(hooks[0].initialValue, 'dark', 'initialValue should be dark');
	assert.equal(hooks[0].setterFnName, 'setTheme2', 'setterFnName should be setTheme2');
});
