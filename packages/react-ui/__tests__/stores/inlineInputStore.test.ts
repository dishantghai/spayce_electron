import { describe, test, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useInlineInputStore } from '../../src/stores/inlineInputStore';

describe('Feature: 012 - Inline Input State Management', () => {
    beforeEach(() => {
        useInlineInputStore.setState({
            sidebarInput: null,
            cardInput: null,
            sidebarRenameItemId: null,
            cardRenameItemId: null,
        });
    });

    describe('AC1: InlineInputStore created at correct location', () => {
        test('should be a Zustand store', () => {
            expect(typeof useInlineInputStore).toBe('function');
            expect(typeof useInlineInputStore.getState).toBe('function');
            expect(typeof useInlineInputStore.setState).toBe('function');
        });

        test('should have all required state properties', () => {
            const state = useInlineInputStore.getState();
            expect(state).toHaveProperty('sidebarInput');
            expect(state).toHaveProperty('cardInput');
            expect(state).toHaveProperty('sidebarRenameItemId');
            expect(state).toHaveProperty('cardRenameItemId');
        });

        test('should have all required actions', () => {
            const state = useInlineInputStore.getState();
            expect(typeof state.setSidebarInput).toBe('function');
            expect(typeof state.clearSidebarInput).toBe('function');
            expect(typeof state.setCardInput).toBe('function');
            expect(typeof state.clearCardInput).toBe('function');
            expect(typeof state.setSidebarRenameItemId).toBe('function');
            expect(typeof state.setCardRenameItemId).toBe('function');
        });
    });

    describe('AC2: Sidebar input state (spaceId, parentId, type) working', () => {
        test('should have null sidebarInput initially', () => {
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toBeNull();
        });

        test('should set sidebar input for folder at root level', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toEqual({
                spaceId: 'space-123',
                parentId: null,
                type: 'folder',
            });
        });

        test('should set sidebar input for link at root level', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'link',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toEqual({
                spaceId: 'space-123',
                parentId: null,
                type: 'link',
            });
        });

        test('should set sidebar input for nested folder with parentId', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: 'folder-456',
                    type: 'folder',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toEqual({
                spaceId: 'space-123',
                parentId: 'folder-456',
                type: 'folder',
            });
        });

        test('should set sidebar input for nested link with parentId', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: 'folder-456',
                    type: 'link',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toEqual({
                spaceId: 'space-123',
                parentId: 'folder-456',
                type: 'link',
            });
        });

        test('should update sidebar input when called multiple times', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
            });
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-456',
                    parentId: 'folder-789',
                    type: 'link',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toEqual({
                spaceId: 'space-456',
                parentId: 'folder-789',
                type: 'link',
            });
        });
    });

    describe('AC3: Card input state (spaceId, parentId, type) working', () => {
        test('should have null cardInput initially', () => {
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toBeNull();
        });

        test('should set card input for folder at root level', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-789',
                    parentId: null,
                    type: 'folder',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toEqual({
                spaceId: 'space-789',
                parentId: null,
                type: 'folder',
            });
        });

        test('should set card input for link at root level', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-789',
                    parentId: null,
                    type: 'link',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toEqual({
                spaceId: 'space-789',
                parentId: null,
                type: 'link',
            });
        });

        test('should set card input for nested folder with parentId', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-789',
                    parentId: 'folder-999',
                    type: 'folder',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toEqual({
                spaceId: 'space-789',
                parentId: 'folder-999',
                type: 'folder',
            });
        });

        test('should set card input for nested link with parentId', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-789',
                    parentId: 'folder-999',
                    type: 'link',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toEqual({
                spaceId: 'space-789',
                parentId: 'folder-999',
                type: 'link',
            });
        });

        test('should update card input when called multiple times', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-789',
                    parentId: null,
                    type: 'folder',
                });
            });
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-111',
                    parentId: 'folder-222',
                    type: 'link',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toEqual({
                spaceId: 'space-111',
                parentId: 'folder-222',
                type: 'link',
            });
        });
    });

    describe('AC4: Rename item ID state for sidebar working', () => {
        test('should have null sidebarRenameItemId initially', () => {
            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBeNull();
        });

        test('should set sidebarRenameItemId', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('item-123');
        });

        test('should clear sidebarRenameItemId by setting to null', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId(null);
            });
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBeNull();
        });

        test('should update sidebarRenameItemId when called multiple times', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('item-456');
            });
            expect(useInlineInputStore.getState().sidebarRenameItemId).toBe('item-456');
        });
    });

    describe('AC5: Rename item ID state for cards working', () => {
        test('should have null cardRenameItemId initially', () => {
            const state = useInlineInputStore.getState();
            expect(state.cardRenameItemId).toBeNull();
        });

        test('should set cardRenameItemId', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-789');
            });
            expect(useInlineInputStore.getState().cardRenameItemId).toBe('item-789');
        });

        test('should clear cardRenameItemId by setting to null', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-789');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId(null);
            });
            expect(useInlineInputStore.getState().cardRenameItemId).toBeNull();
        });

        test('should update cardRenameItemId when called multiple times', () => {
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-789');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('item-999');
            });
            expect(useInlineInputStore.getState().cardRenameItemId).toBe('item-999');
        });
    });

    describe('AC6: setSidebarInput sets state correctly', () => {
        test('should set all fields correctly', () => {
            const inputState = {
                spaceId: 'space-abc',
                parentId: 'parent-xyz',
                type: 'folder' as const,
            };
            act(() => {
                useInlineInputStore.getState().setSidebarInput(inputState);
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput?.spaceId).toBe('space-abc');
            expect(state.sidebarInput?.parentId).toBe('parent-xyz');
            expect(state.sidebarInput?.type).toBe('folder');
        });

        test('should allow setting to null', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
            });
            act(() => {
                useInlineInputStore.getState().setSidebarInput(null);
            });
            expect(useInlineInputStore.getState().sidebarInput).toBeNull();
        });
    });

    describe('AC7: setCardInput sets state correctly', () => {
        test('should set all fields correctly', () => {
            const inputState = {
                spaceId: 'space-def',
                parentId: 'parent-uvw',
                type: 'link' as const,
            };
            act(() => {
                useInlineInputStore.getState().setCardInput(inputState);
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput?.spaceId).toBe('space-def');
            expect(state.cardInput?.parentId).toBe('parent-uvw');
            expect(state.cardInput?.type).toBe('link');
        });

        test('should allow setting to null', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: null,
                    type: 'link',
                });
            });
            act(() => {
                useInlineInputStore.getState().setCardInput(null);
            });
            expect(useInlineInputStore.getState().cardInput).toBeNull();
        });
    });

    describe('AC8: clearSidebarInput resets sidebar state only', () => {
        test('should clear sidebar input', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
            });
            act(() => {
                useInlineInputStore.getState().clearSidebarInput();
            });
            expect(useInlineInputStore.getState().sidebarInput).toBeNull();
        });

        test('should not affect card input when clearing sidebar', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: null,
                    type: 'link',
                });
            });
            act(() => {
                useInlineInputStore.getState().clearSidebarInput();
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toBeNull();
            expect(state.cardInput).toEqual({
                spaceId: 'space-456',
                parentId: null,
                type: 'link',
            });
        });

        test('should not affect rename states when clearing sidebar input', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });
            act(() => {
                useInlineInputStore.getState().clearSidebarInput();
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toBeNull();
            expect(state.sidebarRenameItemId).toBe('item-123');
            expect(state.cardRenameItemId).toBe('item-456');
        });
    });

    describe('AC9: clearCardInput resets card state only', () => {
        test('should clear card input', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-789',
                    parentId: null,
                    type: 'link',
                });
            });
            act(() => {
                useInlineInputStore.getState().clearCardInput();
            });
            expect(useInlineInputStore.getState().cardInput).toBeNull();
        });

        test('should not affect sidebar input when clearing card', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: null,
                    type: 'link',
                });
            });
            act(() => {
                useInlineInputStore.getState().clearCardInput();
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toBeNull();
            expect(state.sidebarInput).toEqual({
                spaceId: 'space-123',
                parentId: null,
                type: 'folder',
            });
        });

        test('should not affect rename states when clearing card input', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: null,
                    type: 'link',
                });
                useInlineInputStore.getState().setSidebarRenameItemId('item-123');
                useInlineInputStore.getState().setCardRenameItemId('item-456');
            });
            act(() => {
                useInlineInputStore.getState().clearCardInput();
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toBeNull();
            expect(state.sidebarRenameItemId).toBe('item-123');
            expect(state.cardRenameItemId).toBe('item-456');
        });
    });

    describe('AC10: Context Separation - Sidebar and Card states are independent', () => {
        test('should allow both sidebar and card inputs to be active simultaneously', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: 'folder-789',
                    type: 'link',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toEqual({
                spaceId: 'space-123',
                parentId: null,
                type: 'folder',
            });
            expect(state.cardInput).toEqual({
                spaceId: 'space-456',
                parentId: 'folder-789',
                type: 'link',
            });
        });

        test('should not affect card input when updating sidebar input', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: null,
                    type: 'link',
                });
            });
            const cardInputBefore = useInlineInputStore.getState().cardInput;
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-999',
                    parentId: 'folder-888',
                    type: 'link',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.cardInput).toEqual(cardInputBefore);
            expect(state.sidebarInput).toEqual({
                spaceId: 'space-999',
                parentId: 'folder-888',
                type: 'link',
            });
        });

        test('should not affect sidebar input when updating card input', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: null,
                    type: 'link',
                });
            });
            const sidebarInputBefore = useInlineInputStore.getState().sidebarInput;
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-777',
                    parentId: 'folder-666',
                    type: 'folder',
                });
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarInput).toEqual(sidebarInputBefore);
            expect(state.cardInput).toEqual({
                spaceId: 'space-777',
                parentId: 'folder-666',
                type: 'folder',
            });
        });

        test('should allow both rename states to be active simultaneously', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item-1');
                useInlineInputStore.getState().setCardRenameItemId('card-item-1');
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBe('sidebar-item-1');
            expect(state.cardRenameItemId).toBe('card-item-1');
        });

        test('should not affect card rename when updating sidebar rename', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item-1');
                useInlineInputStore.getState().setCardRenameItemId('card-item-1');
            });
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item-2');
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBe('sidebar-item-2');
            expect(state.cardRenameItemId).toBe('card-item-1');
        });

        test('should not affect sidebar rename when updating card rename', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarRenameItemId('sidebar-item-1');
                useInlineInputStore.getState().setCardRenameItemId('card-item-1');
            });
            act(() => {
                useInlineInputStore.getState().setCardRenameItemId('card-item-2');
            });
            const state = useInlineInputStore.getState();
            expect(state.sidebarRenameItemId).toBe('sidebar-item-1');
            expect(state.cardRenameItemId).toBe('card-item-2');
        });
    });

    describe('AC11: Type Safety', () => {
        test('should accept folder type for sidebar input', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
            });
            expect(useInlineInputStore.getState().sidebarInput?.type).toBe('folder');
        });

        test('should accept link type for sidebar input', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'link',
                });
            });
            expect(useInlineInputStore.getState().sidebarInput?.type).toBe('link');
        });

        test('should accept folder type for card input', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: null,
                    type: 'folder',
                });
            });
            expect(useInlineInputStore.getState().cardInput?.type).toBe('folder');
        });

        test('should accept link type for card input', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: null,
                    type: 'link',
                });
            });
            expect(useInlineInputStore.getState().cardInput?.type).toBe('link');
        });

        test('should allow null parentId for root level items', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-123',
                    parentId: null,
                    type: 'folder',
                });
            });
            expect(useInlineInputStore.getState().sidebarInput?.parentId).toBeNull();
        });

        test('should allow string parentId for nested items', () => {
            act(() => {
                useInlineInputStore.getState().setCardInput({
                    spaceId: 'space-456',
                    parentId: 'parent-123',
                    type: 'link',
                });
            });
            expect(useInlineInputStore.getState().cardInput?.parentId).toBe('parent-123');
        });

        test('should require spaceId to be a string', () => {
            act(() => {
                useInlineInputStore.getState().setSidebarInput({
                    spaceId: 'space-abc-123',
                    parentId: null,
                    type: 'folder',
                });
            });
            const state = useInlineInputStore.getState();
            expect(typeof state.sidebarInput?.spaceId).toBe('string');
            expect(state.sidebarInput?.spaceId).toBe('space-abc-123');
        });
    });
});
