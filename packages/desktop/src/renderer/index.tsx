import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MinimalApp } from './MinimalApp';

console.log('[Renderer] Starting initialization...');

const container = document.getElementById('root');
if (!container) {
    console.error('[Renderer] Root element not found!');
    throw new Error('Root element not found');
}

console.log('[Renderer] Root element found, creating React root...');

const root = createRoot(container);

// Use MinimalApp first to test components without data loading
const USE_MINIMAL = false; // Set to true to test components, false to test with real data

console.log('[Renderer] Rendering', USE_MINIMAL ? 'MinimalApp' : 'App', 'component...');

// Add global error handler
window.addEventListener('error', (e) => {
    console.error('[Renderer] Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('[Renderer] Unhandled rejection:', e.reason);
});

try {
    root.render(
        <React.StrictMode>
            {USE_MINIMAL ? <MinimalApp /> : <App />}
        </React.StrictMode>
    );
    console.log('[Renderer] App render call completed');
} catch (error) {
    console.error('[Renderer] Error during render:', error);
    throw error;
}
