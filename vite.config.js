import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  extend: {
    animation: {
      slideLeft: "slideLeft 0.5s ease forwards",
      slideRight: "slideRight 0.5s ease forwards",
    },
    keyframes: {
      slideLeft: {
        "0%": { opacity: 0, transform: "translateX(40px)" },
        "100%": { opacity: 1, transform: "translateX(0)" },
      },
      slideRight: {
        "0%": { opacity: 0, transform: "translateX(-40px)" },
        "100%": { opacity: 1, transform: "translateX(0)" },
      },
    },
  },
});
