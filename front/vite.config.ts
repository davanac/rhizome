/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),

  define: {
    global: "globalThis",
    "process.env": {},
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@config": path.resolve(__dirname, "./src/config/config.js"),
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/setupTest.ts"],
  },
}));
