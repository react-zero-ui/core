# Demo + Benchmarks

<div align="center">

**See Zero-UI in action** with interactive demos and performance comparisons.

Experience the difference between React re-renders and Zero-UI's instant updates.

[**Live Demo**](https://zero-ui.dev/) | [**React Version**](https://zero-ui.dev/react) | [**Zero-UI Version**](https://zero-ui.dev/zero-ui)

</div>

---

## Interactive Examples

| Demo                  | Description                                       | Live Link                                  | Source Code                                                                             |
| --------------------- | ------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Interactive Menu**  | Side-by-side comparison with render tracker       | [Main Demo](https://zero-ui.dev/)          | [GitHub](https://zero-ui.dev/react)                                                     |
| **React Benchmark**   | Traditional React render path (10k nodes)         | [React 10k](https://zero-ui.dev/react)     | [GitHub](https://github.com/react-zero-ui/core/tree/main/examples/demo/src/app/react)   |
| **Zero-UI Benchmark** | Identical DOM with `data-*` switching (10k nodes) | [Zero-UI 10k](https://zero-ui.dev/zero-ui) | [GitHub](https://github.com/react-zero-ui/core/tree/main/examples/demo/src/app/zero-ui) |

> **Full Demo Source:** [Zero Rerender Demo](/examples/demo/)

---

## Why Zero-UI?

Every `setState` in React triggers the full **VDOM -> Diff -> Reconciliation -> Paint** pipeline. For _pure UI state_ (themes, menus, toggles) **that work is wasted**.

### Zero-UI's "PRE-rendering" Approach:

1. **Build-time:** Tailwind variants generated for every state
2. **Pre-render:** App renders once with all possible states
3. **Runtime:** State changes only flip a `data-*` attribute

**Result:** **5-10× faster visual updates** with **ZERO additional bundle cost**.

---

## Performance Benchmarks

<div align="center">

_Tested on Apple M1 - Chrome DevTools Performance Tab_

</div>

| **Nodes Updated** | **React State** | **Zero-UI** | **Speed Improvement** |
| :---------------: | :-------------: | :---------: | :-------------------: |
|      10,000       |     ~50 ms      |    ~5 ms    |    **10× faster**     |
|      25,000       |     ~180 ms     |   ~15 ms    |    **12× faster**     |
|      50,000       |     ~300 ms     |   ~20 ms    |    **15× faster**     |

> **Try it yourself:** Re-run these benchmarks using the demo links above with Chrome DevTools.

---

<div align="center">

### Ready to get started?

[**Get Started**](https://github.com/react-zero-ui/core/#quick-start) and never re-render again.

</div>
