import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // base: "/portal/" only in production (when built)
  // In dev with middlewareMode, base should be "/" so Vite resolves relative to dev-server
  base: process.env.NODE_ENV === 'production' ? "/portal/" : "/",
  server: {
    middlewareMode: true,
  },
  build: {
    outDir: "../dist/portal",
    emptyOutDir: true,
  },
});
