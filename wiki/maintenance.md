# Wiki Maintenance

Wiki pages and raw-source metadata are agent-authored. Generated indexes are derived routing artifacts.

## Front Matter Metadata

- `summary` is required for routable pages and should stay concise. `wiki clean` warns above 240 characters.
- `paths` is optional and defines the source scope whose meaningful changes could invalidate the page's knowledge. Do not aim for complete repository path coverage. `project-overview.md` should usually omit `paths` unless a narrow source scope genuinely governs its global knowledge.
- Update front matter when a page's knowledge scope changes.

When creating a nested knowledge directory, add an `index.md` with only a `summary` in front matter. `wiki clean` generates and maintains the index body.

## Page Structure

These are not hard rules but heuristics:

- Keep one cohesive subject per page.
- `wiki clean` warns when `project-overview.md` exceeds 2,000 words or another routable page exceeds 3,000 words. These are review thresholds, not targets or limits.
- Keep indexes small enough to route cheaply. Roughly 10–20 entries is a useful heuristic, not a limit.
- Split large knowledge areas into meaningful nested directories. The hierarchy may recurse as needed.
- Keep supporting evidence under `raw/`.

## Freshness Audit

`wiki audit` compares the current Git-visible contents under each page's `paths` with the fingerprint recorded when that page was last reviewed. A mismatch means review is suggested, not that the page is necessarily stale. Pages without `paths` are not audited.

- Keep `.wiki-system/audit-state.json` committed with the wiki, but treat `.wiki-system/` as machine-maintained state; do not read or edit it directly.
- After creating or migrating a reviewed wiki, run `wiki audit baseline` once. It records only pages without an existing baseline and never clears later review warnings.
- After reviewing a reported page against current source, update the page if needed, then run `wiki audit mark <wiki-page>` to record the reviewed state. Mark it even when review confirms that no wiki content change is needed.
- `wiki audit` includes tracked files and non-ignored untracked working-tree files, so it can detect relevant changes before they are committed.
- Repeated irrelevant audit warnings suggest a page's `paths` are too broad; missed stale knowledge suggests they are too narrow.

## Raw Sources

Raw sources are read-only captured evidence originating outside the maintained semantic wiki, such as confirmed interview transcripts or copied human-authored documentation.

- Ingest external evidence by copying it into `raw/`; never move or delete the original source. Capture all raw evidence as Markdown, converting copied source material to Markdown when necessary.
- When first ingesting a raw source, add front matter containing only a concise `summary` describing what the source is and why it matters. Write summaries as routing signals. A summary should help an agent decide whether to open the page from an index, including the behaviors or boundaries that distinguish it from neighboring pages.
- Preserve the captured body after ingestion. Do not edit an existing raw source without explicit user approval.
- `wiki clean` generates `raw/index.md` from raw Markdown summaries, including Markdown stored in nested raw directories.

## Decision Log

`decision-log.md` preserves major historical reasoning that explains why the project took its current direction. Add a concise entry when a significant decision, reversal, discovery, rejected approach, validation, or lesson from real usage would help a future agent and the reasoning is not obvious from the current code, wiki, or Git history. Do not use it as a changelog.

Before finishing substantial wiki maintenance, ask whether the work exposed or changed durable reasoning that will still matter after the implementation details are forgotten. If yes, append one concise entry.

## Cleanup

After adding, moving, renaming, deleting, or materially changing wiki pages or ingesting raw Markdown sources, run `wiki clean` to regenerate indexes from current metadata and structure. Fix reported errors and useful warnings in the owning metadata.
