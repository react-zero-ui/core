---
summary: "React Zero-UI's CSS-driven state model, engineering approach, and invariants shared by build tooling and runtime."
---

# Project Overview

React Zero-UI is a React library for CSS-driven UI state. Build tooling extracts state declarations and generates Tailwind variants plus initial DOM attributes. Small client setters mutate attributes or CSS variables; React does not recompute component output when those setters run. Presentation must already exist in markup and CSS.

Keep changes pre-rendered, declarative, and fast: this is the engineering direction in [CONTRIBUTING.md](../../CONTRIBUTING.md). Preserve the boundary between static extraction and DOM updates when extending APIs. A new hook shape or state representation can affect the compiler, generated attributes, and runtime together.

State keys and initial values must resolve locally at build time. Across one scanned app, each key has one initial value and one global/scoped meaning. Generated body attributes seed global state; component markup supplies scoped initial attributes. These contracts connect [runtime hooks](core/runtime-hooks.md) and [variant extraction](core/variant-extractor.md).
