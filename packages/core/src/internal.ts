// src/internal.ts
import { UIAction } from './index.js';

export const cssVar: unique symbol = Symbol('cssVar');

export function makeSetter<T extends string>(key: string, initialValue: T, getTarget: () => HTMLElement, flag?: typeof cssVar) {
	const camelKey = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
	const isCss = flag === cssVar;
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
	return (valueOrFn: UIAction<T>) => {
		// SSR safety: bail out if running on server where window is undefined
		if (typeof window === 'undefined') return;

		const target = getTarget();

		const prev = isCss ? ((target.style.getPropertyValue(`--${key}`) || initialValue) as T) : ((target.dataset[camelKey] || initialValue) as T);

		const next =
			typeof valueOrFn === 'function'
				? (valueOrFn as (p: T) => T)(prev) //  ← CALL the updater
				: valueOrFn;

		isCss ? target.style.setProperty(`--${key}`, next) : (target.dataset[camelKey] = next);
	};
}
