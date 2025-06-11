import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import zeroUI from "@austinserb/react-zero-ui/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), zeroUI()],
});
