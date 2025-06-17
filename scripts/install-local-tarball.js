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

fixtures.forEach(dir => {
  // 1 Install the fixture's own dependencies
  execSync(`pnpm --dir ${dir} install --silent`, { stdio: "inherit" });

  // 2 Inject the freshly packed Zero-UI tarball WITHOUT writing to package.json
  execSync(`pnpm --dir ${dir} add ${join(dist, pkg)}`, { stdio: "inherit" });
});