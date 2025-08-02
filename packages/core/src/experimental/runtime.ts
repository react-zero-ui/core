/* ------------------------------------------------------------------ *
 *  Zero-UI click-handler runtime                                     *
 *                                                                    *
 *  Listens for clicks on any element that carries a `data-ui`        *
 *  attribute of the form:                                            *
 *                                                                    *
 * data-ui="global:<key>(v1,v2,…)"   > flips <body data-key="…">      *
 * data-ui="scoped:<key>(v1,v2,…)"   > flips nearest ancestor with matching *
 *                                    data-key="…" (or the host itself)*
 *                                                                    *
 *  A single `activateZeroUiRuntime()` call wires everything up.      *
 *  We guard against duplicate activation in case the component       *
 *  appears twice.                                                    *
 * ------------------------------------------------------------------ */

/** Map emitted by the compiler: every legal data-* key → true */
export type VariantKeyMap = Record<string, true | string[] | '*'>;

/* kebab → camel ("data-theme-dark" → "themeDark") */
const kebabToCamel = (attr: string) => attr.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/* One shared RegExp - avoids per-click re-parsing */
const DATA_UI_RE = /^(global|scoped):([\w-]+)(?:\((.*?)\))?$/;

/* Flip to next value in list */
function cycleDatasetValue(el: HTMLElement, camelKey: string, values: readonly string[]) {
	const next = el.dataset;
	const current = next[camelKey] ?? values[0];
	next[camelKey] = values[(values.indexOf(current) + 1) % values.length];
}

/* ------------------------------------------------------------------ *
 *  Public entry                                                       *
 * ------------------------------------------------------------------ */
export function activateZeroUiRuntime(map: VariantKeyMap) {
	if (typeof window === 'undefined' || (window as any).__zero) return;
	(window as any).__zero = true; // idempotent flag

	if (process.env.NODE_ENV !== 'production') {
		console.log('🧩 Zero-UI runtime attached');
	}

	document.addEventListener('click', (ev) => {
		/* 1. nearest ancestor with data-ui */
		const host = (ev.target as HTMLElement).closest<HTMLElement>('[data-ui]');
		if (!host) return;

		/* 2. parse directive */
		const match = DATA_UI_RE.exec(host.dataset.ui!);
		if (!match) return;

		const [, scope, key, raw = ''] = match;
		if (!map[`data-${key}`]) return;

		const values = raw ? raw.split(',') : ['']; // '' > toggle
		const camelKey = kebabToCamel(`data-${key}`);

		/* 3. decide target element */
		const target = scope === 'global' ? document.body : ((host.closest(`[data-${key}]`) as HTMLElement) ?? host);

		/* 4. mutate data-attribute */
		cycleDatasetValue(target, camelKey, values);
	});
}
