import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The API runs separately in development; same-origin /api calls are forwarded to it.
    proxy: { "/api": process.env.VITE_API_PROXY ?? "http://localhost:5000" },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
  },
});
