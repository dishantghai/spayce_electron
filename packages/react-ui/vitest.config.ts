import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['__tests__/**/*.test.{ts,tsx}'],
    },
    resolve: {
        alias: {
            '@spayce/core': path.resolve(__dirname, '../core/src'),
            '@spayce/core/application': path.resolve(__dirname, '../core/src/application'),
            '@spayce/core/domain': path.resolve(__dirname, '../core/src/domain'),
            '@spayce/infrastructure': path.resolve(__dirname, '../infrastructure/src'),
        },
    },
});
