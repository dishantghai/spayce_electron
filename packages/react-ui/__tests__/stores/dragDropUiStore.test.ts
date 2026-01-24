import { describe, test, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useDragDropUiStore } from '../../src/stores/dragDropUiStore';

describe('Feature: 010 - useDragDropUiStore', () => {
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

    describe('AC1: manages drag state', () => {
        test('should have isDragging as false initially', () => {
            expect(useDragDropUiStore.getState().isDragging).toBe(false);
        });

        test('should set isDragging to true when startDrag is called', () => {
            const mockItem = {
                id: 'item-1', name: 'Test', path: '/', type: 'link' as any,
                isExpanded: false, children: [], faviconUrl: null, description: null,
                visitCount: 0, lastVisited: null, createdAt: new Date(),
                isPinned: false, pinPosition: null, localPath: null,
                securityBookmark: null, lastSyncedAt: null, isWatching: false,
            };
            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: mockItem, items: [mockItem], spaceId: 'space-1',
                    parentId: null, sourceIndex: 0, source: 'sidebar', ancestorIds: []
                });
            });
            expect(useDragDropUiStore.getState().isDragging).toBe(true);
        });

        test('should reset state when endDrag is called', () => {
            const mockItem = {
                id: 'item-1', name: 'Test', path: '/', type: 'link' as any,
                isExpanded: false, children: [], faviconUrl: null, description: null,
                visitCount: 0, lastVisited: null, createdAt: new Date(),
                isPinned: false, pinPosition: null, localPath: null,
                securityBookmark: null, lastSyncedAt: null, isWatching: false,
            };
            act(() => {
                useDragDropUiStore.getState().startDrag({
                    item: mockItem, items: [mockItem], spaceId: 'space-1',
                    parentId: null, sourceIndex: 0, source: 'sidebar', ancestorIds: []
                });
                useDragDropUiStore.getState().endDrag();
            });
            const state = useDragDropUiStore.getState();
            expect(state.isDragging).toBe(false);
            expect(state.dragData).toBeNull();
        });
    });

    describe('AC2: manages drop target', () => {
        test('should have null dropIndicator initially', () => {
            expect(useDragDropUiStore.getState().dropIndicator).toBeNull();
        });

        test('should update dropIndicator with setDropIndicator', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target-1',
                    position: 'after',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
            });
            const indicator = useDragDropUiStore.getState().dropIndicator;
            expect(indicator?.targetId).toBe('target-1');
            expect(indicator?.position).toBe('after');
        });

        test('should update position with setDropIndicator', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target-1',
                    position: 'inside',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
            });
            expect(useDragDropUiStore.getState().dropIndicator?.position).toBe('inside');
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
        test('should have null dragExpandedFolderId initially', () => {
            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBeNull();
        });

        test('should set dragExpandedFolderId with setDragExpandedFolder', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
            });
            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBe('folder-1');
        });

        test('should clear dragExpandedFolderId when endDrag is called', () => {
            act(() => {
                useDragDropUiStore.getState().setDragExpandedFolder('folder-1');
                useDragDropUiStore.getState().endDrag();
            });
            expect(useDragDropUiStore.getState().dragExpandedFolderId).toBeNull();
        });
    });


    describe('AC6: DropPosition type', () => {
        test('should support before position', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target',
                    position: 'before',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
            });
            expect(useDragDropUiStore.getState().dropIndicator?.position).toBe('before');
        });

        test('should support after position', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target',
                    position: 'after',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
            });
            expect(useDragDropUiStore.getState().dropIndicator?.position).toBe('after');
        });

        test('should support inside position', () => {
            act(() => {
                useDragDropUiStore.getState().setDropIndicator({
                    targetId: 'target',
                    position: 'inside',
                    spaceId: 'space-1',
                    targetIndex: 0,
                    targetParentId: null,
                });
            });
            expect(useDragDropUiStore.getState().dropIndicator?.position).toBe('inside');
        });
    });
});
