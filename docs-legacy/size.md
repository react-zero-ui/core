# Bundle Size Proof

This repo measures bundle size from the built `@react-zero-ui/core` entry.

## Command

```bash
pnpm build
pnpm size
pnpm size:badge
```

The `size` script in [`package.json`](../package.json) runs:

```bash
npx esbuild ./packages/core/dist/index.js --bundle --minify --format=esm --external:react --define:process.env.NODE_ENV='"production"' | gzip -c | wc -c
```

That produces the gzipped byte count used for the README badge.

## Badge File

Run `pnpm size:badge` after a build when you want to refresh the badge JSON.

That writes:

- [`core-size.json`](../.github/badges/core-size.json)

The README badge reads from that committed file through a Shields endpoint.
