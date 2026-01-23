import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: 'src/renderer',
    base: './',
    build: {
        outDir: '../../dist/renderer',
        emptyOutDir: true,
        rollupOptions: {
            external: [
                'better-sqlite3',
                'electron',
                'fs',
                'path',
                'util',
            ],
        },
    },
    resolve: {
        alias: {
            '@spayce/react-ui': path.resolve(__dirname, '../react-ui/src'),
            '@spayce/desktop': path.resolve(__dirname, 'src'),
            'react-native': 'react-native-web',
        },
    },
    server: {
        port: 5173,
        strictPort: true,
    },
    optimizeDeps: {
        exclude: [
            'better-sqlite3',
            '@spayce/infrastructure',
            '@spayce/core',
        ],
    },
});
