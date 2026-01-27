import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DroppableTreeItem } from '../../../src/components/drag-drop/DroppableTreeItem';
import { useDragDropUiStore } from '../../../src/stores/dragDropUiStore';
import type { SpaceItem } from '../../../src/types';
import { SpaceItemType } from '../../../src/types';

function createDragOverEvent(clientY: number): React.DragEvent<HTMLDivElement> {
    const event = new Event('dragover', { bubbles: true, cancelable: true }) as unknown as React.DragEvent<HTMLDivElement>;
    Object.defineProperty(event, 'clientY', { value: clientY, writable: false });
    Object.defineProperty(event, 'dataTransfer', { value: { dropEffect: 'none' }, writable: true });
    return event;
}

// Create a mock store that supports both direct access and selector functions
const createMockStore = (state: any) => {
    return (selector?: (state: any) => any) => {
        if (selector) {
            return selector(state);
        }
        return state;
    };
};

vi.mock('../../../src/stores/dragDropUiStore', () => ({
    useDragDropUiStore: vi.fn(),
}));

const createMockItem = (overrides: Partial<SpaceItem> = {}): SpaceItem => ({
    id: 'item-1',
    name: 'Test Item',
    type: SpaceItemType.link,
    path: 'https://example.com',
    isExpanded: false,
    children: [],
    faviconUrl: null,
    description: null,
    visitCount: 0,
    lastVisited: null,
    createdAt: new Date(),
    isPinned: false,
    pinPosition: null,
    localPath: null,
    securityBookmark: null,
    lastSyncedAt: null,
    isWatching: false,
    ...overrides,
});

const mockFolderItem = createMockItem({ id: 'folder-1', name: 'Test Folder', type: SpaceItemType.folder });
const mockLinkItem = createMockItem({ id: 'link-1', name: 'Test Link', type: SpaceItemType.link });
const mockAccentColor = '#6D5AE6';

describe('Feature: Drop Target Hit Zones - DroppableTreeItem Component', () => {
    let mockSetDropIndicator: ReturnType<typeof vi.fn>;
    let mockClearDropIndicator: ReturnType<typeof vi.fn>;
    let mockAddDragExpandedFolder: ReturnType<typeof vi.fn>;
    let mockClearDragExpandedFolder: ReturnType<typeof vi.fn>;
    let mockValidateDrop: ReturnType<typeof vi.fn>;
    let originalGetBoundingClientRect: typeof Element.prototype.getBoundingClientRect;

    beforeEach(() => {
        mockSetDropIndicator = vi.fn();
        mockClearDropIndicator = vi.fn();
        mockAddDragExpandedFolder = vi.fn();
        mockClearDragExpandedFolder = vi.fn();
        mockValidateDrop = vi.fn().mockReturnValue(true);

        const mockState = {
            isDragging: true,
            dragData: { item: mockLinkItem, items: [mockLinkItem], spaceId: 'space-1', source: 'sidebar' },
            dropIndicator: null,
            setDropIndicator: mockSetDropIndicator,
            clearDropIndicator: mockClearDropIndicator,
            addDragExpandedFolder: mockAddDragExpandedFolder,
            validateDrop: mockValidateDrop,
        };

        (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

        // Mock getBoundingClientRect globally for all elements
        originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
            top: 0, height: 100, left: 0, right: 100, bottom: 100, width: 100, x: 0, y: 0,
            toJSON: () => { },
        });

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    describe('AC1: Folder hit zones (20/60/20 split)', () => {
        it('should set position to "before" when hovering top 20% of folder', () => {
            const { container } = render(
                <DroppableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div style={{ height: 100 }}>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');

            // Hover at top 10% (y=10 of 100, with global mock returning height=100, top=0)
            droppable.dispatchEvent(createDragOverEvent(10) as unknown as Event);

            expect(mockSetDropIndicator).toHaveBeenCalledWith(
                expect.objectContaining({ position: 'before' })
            );
        });

        it('should set position to "inside" when hovering middle 60% of folder', () => {
            render(
                <DroppableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div style={{ height: 100 }}>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');

            // Hover at middle 50% (y=50 of 100)
            droppable.dispatchEvent(createDragOverEvent(50) as unknown as Event);

            expect(mockSetDropIndicator).toHaveBeenCalledWith(
                expect.objectContaining({ position: 'inside' })
            );
        });

        it('should set position to "after" when hovering bottom 20% of folder', () => {
            render(
                <DroppableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div style={{ height: 100 }}>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');

            // Hover at bottom 90% (y=90 of 100)
            droppable.dispatchEvent(createDragOverEvent(90) as unknown as Event);

            expect(mockSetDropIndicator).toHaveBeenCalledWith(
                expect.objectContaining({ position: 'after' })
            );
        });
    });

    describe('AC2: Link hit zones (50/50 split)', () => {
        it('should set position to "before" when hovering top 50% of link', () => {
            render(
                <DroppableTreeItem
                    item={mockLinkItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div style={{ height: 100 }}>Link Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');

            // Hover at top 25% (y=25 of 100)
            droppable.dispatchEvent(createDragOverEvent(25) as unknown as Event);

            expect(mockSetDropIndicator).toHaveBeenCalledWith(
                expect.objectContaining({ position: 'before' })
            );
        });

        it('should set position to "after" when hovering bottom 50% of link', () => {
            render(
                <DroppableTreeItem
                    item={mockLinkItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div style={{ height: 100 }}>Link Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');

            // Hover at bottom 75% (y=75 of 100)
            droppable.dispatchEvent(createDragOverEvent(75) as unknown as Event);

            expect(mockSetDropIndicator).toHaveBeenCalledWith(
                expect.objectContaining({ position: 'after' })
            );
        });
    });

    describe('F014: Drop Validation', () => {
        it('should mark invalid drop targets', () => {
            mockValidateDrop.mockReturnValue(false);

            render(
                <DroppableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            expect(droppable.getAttribute('data-valid-drop')).toBe('false');
        });

        it('should mark valid drop targets', () => {
            mockValidateDrop.mockReturnValue(true);

            render(
                <DroppableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            expect(droppable.getAttribute('data-valid-drop')).toBe('true');
        });

        it('should not update drop indicator for invalid targets', () => {
            mockValidateDrop.mockReturnValue(false);

            render(
                <DroppableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragOver(droppable, { clientY: 50 });

            expect(mockSetDropIndicator).not.toHaveBeenCalled();
        });
    });

    describe('F015: Auto-Expand Folders on Drag Hover', () => {
        it('should auto-expand collapsed folder after 800ms hover', async () => {
            const collapsedFolder = createMockItem({
                id: 'folder-collapsed',
                type: SpaceItemType.folder,
                isExpanded: false,
            });

            render(
                <DroppableTreeItem
                    item={collapsedFolder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();

            // Fast-forward 800ms
            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('folder-collapsed');
        });

        it('should not auto-expand already expanded folder', () => {
            const expandedFolder = createMockItem({
                id: 'folder-expanded',
                type: SpaceItemType.folder,
                isExpanded: true,
            });

            render(
                <DroppableTreeItem
                    item={expandedFolder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });

        it('should cancel auto-expand when drag leaves', () => {
            const collapsedFolder = createMockItem({
                id: 'folder-collapsed',
                type: SpaceItemType.folder,
                isExpanded: false,
            });

            render(
                <DroppableTreeItem
                    item={collapsedFolder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                >
                    <div>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            // Leave before 800ms
            act(() => {
                vi.advanceTimersByTime(400);
            });

            fireEvent.dragLeave(droppable, { relatedTarget: null });

            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });
    });

    describe('Drop handling', () => {
        it('should call onDrop callback when item is dropped', () => {
            const mockOnDrop = vi.fn();

            render(
                <DroppableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                    onDrop={mockOnDrop}
                >
                    <div style={{ height: 100 }}>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            droppable.getBoundingClientRect = vi.fn().mockReturnValue({
                top: 0, height: 100, left: 0, right: 100, bottom: 100, width: 100
            });

            fireEvent.drop(droppable, { clientY: 50 });

            expect(mockOnDrop).toHaveBeenCalledWith('folder-1', 'inside');
        });

        it('should clear drop indicator after drop but preserve drag-expanded folders', () => {
            const mockOnDrop = vi.fn();

            render(
                <DroppableTreeItem
                    item={mockFolderItem}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor={mockAccentColor}
                    ancestorIds={[]}
                    onDrop={mockOnDrop}
                >
                    <div style={{ height: 100 }}>Folder Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            droppable.getBoundingClientRect = vi.fn().mockReturnValue({
                top: 0, height: 100, left: 0, right: 100, bottom: 100, width: 100
            });

            fireEvent.drop(droppable, { clientY: 50 });

            // Drop indicator should be cleared
            expect(mockClearDropIndicator).toHaveBeenCalled();
            // Drag-expanded folders should NOT be cleared here - they are preserved
            // so TreeView can commit them to base expandedIds before endDrag() clears them
            expect(mockClearDragExpandedFolder).not.toHaveBeenCalled();
        });
    });
});
