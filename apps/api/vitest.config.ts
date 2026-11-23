import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    // Nest CLI generates *.spec.ts; the migrated domain/adapter tests use
    // *.test.ts (naming kept from the original Express version). Run both.
    include: ['**/*.spec.ts', '**/*.test.ts'],
  },
});
