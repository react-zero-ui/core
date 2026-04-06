'use client';
import { useRef } from 'react';
import { cssVar, makeSetter } from './internal.js';

type UIAction<T extends string> = T | ((prev: T) => T);

type ScopedRef = ((node: HTMLElement | null) => void) & { current: HTMLElement | null };

interface ScopedSetterFn<T extends string = string> {
	(action: UIAction<T>): void; //  ← SINGLE source of truth
	ref?: ScopedRef;
	cssVar?: typeof cssVar;
}

type GlobalSetterFn<T extends string> = (action: UIAction<T>) => void;

function useUI<T extends string>(key: string, initial: T, flag?: typeof cssVar): [T, GlobalSetterFn<T>] {
	return [initial, useRef(makeSetter(key, initial, () => document.body, flag)).current as GlobalSetterFn<T>];
}

function useScopedUI<T extends string = string>(key: string, initialValue: T, flag?: typeof cssVar): [T, ScopedSetterFn<T>] {
	// Create a ref to hold the DOM element that will receive the data-* attributes
	// This allows scoping UI state to specific elements instead of always using document.body
	const scopeRef = useRef<HTMLElement | null>(null);
	const setterFn = useRef(makeSetter(key, initialValue, () => scopeRef.current!, flag)).current as ScopedSetterFn<T>;
	const refAttachCount = useRef(0);
	const attachRef = useRef<ScopedRef | null>(null);

	if (!attachRef.current) {
		attachRef.current = ((node: HTMLElement | null) => {
			if (process.env.NODE_ENV !== 'production') {
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
