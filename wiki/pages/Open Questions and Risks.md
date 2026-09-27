# Open Questions and Risks

## What This Is

The lint target: loose ends found during vault init (2026-07-07). Move items out as they resolve.

## Risks

- **pnpm version mismatch**: root `package.json` pins `packageManager: pnpm@11.3.0`, but `.github/workflows/ci.yml` and `compat.yml` pin `pnpm/action-setup` to `10.12.1`. Lockfile-format or resolution drift between local and CI is possible. No source explains the split.
- **`workspace:^` publish hazard**: `packages/cli` → core dependency breaks consumers if published with `npm publish`; must use `pnpm publish` ([[pages/Packages and Publishing]]).
- **Release automation parked**: `.github/workflows/release.yml.disable` references `.release-please-config.json`, which does not exist in the repo. Re-enabling it as-is would fail.

## Open Questions

- Where is zero-ui.dev hosted/deployed? No deploy config in-repo; presumed Vercel via GitHub integration — unverified.
- `docs/rules.md` is empty (0 bytes). Delete or write it?
- Is `examples/demo` the long-term home for the website, or does it move to something like `apps/docs`? Root `CONTRIBUTING.md` calls it an "apps/docs replacement", suggesting a past/planned migration.
- `.codex/project-memory.md` (2026-04) lists "automated SEMVER-based publishing" as a next action and docs-site help-wanted issue #32 for outside contributors — status of both unknown as of 2026-07-07.

## Staleness Watch (frozen sources — verify before trusting)

- `.codex/project-memory.md` — versions and in-flight work are from 2026-04; decisions section still largely valid. Per `CONTRIBUTING.md` it's meant to stay current, so future sessions may update it; this wiki holds the durable synthesis.
- `packages/core/ARCHITECTURE.md` + `docs/internal.md` — pipeline description valid, filenames stale (`.cts` → `.ts`).
- `docs/CONTRIBUTING.md` — superseded by root `CONTRIBUTING.md`.
- Root `CONTRIBUTING.md` monorepo diagram — mislabels `docs/` vs `examples/demo/` ([[pages/Docs and Website]]).

## Assumptions made at init (user unavailable)

- Vault location `wiki/` in-repo and scope (codebase + npm/docs/examples ecosystem) were specified by the user.
- Chose to treat in-repo docs as raw sources *in place* (pointed at by the manifest) rather than copying them into `raw/` — they're version-controlled here already.
- Treated the disabled release workflow as the only "parked" feature needing a status entry; experimental runtime is shipped-experimental, not parked, so it got a full page.

## Related

- [[pages/Packages and Publishing]]
- [[pages/Docs and Website]]
- [[pages/Build Test and CI]]
