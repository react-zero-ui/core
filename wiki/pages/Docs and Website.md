# Docs and Website

## What This Is

Where documentation lives and how zero-ui.dev is built. Verified 2026-07-07.

## Two doc surfaces — don't confuse them

1. **`docs/*.md`** — plain GitHub-rendered markdown, linked from the README: `api-reference.md`, `usage-examples.md`, `installation-next.md`, `installation-vite.md`, `faq.md`, `migration-guide.md`, `experimental.md`, `demo.md`, `size.md`, `internal.md`, `CONTRIBUTING.md`.
2. **`examples/demo/`** — the actual **zero-ui.dev website**: a private Next.js 15 + Fumadocs app (package name `docs` in `examples/demo/package.json`; fumadocs-core/mdx/ui, MDX content under `examples/demo/content/docs/`, `source.config.ts`). It's in the pnpm workspace via `examples/*` (`pnpm-workspace.yaml`). It also dogfoods `@react-zero-ui/core` and showcases `@react-zero-ui/icon-sprite` (separate repo) at `/icon-sprite`, with `zero-icons` running in `prebuild`.

> Staleness note: the structure diagram in root `CONTRIBUTING.md` has these swapped — it labels `docs/` as "Next.js + Fumadocs docs site" and `examples/demo/` as just a "showcase app". Reality is above. Recorded in `raw/source-manifest.md`.

## Website details

- SEO/branding source of truth: `examples/demo/app/config/site-config.ts` (`DOMAIN_URL` = zero-ui.dev in production, SITE_NAP with schema.org data via `schema-dts`).
- SEO surface: `app/robots.ts`, `app/sitemap.ts`, `app/og/`, `app/llms-full.txt`, redirects in `next.config.mjs` (e.g. `/lucide-react` → `/icon-sprite`).
- Hosting: not declared in-repo (no vercel.json / CI deploy). Presumed Vercel-connected to the GitHub repo — unverified, see [[pages/Open Questions and Risks]].

## Known dead/duplicate doc files

- `docs/rules.md` is **empty (0 bytes)**.
- `docs/CONTRIBUTING.md` is a stale, shorter copy of root `CONTRIBUTING.md` (missing the monorepo diagram and bundle-size sections).
- `docs/internal.md` ≈ duplicate of `packages/core/ARCHITECTURE.md` (both carry the stale `.cts` filenames — see [[pages/Core Library Internals]]).
- `examples/demo/README.md` duplicates the root `README.md`.

## Conventions

- Docs style decision (from `.codex/project-memory.md`): no emoji in markdown docs/templates; README kept tight with `<small>` tags for scannability.

## Related

- [[pages/React Zero-UI]]
- [[pages/Operations Runbook]]
- [[pages/Open Questions and Risks]]
