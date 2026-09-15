import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // In dev the page is served by Vite on :5173 and the API runs on :3000.
    // Proxying makes the browser see one origin, so cookies work and there is no CORS — same as production.
    proxy: { "/auth": "http://localhost:3000", "/tasks": "http://localhost:3000", "/health": "http://localhost:3000" },
  },
});
