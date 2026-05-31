import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["./src/index.ts", "./src/branch.ts", "./src/init.ts"],
    clean: true,
    format: ["esm"],
    minify: false,
    dts: false,
    outDir: "./dist",
  },
]);
