import React from 'react';
import HeaderTabs from './HeaderTabs';

type HeaderBarProps = { title: string; subtitle: React.ReactNode; activeTab: 'lucide' | 'sprite'; className?: string };

export default function HeaderBar({ title, subtitle, activeTab, className }: HeaderBarProps) {
	return (
		<div className={'flex flex-col gap-4 md:flex-row md:items-center md:justify-between ' + (className ?? '')}>
			<div>
				<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
				<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
			</div>
			<HeaderTabs active={activeTab} />
		</div>
	);
}
