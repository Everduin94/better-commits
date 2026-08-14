import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/branch.ts", "./src/init.ts"],
  format: ["esm"],
  minify: true,
  dts: false,
  deps: {
    alwaysBundle: ["valibot"],
    onlyBundle: ["valibot"],
  },
  outDir: "./dist",
  outExtensions: () => ({ js: ".js" }),
});
