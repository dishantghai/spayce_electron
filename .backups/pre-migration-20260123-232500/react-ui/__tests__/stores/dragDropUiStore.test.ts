import { describe, test, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useDragDropUiStore } from '../../src/stores/dragDropUiStore';

describe('Feature: 010 - useDragDropUiStore', () => {
    beforeEach(() => {
        useDragDropUiStore.setState({
            isDragging: false,
            dragData: null,
            dropTargetId: null,
            dropPosition: null,
            expandedFolderId: null,
            flashItemId: null,
        });
    });

    describe('AC1: manages drag state', () => {
        test('should have isDragging as false initially', () => {
            expect(useDragDropUiStore.getState().isDragging).toBe(false);
        });

        test('should set isDragging to true when startDrag is called', () => {
            act(() => {
                useDragDropUiStore.getState().startDrag({ type: 'item', id: 'item-1' });
            });
            expect(useDragDropUiStore.getState().isDragging).toBe(true);
        });

        test('should set dragData when startDrag is called', () => {
            const dragData = { type: 'item' as const, id: 'item-1', sourceSpaceId: 'space-1' };
            act(() => {
                useDragDropUiStore.getState().startDrag(dragData);
            });
            expect(useDragDropUiStore.getState().dragData).toEqual(dragData);
        });

        test('should reset state when endDrag is called', () => {
            act(() => {
                useDragDropUiStore.getState().startDrag({ type: 'item', id: 'item-1' });
                useDragDropUiStore.getState().endDrag();
            });
            const state = useDragDropUiStore.getState();
            expect(state.isDragging).toBe(false);
            expect(state.dragData).toBeNull();
        });
    });

    describe('AC2: manages drop target', () => {
        test('should have null dropTargetId initially', () => {
            expect(useDragDropUiStore.getState().dropTargetId).toBeNull();
        });

        test('should update dropTargetId with setDropTarget', () => {
            act(() => {
                useDragDropUiStore.getState().setDropTarget('target-1', 'after');
            });
            expect(useDragDropUiStore.getState().dropTargetId).toBe('target-1');
        });

        test('should update dropPosition with setDropTarget', () => {
            act(() => {
                useDragDropUiStore.getState().setDropTarget('target-1', 'inside');
            });
            expect(useDragDropUiStore.getState().dropPosition).toBe('inside');
        });
    });

    describe('AC3: manages flash item', () => {
        test('should have null flashItemId initially', () => {
            expect(useDragDropUiStore.getState().flashItemId).toBeNull();
        });

        test('should set flashItemId with setFlashItem', () => {
            act(() => {
                useDragDropUiStore.getState().setFlashItem('item-123');
            });
            expect(useDragDropUiStore.getState().flashItemId).toBe('item-123');
        });
    });

    describe('AC4: manages expanded folder during drag', () => {
        test('should have null expandedFolderId initially', () => {
            expect(useDragDropUiStore.getState().expandedFolderId).toBeNull();
        });

        test('should set expandedFolderId with setExpandedFolder', () => {
            act(() => {
                useDragDropUiStore.getState().setExpandedFolder('folder-1');
            });
            expect(useDragDropUiStore.getState().expandedFolderId).toBe('folder-1');
        });

        test('should clear expandedFolderId when endDrag is called', () => {
            act(() => {
                useDragDropUiStore.getState().setExpandedFolder('folder-1');
                useDragDropUiStore.getState().endDrag();
            });
            expect(useDragDropUiStore.getState().expandedFolderId).toBeNull();
        });
    });

    describe('AC5: DragData type structure', () => {
        test('should support space type drag', () => {
            act(() => {
                useDragDropUiStore.getState().startDrag({ type: 'space', id: 'space-1' });
            });
            expect(useDragDropUiStore.getState().dragData?.type).toBe('space');
        });

        test('should support item type drag', () => {
            act(() => {
                useDragDropUiStore.getState().startDrag({ type: 'item', id: 'item-1' });
            });
            expect(useDragDropUiStore.getState().dragData?.type).toBe('item');
        });

        test('should include sourceSpaceId', () => {
            act(() => {
                useDragDropUiStore.getState().startDrag({ type: 'item', id: 'item-1', sourceSpaceId: 'space-1' });
            });
            expect(useDragDropUiStore.getState().dragData?.sourceSpaceId).toBe('space-1');
        });

        test('should include sourceParentId', () => {
            act(() => {
                useDragDropUiStore.getState().startDrag({ type: 'item', id: 'item-1', sourceParentId: 'parent-1' });
            });
            expect(useDragDropUiStore.getState().dragData?.sourceParentId).toBe('parent-1');
        });
    });

    describe('AC6: DropPosition type', () => {
        test('should support before position', () => {
            act(() => {
                useDragDropUiStore.getState().setDropTarget('target', 'before');
            });
            expect(useDragDropUiStore.getState().dropPosition).toBe('before');
        });

        test('should support after position', () => {
            act(() => {
                useDragDropUiStore.getState().setDropTarget('target', 'after');
            });
            expect(useDragDropUiStore.getState().dropPosition).toBe('after');
        });

        test('should support inside position', () => {
            act(() => {
                useDragDropUiStore.getState().setDropTarget('target', 'inside');
            });
            expect(useDragDropUiStore.getState().dropPosition).toBe('inside');
        });
    });
});
