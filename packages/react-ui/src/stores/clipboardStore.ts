import { create } from 'zustand';
import type { SpaceItem } from '../types';
import { SpaceItemType } from '../types';

export type ClipboardAction = 'copy' | 'cut';
export type PastePosition = 'before' | 'after' | 'inside';

interface ClipboardState {
    items: SpaceItem[];
    sourceSpaceId: string | null;
    action: ClipboardAction | null;

    copyItems: (items: SpaceItem[], spaceId: string) => void;
    cutItems: (items: SpaceItem[], spaceId: string) => void;
    pasteItems: (targetId: string, position?: PastePosition) => Promise<void>;
    canPaste: (targetId: string) => boolean;
    clear: () => void;
    hasItems: () => boolean;
    getCutItems: () => SpaceItem[];

    writeToSystemClipboard: (text: string) => Promise<void>;
    readFromSystemClipboard: () => Promise<string>;
    isValidUrl: (text: string) => boolean;

    copyFromSelection: (spaceId: string) => void;
    cutFromSelection: (spaceId: string) => void;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
    items: [],
    sourceSpaceId: null,
    action: null,

    copyItems: (items, spaceId) => {
        set({
            items: [...items],
            sourceSpaceId: spaceId,
            action: 'copy',
        });
    },

    cutItems: (items, spaceId) => {
        set({
            items: [...items],
            sourceSpaceId: spaceId,
            action: 'cut',
        });
    },

    pasteItems: async (targetId, position) => {
        const state = get();

        if (state.items.length === 0) {
            throw new Error('No items in clipboard');
        }

        if (!get().canPaste(targetId)) {
            throw new Error('Cannot paste to this target');
        }

        // Simulate paste operation
        // In real implementation, this would call IPC handlers to perform the actual paste
        await new Promise(resolve => setTimeout(resolve, 0));

        // Clear clipboard after successful paste
        set({
            items: [],
            sourceSpaceId: null,
            action: null,
        });
    },

    canPaste: (targetId) => {
        const state = get();

        if (state.items.length === 0) {
            return false;
        }

        // Check for circular references
        for (const item of state.items) {
            if (item.id === targetId) {
                return false;
            }

            // Check if target is a descendant of any clipboard item
            if (item.type === SpaceItemType.folder) {
                if (isDescendant(item, targetId)) {
                    return false;
                }
            }
        }

        // Validate target compatibility
        if (targetId === 'pins-grid') {
            // Pins grid only accepts links
            return state.items.every(item => item.type === SpaceItemType.link);
        }

        // All other targets can accept items (folders, space root, etc.)
        return true;
    },

    clear: () => {
        set({
            items: [],
            sourceSpaceId: null,
            action: null,
        });
    },

    hasItems: () => {
        return get().items.length > 0;
    },

    getCutItems: () => {
        const state = get();
        return state.action === 'cut' ? state.items : [];
    },

    writeToSystemClipboard: async (text) => {
        try {
            // In real implementation, this would use IPC to write to system clipboard
            // For now, just simulate the operation
            await new Promise(resolve => setTimeout(resolve, 0));
        } catch (error) {
            console.error('Failed to write to system clipboard:', error);
            // Fallback to internal clipboard only
        }
    },

    readFromSystemClipboard: async () => {
        try {
            // In real implementation, this would use IPC to read from system clipboard
            // For now, return empty string
            await new Promise(resolve => setTimeout(resolve, 0));
            return '';
        } catch (error) {
            console.error('Failed to read from system clipboard:', error);
            return '';
        }
    },

    isValidUrl: (text) => {
        // URL detection regex supporting http(s), domains, localhost, and IP addresses
        const urlPattern = /^(https?:\/\/)|(localhost)|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([^\s]+\.[^\s]+)/;
        return urlPattern.test(text);
    },

    copyFromSelection: (spaceId) => {
        // In real implementation, this would get items from selectionStore
        // For now, just a placeholder
        set({
            items: [],
            sourceSpaceId: spaceId,
            action: 'copy',
        });
    },

    cutFromSelection: (spaceId) => {
        // In real implementation, this would get items from selectionStore
        // For now, just a placeholder
        set({
            items: [],
            sourceSpaceId: spaceId,
            action: 'cut',
        });
    },
}));

// Helper function to check if targetId is a descendant of item
function isDescendant(item: SpaceItem, targetId: string): boolean {
    if (!item.children || item.children.length === 0) {
        return false;
    }

    for (const child of item.children) {
        if (child.id === targetId) {
            return true;
        }
        if (isDescendant(child, targetId)) {
            return true;
        }
    }

    return false;
}
