### Vite Setup

1. **Install the dependencies**

```bash
npm install @react-zero-ui/core
```

```bash
npm install @tailwindcss/postcss
```

---

## 🔧 Setup

### Vite

2. **Add the plugin to your vite.config.ts**

```js
// vite.config.*
import zeroUI from '@react-zero-ui/core/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindCss from '@tailwindcss/postcss';

export default defineConfig({
	// ❗️Remove the default `tailwindcss()` plugin - and pass it into the `zeroUI` plugin
	plugins: [zeroUI({ tailwind: tailwindCss }), react()],
});
```

**Thats it.**

The plugin will add the data-\* attributes to the body tag (no FOUC) and the CSS will be injected and transformed by tailwind.

<!-- See [Usage Examples](./usage-examples.md) for more details. -->
