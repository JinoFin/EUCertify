import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = dirname(fileURLToPath(new URL('./package.json', import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(root, '.')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    exclude: ['e2e/**/*'],
    include: ['tests/**/*.test.ts']
  }
});
