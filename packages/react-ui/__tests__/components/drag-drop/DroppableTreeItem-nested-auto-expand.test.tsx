import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DroppableTreeItem } from '../../../src/components/drag-drop/DroppableTreeItem';
import { useDragDropUiStore } from '../../../src/stores/dragDropUiStore';
import type { SpaceItem } from '../../../src/types';
import { SpaceItemType } from '../../../src/types';

/**
 * Comprehensive tests for nested folder auto-expand functionality
 * Covers the new isExpanded prop, Set-based dragExpandedFolderIds, and orphaned timer prevention
 */

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

describe('DroppableTreeItem - Nested Folder Auto-Expand', () => {
    let mockAddDragExpandedFolder: ReturnType<typeof vi.fn>;
    let mockClearDragExpandedFolders: ReturnType<typeof vi.fn>;
    let mockSetDropIndicator: ReturnType<typeof vi.fn>;
    let mockClearDropIndicator: ReturnType<typeof vi.fn>;
    let mockValidateDrop: ReturnType<typeof vi.fn>;
    let originalGetBoundingClientRect: typeof Element.prototype.getBoundingClientRect;

    beforeEach(() => {
        mockAddDragExpandedFolder = vi.fn();
        mockClearDragExpandedFolders = vi.fn();
        mockSetDropIndicator = vi.fn();
        mockClearDropIndicator = vi.fn();
        mockValidateDrop = vi.fn().mockReturnValue(true);

        const mockLinkItem = createMockItem({ type: SpaceItemType.link });
        const mockState = {
            isDragging: true,
            dragData: {
                item: mockLinkItem,
                items: [mockLinkItem],
                spaceId: 'space-1',
                source: 'sidebar',
                parentId: null,
                sourceIndex: 0,
                ancestorIds: [],
            },
            dropIndicator: null,
            setDropIndicator: mockSetDropIndicator,
            clearDropIndicator: mockClearDropIndicator,
            addDragExpandedFolder: mockAddDragExpandedFolder,
            clearDragExpandedFolders: mockClearDragExpandedFolders,
            validateDrop: mockValidateDrop,
        };

        (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

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

    describe('isExpanded prop - controls auto-expand behavior', () => {
        it('should auto-expand when isExpanded=false (collapsed folder)', () => {
            const folder = createMockItem({
                id: 'collapsed-folder',
                type: SpaceItemType.folder,
                name: 'Collapsed Folder',
            });

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('collapsed-folder');
            expect(mockAddDragExpandedFolder).toHaveBeenCalledTimes(1);
        });

        it('should NOT auto-expand when isExpanded=true (already expanded)', () => {
            const folder = createMockItem({
                id: 'expanded-folder',
                type: SpaceItemType.folder,
                name: 'Expanded Folder',
            });

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={true}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });

        it('should default to isExpanded=false when prop not provided', () => {
            const folder = createMockItem({
                id: 'default-folder',
                type: SpaceItemType.folder,
            });

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('default-folder');
        });
    });

    describe('Orphaned timer prevention', () => {
        it('should clear previous timer before setting new one', () => {
            const folder = createMockItem({
                id: 'test-folder',
                type: SpaceItemType.folder,
            });

            const { rerender } = render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');

            // First dragEnter - sets timer
            fireEvent.dragEnter(droppable);

            // Advance part way through delay
            act(() => {
                vi.advanceTimersByTime(400);
            });

            // Second dragEnter - should clear first timer and set new one
            fireEvent.dragEnter(droppable);

            // Complete the second timer
            act(() => {
                vi.advanceTimersByTime(800);
            });

            // Should only be called once (from second timer, first was cleared)
            expect(mockAddDragExpandedFolder).toHaveBeenCalledTimes(1);
            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('test-folder');
        });

        it('should not fire timer after drag ends', () => {
            const folder = createMockItem({
                id: 'test-folder',
                type: SpaceItemType.folder,
            });

            const { unmount } = render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            // Advance part way
            act(() => {
                vi.advanceTimersByTime(400);
            });

            // Unmount (simulates drag end)
            unmount();

            // Continue time after unmount
            act(() => {
                vi.advanceTimersByTime(500);
            });

            // Timer should have been cleaned up on unmount
            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });

        it('should clear timer on dragLeave', () => {
            const folder = createMockItem({
                id: 'test-folder',
                type: SpaceItemType.folder,
            });

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(400);
            });

            // Leave the item
            fireEvent.dragLeave(droppable, { relatedTarget: null });

            // Complete remaining time
            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });
    });

    describe('Multiple nested folders scenario', () => {
        it('should use addDragExpandedFolder (not replace)', () => {
            const parentFolder = createMockItem({
                id: 'parent-folder',
                type: SpaceItemType.folder,
                name: 'Parent',
            });

            render(
                <DroppableTreeItem
                    item={parentFolder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Parent Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            // Should call addDragExpandedFolder (adds to Set)
            // NOT setDragExpandedFolder (would replace)
            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('parent-folder');
        });

        it('should handle rapid folder hover sequence', () => {
            const folders = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder, name: 'Folder 1' }),
                createMockItem({ id: 'folder-2', type: SpaceItemType.folder, name: 'Folder 2' }),
                createMockItem({ id: 'folder-3', type: SpaceItemType.folder, name: 'Folder 3' }),
            ];

            folders.forEach((folder, idx) => {
                const { unmount } = render(
                    <DroppableTreeItem
                        item={folder}
                        spaceId="space-1"
                        parentId={null}
                        index={idx}
                        level={0}
                        accentColor="#6D5AE6"
                        ancestorIds={[]}
                        isExpanded={false}
                    >
                        <div>Content</div>
                    </DroppableTreeItem>
                );

                const droppable = screen.getByTestId('droppable-tree-item');
                fireEvent.dragEnter(droppable);

                act(() => {
                    vi.advanceTimersByTime(800);
                });

                unmount();
            });

            // Each folder should call addDragExpandedFolder
            expect(mockAddDragExpandedFolder).toHaveBeenCalledTimes(3);
            expect(mockAddDragExpandedFolder).toHaveBeenNthCalledWith(1, 'folder-1');
            expect(mockAddDragExpandedFolder).toHaveBeenNthCalledWith(2, 'folder-2');
            expect(mockAddDragExpandedFolder).toHaveBeenNthCalledWith(3, 'folder-3');
        });
    });

    describe('Drop handling with new API', () => {
        it('should preserve drag-expanded folders on drop (NOT clear them)', () => {
            // Folders are preserved so TreeView can commit them to base expandedIds
            // before endDrag() clears the temporary drag state
            const folder = createMockItem({
                id: 'drop-folder',
                type: SpaceItemType.folder,
            });

            const mockOnDrop = vi.fn();

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                    onDrop={mockOnDrop}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.drop(droppable, { clientY: 50 });

            // Drag-expanded folders should NOT be cleared on drop
            // They are preserved so TreeView can commit them to base state
            expect(mockClearDragExpandedFolders).not.toHaveBeenCalled();
            // Drop indicator should be cleared
            expect(mockClearDropIndicator).toHaveBeenCalled();
            // onDrop callback should be called
            expect(mockOnDrop).toHaveBeenCalled();
        });

        it('should clear timer on drop', () => {
            const folder = createMockItem({
                id: 'drop-folder',
                type: SpaceItemType.folder,
            });

            const mockOnDrop = vi.fn();

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                    onDrop={mockOnDrop}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');

            // Start auto-expand timer
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(400);
            });

            // Drop before timer completes
            fireEvent.drop(droppable, { clientY: 50 });

            // Complete remaining time
            act(() => {
                vi.advanceTimersByTime(500);
            });

            // Timer should have been cleared on drop
            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });
    });

    describe('Edge cases', () => {
        it('should handle folder with no children', () => {
            const emptyFolder = createMockItem({
                id: 'empty-folder',
                type: SpaceItemType.folder,
                children: [],
            });

            render(
                <DroppableTreeItem
                    item={emptyFolder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            // Should still attempt to expand even if empty
            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('empty-folder');
        });

        it('should not auto-expand links', () => {
            const link = createMockItem({
                id: 'test-link',
                type: SpaceItemType.link,
            });

            render(
                <DroppableTreeItem
                    item={link}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });

        it('should handle very deep nesting levels', () => {
            const deepFolder = createMockItem({
                id: 'level-10-folder',
                type: SpaceItemType.folder,
            });

            render(
                <DroppableTreeItem
                    item={deepFolder}
                    spaceId="space-1"
                    parentId="level-9-folder"
                    index={0}
                    level={10}
                    accentColor="#6D5AE6"
                    ancestorIds={Array.from({ length: 10 }, (_, i) => `level-${i}-folder`)}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('level-10-folder');
        });

        it('should handle dragEnter when not dragging', () => {
            const folder = createMockItem({
                id: 'test-folder',
                type: SpaceItemType.folder,
            });

            const mockState = {
                isDragging: false,
                dragData: null,
                dropIndicator: null,
                setDropIndicator: mockSetDropIndicator,
                clearDropIndicator: mockClearDropIndicator,
                addDragExpandedFolder: mockAddDragExpandedFolder,
                clearDragExpandedFolders: mockClearDragExpandedFolders,
                validateDrop: mockValidateDrop,
            };

            (useDragDropUiStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(createMockStore(mockState));

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });

        it('should handle dragEnter on invalid drop target', () => {
            const folder = createMockItem({
                id: 'test-folder',
                type: SpaceItemType.folder,
            });

            mockValidateDrop.mockReturnValue(false);

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            act(() => {
                vi.advanceTimersByTime(800);
            });

            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();
        });
    });

    describe('Auto-expand delay timing', () => {
        it('should use exactly 800ms delay', () => {
            const folder = createMockItem({
                id: 'test-folder',
                type: SpaceItemType.folder,
            });

            render(
                <DroppableTreeItem
                    item={folder}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable);

            // Should not expand at 799ms
            act(() => {
                vi.advanceTimersByTime(799);
            });
            expect(mockAddDragExpandedFolder).not.toHaveBeenCalled();

            // Should expand at 800ms
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('test-folder');
        });

        it('should handle multiple folders with staggered timings', () => {
            const folder1 = createMockItem({ id: 'folder-1', type: SpaceItemType.folder });
            const folder2 = createMockItem({ id: 'folder-2', type: SpaceItemType.folder });

            const { unmount: unmount1 } = render(
                <DroppableTreeItem
                    item={folder1}
                    spaceId="space-1"
                    parentId={null}
                    index={0}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content</div>
                </DroppableTreeItem>
            );

            const droppable1 = screen.getByTestId('droppable-tree-item');
            fireEvent.dragEnter(droppable1);

            // Advance 400ms
            act(() => {
                vi.advanceTimersByTime(400);
            });

            unmount1();

            // Render second folder
            render(
                <DroppableTreeItem
                    item={folder2}
                    spaceId="space-1"
                    parentId={null}
                    index={1}
                    level={0}
                    accentColor="#6D5AE6"
                    ancestorIds={[]}
                    isExpanded={false}
                >
                    <div>Content 2</div>
                </DroppableTreeItem>
            );

            const droppable2 = screen.getAllByTestId('droppable-tree-item')[0];
            fireEvent.dragEnter(droppable2);

            // Advance another 800ms
            act(() => {
                vi.advanceTimersByTime(800);
            });

            // Only folder-2 should expand (folder-1 timer was cleared on unmount)
            expect(mockAddDragExpandedFolder).toHaveBeenCalledTimes(1);
            expect(mockAddDragExpandedFolder).toHaveBeenCalledWith('folder-2');
        });
    });
});
