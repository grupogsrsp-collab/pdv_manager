import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./", // Para GitHub Pages
  root: "client",
  build: {
    outDir: "../dist",
    sourcemap: false,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  define: {
    // Mock environment variables for static build
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.VITE_API_URL': '""',
  },
  publicDir: "public",
});