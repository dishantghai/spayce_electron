/**
 * Type declarations for Electron API exposed via preload script
 */

interface ElectronAPI {
    spaces: {
        getAll: (profileId: string) => Promise<any>;
        create: (input: { profileId: string; userId: string; name: string; iconName: string; accentColor: string }) => Promise<any>;
        delete: (spaceId: string, profileId: string) => Promise<any>;
        rename: (spaceId: string, newName: string) => Promise<any>;
        update: (spaceId: string, updates: { name?: string; iconName?: string; accentColor?: string; isExpanded?: boolean }) => Promise<any>;
        reorder: (profileId: string, spaceIds: string[]) => Promise<any>;
    };
    items: {
        getBySpace: (spaceId: string) => Promise<any>;
        create: (input: { spaceId: string; name: string; type: string; path: string; parentId?: string }) => Promise<any>;
        delete: (itemId: string) => Promise<any>;
        move: (itemId: string, targetSpaceId: string, targetParentId?: string, toPosition?: number) => Promise<any>;
        rename: (itemId: string, newName: string) => Promise<any>;
    };
    search: {
        items: (query: string) => Promise<any>;
        recent: (limit?: number) => Promise<any>;
        mostVisited: (limit?: number) => Promise<any>;
    };
    app: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
    };
    clipboard: {
        readText: () => Promise<string>;
        writeText: (text: string) => Promise<boolean>;
    };
    on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
