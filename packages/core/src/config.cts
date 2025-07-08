export const CONFIG = {
	SUPPORTED_EXTENSIONS: { TYPESCRIPT: ['.ts', '.tsx'], JAVASCRIPT: ['.js', '.jsx'] },
	HOOK_NAME: 'useUI',
	IMPORT_NAME: '@react-zero-ui/core',
	MIN_HOOK_ARGUMENTS: 2,
	MAX_HOOK_ARGUMENTS: 2,
	HEADER: '/* AUTO-GENERATED - DO NOT EDIT */',
	ZERO_UI_DIR: '.zero-ui',
	CONTENT: ['src/**/*.{ts,tsx,js,jsx}', 'app/**/*.{ts,tsx,js,jsx}', 'pages/**/*.{ts,tsx,js,jsx}'],
	POSTCSS_PLUGIN: '@react-zero-ui/core/postcss',
	VITE_PLUGIN: '@react-zero-ui/core/vite',
};

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
