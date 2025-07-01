import { useCallback, useRef, type RefObject } from 'react';

interface GlobalThis {
	__useUIRegistry?: Map<string, string>;
}

export interface UISetterFn<T extends string = string> {
	(valueOrUpdater: T | ((currentValue: T) => T)): void;
	ref?: RefObject<any> | ((node: HTMLElement | null) => void);
}

function useUI<T extends string = string>(key: string, initialValue: T): [T, UISetterFn<T>] {
	/* ─ DEV-ONLY COLLISION GUARD (removed in production by modern bundlers) ─ */
	if (process.env.NODE_ENV !== 'production') {
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
		const registry = typeof globalThis !== 'undefined' ? ((globalThis as GlobalThis).__useUIRegistry ||= new Map()) : new Map();

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
	/* ───────────────────────────────────────────────────────────── */

	// Create a ref to hold the DOM element that will receive the data-* attributes
	// This allows scoping UI state to specific elements instead of always using document.body
	const scopeRef = useRef<HTMLElement | null>(null);

	/* ─ DEV-ONLY MULTIPLE REF GUARD (removed in production by modern bundlers) ─ */
	const refAttachCount = process.env.NODE_ENV !== 'production' ? useRef(0) : null;
	/* ─────────────────────────────────────────────────────────────────────── */

	// Convert kebab-case key to camelCase for dataset property access
	// e.g., "my-key" becomes "myKey" since dataset auto-lowercases after dashes
	const camelKey = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());

	// Memoized setter function that updates data-* attributes on the target element
	// useCallback prevents recreation on every render, essential for useEffect dependencies
	const setValue: UISetterFn<T> = useCallback(
		(valueOrUpdater: T | ((currentValue: T) => T)) => {
			// SSR safety: bail out if running on server where window is undefined
			if (typeof window === 'undefined') return;

			// Use the scoped element if ref is attached, otherwise fall back to document.body
			// This enables both scoped UI state (with ref) and global UI state (without ref)
			const target = scopeRef.current ?? document.body;

			let newValue: T;
			// Check if caller passed an updater function (like React's setState(prev => prev === 'true' ? 'false' : 'true') pattern)
			if (typeof valueOrUpdater === 'function') {
				const value = target.dataset[camelKey] as T;

				// Call the updater function with the parsed current value
				newValue = valueOrUpdater(value);
			} else {
				// Direct value assignment (no updater function)
				newValue = valueOrUpdater;
			}

			// Write the new value to the data-* attribute
			target.dataset[camelKey] = newValue;
		},
		// Recreate callback only when the key changes
		// Note: initialValue intentionally excluded since it should be stable
		[key] // camelKey depends on key, so no need to include it in the dependency array
	);

	//  -- DEV-ONLY MULTIPLE REF GUARD (removed in production by modern bundlers)  --
	// Attach the ref to the setter function so users can write: <div ref={setValue.ref} />
	// This creates a clean API where the ref and setter are bundled together
	if (process.env.NODE_ENV !== 'production') {
		// DEV: Wrap scopeRef to detect multiple attachments
		(setValue as UISetterFn<T>).ref = useCallback(
			(node: HTMLElement | null) => {
				if (node) {
					refAttachCount!.current++;
					if (refAttachCount!.current > 1) {
						// TODO add documentation link
						throw new Error(
							`[useUI] Multiple ref attachments detected for key "${key}". ` +
								`Each useUI hook supports only one ref attachment per component. ` +
								`Solution: Create separate component. and reuse.\n` +
								`Example: <FAQ/>  <FAQ/> instead of multiple refs in one component.`
						);
					}
				} else {
					// Handle cleanup when ref is detached
					refAttachCount!.current = Math.max(0, refAttachCount!.current - 1);
				}
				scopeRef.current = node;
			},
			[key]
		);
	} else {
		// PROD: Direct ref assignment for zero overhead
		setValue.ref = scopeRef;
	}

	// Return tuple matching React's useState pattern: [initialValue, setter]
	return [initialValue, setValue];
}

export { useUI };
