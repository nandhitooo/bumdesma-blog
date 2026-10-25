import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/robots.txt": "http://localhost:4000",
      "/sitemap.xml": "http://localhost:4000",
      "/feed.xml": "http://localhost:4000",
      "/share": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
