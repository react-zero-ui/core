const toCamel = (k: string) => k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const cycle = (el: HTMLElement, ds: string, vals: string[]) => {
	const cur = el.dataset[ds] ?? vals[0];
	const next = vals[(vals.indexOf(cur) + 1) % vals.length];
	el.dataset[ds] = next;
};

export function activateZeroUiRuntime(bodyAttributes: Record<string, string>) {
	if (typeof window === 'undefined' || (window as any).__zeroUIRuntime) return;
	(window as any).__zeroUIRuntime = true;

	document.addEventListener('click', (e) => {
		const host = (e.target as HTMLElement).closest<HTMLElement>('[data-ui]');
		if (!host) return;

		const [, key, raw = ''] = host.dataset.ui!.match(/^cycle:([\w-]+)(?:\((.*?)\))?$/) || [];

		if (!(/* validation */ (`data-${key}` in bodyAttributes))) return;

		const vals = raw.split(',');
		const dsKey = toCamel(`data-${key}`);
		const target = (host.closest(`[data-${key}]`) as HTMLElement) ?? document.body;

		cycle(target, dsKey, vals);
	});
}
