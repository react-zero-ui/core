// __tests__/helpers/resetProjectState.js
import fs from 'node:fs';
import path from 'node:path';
import { rmSync } from 'node:fs';
import { overwriteFile } from './overwriteFile.js';

/**
 * Reset everything the Zero-UI CLI generates inside a fixture.
 *
 * @param projectDir absolute path to the fixture root
 * @param isNext     true  → Next.js fixture (tsconfig + postcss)
 *                   false → Vite fixture   (vite.config.ts)
 */
export async function resetZeroUiState(projectDir, isNext = false) {
	console.log(`[Reset] Starting Zero-UI state reset for ${isNext ? 'Next.js' : 'Vite'} project`);
	console.log(`[Reset] Project directory: ${projectDir}`);

	/* ─── 1. wipe .zero-ui  ─────────────────────────────────────────────── */
	const zeroUiDir = path.join(projectDir, '.zero-ui');
	if (fs.existsSync(zeroUiDir)) {
		rmSync(zeroUiDir, { recursive: true, force: true });
		console.log('[Reset] ✅ Removed .zero-ui directory');
	} else {
		console.log('[Reset] ⏭️  .zero-ui directory not found, skipping');
	}

	/* ─── 2. Next.js cleanup (tsconfig + postcss)  ──────────────────────── */
	if (isNext) {
		console.log('[Reset] 🔧 Running Next.js cleanup');
		await overwriteFile(path.join(projectDir, 'tsconfig.json'), defaultTsconfigContent);

		await overwriteFile(path.join(projectDir, 'app/layout.tsx'), defaultLayoutContent);
		await overwriteFile(path.join(projectDir, 'postcss.config.mjs'), defaultPostcssConfigContent);
	}
	/* ─── 3. Vite cleanup (vite.config.ts)  ─────────────────────────────── */
	if (!isNext) {
		console.log('[Reset] ⚡ Running Vite cleanup');
		await overwriteFile(path.join(projectDir, 'vite.config.ts'), defaultViteConfigContent);
	}
	console.log('[Reset] ✨ Reset complete!');
	return;
}

const defaultLayoutContent = `import './globals.css';

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body
				className="bg-red test-ww this is to test the body tag"
				id="88">
				{children}
			</body>
		</html>
	);
}
`;

const defaultPostcssConfigContent = `// postcss.config.mjs
const config = {
  plugins: ['@tailwindcss/postcss']
};
export default config;
`;

const defaultViteConfigContent = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
});`;

const defaultTsconfigContent = `{
  "compilerOptions": {
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "incremental": true,
    "module": "ESNext",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ],
    "target": "ES2017",
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/**/*.d.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}`;
