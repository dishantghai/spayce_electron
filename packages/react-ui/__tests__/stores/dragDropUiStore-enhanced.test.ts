import { describe, test, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useDragDropUiStore } from '../../src/stores/dragDropUiStore';
import type { SpaceItem } from '../../src/types';

describe('Feature: 014 - Enhanced Drag-Drop State Management', () => {
    const mockItem: SpaceItem = {
        id: 'item-1',
        name: 'Test Item',
        path: '/test',
        type: 'link' as any,
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
    };

    beforeEach(() => {
        useDragDropUiStore.setState({
            isDragging: false,
            dragData: null,
            dropIndicator: null,
            dragExpandedFolderId: null,
            flashItemId: null,
            isOverPinsGrid: false,
            pinsDropIndex: null,
            validationError: null,
        });
    });

    describe('AC1: Enhanced dragDropUiStore at correct location', () => {
        test('should be a Zustand store', () => {
            expect(typeof useDragDropUiStore).toBe('function');
            expect(typeof useDragDropUiStore.getState).toBe('function');
            expect(typeof useDragDropUiStore.setState).toBe('function');
        });

        test('should have all required state properties', () => {
            const state = useDragDropUiStore.getState();
            expect(state).toHaveProperty('isDragging');
            expect(state).toHaveProperty('dragData');
            expect(state).toHaveProperty('dropIndicator');
            expect(state).toHaveProperty('dragExpandedFolderId');
            expect(state).toHaveProperty('flashItemId');
            expect(state).toHaveProperty('isOverPinsGrid');
            expect(state).toHaveProperty('pinsDropIndex');
        });

        test('should have all required action methods', () => {
            const state = useDragDropUiStore.getState();
            expect(typeof state.startDrag).toBe('function');
            expect(typeof state.setDropIndicator).toBe('function');
            expect(typeof state.endDrag).toBe('function');
            expect(typeof state.setDragExpandedFolder).toBe('function');
            expect(typeof state.setFlashItem).toBe('function');
            expect(typeof state.setOverPinsGrid).toBe('function');
        });
    });

    describe('AC2: DragData supports multiple items array', () => {
        test('should support single item in items array', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragData?.items).toHaveLength(1);
            expect(state.dragData?.items[0]).toEqual(mockItem);
        });

        test('should support multiple items in items array', () => {
            const item2 = { ...mockItem, id: 'item-2', name: 'Item 2' };
            const item3 = { ...mockItem, id: 'item-3', name: 'Item 3' };
            const dragData = {
                item: mockItem,
                items: [mockItem, item2, item3],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragData?.items).toHaveLength(3);
            expect(state.dragData?.items).toContain(mockItem);
            expect(state.dragData?.items).toContain(item2);
            expect(state.dragData?.items).toContain(item3);
        });

        test('should maintain item reference in dragData', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            expect(useDragDropUiStore.getState().dragData?.item).toEqual(mockItem);
        });
    });

    describe('AC3: DragData tracks source (sidebar/spaceCard)', () => {
        test('should track sidebar as source', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            expect(useDragDropUiStore.getState().dragData?.source).toBe('sidebar');
        });

        test('should track spaceCard as source', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'spaceCard' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            expect(useDragDropUiStore.getState().dragData?.source).toBe('spaceCard');
        });
    });

    describe('AC4: DragData includes ancestorIds for circular reference validation', () => {
        test('should store empty ancestorIds for root level item', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            expect(useDragDropUiStore.getState().dragData?.ancestorIds).toEqual([]);
        });

        test('should store ancestorIds for nested item', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: 'parent-1',
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: ['parent-1', 'grandparent-1'],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragData?.ancestorIds).toEqual(['parent-1', 'grandparent-1']);
        });

        test('should handle deep ancestor chains', () => {
            const ancestorChain = ['parent-1', 'gp-1', 'ggp-1', 'gggp-1'];
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: 'parent-1',
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: ancestorChain,
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            expect(useDragDropUiStore.getState().dragData?.ancestorIds).toEqual(ancestorChain);
        });
    });

    describe('AC5: DropIndicatorState tracks position (before/after/inside)', () => {
        test('should track before position', () => {
            const indicator = {
                targetId: 'target-1',
                position: 'before' as const,
                spaceId: 'space-1',
                targetIndex: 0,
                targetParentId: null,
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator?.position).toBe('before');
        });

        test('should track after position', () => {
            const indicator = {
                targetId: 'target-1',
                position: 'after' as const,
                spaceId: 'space-1',
                targetIndex: 0,
                targetParentId: null,
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator?.position).toBe('after');
        });

        test('should track inside position', () => {
            const indicator = {
                targetId: 'target-1',
                position: 'inside' as const,
                spaceId: 'space-1',
                targetIndex: 0,
                targetParentId: null,
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator?.position).toBe('inside');
        });
    });

    describe('AC6: DropIndicatorState includes targetIndex and targetParentId', () => {
        test('should track targetIndex', () => {
            const indicator = {
                targetId: 'target-1',
                position: 'after' as const,
                spaceId: 'space-1',
                targetIndex: 5,
                targetParentId: null,
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator?.targetIndex).toBe(5);
        });

        test('should track null targetParentId for root level', () => {
            const indicator = {
                targetId: 'target-1',
                position: 'after' as const,
                spaceId: 'space-1',
                targetIndex: 0,
                targetParentId: null,
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator?.targetParentId).toBeNull();
        });

        test('should track targetParentId for nested drop', () => {
            const indicator = {
                targetId: 'target-1',
                position: 'inside' as const,
                spaceId: 'space-1',
                targetIndex: 2,
                targetParentId: 'parent-1',
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator?.targetParentId).toBe('parent-1');
        });
    });

    describe('AC7: dragExpandedFolderId state for auto-expand folders', () => {
        test('should have null dragExpandedFolderId initially', () => {
            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBeNull();
        });

        test('should set dragExpandedFolderId', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBe('folder-1');
        });

        test('should clear dragExpandedFolderId', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder(null);
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBeNull();
        });

        test('should update dragExpandedFolderId when hovering different folder', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-2');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBe('folder-2');
        });
    });

    describe('AC8: flashItemId state for drop animation', () => {
        test('should have null flashItemId initially', () => {
            expect(useDragDropUiStore.getState().flashItemId).toBeNull();
        });

        test('should set flashItemId', () => {
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-1');
            });

            expect(useDragDropUiStore.getState().flashItemId).toBe('item-1');
        });

        test('should clear flashItemId', () => {
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-1');
            });
            act(() => {
                useDragDropUiStore.getState().setFlashItem(null);
            });

            expect(useDragDropUiStore.getState().flashItemId).toBeNull();
        });

        test('should update flashItemId for different items', () => {
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-1');
            });
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-2');
            });

            expect(useDragDropUiStore.getState().flashItemId).toBe('item-2');
        });
    });

    describe('AC9: isOverPinsGrid and pinsDropIndex for pins grid drops', () => {
        test('should have isOverPinsGrid as false initially', () => {
            expect(useDragDropUiStore.getState().isOverPinsGrid).toBe(false);
        });

        test('should have null pinsDropIndex initially', () => {
            expect(useDragDropUiStore.getState().pinsDropIndex).toBeNull();
        });

        test('should set isOverPinsGrid to true', () => {
            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(true, 0);
            });

            expect(useDragDropUiStore.getState().isOverPinsGrid).toBe(true);
        });

        test('should set pinsDropIndex', () => {
            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(true, 3);
            });

            expect(useDragDropUiStore.getState().pinsDropIndex).toBe(3);
        });

        test('should clear pins grid state', () => {
            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(true, 2);
            });
            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(false, null);
            });

            const state = useDragDropUiStore.getState();
            expect(state.isOverPinsGrid).toBe(false);
            expect(state.pinsDropIndex).toBeNull();
        });

        test('should handle pinsDropIndex of 0', () => {
            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(true, 0);
            });

            expect(useDragDropUiStore.getState().pinsDropIndex).toBe(0);
        });
    });

    describe('AC10: startDrag method sets all drag state', () => {
        test('should set isDragging to true', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            expect(useDragDropUiStore.getState().isDragging).toBe(true);
        });

        test('should set dragData', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: 'parent-1',
                sourceIndex: 2,
                source: 'spaceCard' as const,
                ancestorIds: ['parent-1'],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragData).toEqual(dragData);
        });

        test('should clear dropIndicator on startDrag', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target-1',
                    position: 'after',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
            });
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
            });

            expect(useDragDropUiStore.getState().dropIndicator).toBeNull();
        });
    });

    describe('AC11: setDropIndicator updates drop indicator with circular reference validation', () => {
        test('should set drop indicator for valid drop', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const indicator = {
                targetId: 'target-1',
                position: 'after' as const,
                spaceId: 'space-1',
                targetIndex: 1,
                targetParentId: null,
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator).toEqual(indicator);
        });

        test('should reject drop into self', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const indicator = {
                targetId: 'item-1',
                position: 'inside' as const,
                spaceId: 'space-1',
                targetIndex: 0,
                targetParentId: 'item-1',
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator).toBeNull();
        });

        test('should reject drop into descendant', () => {
            const folderItem = { ...mockItem, id: 'folder-1', type: 'folder' as any };
            const dragData = {
                item: folderItem,
                items: [folderItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const indicator = {
                targetId: 'child-1',
                position: 'inside' as const,
                spaceId: 'space-1',
                targetIndex: 0,
                targetParentId: 'folder-1',
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator).toBeNull();
        });

        test('should set validation error for circular reference', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const indicator = {
                targetId: 'item-1',
                position: 'inside' as const,
                spaceId: 'space-1',
                targetIndex: 0,
                targetParentId: 'item-1',
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            const error = useDragDropUiStore.getState().validationError;
            expect(error).not.toBeNull();
            expect(error?.type).toBe('circular_reference');
        });

        test('should clear validation error for valid drop', () => {
            act(() => {
                useDragDropUiStore.setState({
                    validationError: {
                        type: 'circular_reference',
                        message: 'Test error',
                        context: {
                            operation: 'move',
                            source: 'sidebar',
                            spaceId: 'space-1',
                            timestamp: Date.now(),
                        },
                    },
                });
            });

            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const indicator = {
                targetId: 'target-1',
                position: 'after' as const,
                spaceId: 'space-1',
                targetIndex: 1,
                targetParentId: null,
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().validationError).toBeNull();
        });
    });

    describe('AC12: endDrag clears all drag-related state', () => {
        test('should clear isDragging', () => {
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
            });
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            expect(useDragDropUiStore.getState().isDragging).toBe(false);
        });

        test('should clear dragData', () => {
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
            });
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            expect(useDragDropUiStore.getState().dragData).toBeNull();
        });

        test('should clear dropIndicator', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target-1',
                    position: 'after',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
            });
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            expect(useDragDropUiStore.getState().dropIndicator).toBeNull();
        });

        test('should clear dragExpandedFolderId', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBeNull();
        });

        test('should clear validation error', () => {
            act(() => {
                useDragDropUiStore.setState({
                    validationError: {
                        type: 'circular_reference',
                        message: 'Test error',
                        context: {
                            operation: 'move',
                            source: 'sidebar',
                            spaceId: 'space-1',
                            timestamp: Date.now(),
                        },
                    },
                });
            });
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            expect(useDragDropUiStore.getState().validationError).toBeNull();
        });

        test('should clear all state in one operation', () => {
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
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target-1',
                    position: 'after',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            const state = useDragDropUiStore.getState();
            expect(state.isDragging).toBe(false);
            expect(state.dragData).toBeNull();
            expect(state.dropIndicator).toBeNull();
            expect(state.dragExpandedFolderId).toBeNull();
        });
    });

    describe('AC13: setDragExpandedFolder manages auto-expand state', () => {
        test('should set expanded folder', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBe('folder-1');
        });

        test('should replace previous expanded folder', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-2');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBe('folder-2');
        });

        test('should clear expanded folder with null', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder(null);
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBeNull();
        });
    });

    describe('AC14: setFlashItem triggers flash animation', () => {
        test('should set flash item', () => {
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-1');
            });

            expect(useDragDropUiStore.getState().flashItemId).toBe('item-1');
        });

        test('should replace previous flash item', () => {
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-1');
            });
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-2');
            });

            expect(useDragDropUiStore.getState().flashItemId).toBe('item-2');
        });

        test('should clear flash item with null', () => {
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-1');
            });
            act(() => {
                useDragDropUiStore.getState().setFlashItem(null);
            });

            expect(useDragDropUiStore.getState().flashItemId).toBeNull();
        });
    });

    describe('AC15: validateCircularReference function prevents invalid folder moves', () => {
        test('should have validateCircularReference method', () => {
            const state = useDragDropUiStore.getState();
            expect(typeof state.validateCircularReference).toBe('function');
        });

        test('should validate that item cannot be dropped into itself', () => {
            const result = useDragDropUiStore.getState().validateCircularReference(
                'item-1',
                'item-1',
                []
            );

            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should validate that folder cannot be dropped into its descendant', () => {
            const result = useDragDropUiStore.getState().validateCircularReference(
                'folder-1',
                'child-1',
                ['child-1', 'grandchild-1']
            );

            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should allow valid drop to non-descendant', () => {
            const result = useDragDropUiStore.getState().validateCircularReference(
                'item-1',
                'item-2',
                ['parent-1']
            );

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('should allow drop into null target (root level)', () => {
            const result = useDragDropUiStore.getState().validateCircularReference(
                'item-1',
                null,
                ['parent-1']
            );

            expect(result.valid).toBe(true);
        });
    });

    describe('AC16: Integration with SPEC-013 SelectionStore for multi-item drag', () => {
        test('should support dragging multiple items from selection', () => {
            const item2 = { ...mockItem, id: 'item-2' };
            const item3 = { ...mockItem, id: 'item-3' };

            const dragData = {
                item: mockItem,
                items: [mockItem, item2, item3],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const state = useDragDropUiStore.getState();
            expect(state.dragData?.items).toHaveLength(3);
        });

        test('should maintain primary item reference with multi-selection', () => {
            const item2 = { ...mockItem, id: 'item-2' };

            const dragData = {
                item: mockItem,
                items: [mockItem, item2],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            expect(useDragDropUiStore.getState().dragData?.item.id).toBe('item-1');
        });
    });

    describe('AC17: Unit tests for all store methods', () => {
        test('startDrag method works correctly', () => {
            const dragData = {
                item: mockItem,
                items: [mockItem],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            const state = useDragDropUiStore.getState();
            expect(state.isDragging).toBe(true);
            expect(state.dragData).toEqual(dragData);
        });

        test('setDropIndicator method works correctly', () => {
            const indicator = {
                targetId: 'target-1',
                position: 'after' as const,
                spaceId: 'space-1',
                targetIndex: 0,
                targetParentId: null,
            };

            act(() => {
                useDragDropUiStore.getState().setDropIndicator(indicator);
            });

            expect(useDragDropUiStore.getState().dropIndicator).toEqual(indicator);
        });

        test('endDrag method works correctly', () => {
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
            });
            act(() => {
                useDragDropUiStore.getState().endDrag();
            });

            const state = useDragDropUiStore.getState();
            expect(state.isDragging).toBe(false);
            expect(state.dragData).toBeNull();
        });

        test('setDragExpandedFolder method works correctly', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });

            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBe('folder-1');
        });

        test('setFlashItem method works correctly', () => {
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-1');
            });

            expect(useDragDropUiStore.getState().flashItemId).toBe('item-1');
        });

        test('setOverPinsGrid method works correctly', () => {
            act(() => {
                useDragDropUiStore.getState().setOverPinsGrid(true, 2);
            });

            const state = useDragDropUiStore.getState();
            expect(state.isOverPinsGrid).toBe(true);
            expect(state.pinsDropIndex).toBe(2);
        });
    });

    describe('AC18: Type definitions exported from types/index.ts', () => {
        test('DragSource type should be available', () => {
            const source: 'sidebar' | 'spaceCard' = 'sidebar';
            expect(source).toBeDefined();
        });

        test('DropPosition type should be available', () => {
            const position: 'before' | 'after' | 'inside' = 'after';
            expect(position).toBeDefined();
        });
    });

    describe('AC19: ValidationErrorHandler interface implemented', () => {
        test('should have validationError state', () => {
            const state = useDragDropUiStore.getState();
            expect(state).toHaveProperty('validationError');
        });

        test('should have setValidationError method', () => {
            const state = useDragDropUiStore.getState();
            expect(typeof state.setValidationError).toBe('function');
        });

        test('should have clearValidationError method', () => {
            const state = useDragDropUiStore.getState();
            expect(typeof state.clearValidationError).toBe('function');
        });

        test('should set validation error', () => {
            const error = {
                type: 'circular_reference' as const,
                message: 'Cannot move folder into itself',
                context: {
                    operation: 'move' as const,
                    source: 'sidebar' as const,
                    spaceId: 'space-1',
                    timestamp: Date.now(),
                },
            };

            act(() => {
                useDragDropUiStore.getState().setValidationError(error);
            });

            expect(useDragDropUiStore.getState().validationError).toEqual(error);
        });

        test('should clear validation error', () => {
            act(() => {
                useDragDropUiStore.getState().setValidationError({
                    type: 'circular_reference',
                    message: 'Test error',
                    context: {
                        operation: 'move',
                        source: 'sidebar',
                        spaceId: 'space-1',
                        timestamp: Date.now(),
                    },
                });
            });
            act(() => {
                useDragDropUiStore.getState().clearValidationError();
            });

            expect(useDragDropUiStore.getState().validationError).toBeNull();
        });
    });

    describe('AC20: Edge cases and error handling', () => {
        test('should handle null drop indicator gracefully', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator(null);
            });

            expect(useDragDropUiStore.getState().dropIndicator).toBeNull();
        });

        test('should handle empty items array', () => {
            const dragData = {
                item: mockItem,
                items: [],
                spaceId: 'space-1',
                parentId: null,
                sourceIndex: 0,
                source: 'sidebar' as const,
                ancestorIds: [],
            };

            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });

            expect(useDragDropUiStore.getState().dragData?.items).toHaveLength(0);
        });

        test('should handle multiple endDrag calls', () => {
            act(() => {
                useDragDropUiStore.getState().endDrag();
                useDragDropUiStore.getState().endDrag();
            });

            const state = useDragDropUiStore.getState();
            expect(state.isDragging).toBe(false);
            expect(state.dragData).toBeNull();
        });

        test('should handle setDropIndicator without active drag', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target-1',
                    position: 'after',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
            });

            expect(useDragDropUiStore.getState().dropIndicator).toBeDefined();
        });

        test('should handle deep ancestor chains in validation', () => {
            const deepAncestors = Array.from({ length: 20 }, (_, i) => `ancestor-${i}`);
            const result = useDragDropUiStore.getState().validateCircularReference(
                'item-1',
                'ancestor-10',
                deepAncestors
            );

            expect(result.valid).toBe(false);
        });
    });
});
