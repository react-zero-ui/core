// src/experimental/index.ts

type Attrs<V extends string[]> = { readonly 'data-ui': `global:${string}(${string})` } | { readonly 'data-ui': `scoped:${string}(${string})` };

const makeOnClick =
	<T extends string>(scoped: boolean) =>
	<const V extends string[]>(key: T, vals: [...V]): Attrs<V> => {
		if (process.env.NODE_ENV !== 'production') {
			assertKey(key);
			assertVals(vals);
		}
		return { 'data-ui': `${scoped ? 'scoped' : 'global'}:${key}(${vals.join(',')})` } as const;
	};

export const zeroSSR = { onClick: makeOnClick(false) }; // global intent
export const scopedZeroSSR = { onClick: makeOnClick(true) }; // scoped intent

function assertKey(key: string) {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
		throw new Error(`[Zero-UI] key "${key}" must be kebab-case (e.g. theme-mobile)`);
	}
}

function assertVals(vals: string[]) {
	if (vals.length === 0) {
		throw new Error('[Zero-UI] onClick(): value array cannot be empty.');
	}
}
