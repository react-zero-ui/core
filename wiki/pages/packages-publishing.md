---
summary: "Package/export boundaries, validated pnpm tarballs, automatic npm publishing from GitHub releases, oss-release integration, and one-time npm authorization."
paths:
  - packages/core/package.json
  - packages/cli/package.json
  - packages/core/tsconfig.build.json
  - package.json
  - .npmrc
  - .oss-release.yaml
  - .oss-release.cli.yaml
  - .github/workflows/oss-release-trusted.yml
  - scripts/pack-release.mjs
  - scripts/write-size-badge.mjs
---

# Packages and Publishing

[Core's manifest](../../packages/core/package.json) owns public entry points and publish contents. Runtime hooks, Vite integration, CLI, and experimental helpers use ESM exports; the PostCSS export is CommonJS. [tsconfig.build.json](../../packages/core/tsconfig.build.json) emits `dist` and excludes source tests. Core's `prepack` rebuilds it. Preserve both module boundaries when changing packaging; fixture and smoke validation cover different consumer paths ([testing](build-test-ci.md)).

[create-zero-ui](../../packages/cli/package.json) ships its installer bin and depends on core through `workspace:^...`. The [setup page](core/setup-cli.md) owns installation behavior. Read manifests for versions and exact exports; historical memory is not a version source.

## Publishing constraint

Package with pnpm before publishing. Project memory records a prior consumer breakage from plain `npm publish` retaining the installer's `workspace:` dependency. The release workflow uses **`pnpm pack` followed by `npm publish <validated.tgz>`**: pnpm rewrites workspace dependencies, while npm handles OIDC trusted publishing. Never replace this with npm publishing the source directory. [Historical evidence and reasoning](../decision-log.md).

[pack-release.mjs](../../scripts/pack-release.mjs), exposed as `pnpm release:pack <packages/core|packages/cli> <version> [destination]`, checks the selected package/version, packs it, then inspects the actual tarball. It rejects local dependency protocols, missing published entry points/docs/license, included tests, and incorrect provenance repository metadata. Core's prepack hook builds its compiled files. This command does not publish.

## Release workflow

Publishing a GitHub Release triggers npm publication through [oss-release-trusted.yml](../../.github/workflows/oss-release-trusted.yml). This repo keeps independent package versions:

| Package | Config | Tag | Targets |
| --- | --- | --- | --- |
| `@react-zero-ui/core` | [.oss-release.yaml](../../.oss-release.yaml) (default) | `core-v<version>` | GitHub Release, npm |
| `create-zero-ui` | [.oss-release.cli.yaml](../../.oss-release.cli.yaml) | `cli-v<version>` | npm |

Update the package version, commit/push it to `main`, then publish a GitHub Release with the matching tag. For example, core version `0.4.4` uses `core-v0.4.4`; installer version `2.0.5` uses `cli-v2.0.5`. A draft release does not publish npm. The tagged commit must already contain the matching package version and workflow.

The workflow resolves the package from the tag, checks its manifest version, installs locked dependencies with the manifest's pnpm version on Node 24, prepares packed fixtures, runs `pnpm test`, and validates the selected tarball before publishing with npm OIDC. Node 24 is the release runner; package consumers still require Node >=22. The obsolete disabled release-please workflow was removed.

Release and manual-dispatch runs for the same tag are serialized. If npm already contains that version, the later run succeeds without publishing again; registry errors other than a missing version stop the run. This accommodates the shared CLI creating a GitHub Release and also dispatching the workflow. Prerelease versions or GitHub prereleases publish under npm's `next` tag; stable releases use `latest`. Promoting an existing npm version's dist-tag is a separate operation.

For a release, update the selected package's version and any affected lockfile entries first. When shipping a CLI update that requires a newer core, update its `workspace:^...` minimum too; release core before that CLI. Inspect `pnpm release:pack` output, run checks, and commit the changes on `main` before the release dry run. Never republish an existing npm version.

The shared `_oss-release` skill remains available for agent-driven checks, tags, GitHub Releases, dispatch, and registry verification. Its CLI config publishes the installer directly with its own tag, allowing both packages to release from one commit without the shared tool's "no new commits" GitHub Release restriction. The GitHub UI can also publish installer releases directly.

From the repository root, using the local skill wrapper:

```sh
release=/Users/austinserb/Desktop/agent-workspace/skills/_oss-release/scripts/oss-release
version=0.4.4 # Replace with the selected, committed package version.
"$release" check --repo "$PWD" --version "$version"
"$release" publish --repo "$PWD" --version "$version" --dry-run
# Only after the exact dry run succeeds and the user approves publication:
"$release" publish --repo "$PWD" --version "$version" --approve-npm
```

For the CLI, add `--config .oss-release.cli.yaml` to every command. The orchestrator does not bump versions; a real publish pushes `main` and the package tag, creates the configured GitHub Release for core, dispatches the workflow at that tag, and verifies publication. The workflow must be present on GitHub's default branch before dispatch. No version bump or release is implied by configuring this workflow.

## One-time npm setup

Both packages already exist on npm, so no initial manual publish is needed. In each package's npm **Settings → Trusted Publisher**, select **GitHub Actions**, organization/user **`react-zero-ui`**, repository **`core`**, workflow filename **`oss-release-trusted.yml`**, and enable **Allow npm publish**. Leave the optional environment empty. Complete npm's browser/2FA confirmation. No `NPM_TOKEN` or recurring local npm login is needed for GitHub publishing.

Follow the [npm trusted publisher documentation](https://docs.npmjs.com/trusted-publishers/) and the `_oss-release` skill for human authorization. A successful `npm login` does not by itself authorize npm trust management; npm can require a separate 2FA challenge even for `npm trust list`. npm requires the first publish within two days of creating a new trusted-publisher connection, so finish that setup near the first release.

The shared CLI's `setup` command unconditionally regenerates a generic npm workflow. It does not support this repo's pnpm install/pack steps or the second config. **Do not rerun `init`/`setup` over the maintained workflow.** Configure/verify the two npm connections with `npm trust github` / `npm trust list` as documented in the skill's npm reference; keep using the shared CLI for `check`, `publish`, and `verify`. Future generator upgrades need review against this workspace contract.

Tracked configuration establishes the intended process, not proof that GitHub has the workflow, npm trust is configured, or a release succeeded. Verify those external states before the first release.

## Size artifacts

Build before measuring. Root `pnpm size` bundles core with React external, minifies production output, then gzips it. `pnpm size:badge` writes the README badge through [write-size-badge.mjs](../../scripts/write-size-badge.mjs). Refresh the badge when shipping a changed bundle. Experimental runtime has a separate size command; neither historical size prose nor an old badge proves a new artifact's size.
