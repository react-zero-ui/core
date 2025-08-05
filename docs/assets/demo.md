## 🚀 Demo + Benchmarks

| Example | Link | What it shows | Link to Code |
| -- | -- | -- | -- |
| Interactive menu with render tracker    |  [Main Demo](https://zero-ui.dev/)   | Compare Zero‑UI vs. React side‑by‑side while toggling a menu. | [Github](https://zero-ui.dev/react)   |
| React benchmark (10 000 nested nodes)   | [React 10k](https://zero-ui.dev/react)   | How long the traditional React render path takes.   | [Github](https://github.com/react-zero-ui/core/tree/main/examples/demo/src/app/react)   |
| Zero‑UI benchmark (10 000 nested nodes) | [Zero‑UI 10k](https://zero-ui.dev/zero-ui) | Identical DOM, but powered by Zero‑UI's `data-*` switch.   | [Github](https://github.com/react-zero-ui/core/tree/main/examples/demo/src/app/zero-ui) |

source code for the demo: [Zero Rerender Demo](/examples/demo/)

---

## 🧐 Why Zero‑UI?

Every `setState` in React triggers the full VDOM → Diff → Reconciliation → Paint pipeline. For _pure UI state_ (themes, menus, toggles) that work is wasted.

**Zero‑UI introduces "_PRE‑rendering_":**

1. Tailwind variants for every state are **generated at build‑time**.
2. The app **pre‑renders once**.
3. Runtime state changes only **flip a `data-*`**.

Result → **5-10× faster visual updates** with **ZERO additional bundle cost**.

### 📊 Micro‑benchmarks (Apple M1)

| Nodes updated | React state | Zero‑UI | Speed‑up |
| ------------- | ----------- | ------- | -------- |
| 10,000        | \~50 ms     | \~5 ms  | **10×**  |
| 25,000        | \~180 ms    | \~15 ms | **12×**  |
| 50,000        | \~300 ms    | \~20 ms | **15×**  |

Re‑run these numbers yourself via the links above with chrome dev tools.

---