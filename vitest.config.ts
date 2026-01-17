import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['packages/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['packages/*/src/**/*.{ts,tsx}'],
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
        },
    },
    resolve: {
        alias: {
            '@spayce/shared': path.resolve(__dirname, 'packages/shared/src'),
            '@spayce/desktop': path.resolve(__dirname, 'packages/desktop/src'),
        },
    },
});
