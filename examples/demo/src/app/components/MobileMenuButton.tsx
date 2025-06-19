'use client';
import clsx from 'clsx';
import { useMotionValueEvent } from 'motion/react';
import { useScroll } from 'motion/react';

import useUI from '@austinserb/react-zero-ui';
import { useIsMobile } from '@/hooks/useIsMobile';
import { DotMenuIcon } from './DotMenuIcon';

export const MobileMenuButton: React.FC = () => {
  const [, setMobileMenu] = useUI<'closed' | 'open'>('mobileMenu', 'closed');
  const [, setScrolled] = useUI<'up' | 'down'>('scrolled', 'down');

  const { scrollY } = useScroll();
  const isDesktop = !useIsMobile(768, () => {
    setMobileMenu('closed');
  });

  useMotionValueEvent(scrollY, 'change', current => {
    if (!isDesktop) return;
    const diff = current - (scrollY.getPrevious() ?? 0);
    setScrolled(diff > 0 ? 'up' : 'down');
  });

  return (
    <button
      type="button"
      aria-label="Toggle navigation"
      onMouseEnter={() => {
        if (isDesktop) setScrolled('down');
      }}
      onClick={() => {
        if (!isDesktop) setMobileMenu(prev => (prev === 'closed' ? 'open' : 'closed'));
      }}
      className={clsx(
        'md:scrolled-down:opacity-0 md:scrolled-down:pointer-events-none group right-3 h-6 w-6 text-sm transition-all duration-300 ease-in-out hover:cursor-pointer md:absolute'
      )}
    >
      <DotMenuIcon />
    </button>
  );
};
