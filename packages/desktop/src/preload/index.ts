import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
    // Spaces operations
    spaces: {
        getAll: (profileId: string) => ipcRenderer.invoke('spaces:getAll', profileId),
        create: (input: { profileId: string; userId: string; name: string; iconName: string; accentColor: string }) =>
            ipcRenderer.invoke('spaces:create', input),
        delete: (spaceId: string, profileId: string) => ipcRenderer.invoke('spaces:delete', spaceId, profileId),
        rename: (spaceId: string, newName: string) => ipcRenderer.invoke('spaces:rename', spaceId, newName),
        update: (spaceId: string, updates: { name?: string; iconName?: string; accentColor?: string; isExpanded?: boolean }) =>
            ipcRenderer.invoke('spaces:update', spaceId, updates),
        reorder: (profileId: string, spaceIds: string[]) => ipcRenderer.invoke('spaces:reorder', profileId, spaceIds),
    },

    // Items operations
    items: {
        getBySpace: (spaceId: string) => ipcRenderer.invoke('items:getBySpace', spaceId),
        create: (input: { spaceId: string; name: string; type: string; path: string; parentId?: string }) =>
            ipcRenderer.invoke('items:create', input),
        delete: (itemId: string) => ipcRenderer.invoke('items:delete', itemId),
        move: (itemId: string, targetSpaceId: string, targetParentId?: string, toPosition?: number) =>
            ipcRenderer.invoke('items:move', itemId, targetSpaceId, targetParentId, toPosition),
        rename: (itemId: string, newName: string) => ipcRenderer.invoke('items:rename', itemId, newName),
        updateMetadata: (itemId: string, metadata: { faviconUrl?: string | null; description?: string | null; isExpanded?: boolean }) =>
            ipcRenderer.invoke('items:updateMetadata', itemId, metadata),
        pin: (itemId: string, position?: number) => ipcRenderer.invoke('items:pin', itemId, position),
        unpin: (itemId: string) => ipcRenderer.invoke('items:unpin', itemId),
        reorderPins: (spaceId: string, orderedItemIds: string[]) => ipcRenderer.invoke('items:reorderPins', spaceId, orderedItemIds),
    },

    // Search operations
    search: {
        items: (query: string) => ipcRenderer.invoke('search:items', query),
        recent: (limit?: number) => ipcRenderer.invoke('search:recent', limit),
        mostVisited: (limit?: number) => ipcRenderer.invoke('search:mostVisited', limit),
    },

    // App info
    app: {
        getVersion: () => ipcRenderer.invoke('app:getVersion'),
        getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    },

    // Clipboard operations
    clipboard: {
        readText: () => ipcRenderer.invoke('clipboard:readText'),
        writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
    },

    // Metadata extraction
    metadata: {
        extract: (url: string) => ipcRenderer.invoke('metadata:extract', url),
        extractFavicon: (url: string) => ipcRenderer.invoke('metadata:extractFavicon', url),
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
