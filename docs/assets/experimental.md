
## 🧪 Experimental: SSR-safe `zeroOnClick`

Enable client-side interactivity **without leaving server components**.
Just 300 bytes of runtime overhead.

### ⚙️ Installation (Zero-UI Experimental)

```bash
npm install @react-zero-ui/core@0.3.1-beta.2
```

Initialize once in your root:

```tsx
"use client"

/* ① import the generated defaults */
import { variantKeyMap } from "../.zero-ui/attributes"
/* ② activate the runtime shipped in the package */
import { activateZeroUiRuntime } from "@react-zero-ui/core/experimental/runtime"

activateZeroUiRuntime(variantKeyMap)

export const ZeroUiRuntime = () => null // this component just runs the side effect

```

### Usage

```tsx
import { zeroSSR } from "@react-zero-ui/core/experimental"

<div {...zeroSSR.onClick("theme", ["dark", "light", "spanish"])} >
  Click me to cycle themes!
</div>
```

Usage is the same as the `useUI` hooks:
```html
<div class="theme-dark:bg-black theme-light:bg-white">
  Interactive Server Component!
</div>
```

**Scoped Version:**

```tsx
import { zeroScopedOnClick } from '@react-zero-ui/experimental';

<div data-model="open"> // set the scope with a data-attribute that matches the key
  <button {...scopedZeroSSR.onClick("modal", ["open", "closed"])}>
    Toggle Modal
  </button>
</div>
```

see the source code for the `zeroSSR` object, see [experimental](/packages/core/src/experimental)