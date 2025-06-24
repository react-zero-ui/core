import { useCallback } from 'react';



function useUI(key, initialValue) {
	/* ───────────────── DEV-ONLY COLLISION GUARD ───────────────── */
	if (process.env.NODE_ENV !== 'production') {
		// One shared registry per window / Node context
		const registry =
			typeof globalThis !== 'undefined'
				? (globalThis.__zeroKeys ||= new Map())
				: new Map(); // Fallback for exotic SSR envs

		const prev = registry.get(key);
		if (prev !== undefined && prev !== initialValue) {
			console.error(
				`[Zero-UI] duplicate initial values for key "${key}" - ` +
				`first "${prev}", second "${initialValue}". ` +
				`Namespace your key or keep defaults consistent.`
			);
		} else if (prev === undefined) {
			registry.set(key, initialValue);
		}
	}
	/* ───────────────────────────────────────────────────────────── */


	const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
	const setValue = useCallback(
		(valueOrUpdater, { scope } = {}) => {
			if (typeof window === 'undefined') return;
			// Convert kebab-case to camelCase for dataset API

			const target =
				scope && scope.nodeType === 1
					? scope
					: document.body;

			let newValue;
			if (typeof valueOrUpdater === 'function') {
				const parse = v => {
					if (!v) return initialValue;
					switch (typeof initialValue) {
						case 'boolean':
							return v === 'true';
						case 'number': {
							const n = Number(v);
							return isNaN(n) ? initialValue : n;
						}
						default:
							return v;
					}
				};
				newValue = valueOrUpdater(parse(target.dataset[camelKey]));
			} else {
				newValue = valueOrUpdater;
			}

			target.dataset[camelKey] = String(newValue);
		},
		[key]
	);

	return [initialValue, setValue];
}

export { useUI };
export default useUI;
