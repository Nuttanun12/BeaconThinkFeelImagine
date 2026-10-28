// Tailwind v4 uses CSS-first config via @theme in globals.css.
// This file is kept for any plugin configuration or content overrides.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
};

export default config;
