
### Manual Install Vite

```bash
npm install @react-zero-ui/core @tailwindcss/postcss
```

---

## 🔧 Setup

### Vite

```js
// vite.config.*
import zeroUI from "@react-zero-ui/core/vite";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
 
export default defineConfig({
   // ❗️Remove the default `tailwindcss()` plugin — Zero‑UI extends it internally
  plugins: [zeroUI(), react()]
});
```
### Next.js (App Router)

2. **Add the PostCSS plugin (must come _before_ Tailwind).**

   ```js
   // postcss.config.js
   module.exports = { plugins: { '@react-zero-ui/core/postcss': {}, tailwindcss: {} } };
   ```

---




1. **Spread `bodyAttributes` on `<body>`** in your root layout.

   ```tsx
   // app/layout.tsx
   import { bodyAttributes } from './.zero-ui/attributes';
   // or:  import { bodyAttributes } from '../.zero-ui/attributes';

   export default function RootLayout({ children }) {
   	return (
   		<html lang="en">
   			<body {...bodyAttributes}>{children}</body>
   		</html>
   	);
   }
   ```