import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const outputPath = path.resolve(".github/badges/core-size.json");
const rawBytes = execSync("pnpm size", { encoding: "utf8" }).trim();
const match = rawBytes.match(/(\d+)\s*$/);
const bytes = match ? Number.parseInt(match[1], 10) : Number.NaN;

if (!Number.isFinite(bytes)) {
	throw new Error(`Expected pnpm size to return an integer byte count, got: ${rawBytes}`);
}

const formatBytes = (value) => {
	if (value < 1024) return `${value} B gzip`;
	if (value < 1024 * 1024) return `${(value / 1024).toFixed(1).replace(/\\.0$/, "")} kB gzip`;
	return `${(value / (1024 * 1024)).toFixed(1).replace(/\\.0$/, "")} MB gzip`;
};

const color = bytes < 512 ? "brightgreen" : bytes < 1024 ? "green" : bytes < 2048 ? "yellowgreen" : "yellow";

const badge = {
	schemaVersion: 1,
	label: "bundle size",
	message: formatBytes(bytes),
	color,
	cacheSeconds: 3600,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(badge, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(JSON.stringify(badge));
