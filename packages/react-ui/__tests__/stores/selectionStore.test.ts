import { describe, test, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useSelectionStore } from '../../src/stores/selectionStore';

describe('Feature: 013 - Multi-Selection State Management', () => {
    beforeEach(() => {
        useSelectionStore.setState({
            spaceId: null,
            selectedIds: new Set(),
            lastSelectedId: null,
        });
    });

    describe('AC1: SelectionStore created at packages/react-ui/src/stores/selectionStore.ts', () => {
        test('should be a Zustand store', () => {
            expect(typeof useSelectionStore).toBe('function');
            expect(typeof useSelectionStore.getState).toBe('function');
            expect(typeof useSelectionStore.setState).toBe('function');
        });

        test('should have all required state properties', () => {
            const state = useSelectionStore.getState();
            expect(state).toHaveProperty('spaceId');
            expect(state).toHaveProperty('selectedIds');
            expect(state).toHaveProperty('lastSelectedId');
        });

        test('should have all required actions', () => {
            const state = useSelectionStore.getState();
            expect(typeof state.selectSingle).toBe('function');
            expect(typeof state.toggleSelection).toBe('function');
            expect(typeof state.selectRange).toBe('function');
            expect(typeof state.selectAll).toBe('function');
            expect(typeof state.clearSelection).toBe('function');
            expect(typeof state.isSelected).toBe('function');
            expect(typeof state.getSelectedItems).toBe('function');
        });
    });

    describe('AC2: spaceId tracks current selection space', () => {
        test('should have null spaceId initially', () => {
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBeNull();
        });

        test('should set spaceId when selecting single item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            expect(useSelectionStore.getState().spaceId).toBe('space-123');
        });

        test('should update spaceId when switching spaces', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectSingle('space-456', 'item-2');
            });
            expect(useSelectionStore.getState().spaceId).toBe('space-456');
        });

        test('should clear spaceId when clearing selection', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().clearSelection();
            });
            expect(useSelectionStore.getState().spaceId).toBeNull();
        });
    });

    describe('AC3: selectedIds Set stores selected item IDs', () => {
        test('should have empty Set initially', () => {
            const state = useSelectionStore.getState();
            expect(state.selectedIds).toBeInstanceOf(Set);
            expect(state.selectedIds.size).toBe(0);
        });

        test('should add item to selectedIds when selecting', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should maintain Set type for selectedIds', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            expect(useSelectionStore.getState().selectedIds).toBeInstanceOf(Set);
        });
    });

    describe('AC4: lastSelectedId stores anchor for shift-click', () => {
        test('should have null lastSelectedId initially', () => {
            const state = useSelectionStore.getState();
            expect(state.lastSelectedId).toBeNull();
        });

        test('should set lastSelectedId when selecting item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            expect(useSelectionStore.getState().lastSelectedId).toBe('item-1');
        });

        test('should update lastSelectedId when selecting different item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-2');
            });
            expect(useSelectionStore.getState().lastSelectedId).toBe('item-2');
        });

        test('should update lastSelectedId on toggle selection', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            expect(useSelectionStore.getState().lastSelectedId).toBe('item-1');
        });

        test('should clear lastSelectedId when clearing selection', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().clearSelection();
            });
            expect(useSelectionStore.getState().lastSelectedId).toBeNull();
        });
    });

    describe('AC5: selectSingle clears previous and selects one item', () => {
        test('should select single item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-123');
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
            expect(state.lastSelectedId).toBe('item-1');
        });

        test('should clear previous selection when selecting new item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-2');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(false);
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should clear previous multi-selection when selecting single item', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
                useSelectionStore.getState().toggleSelection('space-123', 'item-3');
            });
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-4');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(false);
            expect(state.selectedIds.has('item-2')).toBe(false);
            expect(state.selectedIds.has('item-3')).toBe(false);
            expect(state.selectedIds.has('item-4')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should handle selecting same item again', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
            expect(state.lastSelectedId).toBe('item-1');
        });
    });

    describe('AC6: toggleSelection adds/removes items (Ctrl+Click)', () => {
        test('should add item to empty selection', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
            expect(state.lastSelectedId).toBe('item-1');
        });

        test('should add item to existing selection', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.size).toBe(2);
        });

        test('should remove item if already selected', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(false);
            expect(state.selectedIds.size).toBe(0);
        });

        test('should allow toggling multiple items', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
                useSelectionStore.getState().toggleSelection('space-123', 'item-3');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(3);
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.has('item-3')).toBe(true);
        });

        test('should update lastSelectedId when toggling', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            expect(useSelectionStore.getState().lastSelectedId).toBe('item-2');
        });

        test('should update lastSelectedId even when removing item', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            expect(useSelectionStore.getState().lastSelectedId).toBe('item-1');
        });

        test('should start fresh selection when space changes', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().toggleSelection('space-456', 'item-3');
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-456');
            expect(state.selectedIds.has('item-1')).toBe(false);
            expect(state.selectedIds.has('item-2')).toBe(false);
            expect(state.selectedIds.has('item-3')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should allow empty selection after deselecting all', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(0);
            expect(state.spaceId).toBe('space-123');
        });
    });

    describe('AC7: selectRange selects between anchor and target (Shift+Click)', () => {
        test('should select range from anchor to target', () => {
            const visibleIds = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-4', visibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.has('item-3')).toBe(true);
            expect(state.selectedIds.has('item-4')).toBe(true);
            expect(state.selectedIds.size).toBe(3);
        });

        test('should select range in reverse order', () => {
            const visibleIds = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-4');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-2', visibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.has('item-3')).toBe(true);
            expect(state.selectedIds.has('item-4')).toBe(true);
            expect(state.selectedIds.size).toBe(3);
        });

        test('should keep anchor (lastSelectedId) unchanged after range selection', () => {
            const visibleIds = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-4', visibleIds);
            });
            expect(useSelectionStore.getState().lastSelectedId).toBe('item-2');
        });

        test('should behave like single click if no anchor exists', () => {
            const visibleIds = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-3', visibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-3')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
            expect(state.lastSelectedId).toBe('item-3');
        });

        test('should start fresh selection if space changes', () => {
            const visibleIds = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-456', 'item-4', visibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-456');
            expect(state.selectedIds.has('item-4')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should select single item if anchor not in visible list', () => {
            const visibleIds = ['item-3', 'item-4', 'item-5'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-4', visibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-4')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should select single item if target not in visible list', () => {
            const visibleIds = ['item-1', 'item-2', 'item-3'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-5', visibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-5')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should handle single item range (same anchor and target)', () => {
            const visibleIds = ['item-1', 'item-2', 'item-3'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-2', visibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should respect tree structure ordering from visible items', () => {
            const visibleIds = ['folder-1', 'folder-1-child-1', 'folder-1-child-2', 'item-2', 'item-3'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'folder-1-child-1');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-2', visibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('folder-1-child-1')).toBe(true);
            expect(state.selectedIds.has('folder-1-child-2')).toBe(true);
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.size).toBe(3);
        });
    });

    describe('AC8: selectAll selects all visible items (Ctrl+A)', () => {
        test('should select all items in empty selection', () => {
            const allVisibleIds = ['item-1', 'item-2', 'item-3', 'item-4'];
            act(() => {
                useSelectionStore.getState().selectAll('space-123', allVisibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-123');
            expect(state.selectedIds.size).toBe(4);
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.has('item-3')).toBe(true);
            expect(state.selectedIds.has('item-4')).toBe(true);
        });

        test('should replace existing selection with all items', () => {
            const allVisibleIds = ['item-1', 'item-2', 'item-3', 'item-4'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectAll('space-123', allVisibleIds);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(4);
        });

        test('should handle empty visible items array', () => {
            act(() => {
                useSelectionStore.getState().selectAll('space-123', []);
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-123');
            expect(state.selectedIds.size).toBe(0);
        });

        test('should handle single item', () => {
            act(() => {
                useSelectionStore.getState().selectAll('space-123', ['item-1']);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(1);
            expect(state.selectedIds.has('item-1')).toBe(true);
        });

        test('should update lastSelectedId to last item in list', () => {
            const allVisibleIds = ['item-1', 'item-2', 'item-3', 'item-4'];
            act(() => {
                useSelectionStore.getState().selectAll('space-123', allVisibleIds);
            });
            expect(useSelectionStore.getState().lastSelectedId).toBe('item-4');
        });

        test('should start fresh when space changes', () => {
            act(() => {
                useSelectionStore.getState().selectAll('space-123', ['item-1', 'item-2']);
            });
            act(() => {
                useSelectionStore.getState().selectAll('space-456', ['item-3', 'item-4']);
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-456');
            expect(state.selectedIds.has('item-1')).toBe(false);
            expect(state.selectedIds.has('item-2')).toBe(false);
            expect(state.selectedIds.has('item-3')).toBe(true);
            expect(state.selectedIds.has('item-4')).toBe(true);
        });
    });

    describe('AC9: clearSelection resets all state', () => {
        test('should clear all state', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().clearSelection();
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBeNull();
            expect(state.selectedIds.size).toBe(0);
            expect(state.lastSelectedId).toBeNull();
        });

        test('should clear multi-selection', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
                useSelectionStore.getState().toggleSelection('space-123', 'item-3');
            });
            act(() => {
                useSelectionStore.getState().clearSelection();
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(0);
        });

        test('should be idempotent (calling multiple times has same effect)', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().clearSelection();
                useSelectionStore.getState().clearSelection();
                useSelectionStore.getState().clearSelection();
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBeNull();
            expect(state.selectedIds.size).toBe(0);
            expect(state.lastSelectedId).toBeNull();
        });
    });

    describe('AC10: Selection clears on space switch', () => {
        test('should clear selection when selectSingle called with different space', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectSingle('space-456', 'item-2');
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-456');
            expect(state.selectedIds.has('item-1')).toBe(false);
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should clear selection when toggleSelection called with different space', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().toggleSelection('space-456', 'item-3');
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-456');
            expect(state.selectedIds.size).toBe(1);
            expect(state.selectedIds.has('item-3')).toBe(true);
        });

        test('should clear selection when selectRange called with different space', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-456', 'item-2', ['item-1', 'item-2']);
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-456');
            expect(state.selectedIds.size).toBe(1);
        });

        test('should clear selection when selectAll called with different space', () => {
            act(() => {
                useSelectionStore.getState().selectAll('space-123', ['item-1', 'item-2']);
            });
            act(() => {
                useSelectionStore.getState().selectAll('space-456', ['item-3', 'item-4']);
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-456');
            expect(state.selectedIds.has('item-1')).toBe(false);
            expect(state.selectedIds.has('item-2')).toBe(false);
        });
    });

    describe('AC13: isSelected helper works correctly', () => {
        test('should return false for unselected item', () => {
            const isSelected = useSelectionStore.getState().isSelected('item-1');
            expect(isSelected).toBe(false);
        });

        test('should return true for selected item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const isSelected = useSelectionStore.getState().isSelected('item-1');
            expect(isSelected).toBe(true);
        });

        test('should return false after item is deselected', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            const isSelected = useSelectionStore.getState().isSelected('item-1');
            expect(isSelected).toBe(false);
        });

        test('should work with multiple selections', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            expect(useSelectionStore.getState().isSelected('item-1')).toBe(true);
            expect(useSelectionStore.getState().isSelected('item-2')).toBe(true);
            expect(useSelectionStore.getState().isSelected('item-3')).toBe(false);
        });
    });

    describe('AC14: getSelectedItems returns array of IDs', () => {
        test('should return empty array when no selection', () => {
            const items = useSelectionStore.getState().getSelectedItems();
            expect(items).toEqual([]);
        });

        test('should return array with single item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const items = useSelectionStore.getState().getSelectedItems();
            expect(items).toEqual(['item-1']);
        });

        test('should return array with multiple items', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
                useSelectionStore.getState().toggleSelection('space-123', 'item-3');
            });
            const items = useSelectionStore.getState().getSelectedItems();
            expect(items.length).toBe(3);
            expect(items).toContain('item-1');
            expect(items).toContain('item-2');
            expect(items).toContain('item-3');
        });

        test('should return new array instance (not reference)', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const items1 = useSelectionStore.getState().getSelectedItems();
            const items2 = useSelectionStore.getState().getSelectedItems();
            expect(items1).not.toBe(items2);
            expect(items1).toEqual(items2);
        });
    });

    describe('AC20: getDragPayload method returns appropriate drag data based on selection state', () => {
        test('should have getDragPayload method', () => {
            const state = useSelectionStore.getState();
            expect(typeof state.getDragPayload).toBe('function');
        });

        test('should return single item when dragging unselected item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const payload = useSelectionStore.getState().getDragPayload('item-2');
            expect(payload.items).toEqual(['item-2']);
            expect(payload.isMultiSelection).toBe(false);
            expect(payload.selectionCount).toBe(1);
        });

        test('should return all selected items when dragging selected item', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
                useSelectionStore.getState().toggleSelection('space-123', 'item-3');
            });
            const payload = useSelectionStore.getState().getDragPayload('item-2');
            expect(payload.items).toContain('item-1');
            expect(payload.items).toContain('item-2');
            expect(payload.items).toContain('item-3');
            expect(payload.isMultiSelection).toBe(true);
            expect(payload.selectionCount).toBe(3);
        });

        test('should return single item when no selection exists', () => {
            const payload = useSelectionStore.getState().getDragPayload('item-1');
            expect(payload.items).toEqual(['item-1']);
            expect(payload.isMultiSelection).toBe(false);
            expect(payload.selectionCount).toBe(1);
        });

        test('should indicate single selection for one selected item', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const payload = useSelectionStore.getState().getDragPayload('item-1');
            expect(payload.isMultiSelection).toBe(false);
        });
    });

    describe('AC21: onDragInitiated handles selection state during drag start', () => {
        test('should have onDragInitiated method', () => {
            const state = useSelectionStore.getState();
            expect(typeof state.onDragInitiated).toBe('function');
        });

        test('should clear selection when dragging unselected item', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().onDragInitiated('item-3');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(0);
        });

        test('should preserve selection when dragging selected item', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().onDragInitiated('item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(2);
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.selectedIds.has('item-2')).toBe(true);
        });

        test('should handle drag initiation with no selection', () => {
            act(() => {
                useSelectionStore.getState().onDragInitiated('item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(0);
        });
    });

    describe('AC22: onDragCompleted manages selection clearing after drag completion', () => {
        test('should have onDragCompleted method', () => {
            const state = useSelectionStore.getState();
            expect(typeof state.onDragCompleted).toBe('function');
        });

        test('should clear selection after successful multi-item drag', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            act(() => {
                useSelectionStore.getState().onDragCompleted(true, true);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(0);
            expect(state.spaceId).toBeNull();
            expect(state.lastSelectedId).toBeNull();
        });

        test('should preserve selection after failed multi-item drag', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            const beforeState = useSelectionStore.getState();
            act(() => {
                useSelectionStore.getState().onDragCompleted(false, true);
            });
            const afterState = useSelectionStore.getState();
            expect(afterState.selectedIds.size).toBe(beforeState.selectedIds.size);
            expect(afterState.spaceId).toBe(beforeState.spaceId);
        });

        test('should not clear selection for single-item drag completion', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().onDragCompleted(true, false);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(1);
        });
    });

    describe('AC25: getSelectedItemsForClipboard provides items for clipboard operations', () => {
        test('should have getSelectedItemsForClipboard method', () => {
            const state = useSelectionStore.getState();
            expect(typeof state.getSelectedItemsForClipboard).toBe('function');
        });

        test('should return empty array when no selection', () => {
            const items = useSelectionStore.getState().getSelectedItemsForClipboard();
            expect(items).toEqual([]);
        });

        test('should return selected item IDs', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            const items = useSelectionStore.getState().getSelectedItemsForClipboard();
            expect(items).toContain('item-1');
            expect(items).toContain('item-2');
        });
    });

    describe('AC26: onClipboardCopy returns structured clipboard data for selected items', () => {
        test('should have onClipboardCopy method', () => {
            const state = useSelectionStore.getState();
            expect(typeof state.onClipboardCopy).toBe('function');
        });

        test('should return clipboard data with selected items', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
                useSelectionStore.getState().toggleSelection('space-123', 'item-2');
            });
            const data = useSelectionStore.getState().onClipboardCopy();
            expect(data.items).toContain('item-1');
            expect(data.items).toContain('item-2');
            expect(data.operation).toBe('copy');
            expect(data.sourceSpaceId).toBe('space-123');
            expect(data.selectionCount).toBe(2);
            expect(typeof data.timestamp).toBe('number');
        });

        test('should maintain selection state after copy', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().onClipboardCopy();
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(1);
        });
    });

    describe('AC27: onClipboardCut returns clipboard data and marks items for deletion', () => {
        test('should have onClipboardCut method', () => {
            const state = useSelectionStore.getState();
            expect(typeof state.onClipboardCut).toBe('function');
        });

        test('should return clipboard data with cut operation', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const data = useSelectionStore.getState().onClipboardCut();
            expect(data.items).toContain('item-1');
            expect(data.operation).toBe('cut');
            expect(data.sourceSpaceId).toBe('space-123');
        });
    });

    describe('AC28: onClipboardPasteComplete handles selection state after paste operations', () => {
        test('should have onClipboardPasteComplete method', () => {
            const state = useSelectionStore.getState();
            expect(typeof state.onClipboardPasteComplete).toBe('function');
        });

        test('should clear selection after successful cut operation paste', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().onClipboardPasteComplete(true, 'cut');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(0);
        });

        test('should preserve selection after successful copy operation paste', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().onClipboardPasteComplete(true, 'copy');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(1);
        });

        test('should preserve selection after failed paste operation', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().onClipboardPasteComplete(false, 'cut');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(1);
        });
    });

    describe('AC36: Parameter validation implemented for all spaceId and itemId inputs', () => {
        test('should validate spaceId is non-empty string', () => {
            expect(() => {
                act(() => {
                    useSelectionStore.getState().selectSingle('', 'item-1');
                });
            }).toThrow();
        });

        test('should validate itemId is non-empty string', () => {
            expect(() => {
                act(() => {
                    useSelectionStore.getState().selectSingle('space-123', '');
                });
            }).toThrow();
        });

        test('should validate spaceId length is within limits', () => {
            const longSpaceId = 'a'.repeat(256);
            expect(() => {
                act(() => {
                    useSelectionStore.getState().selectSingle(longSpaceId, 'item-1');
                });
            }).toThrow();
        });

        test('should validate itemId length is within limits', () => {
            const longItemId = 'a'.repeat(256);
            expect(() => {
                act(() => {
                    useSelectionStore.getState().selectSingle('space-123', longItemId);
                });
            }).toThrow();
        });

        test('should accept valid alphanumeric spaceId with hyphens and underscores', () => {
            expect(() => {
                act(() => {
                    useSelectionStore.getState().selectSingle('space-123_abc', 'item-1');
                });
            }).not.toThrow();
        });

        test('should accept valid alphanumeric itemId with hyphens and underscores', () => {
            expect(() => {
                act(() => {
                    useSelectionStore.getState().selectSingle('space-123', 'item_abc-123');
                });
            }).not.toThrow();
        });
    });

    describe('AC37: Error boundaries handle invalid parameters gracefully', () => {
        test('should handle null spaceId gracefully in selectSingle', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            expect(() => {
                act(() => {
                    // @ts-expect-error Testing invalid input
                    useSelectionStore.getState().selectSingle(null, 'item-1');
                });
            }).toThrow();
            consoleSpy.mockRestore();
        });

        test('should handle null itemId gracefully in selectSingle', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            expect(() => {
                act(() => {
                    // @ts-expect-error Testing invalid input
                    useSelectionStore.getState().selectSingle('space-123', null);
                });
            }).toThrow();
            consoleSpy.mockRestore();
        });

        test('should handle undefined spaceId gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            expect(() => {
                act(() => {
                    // @ts-expect-error Testing invalid input
                    useSelectionStore.getState().selectSingle(undefined, 'item-1');
                });
            }).toThrow();
            consoleSpy.mockRestore();
        });
    });

    describe('AC39: Sanitization normalizes parameter formats where possible', () => {
        test('should trim whitespace from spaceId', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('  space-123  ', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-123');
        });

        test('should trim whitespace from itemId', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', '  item-1  ');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-1')).toBe(true);
        });
    });

    describe('AC41: Unit tests for all selection methods', () => {
        test('selectSingle should work correctly', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-123');
            expect(state.selectedIds.has('item-1')).toBe(true);
            expect(state.lastSelectedId).toBe('item-1');
        });

        test('toggleSelection should work correctly', () => {
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);
            act(() => {
                useSelectionStore.getState().toggleSelection('space-123', 'item-1');
            });
            expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(false);
        });

        test('selectRange should work correctly', () => {
            const visibleIds = ['item-1', 'item-2', 'item-3'];
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-3', visibleIds);
            });
            expect(useSelectionStore.getState().selectedIds.size).toBe(3);
        });

        test('selectAll should work correctly', () => {
            act(() => {
                useSelectionStore.getState().selectAll('space-123', ['item-1', 'item-2', 'item-3']);
            });
            expect(useSelectionStore.getState().selectedIds.size).toBe(3);
        });

        test('clearSelection should work correctly', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            act(() => {
                useSelectionStore.getState().clearSelection();
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBeNull();
            expect(state.selectedIds.size).toBe(0);
        });
    });

    describe('AC42: Edge cases tested (empty selection, no anchor, space switch)', () => {
        test('should handle empty selection state', () => {
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBeNull();
            expect(state.selectedIds.size).toBe(0);
            expect(state.lastSelectedId).toBeNull();
        });

        test('should handle selectRange with no anchor', () => {
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-2', ['item-1', 'item-2']);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.has('item-2')).toBe(true);
            expect(state.selectedIds.size).toBe(1);
        });

        test('should handle rapid space switches', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-1', 'item-1');
                useSelectionStore.getState().selectSingle('space-2', 'item-2');
                useSelectionStore.getState().selectSingle('space-3', 'item-3');
            });
            const state = useSelectionStore.getState();
            expect(state.spaceId).toBe('space-3');
            expect(state.selectedIds.size).toBe(1);
            expect(state.selectedIds.has('item-3')).toBe(true);
        });

        test('should handle selecting same item multiple times', () => {
            act(() => {
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
                useSelectionStore.getState().selectSingle('space-123', 'item-1');
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(1);
        });

        test('should handle empty visible items array in selectAll', () => {
            act(() => {
                useSelectionStore.getState().selectAll('space-123', []);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(0);
            expect(state.spaceId).toBe('space-123');
        });

        test('should handle empty visible items array in selectRange', () => {
            act(() => {
                useSelectionStore.getState().selectRange('space-123', 'item-1', []);
            });
            const state = useSelectionStore.getState();
            expect(state.selectedIds.size).toBe(1);
        });
    });
});
