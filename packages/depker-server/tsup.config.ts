import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    splitting: true,
    clean: true,
    dts: true,
    format: ["cjs"],
  },
  {
    entry: ["src/export-types.ts"],
    dts: {
      only: true,
    },
  },
]);
