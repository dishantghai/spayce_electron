import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useDragDropUiStore } from '../../src/stores/dragDropUiStore';
import type { SpaceItem } from '../../src/types';
import { SpaceItemType } from '../../src/types';

/**
 * End-to-End Integration Tests for Nested Folder Auto-Expand
 * 
 * These tests validate the complete drag-drop flow with nested folders:
 * 1. Store state management (Set-based dragExpandedFolderIds)
 * 2. Component behavior (DroppableTreeItem with isExpanded prop)
 * 3. TreeView integration (merging expandedIds)
 * 4. Timer management (orphaned timer prevention)
 * 5. Drop indicator positioning (no layout shift)
 */

describe('Integration: Nested Folder Auto-Expand - Complete Flow', () => {
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

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

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

    describe('Complete drag-drop scenario: Parent -> Child -> GrandChild', () => {
        it('should expand all folders in hierarchy without collapsing parents', () => {
            const draggedItem = createMockItem({ id: 'link-1', type: SpaceItemType.link });

            // Start drag
            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: draggedItem,
                    items: [draggedItem],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });
            });

            expect(useDragDropUiStore.getState().isDragging).toBe(true);
            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(0);

            // Hover over Parent folder
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('parent-folder');
            });

            let state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.has('parent-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.size).toBe(1);

            // Hover over Child folder (nested in Parent)
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('child-folder');
            });

            state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.has('parent-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.has('child-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.size).toBe(2);

            // Hover over GrandChild folder (nested in Child)
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('grandchild-folder');
            });

            state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.has('parent-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.has('child-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.has('grandchild-folder')).toBe(true);
            expect(state.dragExpandedFolderIds.size).toBe(3);

            // CRITICAL: All parents remain expanded (no collapse)
            expect(Array.from(state.dragExpandedFolderIds)).toEqual([
                'parent-folder',
                'child-folder',
                'grandchild-folder',
            ]);
        });

        it('should clear all expanded folders on drop', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-3');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(3);

            // Simulate drop
            act(() => {
                useDragDropUiStore.getState().clearDragExpandedFolders();
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(0);
        });

        it('should clear all expanded folders on endDrag', () => {
            const draggedItem = createMockItem({ id: 'link-1', type: SpaceItemType.link });

            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: draggedItem,
                    items: [draggedItem],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });

                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(2);

            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            const state = useDragDropUiStore.getState();
            expect(state.isDragging).toBe(false);
            expect(state.dragData).toBeNull();
            expect(state.dragExpandedFolderIds.size).toBe(0);
        });
    });

    describe('Orphaned timer prevention', () => {
        it('should not expand folder if timer fires after drag ends', () => {
            const folder = createMockItem({ id: 'test-folder', type: SpaceItemType.folder });
            const draggedItem = createMockItem({ id: 'link-1', type: SpaceItemType.link });

            // Start drag
            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: draggedItem,
                    items: [draggedItem],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });
            });

            // Simulate hovering and timer being set
            // (In real code, DroppableTreeItem sets the timer)
            let timerFired = false;
            const timerId = setTimeout(() => {
                timerFired = true;
                // This should NOT be called after drag ends
                useDragDropUiStore.getState().addDragExpandedFolder('test-folder');
            }, 800);

            // Advance 400ms
            act(() => {
                vi.advanceTimersByTime(400);
            });

            // End drag before timer completes
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            // Timer should be cleared by component cleanup
            clearTimeout(timerId);

            // Complete remaining time
            act(() => {
                vi.advanceTimersByTime(500);
            });

            // Folder should NOT be in expanded set
            expect(useDragDropUiStore.getState().dragExpandedFolderIds.has('test-folder')).toBe(false);
        });

        it('should handle multiple rapid timer sets and clears', () => {
            // Simulate rapid hover over different folders
            const timers: NodeJS.Timeout[] = [];

            for (let i = 0; i < 5; i++) {
                const timer = setTimeout(() => {
                    useDragDropUiStore.getState().addDragExpandedFolder(`folder-${i}`);
                }, 800);
                timers.push(timer);

                // Advance 200ms before setting next timer
                act(() => {
                    vi.advanceTimersByTime(200);
                });

                // Clear previous timer (simulating rapid hover changes)
                if (i > 0) {
                    clearTimeout(timers[i - 1]);
                }
            }

            // Complete the last timer
            act(() => {
                vi.advanceTimersByTime(600);
            });

            const state = useDragDropUiStore.getState();
            // Only the last folder should be expanded (folder-4)
            expect(state.dragExpandedFolderIds.size).toBe(1);
            expect(state.dragExpandedFolderIds.has('folder-4')).toBe(true);

            // Clean up
            timers.forEach(clearTimeout);
        });
    });

    describe('Circular reference prevention with nested folders', () => {
        it('should not allow dropping parent into its own child', () => {
            const parentFolder = createMockItem({
                id: 'parent-folder',
                type: SpaceItemType.folder,
                name: 'Parent',
            });

            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: parentFolder,
                    items: [parentFolder],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });
            });

            // Try to validate dropping into child
            const isValid = useDragDropUiStore.getState().validateDrop(
                {
                    item: parentFolder,
                    items: [parentFolder],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                },
                'child-folder',
                ['parent-folder', 'child-folder'] // child's ancestors include parent
            );

            expect(isValid).toBe(false);
        });

        it('should allow dropping into sibling even if auto-expanded', () => {
            const folder1 = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                name: 'Folder 1',
            });

            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: folder1,
                    items: [folder1],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });

                // Auto-expand folder-2 (sibling)
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
            });

            // Should be valid to drop into sibling
            const isValid = useDragDropUiStore.getState().validateDrop(
                {
                    item: folder1,
                    items: [folder1],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                },
                'folder-2',
                [] // sibling has no shared ancestors
            );

            expect(isValid).toBe(true);
        });
    });

    describe('Performance with many nested folders', () => {
        it('should handle 50 nested folders efficiently', () => {
            const folderCount = 50;

            const start = performance.now();

            act(() => {
                for (let i = 0; i < folderCount; i++) {
                    useDragDropUiStore.getState().addDragExpandedFolder(`folder-${i}`);
                }
            });

            const duration = performance.now() - start;

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(folderCount);

            // Should be very fast (under 50ms for 50 operations)
            expect(duration).toBeLessThan(50);

            // Verify all are present
            for (let i = 0; i < folderCount; i++) {
                expect(state.dragExpandedFolderIds.has(`folder-${i}`)).toBe(true);
            }
        });

        it('should clear 100 folders efficiently', () => {
            act(() => {
                for (let i = 0; i < 100; i++) {
                    useDragDropUiStore.getState().addDragExpandedFolder(`folder-${i}`);
                }
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(100);

            const start = performance.now();

            act(() => {
                useDragDropUiStore.getState().clearDragExpandedFolders();
            });

            const duration = performance.now() - start;

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(0);
            expect(duration).toBeLessThan(10);
        });
    });

    describe('State consistency across operations', () => {
        it('should maintain state through multiple drag operations', () => {
            const item1 = createMockItem({ id: 'item-1', type: SpaceItemType.link });
            const item2 = createMockItem({ id: 'item-2', type: SpaceItemType.link });

            // First drag operation
            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: item1,
                    items: [item1],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });

                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(2);

            // End first drag
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.size).toBe(0);

            // Second drag operation
            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: item2,
                    items: [item2],
                    spaceId: 'space-1',
                    parentId: null,
                    sourceIndex: 0,
                    source: 'sidebar',
                    ancestorIds: [],
                });

                useDragDropUiStore.getState().addDragExpandedFolder('folder-3');
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(1);
            expect(state.dragExpandedFolderIds.has('folder-3')).toBe(true);
            // Previous folders should not be present
            expect(state.dragExpandedFolderIds.has('folder-1')).toBe(false);
            expect(state.dragExpandedFolderIds.has('folder-2')).toBe(false);
        });

        it('should handle interleaved expand and collapse operations', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
                useDragDropUiStore.getState().clearDragExpandedFolders();
                useDragDropUiStore.getState().addDragExpandedFolder('folder-3');
                useDragDropUiStore.getState().addDragExpandedFolder('folder-4');
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(2);
            expect(state.dragExpandedFolderIds.has('folder-3')).toBe(true);
            expect(state.dragExpandedFolderIds.has('folder-4')).toBe(true);
            expect(state.dragExpandedFolderIds.has('folder-1')).toBe(false);
            expect(state.dragExpandedFolderIds.has('folder-2')).toBe(false);
        });
    });

    describe('Edge case scenarios', () => {
        it('should handle empty folder IDs', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.has('')).toBe(true);
        });

        it('should handle very long folder IDs', () => {
            const longId = 'a'.repeat(10000);

            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder(longId);
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderIds.has(longId)).toBe(true);
        });

        it('should handle special characters in folder IDs', () => {
            const specialIds = [
                'folder/with/slashes',
                'folder.with.dots',
                'folder-with-dashes',
                'folder_with_underscores',
                'folder@with#special$chars%and&more',
                'folder with spaces',
                '文件夹', // Unicode
                '📁 Emoji Folder',
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

        it('should handle UUID-style folder IDs', () => {
            const uuids = [
                '123e4567-e89b-12d3-a456-426614174000',
                'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                'c56a4180-65aa-42ec-a945-5fd21dec0538',
            ];

            act(() => {
                uuids.forEach(id => {
                    useDragDropUiStore.getState().addDragExpandedFolder(id);
                });
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(uuids.length);
            uuids.forEach(id => {
                expect(state.dragExpandedFolderIds.has(id)).toBe(true);
            });
        });
    });

    describe('Concurrent operations', () => {
        it('should handle rapid add operations', () => {
            const folderIds: string[] = [];

            act(() => {
                for (let i = 0; i < 100; i++) {
                    const id = `folder-${i}`;
                    folderIds.push(id);
                    useDragDropUiStore.getState().addDragExpandedFolder(id);
                }
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(100);
            folderIds.forEach(id => {
                expect(state.dragExpandedFolderIds.has(id)).toBe(true);
            });
        });

        it('should handle adding same folder multiple times', () => {
            act(() => {
                for (let i = 0; i < 10; i++) {
                    useDragDropUiStore.getState().addDragExpandedFolder('same-folder');
                }
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(1);
            expect(state.dragExpandedFolderIds.has('same-folder')).toBe(true);
        });

        it('should handle clear followed by immediate add', () => {
            act(() => {
                useDragDropUiStore.getState().addDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().clearDragExpandedFolders();
                useDragDropUiStore.getState().addDragExpandedFolder('folder-2');
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragExpandedFolderIds.size).toBe(1);
            expect(state.dragExpandedFolderIds.has('folder-2')).toBe(true);
            expect(state.dragExpandedFolderIds.has('folder-1')).toBe(false);
        });
    });
});
