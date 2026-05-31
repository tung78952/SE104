import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e/**', 'playwright-report'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/api/**',
        'src/lib/auth/**',
        'src/lib/schemas/**',
        'src/lib/constants/**',
        'src/lib/utils/**',
        'src/app/login/**',
        'src/app/profile/**',
        'src/app/dashboard/**',
        'src/app/subjects/**',
        'src/app/classes/**',
        'src/app/students/**',
        'src/app/difficulties/**',
        'src/app/regulations/**',
        'src/app/admin/**',
        'src/app/questions/**',
        'src/app/exams/**',
        'src/app/grades/**',
        'src/components/profile/**',
        'src/components/common/**',
        'src/components/catalog/**',
        'src/components/questions/**',
        'src/components/exams/**',
        'src/components/grades/**',
        'src/hooks/**',
      ],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.d.ts'],
      thresholds: {
        lines: 70,
        functions: 68,
        branches: 65,
        statements: 70,
      },
    },
  },
});
