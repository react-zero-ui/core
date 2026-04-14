# Internal docs

Below is a **"mental model"** of the Zero‑UI variant extractor-distilled so that _another_ human (or LLM) can reason about, extend, or safely refactor the code‑base.

---

## 1. Top‑level goal

1. **Locate every hook call** `(ast-parsing.cts) -> collectUseUIHooks`

```ts
const [value, setterFn] = useUI("stateKey", "initialValue");
```

2. **Resolve** (using §3) the `stateKey` and `initialValue` arguments **at build‑time.**

- `stateKey` must be a _local_, static string.
- `initialValue` follows the same rule.

3. **Globally scan all project files** for **variant tokens that match any discovered `stateKey`**, regardless of where hooks are declared. `(scanner.cts) -> scanVariantTokens`

_Examples_

```html
<!-- stateKey‑true:bg-black  ->  value = "true" -->
<div class="stateKey-true:bg-black" />
<!-- theme‑dark:text-white  ->  value = "dark" -->
```

```bash
             ┌────────────┐
             │  Phase A   │   Parse + collect hooks
source files ─►           ├─► hooks[], global keySet
             └────────────┘
                    ▼
             ┌────────────┐
             │  Phase B   │   Regex-scan every file
source files ─►           ├─► Map<key,Set<value>>
             └────────────┘
                    ▼
             build VariantData[]
```

4. **Aggregate results** into an array of `VariantData` objects `(ast-parsing.cts)`

   ```ts
   type VariantData = {
   	key: string; // 'stateKey'
   	values: string[]; // ['light', 'dark', …]  (unique & sorted)
   	initialValue: string; // from 2nd arg of useUI()
   	scope: "global" | "scoped";
   };
   ```

5. **Emit Tailwind** `@custom-variant` for every `key‑value` pair `(helpers.cts) -> buildCss`

```ts
function buildLocalSelector(keySlug: string, valSlug: string): string {
	return;
	`[data-${keySlug}="${valSlug}"] &, &[data-${keySlug}="${valSlug}"] { @slot; }`;
}

function buildGlobalSelector(keySlug: string, valSlug: string): string {
	return;
	`&:where(body[data-${keySlug}='${valSlug}'] &) { @slot; }`;
}
```

6. **Generate the attributes file** so SSR can inject the `<body>` data‑attributes `(helpers.cts) -> generateAttributesFile`.

---

## 2. Pipeline overview (AST + global token scan)

| Stage                            | Scope & algorithm                                                                                                                                                                        | Output                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **A - collectUseUIHooks**        | Single AST traversal per file.<br>• Validate `useUI()` shapes.<br>• Resolve **stateKey** and **initialValue** with **`literalFromNode`** (§3).<br>• Builds global set of all state keys. | `HookMeta[]` = `{ stateKey, initialValue }[]`, global `Set<stateKey>` |
| **B - global scanVariantTokens** | Single global regex scan pass over all files (same glob and delimiters Tailwind uses).<br>Matches tokens for **every stateKey discovered in Stage A**.                                   | `Map<stateKey, Set<value>>`                                           |

The pipeline now ensures tokens are captured globally-regardless of hook declarations in each file.

---

## 3. The literal‑resolution micro‑framework

Everything funnels through **`literalFromNode`**. Think of it as a deterministic _static evaluator_ restricted to a very small grammar.

### 3.1 Supported input forms (stateKey & initialValue)

```bash
┌──────────────────────────────┬──────────────────────────┐
│ Expression                   │ Accepted? -> Returns     │
├──────────────────────────────┼──────────────────────────┤
│ "dark"                       │  string literal        │
│ `dark`                       │  template literal      │
│ `th-${COLOR}`                │  if COLOR is const     │
│ "a" + "b"                    │  -> "ab"               │
│ a || b, a ?? b               │  tries left, then right│
│ const DARK = "dark"          │  top-level const only  │
│ THEMES.dark                  │  const object access   │
│ THEMES["dark"]               │  computed property     │
│ THEMES[KEY]                  │  if KEY is const       │
│ THEMES.brand.primary         │  nested objects        │
│ COLORS[1]                    │  array access          │
│ THEMES?.dark                 │  optional chaining     │
│ { dark: "theme" } as const   │  TS const assertion    │
├──────────────────────────────┼──────────────────────────┤
│ import { X } from './file'   │  throws:use local const│
│ let/var THEME                │  only const allowed    │
│ function() { const X }       │  must be top-level     │
│ someFunction()               │  no dynamic values     │
│ THEMES.nonexistent           │  throws: not found     │
│ Math.random()                │  no runtime values     │
└──────────────────────────────┴──────────────────────────┘
```

**Note:** All values must be resolvable at build time to static strings.

### 3.2 Resolvers

| Helper                            | Purpose                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **`resolveTemplateLiteral`**      | Ensures every `${expr}` resolves via `literalFromNode`.                                                                                     |
| **`resolveLocalConstIdentifier`** | Maps an `Identifier` -> its `const` initializer _iff_ initializer is a local static string/template. Imported bindings rejected explicitly. |
| **`resolveMemberExpression`**     | Static walk of `obj.prop`, `obj['prop']`, `obj?.prop`, arrays, numeric indexes, optional‑chaining… Throws if unresolved.                    |
| **`literalFromNode`**             | Router calling above; memoised (`WeakMap`) per AST node.                                                                                    |

Resolvers throw contextual errors via **`throwCodeFrame`** (`@babel/code-frame`).

---

## 4. Validation rules

| Position in `useUI`      | Allowed value       | Example error                                 |
| ------------------------ | ------------------- | --------------------------------------------- |
| **stateKey (arg 0)**     | Local static string | `State key cannot be resolved at build‑time.` |
| **initialValue (arg 1)** | Same rule as above. | `Initial value cannot be resolved …`          |

Imported bindings must be re‑cast locally.

---

## 5. Performance notes

- **Global LRU file‑cache** avoids re‑parsing unchanged files (`mtime:size`).
- **Parallel parsing** (`os.cpus().length-1` concurrent tasks).
- **Regex-based global token scanning** (fast Tailwind‑style parsing).

---

## 6. Unsupported cases

- Runtime constructs (`import.meta`, dynamic imports).
- Cross‑file constants.
- Non‑string values (numbers, booleans).
- Private class fields.
- No analysis of setter functions (runtime-only).
