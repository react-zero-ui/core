//src/postcss/vite.ts

// vite-plugin-zero-ui.ts  (ESM wrapper)
import zeroUiPostcss from './index.cjs';
import tailwindcssInternal from '@tailwindcss/postcss';
import path from 'path';
// @ts-ignore
import type { Plugin } from 'vite';

export default function zeroUI({ tailwind }: { tailwind?: () => any } = {}): Plugin {
	return {
		name: 'vite-react-zero-ui',
		enforce: 'pre' as const, // run before other Vite plugins
		async config() {
			return { css: { postcss: { plugins: [zeroUiPostcss, tailwind ? tailwind : tailwindcssInternal()] } } };
		},
		async transformIndexHtml(html: string): Promise<string> {
			const { bodyAttributes } = await import(path.join(process.cwd(), './.zero-ui/attributes.js'));
			const attrs = Object.entries(bodyAttributes)
				.map(([k, v]) => `${k}="${v}"`)
				.join(' ');
			return html.replace(/<body([^>]*)>/i, `<body$1 ${attrs}>`);
		},
	};
}
