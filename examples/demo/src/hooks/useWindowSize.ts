import { useEffect } from 'react';
import { useRAFstate } from './useRAFstate';
import { env } from '../utils/env';
/**
 * A hook that returns the current window size.
 *
 * @returns The current window size
 */

// Define the type for options that can be passed to the hook
interface Options {
  initialWidth?: number; // Initial width of the window (Default value is 10000)
  initialHeight?: number; // Initial height of the window (Default value is 10000)
  onChange?: (width: number, height: number) => void; // Callback function to execute on window resize (optional)
}

export const useWindowSize = ({ initialWidth = 10000, initialHeight = 10000, onChange }: Options = {}) => {
  // Use the useRafState hook to maintain the current window size (width and height)
  const [state, setState] = useRAFstate<{ width: number; height: number }>({
    width: env.isClient ? window.innerWidth : initialWidth,
    height: env.isClient ? window.innerHeight : initialHeight,
  });
  useEffect((): (() => void) | void => {
    // Only run the effect on the browser (to avoid issues with SSR)
    if (env.isClient) {
      const handler = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        // Update the state with the new window size
        setState({
          width,
          height,
        });
        // If an onChange callback is provided, call it with the new dimensions
        if (onChange) onChange(width, height);
      };
      // Add event listener for the resize event
      on(window, 'resize', handler);
      // Cleanup function to remove the event listener when the component is unmounted (it's for performance optimization)
      return () => {
        off(window, 'resize', handler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return the current window size (width and height)
  return state;
};

export default useWindowSize;

export function on<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args: Parameters<T['addEventListener']> | [string, EventListenerOrEventListenerObject | null, unknown]
): void {
  if (obj && obj.addEventListener) {
    obj.addEventListener(...(args as Parameters<HTMLElement['addEventListener']>));
  }
}

export function off<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args: Parameters<T['removeEventListener']> | [string, EventListenerOrEventListenerObject | null, unknown]
): void {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(...(args as Parameters<HTMLElement['removeEventListener']>));
  }
}
