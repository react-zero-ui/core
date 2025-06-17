import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const dist = join(process.cwd(), "dist");
const pkg = readdirSync(dist)
  .filter(f => f.endsWith(".tgz"))
  .sort((a, b) => statSync(join(dist, b)).mtimeMs - statSync(join(dist, a)).mtimeMs)[0];

["tests/fixtures/next", "tests/fixtures/vite"].forEach(dir => {
  execSync(`npm install --prefix ${dir} --no-save ${join(dist, pkg)}`, { stdio: "inherit" });
});