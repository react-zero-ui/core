import zeroUI from "@react-zero-ui/core/vite";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindCss from '@tailwindcss/postcss';

// https://vite.dev/config/
export default defineConfig({
  plugins: [zeroUI({tailwind: tailwindCss}), react()]
});