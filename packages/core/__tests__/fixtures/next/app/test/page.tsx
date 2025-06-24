'use client';
import React from 'react';
import useUI from '@austinserb/react-zero-ui';

const page = () => {
	const [, setSeason] = useUI<'off' | 'on'>('season', 'off');

	return (
		<div className="season-off:bg-green-900">
			<div
				className="border-2 border-red-500 season-on:bg-red-200 season-off:bg-blue-300 bg-yellow-500"
				onClick={e => setSeason(prev => (prev === 'on' ? 'off' : 'on'), { scope: e.currentTarget })}>
				<div className="h-40 w-40 season-on:bg-red-500 season-off:bg-blue-500">
					CHILD
					<div className="h-20 w-20 season-on:bg-purple-500 season-off:bg-green-500">CHILD2</div>
				</div>
				Toggle Theme 2
			</div>
		</div>
	);
};

export default page;
