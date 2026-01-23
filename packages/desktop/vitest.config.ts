import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',

        // Test file patterns
        include: ['__tests__/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],

        // Performance optimizations for native modules
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true, // Run all tests in single fork for better-sqlite3
            },
        },

        // Timeouts
        testTimeout: 30000,      // 30s per test (some tests run builds)
        hookTimeout: 10000,      // 10s for beforeEach/afterEach
        teardownTimeout: 5000,   // 5s for cleanup

        // Reporters
        reporters: ['verbose'],

        // Fail fast in CI
        bail: process.env.CI ? 1 : 0,

        // Sequence - run preflight first
        sequence: {
            shuffle: false,
        },

        // Setup files
        setupFiles: [],
    },
    resolve: {
        alias: {
            '@spayce/core': path.resolve(__dirname, '../core/src'),
            '@spayce/infrastructure': path.resolve(__dirname, '../infrastructure/src'),
            '@spayce/react-ui': path.resolve(__dirname, '../react-ui/src'),
        },
    },
});
