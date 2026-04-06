# Project Working Memory

## App Summary

- React Zero-UI is a monorepo for a build-time React UI state library and setup CLI.
- Main published packages are `@react-zero-ui/core` and `create-zero-ui`.
- The project targets React developers using Tailwind with Next.js or Vite.

## Current Focus

- Keep docs, metadata, and release-related repo details aligned after the `@react-zero-ui/core@0.4.0` and `create-zero-ui@2.0.1` updates.

## In-Flight Work

- Docs cleanup completed: markdown docs and templates had emoji removed.
- Root `README.md` was tightened and the Serbyte backlink was added.
- Root `README.md` had a few `small` tags restored where they still help scanability.

## Latest Decisions

- Node support is standardized at `>=22` across the repo and published packages.
- `packages/eslint-zero-ui` was removed from the monorepo because it was no longer being pursued.
- Compatibility checks now use Dependabot plus a scheduled GitHub Actions workflow.
- PostCSS runtime no longer auto-runs CLI init; initialization belongs to explicit setup paths.

## Blockers / Risks

- `packages/cli/package.json` currently uses `workspace:^0.4.0`; safe for monorepo work, but publishing with plain `npm publish` would break consumers again. use `pnpm publish` instead.

## Next Actions

- Keep docs-site/help-wanted issue `#32` available for outside contributors.
- Add automated SEMVER-based publishing to the GitHub Actions workflow.

## Open Questions

- None.

## Resume Fast

- Start with `README.md`, `packages/cli/package.json`, and `.github/workflows/compat.yml` if release/docs follow-up work continues.
- Use `pnpm lint` and `pnpm --dir packages/core run build` as the quickest repo-wide sanity checks after nontrivial edits.

## Updated

- 2026-04-06 14:13 MDT

## Project End Goals (future reference)

- Make React Zero-UI a reliable, fast, well-documented open source UI state tool with clear setup, modern framework compatibility, and a stronger docs/demo experience.
