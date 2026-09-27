# Build Test and CI

## What This Is

How the monorepo builds, tests, and runs CI. Verified 2026-07-07 against root `package.json`, `.github/workflows/`.

## The tarball-based test model (key concept)

Tests do not consume core via workspace linking. The flow (root `package.json` scripts) is: build core → `pnpm prepack:core` packs a real tarball into `packages/core/dist/` → `pnpm i-tarball` (`scripts/install-local-tarball.js`) installs that tarball into the Next and Vite fixture apps at `packages/core/__tests__/fixtures/{next,vite}` with `--ignore-workspace`, then git-restores their package.json. This tests the *published artifact*, catching packaging bugs (exports map, CJS/ESM) that workspace links hide.

- `pnpm bootstrap` = frozen install + build + prepack + i-tarball (fresh clone setup).
- `pnpm dev` = same but non-frozen install.
- `pnpm reset` = `git clean -fdx` + full re-bootstrap (nuclear).

## Test suites (root scripts → `packages/core/package.json`)

- `test:unit` — `tsx --test src/**/*.test.ts` (resolver/scanner/AST units next to sources).
- `test:cli` / `test:integration` — `node --test __tests__/unit/*.cjs`.
- `test:vite` / `test:next` — Playwright e2e against the fixtures (`__tests__/config/playwright.{vite,next}.config.js`).
- `pnpm test` (root) = eslint + all of the above + `smoke` (`packages/core/scripts/smoke-test.js`).
- Quick sanity per `.codex/project-memory.md`: `pnpm lint` + `pnpm --dir packages/core run build`.

## CI (GitHub Actions)

- `.github/workflows/ci.yml` — on push to main (packages/scripts/lockfile paths) + all PRs: install → lint → build → prepack → i-tarball → all five test suites. Playwright browsers cached.
- `.github/workflows/compat.yml` — weekly cron (Mon 14:00 UTC) + manual dispatch with version inputs: rewrites fixture React/Next versions via `scripts/set-compat-fixture-versions.mjs`, then runs the full pipeline against `latest`. This plus Dependabot (`.github/dependabot.yml`) is the compatibility strategy (decision in `.codex/project-memory.md`).
- `.github/workflows/release.yml.disable` — parked; see [[pages/Packages and Publishing]].
- Gotcha: both workflows pin `pnpm/action-setup` to **10.12.1** while root `packageManager` says **pnpm@11.3.0** — see [[pages/Open Questions and Risks]].

## Dev playground

`packages/core/dev/next/` is a hand-testing Next.js app (not a test fixture) with demo components and a checked-in `.zero-ui/` output example.

## Related

- [[pages/Operations Runbook]]
- [[pages/Core Library Internals]]
- [[pages/Packages and Publishing]]
