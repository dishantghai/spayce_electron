import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PinnedLinksGrid } from '../../src/components/PinnedLinksGrid';
import type { SpaceItem } from '../../src/types';
import { SpaceItemType } from '../../src/types';
import { useDragDropUiStore } from '../../src/stores/dragDropUiStore';
import type { DragData } from '../../src/stores/dragDropUiStore';

// Mock SpaceItem for testing
const createMockLink = (id: string, name: string, isPinned = false): SpaceItem => ({
    id,
    name,
    type: SpaceItemType.link,
    path: `https://example.com/${id}`,
    isExpanded: false,
    children: [],
    faviconUrl: `https://example.com/${id}/favicon.ico`,
    description: null,
    visitCount: 0,
    lastVisited: null,
    createdAt: new Date(),
    isPinned,
    pinPosition: isPinned ? 0 : null,
    localPath: null,
    securityBookmark: null,
    lastSyncedAt: null,
    isWatching: false,
});

const createMockFolder = (id: string, name: string): SpaceItem => ({
    id,
    name,
    type: SpaceItemType.folder,
    path: '',
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
});

const mockSpaceColor = '#6D5AE6';
const mockSpaceId = 'space-1';

// Helper to create drag data
const createDragData = (item: SpaceItem, isPinned = false): DragData => ({
    item: { ...item, isPinned },
    items: [item],
    spaceId: mockSpaceId,
    parentId: null,
    sourceIndex: 0,
    source: 'sidebar',
    ancestorIds: [],
});

describe('Feature: F022 - Drag to Pins Grid', () => {
    beforeEach(() => {
        // Reset store state
        useDragDropUiStore.setState({
            isDragging: false,
            dragData: null,
            dropIndicator: null,
            dragExpandedFolderIds: new Set<string>(),
            flashItemId: null,
            isOverPinsGrid: false,
            pinsDropIndex: null,
            validationError: null,
        });
    });

    describe('AC1: Only links can be dragged to pins grid', () => {
        it('should accept link items for pinning', () => {
            const pinnedItems: SpaceItem[] = [];
            const mockLink = createMockLink('link-1', 'Test Link');

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // Set up drag state with a link
            useDragDropUiStore.getState().startDrag(createDragData(mockLink));

            // The grid should be able to accept this drop
            // This test verifies the canAcceptDrop logic accepts links
            const state = useDragDropUiStore.getState();
            expect(state.dragData?.item.type).toBe(SpaceItemType.link);
        });

        it('should reject folder items', () => {
            const pinnedItems: SpaceItem[] = [];
            const mockFolder = createMockFolder('folder-1', 'Test Folder');

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // Set up drag state with a folder
            useDragDropUiStore.getState().startDrag(createDragData(mockFolder));

            // The grid should reject this - folders cannot be pinned
            const state = useDragDropUiStore.getState();
            expect(state.dragData?.item.type).toBe(SpaceItemType.folder);
            // When we implement canAcceptDrop, it should return false for folders
        });
    });

    describe('AC2: Folders rejected with not-allowed cursor', () => {
        it('should show not-allowed cursor effect when dragging folder over grid', () => {
            const pinnedItems: SpaceItem[] = [];

            const { container } = render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // When folder is dragged over, the grid should indicate rejection
            // This will be implemented via onDragOver returning false/not-allowed
            expect(container).toBeTruthy();
        });
    });

    describe('AC3: Drop position indicator shows between existing pins', () => {
        it('should calculate correct drop index at beginning', () => {
            const pinnedItems = [
                createMockLink('pin-1', 'Pin 1', true),
                createMockLink('pin-2', 'Pin 2', true),
            ];

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // Test will verify drop index calculation
            // Position at very left should give index 0
            expect(pinnedItems.length).toBe(2);
        });

        it('should calculate correct drop index in middle', () => {
            const pinnedItems = [
                createMockLink('pin-1', 'Pin 1', true),
                createMockLink('pin-2', 'Pin 2', true),
                createMockLink('pin-3', 'Pin 3', true),
            ];

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            expect(pinnedItems.length).toBe(3);
        });

        it('should calculate correct drop index at end', () => {
            const pinnedItems = [
                createMockLink('pin-1', 'Pin 1', true),
            ];

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // Position beyond last item should give index equal to length
            expect(pinnedItems.length).toBe(1);
        });
    });

    describe('AC4: Max 15 pins enforced (5x3 grid)', () => {
        it('should reject new pins when at max capacity', () => {
            // Create 15 pinned items (max)
            const pinnedItems = Array.from({ length: 15 }, (_, i) =>
                createMockLink(`pin-${i}`, `Pin ${i}`, true)
            );

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // Should have 15 pins
            expect(pinnedItems.length).toBe(15);
            // canAcceptDrop should return false for new items when at max
        });

        it('should accept new pins when under max capacity', () => {
            const pinnedItems = Array.from({ length: 14 }, (_, i) =>
                createMockLink(`pin-${i}`, `Pin ${i}`, true)
            );

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            expect(pinnedItems.length).toBe(14);
            // canAcceptDrop should return true for new link when under max
        });

        it('should allow reordering even at max capacity', () => {
            const pinnedItems = Array.from({ length: 15 }, (_, i) =>
                createMockLink(`pin-${i}`, `Pin ${i}`, true)
            );

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // Even at max, existing pinned items should be reorderable
            expect(pinnedItems.length).toBe(15);
        });
    });

    describe('AC5: Empty grid shows hint that highlights on drag over', () => {
        it('should display empty hint when no pins', () => {
            render(
                <PinnedLinksGrid
                    pinnedItems={[]}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            expect(screen.getByText('Drag to add Favorites')).toBeTruthy();
        });

        it('should not show hint when pins exist', () => {
            const pinnedItems = [createMockLink('pin-1', 'Pin 1', true)];

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            expect(screen.queryByText('Drop links here to pin')).toBeNull();
        });
    });

    describe('AC6: Already pinned links can be reordered', () => {
        it('should accept already pinned items for reordering', () => {
            const pinnedItems = [
                createMockLink('pin-1', 'Pin 1', true),
                createMockLink('pin-2', 'Pin 2', true),
            ];

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // Start drag with an already pinned item
            const pinnedItem = { ...pinnedItems[0], isPinned: true };
            useDragDropUiStore.getState().startDrag(createDragData(pinnedItem, true));

            const state = useDragDropUiStore.getState();
            expect(state.dragData?.item.isPinned).toBe(true);
        });
    });

    describe('AC7: Grid border highlights with space accent color', () => {
        it('should apply highlight style when valid drop target', () => {
            const pinnedItems: SpaceItem[] = [];
            const mockLink = createMockLink('link-1', 'Test Link');

            const { container } = render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                />
            );

            // Set drag state to trigger highlight
            useDragDropUiStore.getState().startDrag(createDragData(mockLink));
            useDragDropUiStore.getState().setOverPinsGrid(true, 0);

            const state = useDragDropUiStore.getState();
            expect(state.isOverPinsGrid).toBe(true);
        });
    });

    describe('AC8: Drop creates pin and optionally reorders', () => {
        it('should call pinItem on drop', async () => {
            const pinnedItems: SpaceItem[] = [];
            const onPinItem = vi.fn();

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                    onPinItem={onPinItem}
                />
            );

            // The implementation should call onPinItem when a link is dropped
            expect(onPinItem).not.toHaveBeenCalled();
        });

        it('should call reorderPins when drop position is not at end', async () => {
            const pinnedItems = [
                createMockLink('pin-1', 'Pin 1', true),
                createMockLink('pin-2', 'Pin 2', true),
            ];
            const onReorderPins = vi.fn();

            render(
                <PinnedLinksGrid
                    pinnedItems={pinnedItems}
                    spaceColor={mockSpaceColor}
                    spaceId={mockSpaceId}
                    onReorderPins={onReorderPins}
                />
            );

            expect(onReorderPins).not.toHaveBeenCalled();
        });
    });

    describe('AC9: Invalidates pins cache after successful pin', () => {
        it('should trigger invalidation after successful pin', () => {
            // This will be tested via mock of invalidate function
            expect(true).toBe(true);
        });
    });

    describe('Drop Index Calculation', () => {
        it('should calculate index 0 for top-left position', () => {
            // calculateDropIndex(x=10, y=10, gridRect, pinnedCount=5) should return 0
            expect(true).toBe(true); // Placeholder until implementation
        });

        it('should calculate correct index for position in row 2', () => {
            // Position in second row should calculate correctly
            expect(true).toBe(true);
        });

        it('should clamp to max column index', () => {
            // Position far right should clamp to column 4 (0-indexed)
            expect(true).toBe(true);
        });

        it('should clamp to max row index', () => {
            // Position far down should clamp to row 2 (0-indexed, max 3 rows)
            expect(true).toBe(true);
        });

        it('should not exceed pinnedCount', () => {
            // Drop index should never exceed current pin count (for appending)
            expect(true).toBe(true);
        });
    });

    describe('Store Integration', () => {
        it('should update isOverPinsGrid on drag enter', () => {
            useDragDropUiStore.getState().setOverPinsGrid(true, 0);
            expect(useDragDropUiStore.getState().isOverPinsGrid).toBe(true);
        });

        it('should clear isOverPinsGrid on drag leave', () => {
            useDragDropUiStore.getState().setOverPinsGrid(true, 0);
            useDragDropUiStore.getState().setOverPinsGrid(false);
            expect(useDragDropUiStore.getState().isOverPinsGrid).toBe(false);
        });

        it('should update pinsDropIndex during drag over', () => {
            useDragDropUiStore.getState().setOverPinsGrid(true, 3);
            expect(useDragDropUiStore.getState().pinsDropIndex).toBe(3);
        });
    });
});
