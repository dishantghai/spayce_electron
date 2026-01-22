import { BrowserWindow, screen, app } from 'electron';
import path from 'path';

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

    // Load the renderer - in dev, use Vite server; in prod, use built files
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

    return mainWindow;
}
