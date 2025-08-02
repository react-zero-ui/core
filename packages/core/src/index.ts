'use client';
import { useRef, type RefObject } from 'react';
import { cssVar, makeSetter } from './internal.js';

type UIAction<T extends string> = T | ((prev: T) => T);

interface ScopedSetterFn<T extends string = string> {
	(action: UIAction<T>): void; //  ← SINGLE source of truth
	ref?: RefObject<any> | ((node: HTMLElement | null) => void);
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

	if (process.env.NODE_ENV !== 'production') {
		//  -- DEV-ONLY MULTIPLE REF GUARD (removed in production by modern bundlers)  --
		// Attach the ref to the setter function so users can write: <div ref={setterFn.ref} />
		const refAttachCount = useRef(0);
		// DEV: Wrap scopeRef to detect multiple attachments
		(setterFn as ScopedSetterFn<T>).ref = (node: HTMLElement | null) => {
			if (node) {
				refAttachCount!.current++;
				if (refAttachCount!.current > 1) {
					// TODO add documentation link
					throw new Error(
						`[useUI] Multiple ref attachments detected for key "${key}". ` +
							`Each useScopedUI hook supports only one ref attachment per component. ` +
							`Solution: Create separate component. and reuse.\n`
					);
				}
			} else {
				// Handle cleanup when ref is detached
				refAttachCount!.current = Math.max(0, refAttachCount!.current - 1);
			}
			scopeRef.current = node;
		};
	} else {
		// PROD: Direct ref assignment for zero overhead
		setterFn.ref = scopeRef;
	}

	// Return tuple matching React's useState pattern: [initialValue, setter]
	return [initialValue, setterFn];
}

export { useUI, useScopedUI, cssVar };
export type { UIAction, ScopedSetterFn, GlobalSetterFn };
