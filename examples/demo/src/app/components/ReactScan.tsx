'use client';
// react-scan must be imported before react
import { scan } from 'react-scan/all-environments';
import { useEffect } from 'react';

export function ReactScan() {
	useEffect(() => {
		setTimeout(() => {
			scan({ enabled: true });
		}, 1000);
	}, []);

	return null;
}
