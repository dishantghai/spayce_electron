/**
 * Build script for Electron main process and preload
 * Compiles TypeScript to JavaScript using esbuild
 */

import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(rootDir, '../..');

const isWatch = process.argv.includes('--watch');

// Resolve workspace packages to their source directories
const workspaceAliases = {
    '@spayce/core': path.join(workspaceRoot, 'packages/core/src'),
    '@spayce/infrastructure': path.join(workspaceRoot, 'packages/infrastructure/src'),
    '@spayce/react-ui': path.join(workspaceRoot, 'packages/react-ui/src'),
};

const commonOptions = {
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs', // CommonJS for better Electron compatibility
    sourcemap: true,
    external: [
        'electron',
        'better-sqlite3', // Native module - must be external
    ],
    // Resolve workspace packages
    alias: workspaceAliases,
    // Ensure better-sqlite3 is resolved from the infrastructure package
    plugins: [
        {
            name: 'resolve-native-modules',
            setup(build) {
                // Resolve better-sqlite3 to the infrastructure package's node_modules
                build.onResolve({ filter: /^better-sqlite3$/ }, () => {
                    return { path: 'better-sqlite3', external: true };
                });
            },
        },
    ],
    logLevel: 'info',
};

async function build() {
    try {
        // Build main process - use .cjs extension for CommonJS in ESM package
        const mainContext = await esbuild.context({
            ...commonOptions,
            entryPoints: [path.join(rootDir, 'src/main/index.ts')],
            outfile: path.join(rootDir, 'dist/main.cjs'),
        });

        // Build preload script - use .cjs extension for CommonJS in ESM package
        const preloadContext = await esbuild.context({
            ...commonOptions,
            entryPoints: [path.join(rootDir, 'src/preload/index.ts')],
            outfile: path.join(rootDir, 'dist/preload.cjs'),
        });

        if (isWatch) {
            console.log('Watching for changes...');
            await mainContext.watch();
            await preloadContext.watch();
        } else {
            await mainContext.rebuild();
            await preloadContext.rebuild();
            await mainContext.dispose();
            await preloadContext.dispose();
            console.log('Build complete!');
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
