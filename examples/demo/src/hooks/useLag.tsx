import { MotionValue } from 'motion/react';
import { RefObject, useEffect } from 'react';

export function useCompositorSpring(ref: RefObject<HTMLElement | null>, progress: MotionValue<number>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Create a paused compositor animation ------------------- */
    const anim = el.animate(
      [
        {
          transform: `translate(var(--tx)) translateY(var(--ty)) scale(var(--sc)) rotate(var(--rot))`,
        },
        { transform: 'translate(0) translateY(0) scale(1) rotate(0)' },
      ],
      { duration: 1000, fill: 'both', easing: 'linear' }
    );
    anim.pause(); // we'll scrub it manually
    const total = anim.effect!.getComputedTiming().endTime; // 1000 ms

    /* Spring drives only .currentTime ------------------------ */
    const unsub = progress.on('change', p => (anim.currentTime = p * Number(total)));
    return () => unsub();
  }, [progress]);
}
