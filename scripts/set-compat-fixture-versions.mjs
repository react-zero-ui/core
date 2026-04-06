import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const dryRun = process.env.DRY_RUN === "1";

function envOrDefault(name, fallback) {
	const value = process.env[name]?.trim();
	return value ? value : fallback;
}

const versions = {
	next: envOrDefault("NEXT_VERSION", "latest"),
	react: envOrDefault("REACT_VERSION", "latest"),
	reactDom: envOrDefault("REACT_DOM_VERSION", envOrDefault("REACT_VERSION", "latest")),
	typesReact: envOrDefault("TYPES_REACT_VERSION", "latest"),
	typesReactDom: envOrDefault("TYPES_REACT_DOM_VERSION", "latest"),
};

const manifests = [
	{
		file: "packages/core/__tests__/fixtures/next/package.json",
		update(pkg) {
			pkg.dependencies.next = versions.next;
			pkg.dependencies.react = versions.react;
			pkg.dependencies["react-dom"] = versions.reactDom;
			pkg.devDependencies["@types/react"] = versions.typesReact;
			if (pkg.devDependencies["@types/react-dom"]) {
				pkg.devDependencies["@types/react-dom"] = versions.typesReactDom;
			}
			return pkg;
		},
	},
	{
		file: "packages/core/__tests__/fixtures/vite/package.json",
		update(pkg) {
			pkg.dependencies.react = versions.react;
			pkg.dependencies["react-dom"] = versions.reactDom;
			pkg.devDependencies["@types/react"] = versions.typesReact;
			if (pkg.devDependencies["@types/react-dom"]) {
				pkg.devDependencies["@types/react-dom"] = versions.typesReactDom;
			}
			return pkg;
		},
	},
];

for (const manifest of manifests) {
	const manifestPath = path.join(rootDir, manifest.file);
	const pkg = JSON.parse(await readFile(manifestPath, "utf8"));
	const updated = manifest.update(pkg);

	if (dryRun) {
		console.log(`[compat] Would update ${manifest.file}`);
		continue;
	}

	await writeFile(manifestPath, `${JSON.stringify(updated, null, 2)}\n`);
	console.log(`[compat] Updated ${manifest.file}`);
}

console.log(
	`[compat] Using versions: next=${versions.next}, react=${versions.react}, react-dom=${versions.reactDom}, @types/react=${versions.typesReact}, @types/react-dom=${versions.typesReactDom}`
);
