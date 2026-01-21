import { create } from 'zustand';

export type DropPosition = 'before' | 'after' | 'inside';

export interface DragData {
    type: 'space' | 'item';
    id: string;
    sourceSpaceId?: string;
    sourceParentId?: string | null;
}

interface DragDropUiState {
    isDragging: boolean;
    dragData: DragData | null;
    dropTargetId: string | null;
    dropPosition: DropPosition | null;
    expandedFolderId: string | null;
    flashItemId: string | null;

    startDrag: (data: DragData) => void;
    setDropTarget: (targetId: string | null, position: DropPosition | null) => void;
    endDrag: () => void;
    setExpandedFolder: (folderId: string | null) => void;
    setFlashItem: (itemId: string | null) => void;
}

export const useDragDropUiStore = create<DragDropUiState>((set) => ({
    isDragging: false,
    dragData: null,
    dropTargetId: null,
    dropPosition: null,
    expandedFolderId: null,
    flashItemId: null,

    startDrag: (data) => set({
        isDragging: true,
        dragData: data,
        dropTargetId: null,
        dropPosition: null
    }),

    setDropTarget: (targetId, position) => set({
        dropTargetId: targetId,
        dropPosition: position
    }),

    endDrag: () => set({
        isDragging: false,
        dragData: null,
        dropTargetId: null,
        dropPosition: null,
        expandedFolderId: null
    }),

    setExpandedFolder: (folderId) => set({ expandedFolderId: folderId }),

    setFlashItem: (itemId) => set({ flashItemId: itemId }),
}));
