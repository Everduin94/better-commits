import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/branch.ts", "./src/init.ts"],
  format: ["esm"],
  minify: true,
  dts: false,
  outDir: "./dist",
  outExtensions: () => ({ js: ".js" }),
});
