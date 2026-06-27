import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    emptyOutDir: false,
    outDir: "dist/browser",
    lib: {
      entry: "src/browser.tsx",
      name: "GardenPublicationApp",
      formats: ["es"],
      fileName: () => "garden-publication-app.js",
      cssFileName: "garden-publication-app"
    },
    rollupOptions: {
      output: {
        assetFileNames: "[name][extname]"
      }
    }
  }
});
