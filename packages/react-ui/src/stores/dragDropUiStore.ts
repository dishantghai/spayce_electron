import { create } from 'zustand';
import type { SpaceItem } from '../types';

export type DragSource = 'sidebar' | 'spaceCard' | 'pins-grid';
export type DropPosition = 'before' | 'after' | 'inside';

export interface DragData {
    item: SpaceItem;
    items: SpaceItem[];
    spaceId: string;
    parentId: string | null;
    sourceIndex: number;
    source: DragSource;
    ancestorIds: string[];
}

export interface DropIndicatorState {
    targetId: string;
    position: DropPosition;
    spaceId: string;
    targetIndex: number;
    targetParentId: string | null;
}

export interface DragDropValidationError {
    type: 'circular_reference' | 'invalid_target' | 'permission_denied' | 'system_error';
    message: string;
    context: {
        operation: 'move' | 'reorder' | 'pin';
        source: DragSource;
        spaceId: string;
        timestamp: number;
    };
    targetItemId?: string;
    sourceItemId?: string;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export interface DragDropUiState {
    isDragging: boolean;
    dragData: DragData | null;
    dropIndicator: DropIndicatorState | null;
    dragExpandedFolderIds: Set<string>;
    flashItemId: string | null;
    isOverPinsGrid: boolean;
    pinsDropIndex: number | null;
    validationError: DragDropValidationError | null;

    startDrag: (data: DragData) => void;
    setDropIndicator: (indicator: DropIndicatorState | null) => void;
    clearDropIndicator: () => void;
    endDrag: () => void;
    addDragExpandedFolder: (id: string) => void;
    clearDragExpandedFolders: () => void;
    setFlashItem: (id: string | null) => void;
    setOverPinsGrid: (isOver: boolean, dropIndex?: number | null) => void;
    validateCircularReference: (draggedItemId: string, targetFolderId: string | null, ancestorIds: string[]) => ValidationResult;
    validateDrop: (dragData: DragData, targetId: string, targetAncestorIds: string[]) => boolean;
    setValidationError: (error: DragDropValidationError | null) => void;
    clearValidationError: () => void;
}

export const useDragDropUiStore = create<DragDropUiState>((set, get) => ({
    isDragging: false,
    dragData: null,
    dropIndicator: null,
    dragExpandedFolderIds: new Set<string>(),
    flashItemId: null,
    isOverPinsGrid: false,
    pinsDropIndex: null,
    validationError: null,

    startDrag: (data) => set({
        isDragging: true,
        dragData: data,
        dropIndicator: null,
    }),

    setDropIndicator: (indicator) => {
        if (indicator) {
            const state = get();
            if (state.dragData) {
                const validation = get().validateCircularReference(
                    state.dragData.item.id,
                    indicator.targetParentId,
                    state.dragData.ancestorIds
                );

                if (!validation.valid) {
                    const error: DragDropValidationError = {
                        type: 'circular_reference',
                        message: validation.error!,
                        context: {
                            operation: 'move',
                            source: state.dragData.source,
                            spaceId: state.dragData.spaceId,
                            timestamp: Date.now(),
                        },
                        sourceItemId: state.dragData.item.id,
                        targetItemId: indicator.targetId,
                    };

                    set({ validationError: error, dropIndicator: null });
                    return;
                }

                set({ validationError: null });
            }
        }

        set({ dropIndicator: indicator });
    },

    clearDropIndicator: () => set({ dropIndicator: null }),

    endDrag: () => {
        console.log('[Store endDrag] Clearing all drag state');
        set({
            isDragging: false,
            dragData: null,
            dropIndicator: null,
            dragExpandedFolderIds: new Set<string>(),
            validationError: null,
        });
    },

    addDragExpandedFolder: (id) => {
        const current = get().dragExpandedFolderIds;
        const updated = new Set(current);
        updated.add(id);
        console.log(`[Store addDragExpandedFolder] Adding folder ID: ${id}, total: ${updated.size}`);
        set({ dragExpandedFolderIds: updated });
    },

    clearDragExpandedFolders: () => {
        console.log('[Store clearDragExpandedFolders] Clearing all drag-expanded folders');
        set({ dragExpandedFolderIds: new Set<string>() });
    },

    setFlashItem: (id) => set({ flashItemId: id }),

    setOverPinsGrid: (isOver, dropIndex = null) => set({
        isOverPinsGrid: isOver,
        pinsDropIndex: dropIndex,
    }),

    validateCircularReference: (draggedItemId, targetFolderId, ancestorIds) => {
        if (draggedItemId === targetFolderId) {
            return { valid: false, error: 'Cannot move folder into itself' };
        }

        if (targetFolderId && ancestorIds.includes(targetFolderId)) {
            return { valid: false, error: 'Cannot move folder into its descendant' };
        }

        return { valid: true };
    },

    setValidationError: (error) => set({ validationError: error }),

    clearValidationError: () => set({ validationError: null }),

    validateDrop: (dragData, targetId, targetAncestorIds) => {
        // Cannot drop on self
        if (dragData.item.id === targetId) return false;

        // Cannot drop on any of the dragged items
        if (dragData.items.some(item => item.id === targetId)) return false;

        // Cannot drop folder into its own descendants (circular reference)
        if (targetAncestorIds.includes(dragData.item.id)) return false;

        return true;
    },
}));
