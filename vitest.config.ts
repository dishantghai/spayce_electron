import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',

        // Fast, modular test discovery - only look in packages
        include: ['packages/*/__tests__/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/dist/**'],

        // Environment overrides for specific packages
        environmentMatchGlobs: [
            // React UI tests need jsdom for DOM testing
            ['packages/react-ui/__tests__/**/*.{test,spec}.{ts,tsx}', 'jsdom'],
        ],

        // Setup files
        setupFiles: ['./packages/react-ui/__tests__/setup.ts'],

        // Performance optimizations
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true, // Run all tests in single fork for native modules
            },
        },

        // Timeouts - fail fast if something hangs
        testTimeout: 10000,      // 10s per test
        hookTimeout: 5000,       // 5s for beforeEach/afterEach
        teardownTimeout: 3000,   // 3s for cleanup

        // Logging and debugging
        reporters: ['verbose'],
        onConsoleLog: (log) => {
            // Show all console logs during tests
            return true;
        },

        // Fail fast on first error in CI
        bail: process.env.CI ? 1 : 0,

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
