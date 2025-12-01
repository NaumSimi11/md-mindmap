import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/components/editor/**', 'src/stores/**', 'src/hooks/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

