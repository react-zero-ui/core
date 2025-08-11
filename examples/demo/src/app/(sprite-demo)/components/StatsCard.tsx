import React from 'react';

type StatsCardProps = { title: string; value: string; badgeText?: string; badgeTone?: 'positive' | 'negative' | 'neutral'; className?: string };

export default function StatsCard({ title, value, badgeText, badgeTone = 'neutral', className }: StatsCardProps) {
	const badgeClasses =
		badgeTone === 'positive' ? 'bg-green-100 text-green-700' : badgeTone === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700';

	return (
		<div
			className={
				'rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-3 sm:p-4 shadow-sm ' +
				(className ?? '')
			}>
			<div className="text-[10px] sm:text-xs  uppercase tracking-wide text-slate-500">
				{title} <span className="font-bold">HTML size:</span>
			</div>
			<div className="mt-1 flex items-baseline gap-2">
				<div className="text-base sm:text-lg font-semibold">{value}</div>
				{badgeText ? (
					<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ${badgeClasses}`}>{badgeText}</span>
				) : null}
			</div>
		</div>
	);
}
