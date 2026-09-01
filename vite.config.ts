import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    // Required so the sandbox / preview proxy host is accepted.
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  esbuild: {
    // Strip debug noise from production; keeps console.error for the boundary.
    pure: ["console.log", "console.debug", "console.info"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    // Inline small assets; anything larger gets a hashed file for long caching.
    assetsInlineLimit: 2048,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Long-term cacheable, content-hashed filenames.
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || /node_modules\/react\//.test(id)) return "react";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) return "motion";
          if (id.includes("react-router")) return "router";
          if (id.includes("lucide-react")) return "icons";
        },
      },
    },
  },
});
