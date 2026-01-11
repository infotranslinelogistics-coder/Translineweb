import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/portal/",
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: "../dist/portal",
    emptyOutDir: true,
  },
});
