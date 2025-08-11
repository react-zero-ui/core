import React from 'react';

const layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<main className="sm:p-10 pt-20 md:pt-28 w-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-50">
			{children}
		</main>
	);
};

export default layout;
