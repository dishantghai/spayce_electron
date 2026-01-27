import { create } from 'zustand';

interface ClipboardSelectionData {
    items: string[];
    operation: 'copy' | 'cut';
    sourceSpaceId: string;
    timestamp: number;
    selectionCount: number;
}

interface DragPayload {
    items: string[];
    isMultiSelection: boolean;
    selectionCount: number;
}

export type SelectionContext = 'sidebar' | 'spaceCard';

interface SelectionStore {
    spaceId: string | null;
    selectedIds: Set<string>;
    lastSelectedId: string | null;
    context: SelectionContext | null;

    selectSingle: (spaceId: string, itemId: string, context: SelectionContext) => void;
    toggleSelection: (spaceId: string, itemId: string, context: SelectionContext) => void;
    selectRange: (spaceId: string, itemId: string, allVisibleIds: string[], context: SelectionContext) => void;
    selectAll: (spaceId: string, allVisibleIds: string[], context: SelectionContext) => void;
    clearSelection: () => void;
    isSelected: (itemId: string, context: SelectionContext) => boolean;
    getSelectedItems: () => string[];

    getDragPayload: (draggedItemId: string) => DragPayload;
    onDragInitiated: (draggedItemId: string) => void;
    onDragCompleted: (success: boolean, wasMultiSelection: boolean) => void;

    getSelectedItemsForClipboard: () => string[];
    onClipboardCopy: () => ClipboardSelectionData;
    onClipboardCut: () => ClipboardSelectionData;
    onClipboardPasteComplete: (success: boolean, operation: 'copy' | 'cut') => void;
}

const validateSpaceId = (spaceId: string): string => {
    if (typeof spaceId !== 'string') {
        console.error(`Invalid spaceId type: ${typeof spaceId}`);
        throw new Error(`spaceId must be a string, got ${typeof spaceId}`);
    }

    const trimmed = spaceId.trim();

    if (trimmed.length === 0) {
        console.error('Empty spaceId provided');
        throw new Error('spaceId must be a non-empty string');
    }

    if (trimmed.length > 255) {
        console.error(`spaceId too long: ${trimmed.length} characters`);
        throw new Error('spaceId must be 255 characters or less');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        console.error(`Invalid spaceId format: ${trimmed}`);
        throw new Error('spaceId must contain only alphanumeric characters, hyphens, and underscores');
    }

    return trimmed;
};

const validateItemId = (itemId: string): string => {
    if (typeof itemId !== 'string') {
        console.error(`Invalid itemId type: ${typeof itemId}`);
        throw new Error(`itemId must be a string, got ${typeof itemId}`);
    }

    const trimmed = itemId.trim();

    if (trimmed.length === 0) {
        console.error('Empty itemId provided');
        throw new Error('itemId must be a non-empty string');
    }

    if (trimmed.length > 255) {
        console.error(`itemId too long: ${trimmed.length} characters`);
        throw new Error('itemId must be 255 characters or less');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        console.error(`Invalid itemId format: ${trimmed}`);
        throw new Error('itemId must contain only alphanumeric characters, hyphens, and underscores');
    }

    return trimmed;
};

export const useSelectionStore = create<SelectionStore>((set, get) => ({
    spaceId: null,
    selectedIds: new Set(),
    lastSelectedId: null,
    context: null,

    selectSingle: (spaceId, itemId, context) => {
        const validSpaceId = validateSpaceId(spaceId);
        const validItemId = validateItemId(itemId);

        set({
            spaceId: validSpaceId,
            selectedIds: new Set([validItemId]),
            lastSelectedId: validItemId,
            context,
        });
    },

    toggleSelection: (spaceId, itemId, context) => {
        const validSpaceId = validateSpaceId(spaceId);
        const validItemId = validateItemId(itemId);
        const state = get();

        // Clear selection if switching context or space
        if (state.spaceId !== validSpaceId || state.context !== context) {
            set({
                spaceId: validSpaceId,
                selectedIds: new Set([validItemId]),
                lastSelectedId: validItemId,
                context,
            });
            return;
        }

        const newSelected = new Set(state.selectedIds);
        if (newSelected.has(validItemId)) {
            newSelected.delete(validItemId);
        } else {
            newSelected.add(validItemId);
        }

        set({
            selectedIds: newSelected,
            lastSelectedId: validItemId,
        });
    },

    selectRange: (spaceId, itemId, allVisibleIds, context) => {
        const validSpaceId = validateSpaceId(spaceId);
        const validItemId = validateItemId(itemId);
        const state = get();
        const anchor = state.lastSelectedId;

        // Clear selection if switching context or space, or no anchor
        if (!anchor || state.spaceId !== validSpaceId || state.context !== context) {
            set({
                spaceId: validSpaceId,
                selectedIds: new Set([validItemId]),
                lastSelectedId: validItemId,
                context,
            });
            return;
        }

        const anchorIndex = allVisibleIds.indexOf(anchor);
        const clickedIndex = allVisibleIds.indexOf(validItemId);

        if (anchorIndex === -1 || clickedIndex === -1) {
            set({
                spaceId: validSpaceId,
                selectedIds: new Set([validItemId]),
                lastSelectedId: validItemId,
                context,
            });
            return;
        }

        const start = Math.min(anchorIndex, clickedIndex);
        const end = Math.max(anchorIndex, clickedIndex);
        const rangeIds = allVisibleIds.slice(start, end + 1);

        set({
            spaceId: validSpaceId,
            selectedIds: new Set(rangeIds),
        });
    },

    selectAll: (spaceId, allVisibleIds, context) => {
        const validSpaceId = validateSpaceId(spaceId);
        const lastId = allVisibleIds.length > 0 ? allVisibleIds[allVisibleIds.length - 1] : null;

        set({
            spaceId: validSpaceId,
            selectedIds: new Set(allVisibleIds),
            lastSelectedId: lastId,
            context,
        });
    },

    clearSelection: () => {
        set({
            spaceId: null,
            selectedIds: new Set(),
            lastSelectedId: null,
            context: null,
        });
    },

    isSelected: (itemId, context) => {
        const state = get();
        return state.context === context && state.selectedIds.has(itemId);
    },

    getSelectedItems: () => {
        return Array.from(get().selectedIds);
    },

    getDragPayload: (draggedItemId) => {
        const state = get();
        const isSelected = state.selectedIds.has(draggedItemId);

        if (isSelected && state.selectedIds.size > 1) {
            return {
                items: Array.from(state.selectedIds),
                isMultiSelection: true,
                selectionCount: state.selectedIds.size,
            };
        }

        return {
            items: [draggedItemId],
            isMultiSelection: false,
            selectionCount: 1,
        };
    },

    onDragInitiated: (draggedItemId) => {
        const state = get();
        const isSelected = state.selectedIds.has(draggedItemId);

        if (!isSelected) {
            set({
                spaceId: null,
                selectedIds: new Set(),
                lastSelectedId: null,
            });
        }
    },

    onDragCompleted: (success, wasMultiSelection) => {
        if (success && wasMultiSelection) {
            set({
                spaceId: null,
                selectedIds: new Set(),
                lastSelectedId: null,
            });
        }
    },

    getSelectedItemsForClipboard: () => {
        return Array.from(get().selectedIds);
    },

    onClipboardCopy: () => {
        const state = get();
        return {
            items: Array.from(state.selectedIds),
            operation: 'copy' as const,
            sourceSpaceId: state.spaceId || '',
            timestamp: Date.now(),
            selectionCount: state.selectedIds.size,
        };
    },

    onClipboardCut: () => {
        const state = get();
        return {
            items: Array.from(state.selectedIds),
            operation: 'cut' as const,
            sourceSpaceId: state.spaceId || '',
            timestamp: Date.now(),
            selectionCount: state.selectedIds.size,
        };
    },

    onClipboardPasteComplete: (success, operation) => {
        if (success && operation === 'cut') {
            set({
                spaceId: null,
                selectedIds: new Set(),
                lastSelectedId: null,
            });
        }
    },
}));
