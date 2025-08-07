const EXT = '{ts,tsx,js,mjs,cjs,mts,cts,jsx,css,scss,sass,less}';

export const CONFIG = {
	SUPPORTED_EXTENSIONS: { TYPESCRIPT: ['.ts', '.tsx'], JAVASCRIPT: ['.js', '.jsx'] },
	HOOK_NAME: 'useUI',
	LOCAL_HOOK_NAME: 'useScopedUI',
	SSR_HOOK_NAME: 'zeroSSR',
	SSR_HOOK_NAME_SCOPED: 'scopedZeroSSR',
	IMPORT_NAME: '@react-zero-ui/core',
	PLUGIN_NAME: 'postcss-react-zero-ui',
	MIN_HOOK_ARGUMENTS: 2,
	MAX_HOOK_ARGUMENTS: 2,
	HEADER: '/* AUTO-GENERATED - DO NOT EDIT */',
	ZERO_UI_DIR: '.zero-ui',
	POSTCSS_PLUGIN: '@react-zero-ui/core/postcss',
	VITE_PLUGIN: '@react-zero-ui/core/vite',
	CONTENT: [`src/**/*.${EXT}`, `app/**/*.${EXT}`, `pages/**/*.${EXT}`],
} as const;

export const IGNORE_DIRS = [
	'**/node_modules/**',
	'**/.next/**',
	'**/.turbo/**',
	'**/.vercel/**',
	'**/.git/**',
	'**/coverage/**',
	'**/out/**',
	'**/public/**',
	'**/dist/**',
	'**/build/**',
];
