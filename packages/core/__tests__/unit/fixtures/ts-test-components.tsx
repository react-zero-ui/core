/* eslint-disable import/no-unresolved */

// @ts-ignore
import { useUI } from '@zero-ui/core';

/*───────────────────────────────────────────┐
│  Top-level local constants (legal sources) │
└───────────────────────────────────────────*/
const DARK = 'dark' as const;
const PREFIX = `th-${DARK}` as const;
const SIZES = { small: 'sm', large: 'lg' } as const;
const MODES = ['auto', 'manual'] as const;

const COLORS = { primary: 'blue', secondary: 'green' } as const;
const VARIANTS = { dark: `th-${DARK}`, light: COLORS.primary } as const;

/*───────────────────────────────────────────┐
│  Component covering every legal pattern   │
└───────────────────────────────────────────*/
export function AllPatternsComponent() {
	/* ① literal */
	const [theme, setTheme] = useUI('theme', 'light');
	/* ② identifier */
	const [altTheme, setAltTheme] = useUI('altTheme', DARK);
	/* ③ static template literal */
	const [variant, setVariant] = useUI('variant', PREFIX);
	/* ④ object-member */
	const [size, setSize] = useUI('size', SIZES.large);
	/* ⑤ array-index */
	const [mode, setMode] = useUI('mode', MODES[0]);
	/* ⑥ nested template + member */
	const [color, setColor] = useUI('color', `bg-${COLORS.primary}`);
	/* ⑦ object-member */
	const [variant2, setVariant2] = useUI('variant', VARIANTS.dark);
	/* ⑧ nested template + member */
	const [variant3, setVariant3] = useUI('variant', `th-${VARIANTS.light}`);
	/* ⑨ BinaryExpression (template + member) */
	const [variant4, setVariant4] = useUI('variant', `th-${VARIANTS.light + '-inverse'}`);
	/* ⑩ BinaryExpression (member + template) */
	const [variant5, setVariant5] = useUI('variant', `${VARIANTS.light}-inverse`);
	/* ⑪ BinaryExpression (member + member) */
	const [variant6, setVariant6] = useUI('variant', `${VARIANTS.light}-${VARIANTS.dark}`);
	/* ⑫ BinaryExpression (template + member) */
	const [variant7, setVariant7] = useUI('variant', `th-${VARIANTS.light}-${VARIANTS.dark}`);
	/* ⑬  Optional-chaining w/ unresolvable member */
	// @ts-ignore
	const [variant8, setVariant8] = useUI('variant', VARIANTS?.light.d ?? 'th-light');
	/* ⑭ nullish-coalesce  */
	const [variant9, setVariant9] = useUI('variant', VARIANTS.light ?? 'th-light');
	/* ⑮  Optional-chaining w/ unresolvable member */
	// @ts-ignore
	const [variant10, setVariant10] = useUI('variant', VARIANTS.light?.primary ?? 'th-light');
	/* ⑯ local const identifier */
	const [variant11, setVariant11] = useUI('variant', VARIANTS['blue']);

	/* ── setters exercised in every allowed style ── */
	const clickHandler = () => {
		/* direct literals */
		setTheme('dark');

		/* identifier */
		setSize(SIZES.small);

		/* template literal */
		setVariant(`th-${DARK}-inverse`);

		/* member expression */
		setColor(COLORS.secondary);

		/* array index */
		setMode(MODES[1]);
	};

	/* conditional toggle with prev-state */
	const toggleAlt = () => setAltTheme((prev: string) => (prev === 'dark' ? 'light' : 'dark'));

	/* logical expression setter */
	useEffect(() => {
		mode === 'auto' && setMode(MODES[1]);
	}, [mode]);

	return (
		<div style={{ padding: 20 }}>
			<button onClick={clickHandler}>Run setters</button>
			<button onClick={toggleAlt}>Toggle alt theme</button>
			<pre>{JSON.stringify({ theme, altTheme, variant, size, mode, color }, null, 2)}</pre>
		</div>
	);
}
