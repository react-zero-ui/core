import * as React from 'react';

/**
 * A setter function that updates data-* attributes on DOM elements.
 * Includes a .ref property for scoping the updates to specific elements.
 */
export interface UISetter<T extends string | number | boolean> {
	/**
	 * Updates the data-* attribute. Supports both direct values and updater functions.
	 * @param valueOrUpdater - Either a direct value or function that receives current parsed value
	 */
	(valueOrUpdater: T | ((currentValue: T) => T)): void;

	/**
	 * Attach to any HTML element whose dataset you want to mutate.
	 * If not attached, updates will target document.body.
	 */
	readonly ref: React.RefObject<any>;
}

/**
 * A render-less React hook for managing UI state via data-* attributes.
 *
 * @param key - The data-* attribute key (kebab-case, e.g., "my-key" becomes data-my-key)
 * @param initialValue - The initial value, determines the type for all operations
 * @returns A tuple [staleValue, setter] where staleValue is always the initialValue
 *
 * @example
 * ```tsx
 * const [, setCount] = useUI('count', 0);
 * const [, setVisible] = useUI('visible', false);
 *
 *  Scoped to specific element
 * <div ref={setCount.ref}>
 *   <button onClick={() => setCount(prev => prev + 1)}>Increment</button>
 * </div>
 *
 *  Global (updates document.body)
 * setVisible(true);
 * ```
 */
declare function useUI<T extends string | number | boolean>(key: string, initialValue: T): readonly [T, UISetter<T>];

export { useUI };
export default useUI;
