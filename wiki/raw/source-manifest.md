# Source Manifest

Raw sources are the existing in-repo docs, left in place (they are version-controlled with the code). Paths relative to repo root. Read-only evidence — corrections live in wiki pages; discrepancies are recorded here.

## Ingested at init (2026-07-07)

| Source | What it covers | Staleness / conflict notes |
| --- | --- | --- |
| `.codex/project-memory.md` (updated 2026-04-06) | Tactical working memory: current focus, decisions, risks, next actions | Versions stale: says core@0.4.0 / create-zero-ui@2.0.1 and `workspace:^0.4.0`; actuals 2026-07-07 are 0.4.3 / 2.0.4 / `workspace:^0.4.3`. The `pnpm publish` risk and the decisions (Node >= 22, eslint-zero-ui removed, PostCSS no auto-init, Dependabot+compat workflow) all verified correct against code. |
| `.codex/project-summary.md` (updated 2026-04-06) | Durable product-level overview | Checks out. |
| `README.md` (root) | Product pitch, API reference, quick start | Checks out against `packages/core/src/index.ts` and `config.ts`. |
| `CONTRIBUTING.md` (root) | Philosophy, monorepo structure, setup, PR flow | **Structure diagram wrong**: labels `docs/` as the "Next.js + Fumadocs docs site" and `examples/demo/` as a showcase app. Actually `docs/` is plain markdown; `examples/demo/` is the Fumadocs site (package name `docs`, serves zero-ui.dev). |
| `packages/core/ARCHITECTURE.md` | Variant-extractor mental model (pipeline, literal resolution, perf) | **Filenames stale**: cites `ast-parsing.cts`, `scanner.cts`, `helpers.cts`; sources are `.ts` (`packages/core/src/postcss/`). Only `index.cts` and `traverse.cjs` are CJS. Pipeline description itself verified accurate. |
| `docs/internal.md` | Near-duplicate of `packages/core/ARCHITECTURE.md` | Same `.cts` staleness. Duplicate maintenance burden. |
| `docs/api-reference.md`, `docs/usage-examples.md`, `docs/faq.md`, `docs/migration-guide.md`, `docs/installation-next.md`, `docs/installation-vite.md`, `docs/demo.md` | User-facing library docs | Spot-checked API shapes against `src/index.ts` — consistent. Not deep-verified line-by-line. |
| `docs/experimental.md` + `packages/core/src/experimental/README.md` | Experimental SSR runtime | Verified against `src/experimental/*.ts` — accurate (~300 B runtime, `data-ui` directive format). |
| `docs/size.md` | Bundle-size measurement + badge | Verified against root `package.json` scripts and `scripts/write-size-badge.mjs`. |
| `docs/CONTRIBUTING.md` | Older contributing guide | **Superseded** by root `CONTRIBUTING.md` (missing monorepo diagram + bundle-size sections). |
| `docs/rules.md` | — | **Empty file (0 bytes).** |
| `examples/demo/README.md` | — | Duplicate of root `README.md`. |

## Notes for future ingests

- Add new sources as a table row here (or a `raw/` source note for external/one-off documents), then update pages per `AGENTS.md`.
