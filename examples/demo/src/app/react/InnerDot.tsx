import React from 'react';

export const InnerDot = React.memo(({ theme }: { theme: 'light' | 'dark' }) => {
	const itemClasses2 = theme === 'dark' ? 'bg-red-400' : 'bg-blue-400';

	return (
		<Layer1>
			<Layer2>
				<Layer3>
					<div className={`absolute top-1/2 left-1/2 h-[2px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full ${itemClasses2}`} />
				</Layer3>
			</Layer2>
		</Layer1>
	);
});

const Layer1 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer2 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer3 = ({ children }: { children: React.ReactNode }) => <div className="relative">{children}</div>;
