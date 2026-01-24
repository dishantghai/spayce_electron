import { create } from 'zustand';
import type { SpaceItem } from '../types';

export type DragSource = 'sidebar' | 'spaceCard';
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

interface DragDropUiState {
    isDragging: boolean;
    dragData: DragData | null;
    dropIndicator: DropIndicatorState | null;
    dragExpandedFolderId: string | null;
    flashItemId: string | null;
    isOverPinsGrid: boolean;
    pinsDropIndex: number | null;
    validationError: DragDropValidationError | null;

    startDrag: (data: DragData) => void;
    setDropIndicator: (indicator: DropIndicatorState | null) => void;
    endDrag: () => void;
    setDragExpandedFolder: (id: string | null) => void;
    setFlashItem: (id: string | null) => void;
    setOverPinsGrid: (isOver: boolean, dropIndex?: number | null) => void;
    validateCircularReference: (draggedItemId: string, targetFolderId: string | null, ancestorIds: string[]) => ValidationResult;
    setValidationError: (error: DragDropValidationError | null) => void;
    clearValidationError: () => void;
}

export const useDragDropUiStore = create<DragDropUiState>((set, get) => ({
    isDragging: false,
    dragData: null,
    dropIndicator: null,
    dragExpandedFolderId: null,
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

    endDrag: () => set({
        isDragging: false,
        dragData: null,
        dropIndicator: null,
        dragExpandedFolderId: null,
        validationError: null,
    }),

    setDragExpandedFolder: (id) => set({ dragExpandedFolderId: id }),

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
}));
