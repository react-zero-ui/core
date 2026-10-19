---
summary: "Which tests exercise source, compiled modules, or packed fixtures; active Playwright coverage, fixture mutations, and CI/toolchain gaps."
paths:
  - package.json
  - pnpm-workspace.yaml
  - packages/core/package.json
  - packages/core/tsconfig.build.json
  - packages/core/__tests__/config/
  - packages/core/__tests__/helpers/
  - packages/core/__tests__/e2e/viteSetup.js
  - packages/core/scripts/smoke-test.js
  - scripts/install-local-tarball.js
  - scripts/set-compat-fixture-versions.mjs
  - .github/workflows/ci.yml
  - .github/workflows/compat.yml
  - .github/dependabot.yml
---

# Build, Tests, and CI

## Artifact preparation

[Root scripts](../../package.json) coordinate install → core build → pack → fixture installation. `pnpm bootstrap` uses a frozen install; `pnpm dev` prepares artifacts with a non-frozen install. Neither starts the website. Node minimum and package-manager version are declared in the manifests.

Fixture apps exercise packed core instead of workspace source links. [install-local-tarball.js](../../scripts/install-local-tarball.js) reads the newest tarball from repository-root `dist/`, replaces fixture dependency installs with `--ignore-workspace --ignore-scripts`, and restores fixture manifests afterward. This can discard local fixture-manifest edits. Keep pack output and installer expectations aligned when changing scripts. `pnpm reset` begins with `git clean -fdx`, including ignored/local files.

Not every test uses the tarball:

| Command from repo root  | Actual boundary                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm test:unit`        | Source-level `src/**/*.test.ts`, mainly parser/resolver/scanner/config helpers                               |
| `pnpm test:integration` | `__tests__/unit/index.test.cjs`, importing compiled `dist` modules                                           |
| `pnpm test:cli`         | All `__tests__/unit/*.test.cjs`, including that integration file                                             |
| `pnpm test:vite`        | Packed Vite fixture; setup invokes compiled core CLI; CLI → behavior → scoped projects                       |
| `pnpm test:next`        | Only `next-ssr.spec.js` against the Next dev fixture; other Next projects and global setup are commented out |
| `pnpm test`             | Lint, configured core suites, then an isolated package smoke test                                            |

[Playwright configs](../../packages/core/__tests__/config/) determine active coverage. Existing spec files alone do not establish that CI runs them. [Smoke test](../../packages/core/scripts/smoke-test.js) packs already-built core, installs it in a temporary project, and exercises the published CommonJS PostCSS entry. It is in root `pnpm test`, but the workflows invoke individual suites and omit it.

## CI and compatibility

[CI](../../.github/workflows/ci.yml) installs, lints, builds, packs, installs fixtures, then runs the five named suites. Root build targets core; it does not validate the [website build](docs-website.md).

[Compatibility](../../.github/workflows/compat.yml) rewrites fixture framework versions through [set-compat-fixture-versions.mjs](../../scripts/set-compat-fixture-versions.mjs), then runs those suites. Its fixture installation is separate from `i-tarball`; preserve the rewritten versions when changing this flow. [Dependabot](../../.github/dependabot.yml) supplies complementary fixture dependency updates.

Both workflows specify pnpm `10.12.1`, while root `packageManager` specifies `11.3.0`. Toolchain intent is unresolved; verify effective versions when reproducing install/CI failures. Workflow presence does not establish current green runs.

For source edits, start with `pnpm lint` and `pnpm --dir packages/core run build`, then the relevant boundary above. `packages/core/dev/next/` is a manual playground, separate from fixtures.
