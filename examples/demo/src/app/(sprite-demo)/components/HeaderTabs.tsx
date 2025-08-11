import Link from 'next/link';
import React from 'react';

type HeaderTabsProps = { active: 'lucide' | 'sprite'; className?: string };

export default function HeaderTabs({ active, className }: HeaderTabsProps) {
	const baseLink = 'px-3 py-2 text-sm font-medium transition-colors duration-150';
	const inactive = 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800';
	const activeClasses = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';

	return (
		<div
			className={
				'inline-flex rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 shadow-sm overflow-hidden w-fit ' +
				(className ?? '')
			}>
			<Link
				href="/icon-sprite"
				className={baseLink + ' ' + (active === 'sprite' ? activeClasses : inactive)}
				aria-current={active === 'sprite' ? 'page' : undefined}>
				Zero UI Sprite
			</Link>
			<Link
				href="/lucide-react"
				className={baseLink + ' ' + (active === 'lucide' ? activeClasses : inactive)}
				aria-current={active === 'lucide' ? 'page' : undefined}>
				Lucide React
			</Link>
		</div>
	);
}
