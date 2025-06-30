import fs from 'fs';

/**
 * Overwrites a given file with the provided content.
 *
 * @param {string} filePath - Absolute path to the file (e.g., projectDir/layout.tsx)
 * @param {string} content  - New content to write
 */
export async function overwriteFile(filePath, content) {
	if (!fs.existsSync(filePath)) {
		console.warn(`[Reset] ⚠️ File not found: ${filePath} — skipping overwrite.`);
		return;
	}

	fs.writeFileSync(filePath, content);
	console.log(`[Reset] ✅ Overwrote: ${filePath}`);

	await new Promise((resolve) => setTimeout(resolve, 1000));
	console.log(`[Reset] ✅ Wait complete, continuing...`);
}
