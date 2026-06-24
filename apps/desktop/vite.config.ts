import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "ui")
    }
  },
  server: {
    strictPort: true,
    port: 1420
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["@tanstack/react-router", "@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
          motion: ["framer-motion"]
        }
      }
    }
  },
  clearScreen: false
});
