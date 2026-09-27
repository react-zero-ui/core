# Operations Runbook

## What This Is

Where-to-start recipes for common tasks. Verified 2026-07-07. All commands run from repo root; Node >= 22 and pnpm required (`preinstall` blocks npm/yarn).

## Local setup

```bash
pnpm bootstrap   # frozen install + build core + pack tarball + install into test fixtures
pnpm test        # lint + all suites (slow: includes Playwright e2e)
```

Cheap sanity after edits: `pnpm lint` and `pnpm --dir packages/core run build`. Full details in [[pages/Build Test and CI]].

## Recipes (where to start)

- **Change hook/runtime behavior** → `packages/core/src/index.ts` + `internal.ts`; unit-test via `pnpm test:unit`; hand-test in `packages/core/dev/next/`.
- **Change the variant extractor / generated CSS** → `packages/core/src/postcss/` (see [[pages/Core Library Internals]] for which file owns which stage); tests live next to the sources.
- **Change what `npx create-zero-ui` does** → scaffolding lives in `packages/cli/bin.js`, but the real config patching is `packages/core/src/cli/init.ts`; test with `pnpm test:cli`.
- **Cut a release** → bump versions, use **`pnpm publish`** (never `npm publish` — workspace protocol, see [[pages/Packages and Publishing]]); after core changes run `pnpm size:badge` and commit `.github/badges/core-size.json`.
- **Edit website copy / add a docs page** → MDX in `examples/demo/content/docs/`; site config in `examples/demo/app/config/site-config.ts`; run with `pnpm --dir examples/demo dev`. GitHub-facing docs are separate: `docs/*.md` ([[pages/Docs and Website]]).
- **Check compatibility with a new React/Next version** → dispatch `.github/workflows/compat.yml` with version inputs, or locally run `node scripts/set-compat-fixture-versions.mjs` then the test pipeline.
- **Update repo working memory** → `.codex/project-memory.md` (tactical, current) and `.codex/project-summary.md` (durable) per the convention in `CONTRIBUTING.md`; durable synthesis belongs in this wiki.

## Conventions

- Semantic commit prefixes (`feat:`, `fix:`, `chore:`, `refactor:`); focused PRs with the template filled (`CONTRIBUTING.md`).
- Formatting: `pnpm format` (Prettier, config in `.prettierrc.json`).

## Related

- [[pages/Build Test and CI]]
- [[pages/Packages and Publishing]]
- [[pages/Docs and Website]]
