import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/portal/",
  server: {
    middlewareMode: true,
  },
  build: {
    outDir: "../dist/portal",
    emptyOutDir: true,
  },
});
