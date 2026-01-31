import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
    ViewBounds,
    CreateViewOptions,
    BrowserLoadingEvent,
    BrowserNavigatedEvent,
    BrowserTitleEvent,
    BrowserFaviconEvent,
    BrowserProgressEvent,
    BrowserErrorEvent,
} from './types';

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
        reorder: (spaceId: string, parentId: string | null, orderedItemIds: string[]) =>
            ipcRenderer.invoke('items:reorder', spaceId, parentId, orderedItemIds),
        incrementVisit: (itemId: string) => ipcRenderer.invoke('items:incrementVisit', itemId),
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

    // File system operations
    fs: {
        selectFolder: () => ipcRenderer.invoke('fs:selectFolder'),
        selectFile: () => ipcRenderer.invoke('fs:selectFile'),
        loadFolderChildren: (folderPath: string) => ipcRenderer.invoke('fs:loadFolderChildren', folderPath),
    },

    // Event listeners
    on: (channel: string, callback: (...args: unknown[]) => void) => {
        const subscription = (_: Electron.IpcRendererEvent, ...args: unknown[]) =>
            callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
    },

    // Browser operations (Spec 019)
    browser: {
        // View management
        createView: (id: string, options?: CreateViewOptions) =>
            ipcRenderer.invoke('browser:createView', id, options),
        destroyView: (id: string) =>
            ipcRenderer.invoke('browser:destroyView', id),
        setActiveView: (id: string) =>
            ipcRenderer.invoke('browser:setActiveView', id),
        getActiveViewId: () =>
            ipcRenderer.invoke('browser:getActiveViewId'),

        // Bounds
        setBounds: (bounds: ViewBounds) =>
            ipcRenderer.invoke('browser:setBounds', bounds),

        // Navigation
        loadURL: (id: string, url: string) =>
            ipcRenderer.invoke('browser:loadURL', id, url),
        goBack: (id: string) =>
            ipcRenderer.invoke('browser:goBack', id),
        goForward: (id: string) =>
            ipcRenderer.invoke('browser:goForward', id),
        reload: (id: string) =>
            ipcRenderer.invoke('browser:reload', id),
        stop: (id: string) =>
            ipcRenderer.invoke('browser:stop', id),

        // State
        getViewState: (id: string) =>
            ipcRenderer.invoke('browser:getViewState', id),
        setVisibility: (id: string, visible: boolean) =>
            ipcRenderer.invoke('browser:setVisibility', id, visible),
        getViewCount: () =>
            ipcRenderer.invoke('browser:getViewCount'),

        // Event listeners
        onLoading: (callback: (data: BrowserLoadingEvent) => void) => {
            const handler = (_: IpcRendererEvent, data: BrowserLoadingEvent) => callback(data);
            ipcRenderer.on('browser:loading', handler);
            return () => ipcRenderer.removeListener('browser:loading', handler);
        },
        onNavigated: (callback: (data: BrowserNavigatedEvent) => void) => {
            const handler = (_: IpcRendererEvent, data: BrowserNavigatedEvent) => callback(data);
            ipcRenderer.on('browser:navigated', handler);
            return () => ipcRenderer.removeListener('browser:navigated', handler);
        },
        onTitle: (callback: (data: BrowserTitleEvent) => void) => {
            const handler = (_: IpcRendererEvent, data: BrowserTitleEvent) => callback(data);
            ipcRenderer.on('browser:title', handler);
            return () => ipcRenderer.removeListener('browser:title', handler);
        },
        onFavicon: (callback: (data: BrowserFaviconEvent) => void) => {
            const handler = (_: IpcRendererEvent, data: BrowserFaviconEvent) => callback(data);
            ipcRenderer.on('browser:favicon', handler);
            return () => ipcRenderer.removeListener('browser:favicon', handler);
        },
        onProgress: (callback: (data: BrowserProgressEvent) => void) => {
            const handler = (_: IpcRendererEvent, data: BrowserProgressEvent) => callback(data);
            ipcRenderer.on('browser:progress', handler);
            return () => ipcRenderer.removeListener('browser:progress', handler);
        },
        onError: (callback: (data: BrowserErrorEvent) => void) => {
            const handler = (_: IpcRendererEvent, data: BrowserErrorEvent) => callback(data);
            ipcRenderer.on('browser:error', handler);
            return () => ipcRenderer.removeListener('browser:error', handler);
        },
    },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Export type for use in renderer
export type ElectronAPI = typeof electronAPI;
