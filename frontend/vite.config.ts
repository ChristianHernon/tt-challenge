import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, /api goes to the Express backend. In production the same
    // paths are served by the Worker in ./worker.
    proxy: {
      "/api": process.env.API_URL ?? "http://localhost:5001",
    },
  },
});
