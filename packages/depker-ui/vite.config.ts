import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import eslint from "vite-plugin-eslint";

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
    checker({
      typescript: true,
    }),
    eslint({
      exclude: ["**/node_modules/**", "**/dist/**"],
    }),
  ],
});
