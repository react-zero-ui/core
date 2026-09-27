# Secret Handling

Use this vault to document where credentials live and what they are for. **Do not commit real secret values — anywhere in this vault, including `_private/`.**

## Pattern

- Public wiki pages may list env variable names, service names, and code paths.
- Actual secret values live in the maintainer's npm account, GitHub repo/organization secrets, or local `.env` files.
- Local-only notes (account owners, portal URLs, rotation steps) go in `_private/secrets-map.local.md`. That folder is gitignored.

## Current Env Names

This is an open-source library repo — verified 2026-07-07 there are **no application secrets**: no `.env*` files, and the only `process.env` reads are `NODE_ENV`, `PATH` (tests), and `DRY_RUN` (`scripts/set-compat-fixture-versions.mjs`).

Credentials that exist outside the repo:

- npm publish auth for `@react-zero-ui/core` and `create-zero-ui` — maintainer's npm account (publishes are manual via `pnpm publish`).
- `secrets.GITHUB_TOKEN` — GitHub-provided, used by the (currently disabled) `.github/workflows/release.yml.disable`.
- zero-ui.dev hosting credentials — provider unverified (presumed Vercel), see `[[pages/Open Questions and Risks]]`.

## Service Owners

- npm packages, GitHub org `react-zero-ui`, zero-ui.dev domain: Austin Serb (project owner).

## Hard Rules

- Never expose secrets in logs, client code, third-party tools, or uploaded AI context.
- Only framework-public vars (e.g. `NEXT_PUBLIC_*`) may reach the browser.
