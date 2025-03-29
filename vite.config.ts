import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "stats.html",
      open: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion"],
    exclude: ["firebase", "@firebase/firestore"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  define: {
    // This is required for Vite to properly handle environment variables
    "process.env": {},
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Core React dependencies
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "react-core";
          }

          // Firebase dependencies
          if (
            id.includes("node_modules/firebase") ||
            id.includes("node_modules/@firebase")
          ) {
            return "firebase";
          }

          // UI component libraries
          if (
            id.includes("node_modules/@heroui") ||
            id.includes("node_modules/@radix-ui")
          ) {
            return "ui-components";
          }

          // Animation libraries
          if (id.includes("node_modules/framer-motion")) {
            return "animations";
          }

          // Form handling libraries
          if (
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/zod")
          ) {
            return "form-handling";
          }

          // React Router related dependencies
          if (id.includes("node_modules/react-router")) {
            return "react-router";
          }

          // Vendor chunk for other dependencies
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    // Enable source maps for better debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
