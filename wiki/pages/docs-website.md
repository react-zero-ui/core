---
summary: "Independent GitHub Markdown and Fumadocs MDX surfaces, shared website routing/SEO owners, and the external icon-sprite build dependency."
paths:
  - examples/demo/package.json
  - examples/demo/source.config.ts
  - examples/demo/lib/source.ts
  - examples/demo/next.config.mjs
  - examples/demo/postcss.config.mjs
  - examples/demo/app/config/
  - examples/demo/app/layout.tsx
  - examples/demo/app/docs/
  - examples/demo/app/api/search/route.ts
  - examples/demo/app/llms-full.txt/route.ts
  - examples/demo/app/sitemap.ts
  - examples/demo/app/robots.ts
---

# Docs and Website

`docs/` contains GitHub Markdown linked from the root README. The actual zero-ui.dev website is the private Next.js/Fumadocs app in `examples/demo/`. Its [MDX content](../../examples/demo/content/docs/) is maintained separately; editing `docs/*.md` does not update website pages. The root contributing guide's directory diagram misidentifies these roles.

## Content and routing

[source.config.ts](../../examples/demo/source.config.ts) defines the MDX collection and enables processed Markdown. [lib/source.ts](../../examples/demo/lib/source.ts) exposes the Fumadocs loader used by docs routes, search, sitemap, generated Open Graph images, and `llms-full.txt`. Update the shared source pipeline when changing content representation; avoid separate page inventories in those consumers.

[site-config.ts](../../examples/demo/app/config/site-config.ts) owns domain, branding, and named routes. [Docs routing](../../examples/demo/app/docs/) renders loader pages and derives metadata. [sitemap.ts](../../examples/demo/app/sitemap.ts) combines static routes with loader pages; [robots.ts](../../examples/demo/app/robots.ts) uses the same domain. Redirects belong to [next.config.mjs](../../examples/demo/next.config.mjs).

## Build boundaries

The website consumes core as a package and spreads generated body attributes in [app/layout.tsx](../../examples/demo/app/layout.tsx). It also consumes `@react-zero-ui/icon-sprite`, maintained in a separate repository. [Package scripts](../../examples/demo/package.json) run `zero-icons` before production build and `fumadocs-mdx` after install; generated sprite and MDX artifacts are part of its build prerequisites.

Use `pnpm --dir examples/demo dev` or `pnpm --dir examples/demo build`. Root build and CI target core rather than the website ([testing](build-test-ci.md)). Deployment ownership remains [unverified](operations.md).

Older pipeline notes in `packages/core/ARCHITECTURE.md` and `docs/internal.md` still cite `.cts` extractor filenames. Use the [current compiler map](core/variant-extractor.md) for source navigation. The demo README repeats product documentation with local differences; it does not define site wiring.
