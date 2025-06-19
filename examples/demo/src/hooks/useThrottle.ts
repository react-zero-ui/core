import { useEffect, useRef, useState, useCallback } from 'react';

export interface ThrottleOptions {
  /**
   * Whether to invoke on the leading edge of the timeout
   * @default true
   */
  leading?: boolean;

  /**
   * Whether to invoke on the trailing edge of the timeout
   * @default true
   */
  trailing?: boolean;
}

/**
 * A hook that throttles a value, limiting how often the value is updated.
 *
 * @param value The value to throttle
 * @param ms The throttle delay in milliseconds (Default value is 200)
 * @param options Configuration options (Default value is { leading: true, trailing: true })
 * @returns An object containing the throttled value and a cancel function
 */

const useThrottle = <T>(value: T, ms: number = 200, options: ThrottleOptions = {}): { value: T; cancel: () => void } => {
  // Set defaults
  const { leading = true, trailing = true } = options;

  const [state, setState] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextValueRef = useRef<T>(value);
  const lastUpdatedRef = useRef<number>(Date.now());

  // Memoize options to prevent unnecessary effect triggers
  const optionsRef = useRef({ leading, trailing });

  // Update options ref when inputs change
  useEffect(() => {
    optionsRef.current = { leading, trailing };
  }, [leading, trailing]);

  // Cancel function - useful for manual cancellation
  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set initial value immediately if leading is true
  useEffect(() => {
    if (optionsRef.current.leading && state !== value) {
      setState(value);
    }
    // This effect intentionally runs only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Skip if value hasn't changed
    if (value === state && timeoutRef.current === null) {
      return;
    }

    // Store latest value
    nextValueRef.current = value;

    const now = Date.now();
    const remaining = Math.max(0, ms - (now - lastUpdatedRef.current));

    // If no timeout is running
    if (timeoutRef.current === null) {
      // If leading option is true, update immediately on first change
      if (optionsRef.current.leading && state !== value) {
        setState(value);
        lastUpdatedRef.current = now;
      }

      // Schedule next update
      const timeoutCallback = () => {
        const currentTime = Date.now();
        lastUpdatedRef.current = currentTime;
        // If trailing option is true, update with latest value
        if (optionsRef.current.trailing && nextValueRef.current !== state) {
          setState(nextValueRef.current);
        }

        timeoutRef.current = null;
      };

      timeoutRef.current = setTimeout(timeoutCallback, remaining > 0 ? remaining : ms);
    }
  }, [value, ms, state]);

  // Clean up timeout when component unmounts
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return { value: state, cancel };
};

export default useThrottle;
