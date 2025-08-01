// internal.ts

export function makeSetter<T extends string>(key: string, initialValue: T, getTarget: () => HTMLElement) {
	const camelKey = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());

	if (process.env.NODE_ENV !== 'production') {
		if (key.includes(' ') || initialValue.includes(' ')) {
			throw new Error(`[Zero-UI] useUI(key, initialValue); key and initialValue must not contain spaces, got "${key}" and "${initialValue}"`);
		}

		// enforce kebab-case for the key: lowercase letters, digits and single dashes
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
			throw new Error(
				`[Zero-UI] useUI(key, …); key must be kebab-case (e.g. "theme-dark"), got "${key}". ` + `Avoid camelCase or uppercase — they break variant generation.`
			);
		}

		// Validate inputs with helpful error messages
		if (!key || typeof key !== 'string' || key.trim() === '') {
			throw new Error(`useUI(key, initialValue); key must be a non-empty string, got "${key}"`);
		}
		// force string type for initialValue
		if (typeof initialValue !== 'string') {
			throw new Error(`useUI(key, initialValue); initialValue must be or resolve to a string, got "${typeof initialValue}"`);
		}

		if (initialValue === '' || initialValue == null) {
			throw new Error(`useUI(key, initialValue); initialValue cannot be empty string, null, or undefined, got "${initialValue}"`);
		}
		// One shared registry per window / Node context
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const registry = typeof globalThis !== 'undefined' ? ((globalThis as any).__useUIRegistry ||= new Map()) : new Map();

		const prev = registry.get(key);
		// TODO try to add per page error boundaries
		if (prev !== undefined && prev !== initialValue) {
			console.error(
				`[useUI] Inconsistent initial values for key "${key}": ` +
					`expected "${prev}", got "${initialValue}". ` +
					`Use the same initial value everywhere or namespace your keys.`
			);
		} else if (prev === undefined) {
			registry.set(key, initialValue);
		}
	}
	return (valueOrFn: T | ((prev: T) => T)) => {
		// SSR safety: bail out if running on server where window is undefined
		if (typeof window === 'undefined') return;

		const target = getTarget();
		if (process.env.NODE_ENV !== 'production') {
			if (target === null) {
				throw new Error(
					`[Zero-UI] useScopedUI(key, initialValue); targetRef is null. \n` +
						`This is likely due to a missing ref attachment. \n` +
						`Solution: Attach a ref to the component.\n` +
						`Example: <div ref={setValue.ref} />`
				);
			}
		}

		// Write the new value to the data-* attribute
		target.dataset[camelKey] =
			// Check if caller passed an updater function (like React's setState(prev => prev === 'true' ? 'false' : 'true') pattern)
			typeof valueOrFn === 'function'
				? // Call the updater function with the parsed current value - fallback to initial value if not set
					valueOrFn((target.dataset[camelKey] as T) ?? initialValue)
				: // Direct value assignment (no updater function)
					valueOrFn;
	};
}
