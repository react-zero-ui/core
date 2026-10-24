"use client";
import { useRef } from "react";
import { cssVar, makeSetter } from "./internal.js";

/** A value or an updater receiving the current DOM value, falling back to the hook's initial value. */
type UIAction<T extends string> = T | ((prev: T) => T);

type ScopedRef = ((node: HTMLElement | null) => void) & { current: HTMLElement | null };

/** Updates the element attached through `ref` without triggering React re-renders. */
interface ScopedSetterFn<T extends string = string> {
	/** Writes a value or applies an updater to the current DOM value. The ref must be attached first. */
	(action: UIAction<T>): void;
	/**
	 * Attach to exactly one scope root. The setter updates this element's `data-*` attribute
	 * (or CSS variable); render the initial value on the same element.
	 */
	ref?: ScopedRef;
	cssVar?: typeof cssVar;
}

/** Updates `<body>` without triggering React re-renders; updater functions read the current DOM value. */
type GlobalSetterFn<T extends string> = (action: UIAction<T>) => void;

/**
 * Returns the supplied initial value and a setter that writes `data-{key}` on `<body>`.
 * Updates do not trigger React re-renders; the first value does not track DOM changes.
 * Zero UI's PostCSS plugin generates the `key-value:` Tailwind variants used in your source,
 * so elements anywhere under `<body>` can respond through CSS. Render alternate states up front.
 *
 * @param key - Stable kebab-case key, resolvable at build time.
 * @param initial - Static default for generated `bodyAttributes`; use the same default everywhere this key is declared.
 * @param flag - Pass {@link cssVar} to write `--{key}` instead of a data attribute.
 * @returns `[initial, setter]`. The setter accepts a value or an updater reading the current DOM value.
 * @example
 * ```tsx
 * const [, setScrolled] = useUI<"true" | "false">("scrolled", "false");
 * return (
 *   <button onClick={() => setScrolled("true")} className="scrolled-true:opacity-50">
 *     Mark scrolled
 *   </button>
 * );
 * ```
 * @see https://zero-ui.dev/docs/api-reference#useuitkey-initial-flag
 */
function useUI<T extends string>(key: string, initial: T, flag?: typeof cssVar): [T, GlobalSetterFn<T>] {
	return [initial, useRef(makeSetter(key, initial, () => document.body, flag)).current as GlobalSetterFn<T>];
}

/**
 * Returns the supplied initial value and a setter that writes `data-{key}` on one element.
 * Updates do not trigger React re-renders; the first value does not track DOM changes.
 * Attach `setter.ref` to the scope root: the setter updates this element's attribute.
 * Render the initial `data-{key}` on the same element. Zero UI's PostCSS plugin generates
 * `key-value:` Tailwind variants used in your source for this element and its descendants.
 *
 * @param key - Stable kebab-case key, resolvable at build time. Each hook instance has its own target.
 * @param initialValue - Static default; use the same default everywhere this key is declared.
 * @param flag - Pass {@link cssVar} to write `--{key}` instead of a data attribute.
 * @returns `[initialValue, setter]`. The setter accepts a value or an updater reading the current DOM value.
 * @example
 * ```tsx
 * const [initial, setPanel] = useScopedUI<"open" | "closed">("panel", "closed");
 * return (
 *   <section ref={setPanel.ref} data-panel={initial}>
 *     <button onClick={() => setPanel(prev => prev === "closed" ? "open" : "closed")}>Toggle</button>
 *     <div className="panel-closed:hidden panel-open:block">Details</div>
 *   </section>
 * );
 * ```
 * @see https://zero-ui.dev/docs/api-reference#usescopeduitkey-initial-flag
 */
function useScopedUI<T extends string = string>(key: string, initialValue: T, flag?: typeof cssVar): [T, ScopedSetterFn<T>] {
	// Create a ref to hold the DOM element that will receive the data-* attributes
	// This allows scoping UI state to specific elements instead of always using document.body
	const scopeRef = useRef<HTMLElement | null>(null);
	const setterFn = useRef(makeSetter(key, initialValue, () => scopeRef.current!, flag)).current as ScopedSetterFn<T>;
	const refAttachCount = useRef(0);
	const attachRef = useRef<ScopedRef | null>(null);

	if (!attachRef.current) {
		attachRef.current = ((node: HTMLElement | null) => {
			if (process.env.NODE_ENV !== "production") {
				if (node) {
					refAttachCount.current++;
					if (refAttachCount.current > 1) {
						// TODO add documentation link
						throw new Error(
							`[useUI] Multiple ref attachments detected for key "${key}". ` +
								`Each useScopedUI hook supports only one ref attachment per component. ` +
								`Solution: Create separate component. and reuse.\n` +
								`React Strict Mode May Cause the Ref to be attached multiple times.`
						);
					}
				} else {
					// Handle cleanup when ref is detached
					refAttachCount.current = Math.max(0, refAttachCount.current - 1);
				}
			}

			scopeRef.current = node;
			attachRef.current!.current = node;
		}) as ScopedRef;
		attachRef.current.current = null;
	}

	setterFn.ref = attachRef.current;

	// Return tuple matching React's useState pattern: [initialValue, setter]
	return [initialValue, setterFn];
}

export { useUI, useScopedUI, cssVar };
export type { UIAction, ScopedSetterFn, GlobalSetterFn };
