import { vi } from 'vitest';
import type { DragDropUiState } from '../../src/stores/dragDropUiStore';
import type { SelectionStore } from '../../src/stores/selectionStore';
import type { ClipboardState } from '../../src/stores/clipboardStore';

export const createMockDragDropStore = (overrides: Partial<DragDropUiState> = {}): DragDropUiState => ({
    isDragging: false,
    dragData: null,
    dropIndicator: null,
    dragExpandedFolderIds: new Set<string>(),
    flashItemId: null,
    isOverPinsGrid: false,
    pinsDropIndex: null,
    validationError: null,
    startDrag: vi.fn(),
    setDropIndicator: vi.fn(),
    clearDropIndicator: vi.fn(),
    endDrag: vi.fn(),
    addDragExpandedFolder: vi.fn(),
    clearDragExpandedFolders: vi.fn(),
    setFlashItem: vi.fn(),
    setOverPinsGrid: vi.fn(),
    validateCircularReference: vi.fn().mockReturnValue({ valid: true }),
    validateDrop: vi.fn().mockReturnValue(true),
    setValidationError: vi.fn(),
    clearValidationError: vi.fn(),
    ...overrides,
});

export const createMockSelectionStore = (overrides: Partial<SelectionStore> = {}): SelectionStore => ({
    spaceId: null,
    selectedIds: new Set<string>(),
    lastSelectedId: null,
    context: null,
    selectSingle: vi.fn(),
    toggleSelection: vi.fn(),
    selectRange: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
    isSelected: vi.fn().mockReturnValue(false),
    getSelectedItems: vi.fn().mockReturnValue([]),
    getDragPayload: vi.fn().mockReturnValue({ items: [], isMultiSelection: false, selectionCount: 0 }),
    onDragInitiated: vi.fn(),
    onDragCompleted: vi.fn(),
    getSelectedItemsForClipboard: vi.fn().mockReturnValue([]),
    onClipboardCopy: vi.fn().mockReturnValue({ items: [], operation: 'copy', sourceSpaceId: '', timestamp: 0, selectionCount: 0 }),
    onClipboardCut: vi.fn().mockReturnValue({ items: [], operation: 'cut', sourceSpaceId: '', timestamp: 0, selectionCount: 0 }),
    onClipboardPasteComplete: vi.fn(),
    ...overrides,
});

export const createMockClipboardStore = (overrides: Partial<ClipboardState> = {}): ClipboardState => ({
    items: [],
    sourceSpaceId: null,
    action: null,
    getItems: vi.fn().mockReturnValue([]),
    copyItems: vi.fn(),
    cutItems: vi.fn(),
    pasteItems: vi.fn().mockResolvedValue(undefined),
    canPaste: vi.fn().mockReturnValue(true),
    clear: vi.fn(),
    hasItems: vi.fn().mockReturnValue(false),
    getCutItems: vi.fn().mockReturnValue([]),
    writeToSystemClipboard: vi.fn().mockResolvedValue(undefined),
    readFromSystemClipboard: vi.fn().mockResolvedValue(''),
    isValidUrl: vi.fn().mockReturnValue(false),
    copyFromSelection: vi.fn(),
    cutFromSelection: vi.fn(),
    ...overrides,
});

export const createZustandMockSelector = <T>(state: T) => {
    return (selector?: (state: T) => any) => {
        if (selector) {
            return selector(state);
        }
        return state;
    };
};

export const setupStoreMocks = () => {
    const dragDropStore = createMockDragDropStore();
    const selectionStore = createMockSelectionStore();
    const clipboardStore = createMockClipboardStore();

    return {
        dragDropStore,
        selectionStore,
        clipboardStore,
        mockDragDropUiStore: createZustandMockSelector(dragDropStore),
        mockSelectionStore: createZustandMockSelector(selectionStore),
        mockClipboardStore: createZustandMockSelector(clipboardStore),
    };
};
