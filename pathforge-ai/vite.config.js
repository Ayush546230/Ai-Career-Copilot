// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        // Proxy API calls to backend (uses VITE_BACKEND_URL in Docker, localhost in dev)
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});






