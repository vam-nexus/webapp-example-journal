import { defineConfig } from "astro/config";

export default defineConfig({
  server: { port: 4321 },
  build: { outDir: "dist" },
  vite: {
    server: {
      fs: {
        allow: [".."]
      }
    }
  }
});
