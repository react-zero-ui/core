# Packages and Publishing

## What This Is

The npm packages this monorepo publishes and the release rules that keep them from breaking. Verified 2026-07-07.

## Current Facts

- `@react-zero-ui/core` **0.4.3** (`packages/core/package.json`). Exports map: `.` (hooks, ESM), `./postcss` (CJS, `require` only), `./vite`, `./cli`, `./experimental`, `./experimental/runtime`. `sideEffects` lists only `./dist/experimental/runtime.js`. Build = `tsc -p tsconfig.build.json` into `dist/` (`prepack` runs it automatically).
- `create-zero-ui` **2.0.4** (`packages/cli/package.json`). Single-file bin (`packages/cli/bin.js`): detects pnpm/yarn/npm from lockfile, installs `@react-zero-ui/core` + `@tailwindcss/postcss`, then hands off to `@react-zero-ui/core/cli` (which is `packages/core/src/cli/init.ts` — patches PostCSS/Vite config, layout body attrs, `.zero-ui/`).
- Version drift warning: `.codex/project-memory.md` (2026-04) says 0.4.0 / 2.0.1 — always read the package.json files for current numbers.
- Both packages: MIT, `engines.node >= 22`, homepage `zero-ui.dev`, repo `github.com/react-zero-ui/core`.

## The publishing gotcha (do not lose this)

`packages/cli/package.json` depends on core via `workspace:^0.4.3`. **Publishing with plain `npm publish` ships the literal `workspace:` protocol and breaks consumers** (it has happened before, per `.codex/project-memory.md`). Use `pnpm publish`, which rewrites the protocol to a real semver range.

## Release automation status: PARKED

- `.github/workflows/release.yml.disable` is a complete release-please pipeline (manual dispatch, CI-green gate, `.release-please-config.json`) — **disabled by rename**. The config file it references does not exist in the repo. Releases are currently manual version-bump commits (e.g. `git log`: "2.0.4", "0.4.3").
- Resume checklist: re-enable the file (drop `.disable`), add `.release-please-config.json`, confirm it uses `pnpm publish` semantics for the workspace protocol issue above.

## Repo-level publish config

- `.npmrc`: `workspaces-update=false`. Root `preinstall` enforces pnpm via `only-allow`.
- Bundle size is a marketing artifact: `pnpm size` (esbuild + gzip on built core), `pnpm size:badge` writes `.github/badges/core-size.json` consumed by the README badge via jsDelivr/Shields (`docs/size.md`, `scripts/write-size-badge.mjs`).

## Related

- [[pages/Build Test and CI]]
- [[pages/Architecture Map]]
- [[pages/Open Questions and Risks]]
