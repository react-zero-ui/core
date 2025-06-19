'use client';
import { useSyncExternalStore } from 'react';
import { getMediaQueryStore } from '../utils/getMediaQueryStore';

/**
 * Hook to check if the screen is mobile
 * @param breakpoint - The breakpoint to check against
 * @returns true if the screen is mobile, false otherwise
 * @param fn - A function to call when the screen is mobile
 */
export function useIsMobile(breakpoint = 768, fn?: () => void) {
  const store = getMediaQueryStore(breakpoint, fn);

  return useSyncExternalStore(
    cb => {
      store.subscribers.add(cb);
      return () => store.subscribers.delete(cb);
    },
    () => store.isMatch,
    () => false
  );
}
