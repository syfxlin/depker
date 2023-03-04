import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/bin.ts"],
  splitting: true,
  clean: true,
  dts: true,
  format: ["esm"],
});
