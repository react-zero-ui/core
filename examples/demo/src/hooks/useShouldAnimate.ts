import { useEffect, useState } from 'react';

type BreakpointKey = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpointMap: Record<BreakpointKey, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useShouldAnimate(breakpoint: BreakpointKey | number = 'md') {
  const threshold = typeof breakpoint === 'string' ? breakpointMap[breakpoint] : breakpoint;
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryMobile = window.matchMedia(`(max-width: ${threshold - 0.1}px)`);
    const mediaQueryReducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`);

    const update = () => {
      const isMobile = mediaQueryMobile.matches;
      const prefersReducedMotion = mediaQueryReducedMotion.matches;
      setShouldAnimate(!isMobile && !prefersReducedMotion);
    };

    update();

    mediaQueryMobile.addEventListener('change', update);
    mediaQueryReducedMotion.addEventListener('change', update);

    return () => {
      mediaQueryMobile.removeEventListener('change', update);
      mediaQueryReducedMotion.removeEventListener('change', update);
    };
  }, [threshold]);
  return shouldAnimate;
}
