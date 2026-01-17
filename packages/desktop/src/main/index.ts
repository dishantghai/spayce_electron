import { app, BrowserWindow } from 'electron';
import path from 'path';
import { createMainWindow } from './window';
import { initDatabase } from './database/surrealdb';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

async function initialize() {
    try {
        // Initialize SurrealDB
        await initDatabase();
        console.log('SurrealDB initialized');

        // Register IPC handlers
        registerIpcHandlers();

        // Create main window
        mainWindow = createMainWindow();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        app.quit();
    }
}

app.whenReady().then(initialize);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
    }
});

export { mainWindow };
