---
summary: "Deployment evidence limits, release credential boundaries, and preservation of ignored local wiki notes."
paths:
  - examples/demo/next.config.mjs
  - examples/demo/app/config/site-config.ts
  - .github/workflows/
  - .gitignore
---

# Operations

## Deployment knowledge

Website config identifies `zero-ui.dev`, but tracked configuration does not establish its hosting provider, deployed branch, account, or deployment procedure. No website deployment job is present in [.github/workflows](../../.github/workflows/). Verify these details with deployment access before changing production. The old wiki's Vercel suggestion was an unconfirmed guess.

## Credentials and local notes

The [release workflow](../../.github/workflows/oss-release-trusted.yml) publishes npm packages when a matching GitHub Release is published, using GitHub's `id-token: write` permission for short-lived OIDC credentials. Each npm package needs its own trusted-publisher connection to `react-zero-ui/core` and that workflow filename; no long-lived `NPM_TOKEN` is required. The local release orchestrator can also use `gh` authentication to push releases and dispatch Actions. [Publishing](packages-publishing.md) owns setup and release steps. Tracked configuration does not prove those external permissions are configured.

Preserve the existing wiki convention: record service names, credential locations, owners, and rotation procedures without credential values. Local account notes belong under `wiki/_private/`, ignored by [.gitignore](../../.gitignore); they are not part of wiki routing or shared evidence. Do not infer an absence of secrets from checked-in environment-variable usage.

For local development and validation, use [build, tests, and CI](build-test-ci.md).
