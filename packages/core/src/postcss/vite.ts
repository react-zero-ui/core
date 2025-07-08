//src/postcss/vite.ts

// vite-plugin-zero-ui.ts  (ESM wrapper)
import tailwindcss from '@tailwindcss/postcss';
import zeroUiPostcss from './index.cjs';
import path from 'path';
export default function zeroUI() {
	return {
		name: 'vite-zero-ui',
		enforce: 'pre', // run before other Vite plugins
		async config() {
			return { css: { postcss: { plugins: [zeroUiPostcss, tailwindcss()] } } };
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
