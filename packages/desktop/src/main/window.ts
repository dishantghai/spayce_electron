import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { getSidebarOverlayService } from './services/SidebarOverlayService';
import { getBrowserService } from './services/BrowserService';

export function createMainWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Preload script is compiled to dist/preload.cjs (same dir as main.cjs)
    const preloadPath = path.join(__dirname, 'preload.cjs');
    console.log('[Spayce] Preload path:', preloadPath);

    const mainWindow = new BrowserWindow({
        width: Math.min(1440, width),
        height: Math.min(900, height),
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 16 },
        backgroundColor: '#0F0B1A',
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // Need to disable sandbox for better-sqlite3 IPC
        },
    });

    // Handle renderer reload (CMD+R / CMD+SHIFT+R)
    // This ensures WebContentsViews are properly reset after reload
    let isFirstLoad = true;
    console.log('[Spayce] Window created, setting up did-finish-load handler');

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[Spayce] did-finish-load fired, isFirstLoad:', isFirstLoad);

        if (isFirstLoad) {
            isFirstLoad = false;
            console.log('[Spayce] Initial load complete - NOT calling reload handlers');
            return;
        }

        // Renderer has reloaded - reset WebContentsView state
        console.log('[Spayce] Renderer reloaded - resetting WebContentsView state');

        // Small delay to ensure renderer is ready
        setTimeout(() => {
            try {
                const sidebarService = getSidebarOverlayService();
                const browserService = getBrowserService();

                // Reset browser view first (z-index 0)
                browserService.handleRendererReload();

                // Then reset sidebar view (z-index 1)
                sidebarService.handleRendererReload();

                console.log('[Spayce] WebContentsView state reset complete');
            } catch (error) {
                console.error('[Spayce] Error resetting views after reload:', error);
            }
        }, 100); // 100ms delay to let renderer initialize
    });

    return mainWindow;
}

/**
 * Load the renderer content into the window
 * Should be called after all IPC handlers are registered
 */
export function loadRenderer(mainWindow: BrowserWindow): void {
    const isDev = !app.isPackaged;

    if (isDev) {
        console.log('[Spayce] Loading dev server at http://localhost:5173');
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        const rendererPath = path.join(__dirname, '../renderer/index.html');
        console.log('[Spayce] Loading renderer from:', rendererPath);
        mainWindow.loadFile(rendererPath);
    }
}
