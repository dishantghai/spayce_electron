import { describe, test, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useInlineInputStore } from '../../src/stores/inlineInputStore';

describe('Feature: 015 - Inline Rename State Management', () => {
    beforeEach(() => {
        useInlineInputStore.setState({
            sidebarInput: null,
            cardInput: null,
            sidebarRenameItemId: null,
            cardRenameItemId: null,
        });
    });

    describe('AC1: Rename state integrated into InlineInputStore (SPEC-012)', () => {
        test('should have sidebarRenameItemId property', () => {
            const state = useInlineInputStore.getState();
            expect(state).toHaveProperty('sidebarRenameItemId');
        });

        test('should have cardRenameItemId property', () => {
            const state = useInlineInputStore.getState();
            expect(state).toHaveProperty('cardRenameItemId');
        });

        test('should have setSidebarRenameItemId method', () => {
            const state = useInlineInputStore.getState();
            expect(typeof state.setSidebarRenameItemId).toBe('function');
        });

        test('should have setCardRenameItemId method', () => {
            const state = useInlineInputStore.getState();
            expect(typeof state.setCardRenameItemId).toBe('function');
        });
    });

    describe('AC2: sidebarRenameItemId state working', () => {
        test('should have null sidebarRenameItemId initially', () => {
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should store sidebar rename item ID', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('item-123');
        });

        test('should update sidebar rename item ID', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-2');
            });
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('item-2');
        });
    });

    describe('AC3: cardRenameItemId state working', () => {
        test('should have null cardRenameItemId initially', () => {
            expect(useInlineInputStore.getState().cardRenameItemId).toBeNull();
        });

        test('should store card rename item ID', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });
            expect(useInlineInputStore.getState().cardRenameItemId).toBe('item-456');
        });

        test('should update card rename item ID', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-1');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-2');
            });
            expect(useInlineInputStore.getState().cardRenameItemId).toBe('item-2');
        });
    });

    describe('AC4: setSidebarRenameItemId sets/clears state correctly', () => {
        test('should set sidebar rename item ID', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-789');
            });
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('item-789');
        });

        test('should clear sidebar rename item ID with null', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(null);
            });
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should replace previous sidebar rename item ID', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-old');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-new');
            });
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('item-new');
        });
    });

    describe('AC5: setCardRenameItemId sets/clears state correctly', () => {
        test('should set card rename item ID', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-999');
            });
            expect(useInlineInputStore.getState().cardRenameItemId).toBe('item-999');
        });

        test('should clear card rename item ID with null', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-1');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId(null);
            });
            expect(useInlineInputStore.getState().cardRenameItemId).toBeNull();
        });

        test('should replace previous card rename item ID', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-old');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-new');
            });
            expect(useInlineInputStore.getState().cardRenameItemId).toBe('item-new');
        });
    });

    describe('AC6: Only one item can be renamed per context at a time', () => {
        test('should replace previous sidebar rename when setting new one', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-2');
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBe('item-2');
        });

        test('should replace previous card rename when setting new one', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-1');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-2');
            });

            const state = useInlineInputStore.getState();
            expect(state.cardRenameItemId).toBe('item-2');
        });

        test('should only allow one rename per context', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item');
                useInlineInputStore.getState().setCardRenameItemId('card-item');
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBe('sidebar-item');
            expect(state.cardRenameItemId).toBe('card-item');
        });
    });

    describe('AC7: Rename state is context-separated (sidebar vs card)', () => {
        test('should maintain independent sidebar and card rename states', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item');
                useInlineInputStore.getState().setCardRenameItemId('card-item');
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBe('sidebar-item');
            expect(state.cardRenameItemId).toBe('card-item');
        });

        test('should not affect card rename when setting sidebar rename', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('card-item');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item');
            });

            expect(useInlineInputStore.getState().cardRenameItemId).toBe('card-item');
        });

        test('should not affect sidebar rename when setting card rename', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('card-item');
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('sidebar-item');
        });

        test('should not affect card rename when clearing sidebar rename', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item');
                useInlineInputStore.getState().setCardRenameItemId('card-item');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(null);
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBeNull();
            expect(state.cardRenameItemId).toBe('card-item');
        });

        test('should not affect sidebar rename when clearing card rename', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item');
                useInlineInputStore.getState().setCardRenameItemId('card-item');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId(null);
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBe('sidebar-item');
            expect(state.cardRenameItemId).toBeNull();
        });
    });

    describe('AC8: Helper methods for rename state', () => {
        test('should have getRenameState method', () => {
            const state = useInlineInputStore.getState();
            expect(typeof state.getRenameState).toBe('function');
        });

        test('should get sidebar rename state', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item');
            });

            const renameState = useInlineInputStore.getState().getRenameState('sidebar');
            expect(renameState).toBe('sidebar-item');
        });

        test('should get card rename state', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('card-item');
            });

            const renameState = useInlineInputStore.getState().getRenameState('card');
            expect(renameState).toBe('card-item');
        });

        test('should have isRenaming method', () => {
            const state = useInlineInputStore.getState();
            expect(typeof state.isRenaming).toBe('function');
        });

        test('should check if item is being renamed in sidebar', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            expect(useInlineInputStore.getState().isRenaming('item-123', 'sidebar')).toBe(true);
            expect(useInlineInputStore.getState().isRenaming('item-456', 'sidebar')).toBe(false);
        });

        test('should check if item is being renamed in card', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });

            expect(useInlineInputStore.getState().isRenaming('item-456', 'card')).toBe(true);
            expect(useInlineInputStore.getState().isRenaming('item-123', 'card')).toBe(false);
        });

        test('should return false for isRenaming when no rename is active', () => {
            expect(useInlineInputStore.getState().isRenaming('item-123', 'sidebar')).toBe(false);
            expect(useInlineInputStore.getState().isRenaming('item-456', 'card')).toBe(false);
        });
    });

    describe('AC9: Deletion during rename cancels rename mode', () => {
        test('should clear rename state when item is deleted', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-to-delete');
            });

            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(null);
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should handle deletion in sidebar context', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(null);
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should handle deletion in card context', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });

            act(() => {
                useInlineInputStore.getState().setCardRenameItemId(null);
            });

            expect(useInlineInputStore.getState().cardRenameItemId).toBeNull();
        });
    });

    describe('AC10: Space switching clears rename state', () => {
        test('should have clearAllRenames method', () => {
            const state = useInlineInputStore.getState();
            expect(typeof state.clearAllRenames).toBe('function');
        });

        test('should clear all rename states on space switch', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item');
                useInlineInputStore.getState().setCardRenameItemId('card-item');
            });

            act(() => {
                useInlineInputStore.getState().clearAllRenames();
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBeNull();
            expect(state.cardRenameItemId).toBeNull();
        });

        test('should clear sidebar rename on space switch', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            act(() => {
                useInlineInputStore.getState().clearAllRenames();
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should clear card rename on space switch', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });

            act(() => {
                useInlineInputStore.getState().clearAllRenames();
            });

            expect(useInlineInputStore.getState().cardRenameItemId).toBeNull();
        });
    });

    describe('AC11: Navigation within same space preserves rename state', () => {
        test('should preserve sidebar rename state during same-space navigation', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            const itemId = useInlineInputStore.getState().sidebarRenameItemId;
            expect(itemId).toBe('item-123');
        });

        test('should preserve card rename state during same-space navigation', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });

            const itemId = useInlineInputStore.getState().cardRenameItemId;
            expect(itemId).toBe('item-456');
        });
    });

    describe('AC12: Escape key and outside click clear rename state', () => {
        test('should clear sidebar rename on cancel', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(null);
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should clear card rename on cancel', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });

            act(() => {
                useInlineInputStore.getState().setCardRenameItemId(null);
            });

            expect(useInlineInputStore.getState().cardRenameItemId).toBeNull();
        });

        test('should immediately clear on explicit cancel', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
                useInlineInputStore.getState().setSidebarRenameItemId(null);
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });
    });

    describe('AC13-15: Integration with SPEC-012 State Management', () => {
        test('should isolate rename state from inline input state', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    type: 'folder',
                    parentId: null,
                    spaceId: 'space-1'
                });
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).not.toBeNull();
            expect(state.sidebarRenameItemId).toBe('item-123');
        });

        test('should not conflict with inline input state', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    type: 'link',
                    parentId: 'parent-1',
                    spaceId: 'space-1'
                });
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarInput?.type).toBe('link');
            expect(state.cardRenameItemId).toBe('item-456');
        });

        test('should maintain separate tracking for sidebar and card', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-1');
                useInlineInputStore.getState().setCardRenameItemId('card-1');
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBe('sidebar-1');
            expect(state.cardRenameItemId).toBe('card-1');
        });

        test('should handle state transitions between contexts', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(null);
                useInlineInputStore.getState().setCardRenameItemId('item-2');
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBeNull();
            expect(state.cardRenameItemId).toBe('item-2');
        });

        test('should cleanup state on completion', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });

            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(null);
                useInlineInputStore.getState().setCardRenameItemId(null);
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBeNull();
            expect(state.cardRenameItemId).toBeNull();
        });
    });

    describe('AC16-17: Edge cases and error handling', () => {
        test('should handle multiple rapid rename attempts', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
                useInlineInputStore.getState().setSidebarRenameItemId('item-2');
                useInlineInputStore.getState().setSidebarRenameItemId('item-3');
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('item-3');
        });

        test('should handle null and undefined gracefully', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
                useInlineInputStore.getState().setSidebarRenameItemId(null);
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should handle empty string item IDs', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('');
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('');
        });

        test('should handle long item IDs', () => {
            const longId = 'item-' + 'x'.repeat(1000);
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(longId);
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe(longId);
        });

        test('should handle special characters in item IDs', () => {
            const specialId = 'item-!@#$%^&*()';
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId(specialId);
            });

            expect(useInlineInputStore.getState().cardRenameItemId).toBe(specialId);
        });
    });

    describe('AC18: Performance requirements', () => {
        test('should update state within acceptable time', () => {
            const start = performance.now();

            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            const duration = performance.now() - start;
            expect(duration).toBeLessThan(16);
        });

        test('should handle batch updates efficiently', () => {
            const start = performance.now();

            act(() => {
                for (let i = 0; i < 10; i++) {
                    useInlineInputStore.getState().setSidebarRenameItemId(`item-${i}`);
                }
            });

            const duration = performance.now() - start;
            expect(duration).toBeLessThan(100);
        });
    });

    describe('AC19: Context validation', () => {
        test('should validate sidebar context', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            const isRenaming = useInlineInputStore.getState().isRenaming('item-123', 'sidebar');
            expect(isRenaming).toBe(true);
        });

        test('should validate card context', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });

            const isRenaming = useInlineInputStore.getState().isRenaming('item-456', 'card');
            expect(isRenaming).toBe(true);
        });

        test('should not cross-validate contexts', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });

            expect(useInlineInputStore.getState().isRenaming('item-123', 'card')).toBe(false);
        });
    });

    describe('AC20: State cleanup and memory management', () => {
        test('should fully cleanup state', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
                useInlineInputStore.getState().setCardRenameItemId('item-2');
            });

            act(() => {
                useInlineInputStore.getState().clearAllRenames();
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBeNull();
            expect(state.cardRenameItemId).toBeNull();
        });

        test('should handle multiple cleanup calls', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
                useInlineInputStore.getState().clearAllRenames();
                useInlineInputStore.getState().clearAllRenames();
            });

            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should not affect other state during cleanup', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    type: 'folder',
                    parentId: null,
                    spaceId: 'space-1'
                });
                useInlineInputStore.getState().setSidebarRenameItemId('item-1');
            });

            act(() => {
                useInlineInputStore.getState().clearAllRenames();
            });

            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).not.toBeNull();
            expect(state.sidebarRenameItemId).toBeNull();
        });
    });
});
