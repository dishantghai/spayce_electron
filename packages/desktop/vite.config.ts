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
    },
    resolve: {
        alias: {
            '@spayce/shared': path.resolve(__dirname, '../shared/src'),
            '@spayce/desktop': path.resolve(__dirname, 'src'),
            'react-native': 'react-native-web',
        },
    },
    server: {
        port: 5173,
    },
});
