import { ipcMain } from 'electron';
import { getDatabase } from '../database/surrealdb';

export function registerIpcHandlers(): void {
    // Database operations
    ipcMain.handle('db:query', async (_, sql: string, vars?: Record<string, unknown>) => {
        const db = getDatabase();
        return db.query(sql, vars);
    });

    ipcMain.handle('db:create', async (_, table: string, data: unknown) => {
        const db = getDatabase();
        return db.create(table, data);
    });

    ipcMain.handle('db:select', async (_, table: string) => {
        const db = getDatabase();
        return db.select(table);
    });

    ipcMain.handle('db:update', async (_, id: string, data: unknown) => {
        const db = getDatabase();
        return db.update(id, data);
    });

    ipcMain.handle('db:delete', async (_, id: string) => {
        const db = getDatabase();
        return db.delete(id);
    });

    // App info
    ipcMain.handle('app:getVersion', () => {
        return process.env.npm_package_version || '0.1.0';
    });

    ipcMain.handle('app:getPlatform', () => {
        return process.platform;
    });

    console.log('IPC handlers registered');
}
