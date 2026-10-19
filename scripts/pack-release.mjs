import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";

// Build a publishable tarball and check the manifest and entry points inside it.
// pnpm owns workspace: rewriting; npm may publish only the resulting tarball.
const [packageDir, version, destination = "dist/release"] = process.argv.slice(2);
const packageNames = { "packages/core": "@react-zero-ui/core", "packages/cli": "create-zero-ui" };
assert(Object.hasOwn(packageNames, packageDir) && version, "Usage: pnpm release:pack <packages/core|packages/cli> <version> [destination]");
const repoDir = fileURLToPath(new URL("../", import.meta.url));
const source = JSON.parse(readFileSync(resolve(repoDir, packageDir, "package.json"), "utf8"));
assert.equal(source.name, packageNames[packageDir], "Unexpected package name");
assert.equal(source.version, version, "Update the package version before packing");
assert.match(version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/, "Expected a package version");

const outputDir = resolve(repoDir, destination);
mkdirSync(outputDir, { recursive: true });
execFileSync("pnpm", ["--dir", packageDir, "pack", "--pack-destination", outputDir], { cwd: repoDir, stdio: "inherit" });
const tarball = resolve(outputDir, `${source.name.replace(/^@/, "").replace("/", "-")}-${version}.tgz`);
const packed = JSON.parse(execFileSync("tar", ["-xOf", tarball, "package/package.json"], { encoding: "utf8" }));
assert.equal(packed.name, source.name);
assert.equal(packed.version, version);
assert.notEqual(packed.private, true, "Cannot release a private package");
assert.equal(packed.repository?.url, "git+https://github.com/react-zero-ui/core.git", "npm provenance requires the canonical repository");

for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
	for (const [name, range] of Object.entries(packed[field] ?? {})) {
		assert(!/^(workspace:|file:|link:)/.test(range), `${field}.${name} is not a published dependency: ${range}`);
	}
}

const files = new Set(execFileSync("tar", ["-tf", tarball], { encoding: "utf8" }).trim().split("\n"));
const entries = ["README.md", "LICENSE", packed.main, packed.types, ...Object.values(packed.bin ?? {})];
for (const conditions of Object.values(packed.exports ?? {})) {
	entries.push(...(typeof conditions === "string" ? [conditions] : Object.values(conditions)));
}
for (const entry of entries.filter(Boolean)) {
	assert(files.has(`package/${entry.replace(/^\.\//, "")}`), `Missing packed entry: ${entry}`);
}
assert(![...files].some((file) => /\.test\.[cm]?js$/.test(file)), "Tests must not ship in the package");
console.log(`Validated ${packed.name}@${packed.version}: ${tarball}`);
