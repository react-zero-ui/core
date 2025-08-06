import { bodyAttributes } from './attributes';

if (typeof window !== 'undefined') {
	const toCamel = (key: string) => key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());

	const cycle = (target: HTMLElement, k: string, vals: string[]) => {
		const cur = target.dataset[k] ?? vals[0]; // default = first value
		const next = vals[(vals.indexOf(cur) + 1) % vals.length];
		target.dataset[k] = next;
	};

	document.addEventListener('click', (e) => {
		const el = (e.target as HTMLElement).closest<HTMLElement>('[data-ui]');
		if (!el) return;

		const [, key, rawVals = ''] = el.dataset.ui!.match(/^cycle:([\w-]+)(?:\((.*?)\))?$/) || [];

		if (!(`data-${key}` in bodyAttributes)) return; // unknown variant ➡️ bail

		const vals = rawVals.split(','); // '' ➡️ ['']  OK for toggle
		const dsKey = toCamel(`data-${key}`);
		const target = (el.closest(`[data-${key}]`) as HTMLElement) ?? document.body;

		cycle(target, dsKey, vals);
	});
}
