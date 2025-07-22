'use client';
import clsx from 'clsx';
import { useMotionValueEvent } from 'motion/react';
import { useScroll } from 'motion/react';

import { useUI } from '@react-zero-ui/core';
import { useIsMobile } from '@/hooks/useIsMobile';
import { DotMenuIcon } from './DotMenuIcon';

export const MobileMenuButton: React.FC = () => {
	const [, setMobileMenu] = useUI<'closed' | 'open'>('mobile-menu', 'closed');
	const [, setScrolled] = useUI<'up' | 'down'>('scrolled', 'up');

	const { scrollY } = useScroll();
	const isDesktop = !useIsMobile(768, () => {
		setMobileMenu('closed');
	});

	useMotionValueEvent(scrollY, 'change', (current) => {
		if (!isDesktop) return;

		const previous = scrollY.getPrevious() ?? current;
		const diff = current - previous;

		if (Math.abs(diff) < 10) return; // Ignore minor scrolls

		setScrolled(diff > 0 ? 'down' : 'up');
	});

	return (
		<button
			type="button"
			aria-label="Toggle navigation"
			onMouseEnter={() => {
				if (isDesktop) setScrolled('up');
			}}
			onClick={() => {
				if (!isDesktop) setMobileMenu((prev) => (prev === 'closed' ? 'open' : 'closed'));
			}}
			className={clsx(
				'md:scrolled-up:opacity-0 md:scrolled-up:pointer-events-none group right-3 h-6 w-6 text-sm transition-all duration-300 ease-in-out hover:cursor-pointer md:absolute'
			)}>
			<DotMenuIcon />
		</button>
	);
};
