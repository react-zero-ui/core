import { useReducer, useRef } from 'react';
import { HeroOffset } from '../components/AnimatedCard';
import { debounce } from '../utils/debounce';
import { useIsoMorphicEffect } from '@/hooks/useIsoMorphicEffect';

const initialOffsets: Record<string, Partial<HeroOffset>> = {
  automedics: {
    x: 533.46875,
    y: -1239.96875,
  },
  entitled: {
    x: 533.46875,
    y: -858.375,
  },
  iao: {
    x: -18.53125,
    y: -858.375,
  },
  bespoke: {
    x: -18.53125,
    y: -1239.96875,
  },
};
export function useOffset(cardIds: string[]) {
  const offsetsRef = useRef(initialOffsets);
  const [, force] = useReducer(x => x + 1, 0); // cheap re-render trigger

  useIsoMorphicEffect(() => {
    const calc = () => {
      const next: Record<string, Partial<HeroOffset>> = {};
      for (const id of cardIds) {
        const grid = document.querySelector(`[data-grid-id="${id}"]`);
        const hero = document.querySelector('[data-stack-target-id]');
        if (!grid || !hero) continue;
        const g = grid.getBoundingClientRect();
        const h = hero.getBoundingClientRect();
        next[id] = { x: h.left - g.left, y: h.top - g.top };
      }
      offsetsRef.current = next;

      force(); // tell React styles changed
    };
    const debouncedCalc = debounce(calc, 50);
    const ro = new ResizeObserver(debouncedCalc); // auto-recompute on resize
    ro.observe(document.documentElement);

    calc();

    return () => ro.disconnect();
  }, [cardIds]);

  return offsetsRef.current;
}
