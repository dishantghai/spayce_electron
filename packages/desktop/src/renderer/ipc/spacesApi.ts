// IPC bridge for spaces operations
// This connects the renderer process to the main process facades via IPC
// Uses the secure electronAPI exposed via preload script

// Get the electronAPI from window (exposed by preload script)
const getElectronAPI = () => (window as any).electronAPI;

// Mock API for browser development (when not in Electron)
const mockApi = {
    spaces: {
        getAll: async () => ({ success: true, data: [] }),
        create: async () => ({ success: true, data: null }),
        delete: async () => ({ success: true }),
        rename: async () => ({ success: true }),
        update: async () => ({ success: true }),
        reorder: async () => ({ success: true }),
    },
    items: {
        getBySpace: async () => ({ success: true, data: [] }),
        create: async () => ({ success: true, data: null }),
        delete: async () => ({ success: true }),
        move: async () => ({ success: true }),
        rename: async () => ({ success: true }),
    },
    search: {
        items: async () => ({ success: true, data: [] }),
        recent: async () => ({ success: true, data: [] }),
        mostVisited: async () => ({ success: true, data: [] }),
    },
};

export interface CreateSpaceInput {
    profileId: string;
    userId: string;
    name: string;
    iconName: string;
    accentColor: string;
}

export interface SpaceUpdates {
    name?: string;
    iconName?: string;
    accentColor?: string;
    isExpanded?: boolean;
}

export const spacesApi = {
    getAll: async (profileId: string) => {
        const api = getElectronAPI();
        if (api?.spaces) {
            return api.spaces.getAll(profileId);
        }
        console.warn('[Browser Dev] Using mock spacesApi.getAll');
        return mockApi.spaces.getAll();
    },

    create: async (input: CreateSpaceInput) => {
        const api = getElectronAPI();
        if (api?.spaces) {
            return api.spaces.create(input);
        }
        console.warn('[Browser Dev] Using mock spacesApi.create');
        return mockApi.spaces.create();
    },

    delete: async (spaceId: string, profileId: string) => {
        const api = getElectronAPI();
        if (api?.spaces) {
            return api.spaces.delete(spaceId, profileId);
        }
        return mockApi.spaces.delete();
    },

    rename: async (spaceId: string, newName: string) => {
        const api = getElectronAPI();
        if (api?.spaces) {
            return api.spaces.rename(spaceId, newName);
        }
        return mockApi.spaces.rename();
    },

    update: async (spaceId: string, updates: SpaceUpdates) => {
        const api = getElectronAPI();
        if (api?.spaces) {
            return api.spaces.update(spaceId, updates);
        }
        return mockApi.spaces.update();
    },

    reorder: async (profileId: string, spaceIds: string[]) => {
        const api = getElectronAPI();
        if (api?.spaces) {
            return api.spaces.reorder(profileId, spaceIds);
        }
        return mockApi.spaces.reorder();
    },
};

export interface CreateItemInput {
    spaceId: string;
    name: string;
    type: string;
    path: string;
    parentId?: string;
    faviconUrl?: string | null;
}

export const itemsApi = {
    getBySpace: async (spaceId: string) => {
        const api = getElectronAPI();
        if (api?.items) {
            return api.items.getBySpace(spaceId);
        }
        return mockApi.items.getBySpace();
    },

    create: async (input: CreateItemInput) => {
        const api = getElectronAPI();
        if (api?.items) {
            return api.items.create(input);
        }
        return mockApi.items.create();
    },

    delete: async (itemId: string) => {
        const api = getElectronAPI();
        if (api?.items) {
            return api.items.delete(itemId);
        }
        return mockApi.items.delete();
    },

    move: async (itemId: string, targetSpaceId: string, targetParentId?: string) => {
        const api = getElectronAPI();
        if (api?.items) {
            return api.items.move(itemId, targetSpaceId, targetParentId);
        }
        return mockApi.items.move();
    },

    rename: async (itemId: string, newName: string) => {
        const api = getElectronAPI();
        if (api?.items) {
            return api.items.rename(itemId, newName);
        }
        return mockApi.items.rename();
    },
};

export const searchApi = {
    items: async (query: string) => {
        const api = getElectronAPI();
        if (api?.search) {
            return api.search.items(query);
        }
        return mockApi.search.items();
    },

    recent: async (limit?: number) => {
        const api = getElectronAPI();
        if (api?.search) {
            return api.search.recent(limit);
        }
        return mockApi.search.recent();
    },

    mostVisited: async (limit?: number) => {
        const api = getElectronAPI();
        if (api?.search) {
            return api.search.mostVisited(limit);
        }
        return mockApi.search.mostVisited();
    },
};
