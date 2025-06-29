import { useCallback, useRef } from 'react';

function useUI(key, initialValue) {
	/* ─ DEV-ONLY COLLISION GUARD (removed in production by modern bundlers) ─ */
	if (process.env.NODE_ENV !== 'production') {
		// Validate inputs with helpful error messages
		if (!key || typeof key !== 'string' || key.trim() === '') {
			throw new Error(`useUI(key, initialValue); key must be a non-empty string, got "${key}"`);
		}

		if (initialValue === '' || initialValue == null) {
			throw new Error(`useUI(key, initialValue); initialValue cannot be empty string, null, or undefined, got "${initialValue}"`);
		}
		// One shared registry per window / Node context
		const registry = typeof globalThis !== 'undefined' ? (globalThis.__useUIRegistry ||= new Map()) : new Map();

		const prev = registry.get(key);
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
	const scopeRef = useRef(null);

	/* ─ DEV-ONLY MULTIPLE REF GUARD (removed in production by modern bundlers) ─ */
	const refAttachCount = process.env.NODE_ENV !== 'production' ? useRef(0) : null;
	/* ─────────────────────────────────────────────────────────────────────── */

	// Convert kebab-case key to camelCase for dataset property access
	// e.g., "my-key" becomes "myKey" since dataset auto-lowercases after dashes
	const camelKey = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());

	// Memoized setter function that updates data-* attributes on the target element
	// useCallback prevents recreation on every render, essential for useEffect dependencies
	const setValue = useCallback(
		(valueOrUpdater) => {
			// SSR safety: bail out if running on server where window is undefined
			if (typeof window === 'undefined') return;

			// Use the scoped element if ref is attached, otherwise fall back to document.body
			// This enables both scoped UI state (with ref) and global UI state (without ref)
			const target = scopeRef.current ?? document.body;

			let newValue;
			// Check if caller passed an updater function (like React's setState(prev => prev) pattern)
			if (typeof valueOrUpdater === 'function') {
				const value = target.dataset[camelKey];

				// Parse the string value from dataset back to the original type
				// Call the updater function with the parsed current value
				newValue = valueOrUpdater(
					// If no value exists, return the initial value
					!value
						? initialValue
						: // If initial was boolean, parse "true"/"false" string to boolean
							typeof initialValue === 'boolean'
							? value === 'true'
							: // If initial was number, convert string to number with NaN fallback
								typeof initialValue === 'number'
								? // The double conversion of +value is very fast and is the same as isNaN check without the function overhead
									+value === +value
									? +value
									: initialValue
								: value
				);
			} else {
				// Direct value assignment (no updater function)
				newValue = valueOrUpdater;
			}

			// Write the new value to the data-* attribute as a string
			target.dataset[camelKey] = newValue + ''; // The fastest way to convert to string
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
		setValue.ref = useCallback(
			(node) => {
				if (node !== null) {
					refAttachCount.current++;
					if (refAttachCount.current > 1) {
						throw new Error(
							// TODO add documentation link
							`[useUI] Multiple ref attachments detected for key "${key}". ` +
								`Each useUI hook supports only one ref attachment per component. ` +
								`Solution: Create separate component. and reuse.\n` +
								`Example: <FAQ/>  <FAQ/> instead of multiple refs in one component.`
						);
					}
				} else {
					// Handle cleanup when ref is detached
					refAttachCount.current = Math.max(0, refAttachCount.current - 1);
				}
				scopeRef.current = node;
			},
			[key]
		);
	} else {
		// PROD: Direct ref assignment for zero overhead
		setValue.ref = scopeRef;
	}

	// Return tuple matching React's useState pattern: [currentValue, setter]
	// Note: currentValue is always initialValue since this doesn't trigger re-renders
	return [initialValue, setValue];
}

export { useUI };
export default useUI;
