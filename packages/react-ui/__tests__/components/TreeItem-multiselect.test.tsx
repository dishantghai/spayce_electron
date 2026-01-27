import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import { TreeItem } from '../../src/components/TreeItem';
import { useSelectionStore } from '../../src/stores/selectionStore';
import { SpaceItemType } from '../../src/types';
import type { SpaceItem } from '../../src/types';

// Mock the drag-drop components to simplify testing
vi.mock('../../src/components/drag-drop', () => ({
    DraggableTreeItem: ({ children }: { children: React.ReactNode }) => <div data-testid="draggable">{children}</div>,
    DroppableTreeItem: ({ children }: { children: React.ReactNode }) => <div data-testid="droppable">{children}</div>,
    FlashItem: ({ children }: { children: React.ReactNode }) => <div data-testid="flash">{children}</div>,
}));

// Mock TreeItemIcon
vi.mock('../../src/components/TreeItemIcon', () => ({
    TreeItemIcon: () => <span data-testid="tree-icon">icon</span>,
}));

describe('Feature F017: Ctrl+Click Toggle Selection', () => {
    const mockItem: SpaceItem = {
        id: 'item-1',
        name: 'Test Item',
        type: SpaceItemType.link,
        path: '/test',
        isPinned: false,
        isExpanded: false,
        children: [],
        faviconUrl: null,
        description: null,
        visitCount: 0,
        lastVisited: null,
        createdAt: new Date(),
        pinPosition: null,
        localPath: null,
        securityBookmark: null,
        lastSyncedAt: null,
        isWatching: false,
    };

    const mockFolder: SpaceItem = {
        id: 'folder-1',
        name: 'Test Folder',
        type: SpaceItemType.folder,
        path: '',
        isPinned: false,
        isExpanded: false,
        children: [],
        faviconUrl: null,
        description: null,
        visitCount: 0,
        lastVisited: null,
        createdAt: new Date(),
        pinPosition: null,
        localPath: null,
        securityBookmark: null,
        lastSyncedAt: null,
        isWatching: false,
    };

    const defaultProps = {
        item: mockItem,
        depth: 0,
        selectedId: null,
        activeId: null,
        expandedIds: new Set<string>(),
        accentColor: '#6D5AE6',
        spaceId: 'space-1',
    };

    beforeEach(() => {
        // Reset selection store before each test
        useSelectionStore.setState({
            spaceId: null,
            selectedIds: new Set(),
            lastSelectedId: null,
        });
    });

    describe('AC1: Ctrl+Click adds item to selection if not selected', () => {
        test('should add item to selection on Ctrl+Click', () => {
            const onItemClick = vi.fn();
            render(<TreeItem {...defaultProps} onItemClick={onItemClick} />);

            const treeItem = screen.getByRole('treeitem');

            // Simulate Ctrl+Click
            fireEvent.click(treeItem, { ctrlKey: true });

            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.spaceId).toBe('space-1');
            expect(state.lastSelectedId).toBe('item-1');
            // onItemClick should NOT be called on Ctrl+Click
            expect(onItemClick).not.toHaveBeenCalled();
        });

        test('should add item to selection on Cmd+Click (Mac)', () => {
            // Mock navigator.platform to simulate Mac
            const originalPlatform = navigator.platform;
            Object.defineProperty(navigator, 'platform', {
                value: 'MacIntel',
                writable: true,
                configurable: true,
            });

            render(<TreeItem {...defaultProps} />);

            const treeItem = screen.getByRole('treeitem');

            // Simulate Cmd+Click (metaKey on Mac)
            fireEvent.click(treeItem, { metaKey: true });

            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(true);

            // Restore original platform
            Object.defineProperty(navigator, 'platform', {
                value: originalPlatform,
                writable: true,
                configurable: true,
            });
        });

        test('should accumulate multiple Ctrl+Clicks', () => {
            const item2: SpaceItem = { ...mockItem, id: 'item-2', name: 'Item 2' };

            const { rerender } = render(<TreeItem {...defaultProps} />);

            // First Ctrl+Click
            fireEvent.click(screen.getByRole('treeitem'), { ctrlKey: true });

            // Rerender with second item
            rerender(<TreeItem {...defaultProps} item={item2} />);

            // Second Ctrl+Click
            fireEvent.click(screen.getByRole('treeitem'), { ctrlKey: true });

            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(2);
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.has('item-2')).toBe(true);
        });
    });

    describe('AC2: Ctrl+Click on already selected item removes it from selection', () => {
        test('should remove item from selection on Ctrl+Click if already selected', () => {
            // Pre-select the item
            act(() => {
                useSelectionStore.getState().toggleSelection('space-1', 'item-1', 'sidebar');
            });
            expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);

            render(<TreeItem {...defaultProps} />);
            const treeItem = screen.getByRole('treeitem');

            // Ctrl+Click to deselect
            fireEvent.click(treeItem, { ctrlKey: true });

            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(false);
        });

        test('should keep other items selected when removing one', () => {
            // Pre-select multiple items
            act(() => {
                useSelectionStore.getState().toggleSelection('space-1', 'item-1', 'sidebar');
                useSelectionStore.getState().toggleSelection('space-1', 'item-2', 'sidebar');
                useSelectionStore.getState().toggleSelection('space-1', 'item-3', 'sidebar');
            });

            render(<TreeItem {...defaultProps} />);
            const treeItem = screen.getByRole('treeitem');

            // Ctrl+Click to deselect item-1
            fireEvent.click(treeItem, { ctrlKey: true });

            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(false);
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.has('item-3')).toBe(true);
        });
    });

    describe('AC3: Regular click clears multi-selection and selects single item', () => {
        test('should clear multi-selection on regular click', () => {
            // Pre-select multiple items
            act(() => {
                useSelectionStore.getState().toggleSelection('space-1', 'item-1', 'sidebar');
                useSelectionStore.getState().toggleSelection('space-1', 'item-2', 'sidebar');
            });

            const onItemClick = vi.fn();
            render(<TreeItem {...defaultProps} onItemClick={onItemClick} />);
            const treeItem = screen.getByRole('treeitem');

            // Regular click (no modifier)
            fireEvent.click(treeItem);

            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(0);
            expect(state.spaceId).toBeNull();
            expect(onItemClick).toHaveBeenCalledWith(mockItem);
        });

        test('should call onItemClick on regular click', () => {
            const onItemClick = vi.fn();
            render(<TreeItem {...defaultProps} onItemClick={onItemClick} />);

            fireEvent.click(screen.getByRole('treeitem'));

            expect(onItemClick).toHaveBeenCalledWith(mockItem);
        });
    });

    describe('AC5: Selection state persists across tree re-renders', () => {
        test('should maintain selection after rerender', () => {
            const { rerender } = render(<TreeItem {...defaultProps} />);

            // Ctrl+Click to select
            fireEvent.click(screen.getByRole('treeitem'), { ctrlKey: true });
            expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);

            // Rerender component
            rerender(<TreeItem {...defaultProps} selectedId="other-item" />);

            // Selection should persist in store
            expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);
        });
    });

    describe('AC6: Works for both folders and links', () => {
        test('should toggle selection for folder on Ctrl+Click', () => {
            const onItemExpand = vi.fn();
            render(<TreeItem {...defaultProps} item={mockFolder} onItemExpand={onItemExpand} />);

            fireEvent.click(screen.getByRole('treeitem'), { ctrlKey: true });

            expect(useSelectionStore.getState().selectedIds.has('folder-1')).toBe(true);
            // Should NOT expand folder on Ctrl+Click
            expect(onItemExpand).not.toHaveBeenCalled();
        });

        test('should toggle selection for link on Ctrl+Click', () => {
            render(<TreeItem {...defaultProps} />);

            fireEvent.click(screen.getByRole('treeitem'), { ctrlKey: true });

            expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);
        });
    });

    describe('AC7: Works at any nesting level', () => {
        test('should work at depth 0', () => {
            render(<TreeItem {...defaultProps} depth={0} />);

            fireEvent.click(screen.getByRole('treeitem'), { ctrlKey: true });

            expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);
        });

        test('should work at depth 3', () => {
            render(<TreeItem {...defaultProps} depth={3} />);

            fireEvent.click(screen.getByRole('treeitem'), { ctrlKey: true });

            expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);
        });
    });

    describe('Folder behavior with Ctrl+Click', () => {
        test('should NOT call onItemClick on Ctrl+Click (only toggles selection)', () => {
            const onItemClick = vi.fn();
            render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    onItemClick={onItemClick}
                />
            );

            const treeItems = screen.getAllByRole('treeitem');
            fireEvent.click(treeItems[0], { ctrlKey: true });

            // Ctrl+Click should only toggle selection, not call onItemClick
            expect(onItemClick).not.toHaveBeenCalled();
            // But selection should be toggled
            expect(useSelectionStore.getState().selectedIds.has('folder-1')).toBe(true);
        });

        test('should call onItemClick on regular click', () => {
            const onItemClick = vi.fn();
            render(
                <TreeItem
                    {...defaultProps}
                    item={mockFolder}
                    onItemClick={onItemClick}
                />
            );

            const treeItems = screen.getAllByRole('treeitem');
            fireEvent.click(treeItems[0]);

            // Regular click should call onItemClick
            expect(onItemClick).toHaveBeenCalled();
        });
    });

    describe('Renaming state', () => {
        test('should not toggle selection when renaming', () => {
            render(<TreeItem {...defaultProps} renameItemId="item-1" />);

            // Try to Ctrl+Click while renaming - use getAllByRole since there may be multiple
            const treeItems = screen.getAllByRole('treeitem');
            fireEvent.click(treeItems[0], { ctrlKey: true });

            // Selection should not change
            expect(useSelectionStore.getState().selectedIds.size).toBe(0);
        });
    });
});
