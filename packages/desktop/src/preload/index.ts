import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
    // Database operations
    db: {
        query: (sql: string, vars?: Record<string, unknown>) =>
            ipcRenderer.invoke('db:query', sql, vars),
        create: (table: string, data: unknown) =>
            ipcRenderer.invoke('db:create', table, data),
        select: (table: string) =>
            ipcRenderer.invoke('db:select', table),
        update: (id: string, data: unknown) =>
            ipcRenderer.invoke('db:update', id, data),
        delete: (id: string) =>
            ipcRenderer.invoke('db:delete', id),
    },

    // App info
    app: {
        getVersion: () => ipcRenderer.invoke('app:getVersion'),
        getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    },

    // Event listeners
    on: (channel: string, callback: (...args: unknown[]) => void) => {
        const subscription = (_: Electron.IpcRendererEvent, ...args: unknown[]) =>
            callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
    },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for renderer
declare global {
    interface Window {
        electronAPI: typeof electronAPI;
    }
}
