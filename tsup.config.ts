import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./src/index.ts','./src/branch.ts','./src/init.ts'],
    clean: true,
    format: ['esm'],
    minify: false,
    dts: false,
    outDir: './dist',
  },
  {
    entry: ['./src/index.ts','./src/branch.ts','./src/init.ts'],
    clean: true,
    format: ['esm'],
    minify: true,
    dts: false,
    outDir: './dist',
    outExtension: ({ format }) => ({
      js: format === 'cjs' ? '.min.cjs' : '.min.js',
    }),
  },
]);
