import { bodyAttributes } from './attributes';

if (typeof window !== 'undefined') {
	const toDatasetKey = (dataKey: string) => dataKey.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());

	const act = {
		// toggle:theme-test(dark,light)
		toggle: (k: string, [on = 'on']: string[]) => {
			document.body.dataset[k] = document.body.dataset[k] ? '' : on;
		},
		// cycle:theme-test(dark,light)
		cycle: (k: string, vals: string[]) => {
			const cur = document.body.dataset[k] ?? vals[0];
			const next = vals[(vals.indexOf(cur) + 1) % vals.length];
			document.body.dataset[k] = next;
		},
		// set:theme-test(dark)
		set: (k: string, [v = '']: string[]) => {
			document.body.dataset[k] = v;
		},
		// attr:theme-test(data-theme)
		attr: (k: string, [attr]: string[], el: HTMLElement) => {
			document.body.dataset[k] = el.getAttribute(attr) ?? '';
		},
	};

	document.addEventListener('click', (e) => {
		const el = (e.target as HTMLElement).closest<HTMLElement>('[data-ui]');
		if (!el) return;

		const [, cmd, key, raw] = el.dataset.ui!.match(/^(\w+):([\w-]+)(?:\((.*?)\))?$/) || [];
		if (!cmd || !(`data-${key}` in bodyAttributes)) return;

		const dsKey = toDatasetKey(`data-${key}`);
		console.log('dsKey: ', dsKey);
		act[cmd as keyof typeof act]?.(dsKey, raw ? raw.split(',') : [], el);
	});
}
