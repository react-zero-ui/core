# React Zero-UI Wiki

Project knowledge for coding agents. Usage Steps:

1. Read [Project Overview](./pages/project-overview.md).
2. Read `index.md`.
3. Follow only branches relevant to current task.
4. Open smallest useful set of pages.
5. Verify drift-prone facts against repository evidence.

Use `raw/index.md` only when supporting evidence is needed. Raw source bodies are preserved evidence, not maintained synthesis.
Read `decision-log.md` only when historical reasoning or why the project took its current direction matters.

Routable pages use:

`<descriptive-filename-slug>.md`:

```
---
summary: "Concise description of this page."
paths:
  - src/related-files/
  - src/related-file.ts
---

[content]
```

For maintenance, read [maintenance.md](maintenance.md).
