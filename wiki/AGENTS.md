# React Zero-UI Wiki Maintainer

This vault follows the LLM wiki pattern from Andrej Karpathy's "LLM Wiki" gist (`https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f`): raw sources are read-only evidence, the wiki is maintained markdown, and this file is the schema for future agents.

The vault lives at `wiki/` at the repo root. Everything here is committed except `_private/`, which is gitignored.

## Purpose

- Preserve high-level knowledge about React Zero-UI that should survive individual chats.
- Make future work faster: monorepo layout, the variant-extractor pipeline, publishing rules, CI, the docs site, and open risks.
- Keep synthesis in the wiki instead of forcing every future agent to rediscover it from raw repo files.

## Layers

- `raw/`: source manifest and source notes. Read-only evidence pointers unless the user asks to add a new source. For this repo the raw sources are the in-repo docs themselves (`README.md`, `CONTRIBUTING.md`, `docs/*.md`, `packages/core/ARCHITECTURE.md`, `.codex/*.md`) — they stay where they are; the manifest points at them.
- `pages/`: maintained wiki pages. Update these when new facts change the synthesis.
- `ops/`: operational conventions (e.g., secret handling).
- `templates/`: page templates for future additions.
- `_private/`: gitignored local-only notes. Never commit; never store secret values even here — store locations and pointers.
- `index.md`: content map. Update whenever pages are added or renamed.
- `log.md`: chronological append-only maintenance log. Entry format: `## [YYYY-MM-DD] operation | short description` (consistent prefixes keep the log parseable with standard tools).

## Wiki Rules

- Prefer Obsidian wikilinks: `[[pages/Page Name]]` (vault root is `wiki/`).
- Put durable synthesis in `pages/`, not chatty notes.
- Cite concrete repo paths for implementation facts (relative to repo root).
- If sources disagree, do not hide it. Add a "Staleness / conflict" note and point to the newer source when known.
- Do not store secret values, passwords, tokens, or API keys anywhere in this vault — including `_private/`. Documenting env var *names*, owning services, and rotation locations is OK.
- Legacy docs ingested as raw sources may be stale (`.codex/project-memory.md` and `packages/core/ARCHITECTURE.md` already were at init). **Verify against current code before promoting any claim from them into a page.**
- Package versions drift fast in this repo. Re-check `packages/core/package.json` and `packages/cli/package.json` before repeating any version number as current.
- Use short pages with clear headings. Make one page useful before making many pages clever.

## Ingest Workflow

1. Add the source to `raw/source-manifest.md`.
2. Read only the relevant source sections.
3. Update existing pages before creating a new one.
4. Add backlinks between related concepts.
5. Update `index.md` if pages were added or renamed.
6. Append a `log.md` entry with source, pages touched, and unresolved questions.

## Query Workflow

1. Read `index.md`.
2. Open the 1-3 most relevant pages.
3. Answer from the wiki when current enough.
4. If the answer may drift (package versions, npm state, CI config, docs-site deps), verify against the repo before presenting it as current.
5. If the synthesis was valuable and evidence-backed, file it back into the wiki as a new or updated page (with citations, index entry, and log entry) — explorations should compound. Never file back an answer that lacks source or code backing; unbacked pages are how hallucinations compound.

## Lint Workflow

Periodically check for:

- Pages listed in `index.md` that no longer exist.
- Orphan pages: pages missing from `index.md` or with no inbound wikilinks.
- Contradictions between wiki pages (two pages asserting conflicting facts).
- Important pages missing backlinks.
- Stale claims inherited from legacy docs.
- Any accidental secret values.
- Open questions that were answered but never folded into normal pages.
