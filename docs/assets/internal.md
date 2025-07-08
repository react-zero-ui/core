Below is a **“mental model”** of the Zero-UI variant extractor. distilled so that _another_ human (or LLM) can reason about, extend, or safely refactor the code-base.

---

## 1. Top-level goal

- **Locate every call** to a user-supplied React hook

  ```js
  const [value, setterFn] = useUI('stateKey', 'initialValue');
  ```

- Statically discover **all possible string values** that flow into
  `stateKey`, `initialValue`, and `setterFn()` arguments.
  - `stateKey` can resolve to a local static string.
  - `initialValue` is the same rule as above.
  - `setterFn()` argument is many forms allowed (see table 3.1) but **must be resolvable**; otherwise the value is ignored (silent) _unless_ it looked resolvable but failed inside the helpers, in which case a targeted error is thrown.
  - Imported bindings are never allowed - the dev must re-cast them through a local `const`.

- Report the result as a list of `VariantData` objects.

```ts
type VariantData = {
	key: string; // 'stateKey'
	values: string[]; // ['light','dark',…]   (unique, sorted)
	initialValue: string; // from 2nd arg of useUI()
};
```

---

## 2. Two-pass pipeline

| Pass                               | File-scope work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Output                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Pass 1 - `collectUseUISetters`** | 1. Traverse the AST once.<br>2. For each `useUI()` destructuring:<br>• validate shapes & count.<br>• resolve the **state key** and **initial value** with **`literalFromNode`** (see rules below).<br>• grab the **binding** of the setter variable.                                                                                                                                                                                                                                                                                   | `SetterMeta[]` = `{ binding, setterName, stateKey, initialValue }[]` |
| **Pass 2 - `harvestSetterValues`** | 1. For every `binding.referencePaths` (i.e. every place the setter is used)<br>2. Only keep `CallExpression`s: `setX(…)`<br>3. Examine the first argument:<br>• direct literal / identifier / template → resolve via `literalFromNode`.<br>• conditional `cond ? a : b` → resolve both arms.<br>• logical fallback `a \|\| b`, `a ?? b` → resolve each side.<br>&nbsp;&nbsp; arrow / function bodies → collect every returned expression and resolve.<br>4. Add every successfully-resolved string to a `Set` bucket **per stateKey**. | `Map< stateKey, Set<string> >`                                       |

`normalizeVariants` just converts that map back into the
`VariantData[]` shape (keeping initial values, sorting, etc.).

---

## 3. The **literal-resolution micro-framework**

Everything funnels through **`literalFromNode`**.
Think of it as a deterministic _static evaluator_ restricted to a
_very_ small grammar.

### 3.1 Supported input forms (setterFn())

```
┌────────────────────────────────┬─────────────────────────┐
│ Expression                     │ Accepted? → Returns     │
├────────────────────────────────┼─────────────────────────┤
│ dark                           │ ✔ string literal        │
│ `th-${COLOR}`                  │ ✔ if every `${}`resolves│
│ const DARK                     │ ✔ if IDENT → const str  │
│ THEMES.dark/[idx]/?.           │ ✔ if the whole chain is │
│                                │   top-level `const`     │
│ "a" + "b"                      │ ✔ "ab"                  │
│ a ?? b or a || b               │ ✔ Attempts to resolve   │
│                                │   both sides            │
│prev =>(prev=== 'a' ? 'b' : 'a')│  "a" ,"b"               │
│ Anything imported              │ ❌ Hard error           │
│ Anything dynamic at runtime    │ ❌ Returns null / error │
└────────────────────────────────┴─────────────────────────┘
```

### 3.2 Helpers

| Helper                            | Job                                                                                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`resolveTemplateLiteral`**      | Ensures every `${expr}` itself resolves to a string via `literalFromNode`.                                                                                                    |
| **`resolveLocalConstIdentifier`** | Maps an `Identifier` → its `const` initializer _if_ that initializer is an accepted string/ template. Rejects imported bindings with a _single_ descriptive error.            |
| **`resolveMemberExpression`**     | Static walk of `obj.prop`, `obj['prop']`, `obj?.prop`, etc. Works through `as const`, optional-chaining, arrays, numbers, nested chains. Throws if any hop can't be resolved. |
| **`literalFromNode`**             | Router that calls the above; memoised (`WeakMap`) so each AST node is evaluated once.                                                                                         |

All helpers accept `opts:{ throwOnFail, source, hook }` so _contextual_
error messages can be emitted with **`throwCodeFrame`**
(using `@babel/code-frame` to show a coloured snippet).

---

## 4. Validation rules (why errors occur)

| Position in `useUI`      | Allowed value                                                                                                                                                                                                 | Example error                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **stateKey (arg 0)**     | _Local_ static string                                                                                                                                                                                         | `State key cannot be resolved at build-time.` |
| **initialValue (arg 1)** | Same rule as above.                                                                                                                                                                                           | `Initial value cannot be resolved …`          |
| **setter argument**      | Many forms allowed (see table 3.1) but **must be resolvable**; otherwise the value is ignored (silent) _unless_ it looked resolvable but failed inside the helpers, in which case a targeted error is thrown. |                                               |

Imported bindings are never allowed - the dev must re-cast them
through a local `const`.

---

## 5. Optional-chain & optional-member details

- The updated `resolveMemberExpression` loop iterates while
  `isMemberExpression || isOptionalMemberExpression`.
- Inside array/obj traversal it throws a clear error if a link is
  missing instead of silently returning `null`.
- `props` collects mixed `string | number` keys in **reverse** (deep → shallow) order, so they can be replayed from the root identifier outward.

---

## 6. Performance enhancements

- **Memoisation** (`WeakMap<node,string\|null>`) across _both_ passes.
- **Quick literals** - string & number keys handled without extra calls.
- `throwCodeFrame` (and thus `generate(node).code`) runs **only** on
  failing branches.
- A small **LRU file-cache** (<5k entries) avoids re-parsing unchanged
  files (mtime + size signature, with hash fallback).

---

## 7. What is **not** supported

- Runtime-only constructs (`import.meta`, env checks, dynamic imports …).
- Cross-file constant propagation - the extractor is intentionally
  single-file to keep the build independent of user bundler config.
- Non-string variants (numbers, booleans) - strings only.
- Private class fields in member chains.
- Setter arguments that are **imported functions**.

---

## 8. How to extend

- **Add more expression kinds**: extend `literalFromNode` with new
  cases _and_ unit-test them.
- **Cross-file constants**: in `resolveLocalConstIdentifier`, detect
  `ImportSpecifier`, read & parse the target file, then recurse - but
  beware performance.
- **Boolean / number variants**: relax `literalToString` and adjust
  variant schema.

---

> **In one sentence**:
> The extractor turns _purely static, in-file JavaScript_ around `useUI`
> into a deterministic list of variant strings, throwing early and with
> helpful frames whenever something would otherwise need runtime
> evaluation.
