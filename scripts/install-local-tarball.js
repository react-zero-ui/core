import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const dist = join(process.cwd(), "dist");
const pkg = readdirSync(dist)
  .filter(f => f.endsWith(".tgz"))
  .sort((a, b) => statSync(join(dist, b)).mtimeMs - statSync(join(dist, a)).mtimeMs)[0];

const fixtures = [
  "packages/core/__tests__/fixtures/next",
  "packages/core/__tests__/fixtures/vite",
];

for (const dir of fixtures) {
  const pkgJson = join(dir, "package.json");

  // 1: Inject the packed tarball
  execSync(`pnpm --dir ${dir} add ${join(dist, pkg)}`, { stdio: "inherit" });

  // 2: Install to resolve tree
  execSync(`pnpm --dir ${dir} install`, { stdio: "inherit" });

  // 3: Undo changes to package.json
  execSync(`git restore ${pkgJson}`, { stdio: "inherit" });
}
