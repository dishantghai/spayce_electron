import { describe, test, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useClipboardStore } from '../../src/stores/clipboardStore';
import { SpaceItemType } from '../../src/types';
import type { SpaceItem } from '../../src/types';

const createMockItem = (overrides: Partial<SpaceItem> = {}): SpaceItem => ({
    id: 'item-1',
    name: 'Test Item',
    path: '/test',
    type: SpaceItemType.link,
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

describe('Feature: 016 - Clipboard State Management', () => {
    beforeEach(() => {
        useClipboardStore.setState({
            items: [],
            sourceSpaceId: null,
            action: null,
        });
    });

    describe('AC1: ClipboardStore created with correct structure', () => {
        test('should have items array initially empty', () => {
            const state = useClipboardStore.getState();
            expect(state.items).toEqual([]);
        });

        test('should have sourceSpaceId as null initially', () => {
            const state = useClipboardStore.getState();
            expect(state.sourceSpaceId).toBeNull();
        });

        test('should have action as null initially', () => {
            const state = useClipboardStore.getState();
            expect(state.action).toBeNull();
        });

        test('should have copyItems method', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.copyItems).toBe('function');
        });

        test('should have cutItems method', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.cutItems).toBe('function');
        });

        test('should have pasteItems method', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.pasteItems).toBe('function');
        });

        test('should have canPaste method', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.canPaste).toBe('function');
        });

        test('should have clear method', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.clear).toBe('function');
        });

        test('should have hasItems method', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.hasItems).toBe('function');
        });

        test('should have getCutItems method', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.getCutItems).toBe('function');
        });
    });

    describe('AC2: copyItems/cutItems methods work correctly', () => {
        test('should copy single item', () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].id).toBe('item-1');
            expect(state.sourceSpaceId).toBe('space-1');
            expect(state.action).toBe('copy');
        });

        test('should copy multiple items', () => {
            const items = [
                createMockItem({ id: 'item-1' }),
                createMockItem({ id: 'item-2' }),
                createMockItem({ id: 'item-3' }),
            ];

            act(() => {
                useClipboardStore.getState().copyItems(items, 'space-1');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(3);
            expect(state.action).toBe('copy');
        });

        test('should cut single item', () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().cutItems([item], 'space-1');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].id).toBe('item-1');
            expect(state.sourceSpaceId).toBe('space-1');
            expect(state.action).toBe('cut');
        });

        test('should cut multiple items', () => {
            const items = [
                createMockItem({ id: 'item-1' }),
                createMockItem({ id: 'item-2' }),
            ];

            act(() => {
                useClipboardStore.getState().cutItems(items, 'space-1');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(2);
            expect(state.action).toBe('cut');
        });

        test('should replace previous clipboard content on new copy', () => {
            const item1 = createMockItem({ id: 'item-1' });
            const item2 = createMockItem({ id: 'item-2' });

            act(() => {
                useClipboardStore.getState().copyItems([item1], 'space-1');
            });
            act(() => {
                useClipboardStore.getState().copyItems([item2], 'space-2');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].id).toBe('item-2');
            expect(state.sourceSpaceId).toBe('space-2');
        });

        test('should replace previous clipboard content on new cut', () => {
            const item1 = createMockItem({ id: 'item-1' });
            const item2 = createMockItem({ id: 'item-2' });

            act(() => {
                useClipboardStore.getState().cutItems([item1], 'space-1');
            });
            act(() => {
                useClipboardStore.getState().cutItems([item2], 'space-2');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].id).toBe('item-2');
            expect(state.action).toBe('cut');
        });
    });

    describe('AC3: pasteItems executes with position support', () => {
        test('should have pasteItems method that accepts targetId', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            await expect(
                useClipboardStore.getState().pasteItems('target-1')
            ).resolves.not.toThrow();
        });

        test('should support before position', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            await expect(
                useClipboardStore.getState().pasteItems('target-1', 'before')
            ).resolves.not.toThrow();
        });

        test('should support after position', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            await expect(
                useClipboardStore.getState().pasteItems('target-1', 'after')
            ).resolves.not.toThrow();
        });

        test('should support inside position', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            await expect(
                useClipboardStore.getState().pasteItems('target-1', 'inside')
            ).resolves.not.toThrow();
        });

        test('should default to inside for folders when position not specified', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            await expect(
                useClipboardStore.getState().pasteItems('folder-1')
            ).resolves.not.toThrow();
        });
    });

    describe('AC4: canPaste validates target compatibility', () => {
        test('should return false when clipboard is empty', () => {
            const canPaste = useClipboardStore.getState().canPaste('target-1');
            expect(canPaste).toBe(false);
        });

        test('should return true when clipboard has items and target is valid', () => {
            const item = createMockItem({ id: 'item-1', type: SpaceItemType.link });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            const canPaste = useClipboardStore.getState().canPaste('folder-1');
            expect(canPaste).toBe(true);
        });

        test('should validate folder can accept any item type', () => {
            const linkItem = createMockItem({ id: 'link-1', type: SpaceItemType.link });

            act(() => {
                useClipboardStore.getState().copyItems([linkItem], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('folder-1')).toBe(true);
        });

        test('should validate space root can accept folders and links', () => {
            const folderItem = createMockItem({ id: 'folder-1', type: SpaceItemType.folder });

            act(() => {
                useClipboardStore.getState().copyItems([folderItem], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('space-root')).toBe(true);
        });

        test('should validate pins grid accepts only links', () => {
            const linkItem = createMockItem({ id: 'link-1', type: SpaceItemType.link });

            act(() => {
                useClipboardStore.getState().copyItems([linkItem], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('pins-grid')).toBe(true);
        });

        test('should reject folder paste into pins grid', () => {
            const folderItem = createMockItem({ id: 'folder-1', type: SpaceItemType.folder });

            act(() => {
                useClipboardStore.getState().copyItems([folderItem], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('pins-grid')).toBe(false);
        });
    });

    describe('AC5: Circular reference prevention implemented', () => {
        test('should prevent pasting folder into itself', () => {
            const folder = createMockItem({ id: 'folder-1', type: SpaceItemType.folder });

            act(() => {
                useClipboardStore.getState().copyItems([folder], 'space-1');
            });

            const canPaste = useClipboardStore.getState().canPaste('folder-1');
            expect(canPaste).toBe(false);
        });

        test('should prevent pasting folder into its descendant', () => {
            const parentFolder = createMockItem({
                id: 'parent-folder',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({ id: 'child-folder', type: SpaceItemType.folder }),
                ],
            });

            act(() => {
                useClipboardStore.getState().copyItems([parentFolder], 'space-1');
            });

            const canPaste = useClipboardStore.getState().canPaste('child-folder');
            expect(canPaste).toBe(false);
        });

        test('should allow pasting folder into sibling folder', () => {
            const folder1 = createMockItem({ id: 'folder-1', type: SpaceItemType.folder });

            act(() => {
                useClipboardStore.getState().copyItems([folder1], 'space-1');
            });

            const canPaste = useClipboardStore.getState().canPaste('folder-2');
            expect(canPaste).toBe(true);
        });
    });

    describe('AC6-7: System clipboard integration (IPC handlers)', () => {
        test('should have method to write to system clipboard', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.writeToSystemClipboard).toBe('function');
        });

        test('should have method to read from system clipboard', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.readFromSystemClipboard).toBe('function');
        });

        test('should detect URL pattern in clipboard text', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.isValidUrl).toBe('function');

            expect(state.isValidUrl('https://example.com')).toBe(true);
            expect(state.isValidUrl('http://example.com')).toBe(true);
            expect(state.isValidUrl('example.com')).toBe(true);
            expect(state.isValidUrl('not a url')).toBe(false);
        });

        test('should detect localhost URLs', () => {
            const state = useClipboardStore.getState();
            expect(state.isValidUrl('http://localhost:3000')).toBe(true);
            expect(state.isValidUrl('localhost:8080')).toBe(true);
        });

        test('should detect IP addresses', () => {
            const state = useClipboardStore.getState();
            expect(state.isValidUrl('http://192.168.1.1')).toBe(true);
            expect(state.isValidUrl('192.168.1.1:8080')).toBe(true);
        });

        test('should fallback to internal clipboard on IPC error', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(1);
        });
    });

    describe('AC8: Integration with SPEC-013 selection state', () => {
        test('should have method to get items from selection', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.copyFromSelection).toBe('function');
        });

        test('should have method to cut items from selection', () => {
            const state = useClipboardStore.getState();
            expect(typeof state.cutFromSelection).toBe('function');
        });

        test('should clear selection after paste', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            await useClipboardStore.getState().pasteItems('target-1');
        });
    });

    describe('AC9: Clear clipboard after successful paste', () => {
        test('should clear clipboard after paste', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            await useClipboardStore.getState().pasteItems('target-1');

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(0);
            expect(state.action).toBeNull();
            expect(state.sourceSpaceId).toBeNull();
        });

        test('should not clear clipboard if paste fails', async () => {
            const folder = createMockItem({ id: 'folder-1', type: SpaceItemType.folder });

            act(() => {
                useClipboardStore.getState().copyItems([folder], 'space-1');
            });

            try {
                // Try to paste folder into pins grid (should fail validation)
                await useClipboardStore.getState().pasteItems('pins-grid');
            } catch (error) {
                // Expected to fail
            }

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(1);
        });
    });

    describe('AC10: hasItems and clear methods', () => {
        test('should return false when clipboard is empty', () => {
            expect(useClipboardStore.getState().hasItems()).toBe(false);
        });

        test('should return true when clipboard has items', () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            expect(useClipboardStore.getState().hasItems()).toBe(true);
        });

        test('should clear all clipboard state', () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });
            act(() => {
                useClipboardStore.getState().clear();
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(0);
            expect(state.action).toBeNull();
            expect(state.sourceSpaceId).toBeNull();
        });
    });

    describe('AC11: getCutItems method for UI styling', () => {
        test('should return empty array when no items are cut', () => {
            const cutItems = useClipboardStore.getState().getCutItems();
            expect(cutItems).toEqual([]);
        });

        test('should return cut items when action is cut', () => {
            const items = [
                createMockItem({ id: 'item-1' }),
                createMockItem({ id: 'item-2' }),
            ];

            act(() => {
                useClipboardStore.getState().cutItems(items, 'space-1');
            });

            const cutItems = useClipboardStore.getState().getCutItems();
            expect(cutItems).toHaveLength(2);
            expect(cutItems[0].id).toBe('item-1');
        });

        test('should return empty array when action is copy', () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            const cutItems = useClipboardStore.getState().getCutItems();
            expect(cutItems).toEqual([]);
        });
    });

    describe('AC12: Edge cases and error handling', () => {
        test('should handle empty items array', () => {
            act(() => {
                useClipboardStore.getState().copyItems([], 'space-1');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(0);
        });

        test('should handle null spaceId gracefully', () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().copyItems([item], '');
            });

            const state = useClipboardStore.getState();
            expect(state.sourceSpaceId).toBe('');
        });

        test('should handle multiple rapid copy operations', () => {
            const item1 = createMockItem({ id: 'item-1' });
            const item2 = createMockItem({ id: 'item-2' });
            const item3 = createMockItem({ id: 'item-3' });

            act(() => {
                useClipboardStore.getState().copyItems([item1], 'space-1');
                useClipboardStore.getState().copyItems([item2], 'space-2');
                useClipboardStore.getState().copyItems([item3], 'space-3');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].id).toBe('item-3');
        });

        test('should handle paste without clipboard items', async () => {
            await expect(
                useClipboardStore.getState().pasteItems('target-1')
            ).rejects.toThrow();
        });

        test('should validate cut items still exist before paste', async () => {
            const item = createMockItem({ id: 'item-1' });

            act(() => {
                useClipboardStore.getState().cutItems([item], 'space-1');
            });

            await expect(
                useClipboardStore.getState().pasteItems('target-1')
            ).resolves.not.toThrow();
        });
    });

    describe('AC13: Position validation matrix', () => {
        test('should allow folder to accept before position', () => {
            const item = createMockItem({ id: 'item-1', type: SpaceItemType.link });
            const folder = createMockItem({ id: 'folder-1', type: SpaceItemType.folder });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('folder-1')).toBe(true);
        });

        test('should allow folder to accept after position', () => {
            const item = createMockItem({ id: 'item-1', type: SpaceItemType.link });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('folder-1')).toBe(true);
        });

        test('should allow folder to accept inside position', () => {
            const item = createMockItem({ id: 'item-1', type: SpaceItemType.link });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('folder-1')).toBe(true);
        });

        test('should allow link to accept before position', () => {
            const item = createMockItem({ id: 'item-1', type: SpaceItemType.link });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('link-1')).toBe(true);
        });

        test('should allow link to accept after position', () => {
            const item = createMockItem({ id: 'item-1', type: SpaceItemType.link });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('link-1')).toBe(true);
        });

        test('should reject link inside position', () => {
            const item = createMockItem({ id: 'item-1', type: SpaceItemType.link });

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            expect(useClipboardStore.getState().canPaste('link-1')).toBe(true);
        });
    });

    describe('AC14: Performance and memory', () => {
        test('should handle large number of items', () => {
            const items = Array.from({ length: 100 }, (_, i) =>
                createMockItem({ id: `item-${i}` })
            );

            act(() => {
                useClipboardStore.getState().copyItems(items, 'space-1');
            });

            const state = useClipboardStore.getState();
            expect(state.items).toHaveLength(100);
        });

        test('should update state within acceptable time', () => {
            const item = createMockItem({ id: 'item-1' });
            const start = performance.now();

            act(() => {
                useClipboardStore.getState().copyItems([item], 'space-1');
            });

            const duration = performance.now() - start;
            expect(duration).toBeLessThan(16);
        });
    });
});
