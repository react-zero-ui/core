# Maintenance Log (append-only)

## 2026-07-07 — Vault initialized

- Created vault at `wiki/` (in-repo). Scope per user: codebase/build + project/ecosystem (npm publishing, docs site, examples).
- Sources ingested (in place, see `raw/source-manifest.md`): `.codex/project-memory.md`, `.codex/project-summary.md`, root `README.md`, root `CONTRIBUTING.md`, `packages/core/ARCHITECTURE.md`, `docs/*.md` (11 files), `packages/core/src/experimental/README.md`, `examples/demo/README.md`.
- Pages created (9): React Zero-UI, Architecture Map, Core Library Internals, Packages and Publishing, Build Test and CI, Docs and Website, Experimental Runtime, Operations Runbook, Open Questions and Risks.
- Corrections found during verification (details in manifest):
  1. `ARCHITECTURE.md`/`docs/internal.md` cite `.cts` extractor files; sources are `.ts`.
  2. Root `CONTRIBUTING.md` diagram swaps `docs/` and `examples/demo/` roles (the Fumadocs site is `examples/demo/`).
  3. `.codex/project-memory.md` package versions stale (0.4.0/2.0.1 → 0.4.3/2.0.4).
  4. `docs/CONTRIBUTING.md` is a stale copy of root; `docs/rules.md` is empty; `examples/demo/README.md` duplicates root README.
- Noticed in code, no source mentions: CI pins pnpm 10.12.1 vs `packageManager` pnpm@11.3.0; `.release-please-config.json` referenced by the disabled release workflow does not exist; `@react-zero-ui/icon-sprite` is an external sibling repo the docs site depends on.
- Added `/wiki/_private/` to root `.gitignore` and verified with `git check-ignore`.
- **Assumptions (user unavailable during init)**: treated in-repo docs as raw sources in place instead of copying into `raw/`; treated only the disabled release workflow as "parked" work; skipped a business/client page beyond the product page (open-source library — positioning lives in the product page and `site-config.ts`); presumed-Vercel hosting recorded as unverified in Open Questions.
