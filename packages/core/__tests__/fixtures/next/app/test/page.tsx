'use client';
import React from 'react';
import useUI from '@react-zero-ui/core';

const Component = () => {
	const [, setSeason] = useUI<'off' | 'on' | 'maybe'>('season', 'off');

	return <div onClick={() => setSeason('off')}>Component</div>;
};

const page = () => {
	const [, setSeason] = useUI<'off' | 'on' | 'maybe'>('season', 'off');
	return (
		<div
			className="season-off:bg-green-900 bg-red-500"
			ref={setSeason.ref}>
			<Component />
			<div
				className="border-2 border-red-500 season-on:bg-red-200 season-off:bg-blue-300 bg-yellow-500"
				onClick={() => setSeason((prev) => (prev === 'on' ? 'off' : 'on'))}>
				<div className="h-40 w-40 season-on:bg-red-500 season-off:bg-blue-500">
					CHILD
					<div className="h-20 w-20 season-on:bg-purple-500 season-off:bg-green-500">CHILD2</div>
				</div>
			</div>
			<button
				className="bg-blue-500 text-white p-2 rounded-md m-5"
				onClick={() => setSeason((prev) => (prev === 'on' ? 'off' : 'on'))}>
				Toggle Theme 2
			</button>
		</div>
	);
};

export default page;
