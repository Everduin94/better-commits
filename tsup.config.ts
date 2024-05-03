import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["./src/index.ts", "./src/branch.ts", "./src/init.ts"],
    clean: true,
    format: ["esm"],
    minify: true,
    dts: false,
    outDir: "./dist",
  },
]);
