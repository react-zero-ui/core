import zeroUI from '@austinserb/react-zero-ui/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({ plugins: [react(), zeroUI()] });
