import { describe, test, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useDragDropUiStore } from '../../src/stores/dragDropUiStore';
import type { SpaceItem } from '../../src/types';
import { SpaceItemType } from '../../src/types';

/**
 * Comprehensive tests for nested folder auto-expand functionality
 * Tests the Set-based dragExpandedFolderIds implementation
 */
describe('dragDropUiStore - Nested Folder Auto-Expand', () => {
    const createMockItem = (id: string, name: string): SpaceItem => ({
        id,
        name,
        path: '/',
        type: SpaceItemType.folder,
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

    beforeEach(() => {
        // Reset store to clean state
        act(() => {
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
    });

    describe('dragExpandedFolderIds - Set-based state', () => {
        test('should initialize as empty Set', () => {
            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds).toBeInstanceOf(Set);
            expect(state.dragExpandedFolderIds.size).toBe(0);
        });

        test('should add single folder ID', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.has('folder-1')).toBe(true);
            expect(state.dragExpandedFolderIds.size).toBe(1);
        });

        test('should add multiple folder IDs without replacing', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('parent-folder');
                useDragDropUiStore.getState().addDragExpandedFolder('child-folder');
                useDragDropUiStore.getState().addDragExpandedFolder('grandchild-folder');
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(3);
            expect(state.dragExpandedFolderIds.has('parent-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.has('child-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.has('grandchild-folder')).toBe(true);
        });

        test('should not add duplicate IDs', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(1);
            expect(state.dragExpandedFolderIds.has('folder-1')).toBe(true);
        });

        test('should clear all expanded folders', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-3');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(3);

            act(() => {
                useDragDropUiStore.getState().clearDragExpandedFolders();
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(0);
        });
    });

    describe('Nested folder expansion scenario', () => {
        test('should maintain parent expansion when child is expanded', () => {
            // Simulate dragging over parent
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('parent-folder');
            });

            let state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.has('parent-folder')).toBe(true);

            // Simulate dragging over child (nested inside parent)
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('child-folder');
            });

            state = useDragDropUiStore.getState();
            // CRITICAL: Both parent and child should be expanded
            expect(state.dragExpandedFolderIds.has('parent-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.has('child-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.size).toBe(2);
        });

        test('should support deep nesting (3+ levels)', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('level-1');
                useDragDropUiStore.getState().addDragExpandedFolder('level-2');
                useDragDropUiStore.getState().addDragExpandedFolder('level-3');
                useDragDropUiStore.getState().addDragExpandedFolder('level-4');
                useDragDropUiStore.getState().addDragExpandedFolder('level-5');
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(5);
            expect(Array.from(state.dragExpandedFolderIds)).toEqual([
                'level-1',
                'level-2',
                'level-3',
                'level-4',
                'level-5',
            ]);
        });

        test('should handle rapid hover changes across siblings', () => {
            // Simulate hovering over multiple sibling folders rapidly
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('sibling-1');
                useDragDropUiStore.getState().addDragExpandedFolder('sibling-2');
                useDragDropUiStore.getState().addDragExpandedFolder('sibling-3');
            });

            const state = useDragDropUiStore.getState();
            // All siblings should be in the set (not replaced)
            expect(state.dragExpandedFolderIds.size).toBe(3);
        });
    });

    describe('Integration with drag lifecycle', () => {
        test('should clear expanded folders on endDrag', () => {
            const mockItem = createMockItem('dragged-item', 'Dragged Item');

            act(() => {
                // Start drag
                useDragDropUiStore.getState().startDrag({
                    item: mockItem,
                    items: [mockItem],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });

                // Expand multiple folders during drag
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(2);

            // End drag - should clear all
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(0);
            expect(state.isDragging).toBe(false);
            expect(state.dragData).toBeNull();
        });

        test('should maintain expanded folders during drag until endDrag', () => {
            const mockItem = createMockItem('dragged-item', 'Dragged Item');

            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: mockItem,
                    items: [mockItem],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });

                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
            });

            // Should still have folder expanded while dragging
            expect(useDragDropUiStore.getState().isDragging).toBe(true);
            expect(useDragDropUiStore.getState().dragExpandedFolderIds.has('folder-1')).toBe(true);

            // Add more folders
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(2);
        });
    });

    describe('Edge cases', () => {
        test('should handle empty string ID', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('');
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.has('')).toBe(true);
            expect(state.dragExpandedFolderIds.size).toBe(1);
        });

        test('should handle very long folder IDs', () => {
            const longId = 'a'.repeat(1000);
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder(longId);
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.has(longId)).toBe(true);
        });

        test('should handle special characters in IDs', () => {
            const specialIds = [
                'folder-with-dash',
                'folder_with_underscore',
                'folder.with.dots',
                'folder/with/slashes',
                'folder with spaces',
                'folder@with#special$chars',
            ];

            act(() => {
                specialIds.forEach(id => {
                    useDragDropUiStore.getState().addDragExpandedFolder(id);
                });
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(specialIds.length);
            specialIds.forEach(id => {
                expect(state.dragExpandedFolderIds.has(id)).toBe(true);
            });
        });

        test('should handle adding folders in random order', () => {
            const folderIds = ['z-folder', 'a-folder', 'm-folder', 'b-folder'];

            act(() => {
                folderIds.forEach(id => {
                    useDragDropUiStore.getState().addDragExpandedFolder(id);
                });
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(folderIds.length);
            folderIds.forEach(id => {
                expect(state.dragExpandedFolderIds.has(id)).toBe(true);
            });
        });

        test('should handle clearing when already empty', () => {
            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(0);

            act(() => {
                useDragDropUiStore.getState().clearDragExpandedFolders();
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(0);
        });

        test('should handle multiple clears', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().clearDragExpandedFolders();
                useDragDropUiStore.getState().clearDragExpandedFolders();
                useDragDropUiStore.getState().clearDragExpandedFolders();
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(0);
        });
    });

    describe('State immutability', () => {
        test('should create new Set instance when adding folder', () => {
            const initialSet = useDragDropUiStore.getState().dragExpandedFolderIds;

            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
            });

            const newSet = useDragDropUiStore.getState().dragExpandedFolderIds;
            // Should be a different Set instance (immutable update)
            expect(newSet).not.toBe(initialSet);
            expect(newSet.has('folder-1')).toBe(true);
        });

        test('should create new Set instance when clearing', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
            });

            const setWithData = useDragDropUiStore.getState().dragExpandedFolderIds;

            act(() => {
                useDragDropUiStore.getState().clearDragExpandedFolders();
            });

            const clearedSet = useDragDropUiStore.getState().dragExpandedFolderIds;
            expect(clearedSet).not.toBe(setWithData);
            expect(clearedSet.size).toBe(0);
        });
    });

    describe('Performance considerations', () => {
        test('should handle large number of expanded folders', () => {
            const folderCount = 100;
            const folderIds = Array.from({ length: folderCount }, (_, i) => `folder-${i}`);

            act(() => {
                folderIds.forEach(id => {
                    useDragDropUiStore.getState().addDragExpandedFolder(id);
                });
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(folderCount);

            // Verify all are present
            folderIds.forEach(id => {
                expect(state.dragExpandedFolderIds.has(id)).toBe(true);
            });
        });

        test('should efficiently check membership', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-3');
            });

            const state = useDragDropUiStore.getState();

            // Set.has() is O(1) - should be very fast
            const start = performance.now();
            const has1 = state.dragExpandedFolderIds.has('folder-1');
            const has2 = state.dragExpandedFolderIds.has('folder-2');
            const has3 = state.dragExpandedFolderIds.has('folder-3');
            const hasNonExistent = state.dragExpandedFolderIds.has('non-existent');
            const duration = performance.now() - start;

            expect(has1).toBe(true);
            expect(has2).toBe(true);
            expect(has3).toBe(true);
            expect(hasNonExistent).toBe(false);
            expect(duration).toBeLessThan(1); // Should be extremely fast
        });
    });
});
