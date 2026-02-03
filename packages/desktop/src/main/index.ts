import { app, BrowserWindow, powerMonitor } from 'electron';
import path from 'path';
import { createMainWindow, loadRenderer } from './window';
import { ServiceBootstrap } from '@spayce/infrastructure';
import { registerIpcHandlers } from './ipc/handlers';
import { registerBrowserHandlers } from './ipc/browserHandlers';
import { registerSidebarOverlayHandlers } from './ipc/sidebarOverlayHandlers';
import { getSidebarOverlayService } from './services/SidebarOverlayService';
import { getBrowserService } from './services/BrowserService';

// Add Chrome-like command line switches to bypass Google's detection
// These make Electron behave more like a regular Chrome browser
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('disable-site-isolation-trials');

let mainWindow: BrowserWindow | null = null;

// Get the project root directory (spayce_electron/)
function getProjectRoot(): string {
    // In development, __dirname is packages/desktop/dist/
    // Go up 3 levels: dist/ -> desktop/ -> packages/ -> spayce_electron/
    if (app.isPackaged) {
        return path.join(app.getAppPath(), '..');
    }
    return path.join(__dirname, '../../..');
}

async function initialize() {
    try {
        // Initialize services with SQLite database
        // In development, use the project database; in production, use user data path
        const isDev = !app.isPackaged;
        const projectRoot = getProjectRoot();

        const databasePath = isDev
            ? path.join(projectRoot, 'resources/db/spaces.sqlite')
            : path.join(app.getPath('userData'), 'spayce.db');

        console.log('[Spayce] Project root:', projectRoot);
        console.log('[Spayce] Database path:', databasePath);
        console.log('[Spayce] Is packaged:', app.isPackaged);

        ServiceBootstrap.initialize({
            databasePath,
            logPrefix: '[Spayce]',
        });
        console.log('[Spayce] Services initialized with database at:', databasePath);

        // Register IPC handlers
        registerIpcHandlers();

        // Create main window (but don't load content yet)
        console.log('[Spayce] Creating main window...');
        mainWindow = createMainWindow();
        console.log('[Spayce] Main window created');

        // Register browser IPC handlers (requires mainWindow)
        console.log('[Spayce] Registering browser handlers...');
        registerBrowserHandlers(mainWindow);

        // Register sidebar overlay IPC handlers (Spec 020)
        console.log('[Spayce] Registering sidebar overlay handlers...');
        registerSidebarOverlayHandlers(mainWindow);
        console.log('[Spayce] Sidebar overlay handlers registered');

        // Now load the renderer - after all IPC handlers are registered
        console.log('[Spayce] Loading renderer...');
        loadRenderer(mainWindow);
        console.log('[Spayce] Renderer load initiated');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        app.quit();
    }
}

app.whenReady().then(() => {
    initialize();

    // B008: Handle system resume (wake from sleep)
    // Collapses sidebar overlay and re-validates WebContentsView bounds
    // to prevent narrow strip bug and stale viewport after sleep
    powerMonitor.on('resume', () => {
        console.log('[Spayce] System resumed from sleep');

        if (mainWindow && !mainWindow.isDestroyed()) {
            try {
                const sidebarService = getSidebarOverlayService();
                const browserService = getBrowserService();

                // Hide sidebar overlay (collapse) and re-validate bounds
                sidebarService.handleSystemResume();

                // Re-validate browser view bounds
                browserService.handleSystemResume();

                // Notify renderer to collapse sidebar state
                mainWindow.webContents.send('app:system-resumed');

                console.log('[Spayce] System resume handling complete');
            } catch (error) {
                console.error('[Spayce] Error handling system resume:', error);
            }
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
        registerBrowserHandlers(mainWindow);
        registerSidebarOverlayHandlers(mainWindow);
        loadRenderer(mainWindow);
    }
});

export { mainWindow };
