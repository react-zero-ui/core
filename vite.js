// vite-plugin-zero-ui.ts  (ESM wrapper)
import tailwindcss from '@tailwindcss/postcss';
import path from 'path';
export default function zeroUI() {
  return {
    name: 'vite-zero-ui',
    enforce: 'pre', // run before other Vite plugins
    async config() {
      const { default: zeroUiPostcss } = await import('./postcss/index.cjs');
      return {
        css: {
          postcss: {
            plugins: [zeroUiPostcss(), tailwindcss]
          }
        },
      };

    },
    async transformIndexHtml(html) {
      const { bodyAttributes } = await import(path.join(process.cwd(), './.zero-ui/attributes.js'));
      const attrs = Object.entries(bodyAttributes)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return html.replace('<body', `<body ${attrs}`);
    },
  };
}
