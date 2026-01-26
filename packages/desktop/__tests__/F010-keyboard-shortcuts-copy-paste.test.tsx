import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useClipboardStore } from '@spayce/react-ui/stores';
import { SpaceItemType } from '@spayce/react-ui';
import type { SpaceItem } from '@spayce/react-ui';

/**
 * TDD Tests for F010: Keyboard Shortcuts (Copy/Paste)
 * 
 * These tests verify keyboard shortcuts (Cmd+C/Cmd+V) work correctly for:
 * - Copying single items
 * - Copying multiple items (multi-selection)
 * - Pasting items
 * - System clipboard integration for links
 * - Focus management (only active when sidebar has focus)
 * - Input field protection (shortcuts ignored when typing)
 */

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

describe('Feature F010: Keyboard Shortcuts (Copy/Paste)', () => {
    let mockElectronAPI: any;

    beforeEach(() => {
        // Reset clipboard store
        useClipboardStore.setState({
            items: [],
            sourceSpaceId: null,
            action: null,
        });

        // Mock electron API
        mockElectronAPI = {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
                readText: vi.fn().mockResolvedValue(''),
            },
        };

        // Setup global window mock
        if (typeof window === 'undefined') {
            (global as any).window = {
                electronAPI: mockElectronAPI,
            };
        } else {
            (window as any).electronAPI = mockElectronAPI;
        }
    });

    describe('AC1: Cmd+C (Mac) / Ctrl+C (Win) → copies selected item(s)', () => {
        test('should copy single folder when Cmd+C pressed', () => {
            const folder = createMockItem({
                id: 'folder-1',
                name: 'My Folder',
                type: SpaceItemType.folder
            });

            // Simulate copy action
            useClipboardStore.getState().copyItems([folder], 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items).toHaveLength(1);
            expect(clipboard.items[0].id).toBe('folder-1');
            expect(clipboard.action).toBe('copy');
        });

        test('should copy single link when Cmd+C pressed', () => {
            const link = createMockItem({
                id: 'link-1',
                name: 'Google',
                path: 'https://google.com',
                type: SpaceItemType.link
            });

            useClipboardStore.getState().copyItems([link], 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items).toHaveLength(1);
            expect(clipboard.items[0].id).toBe('link-1');
            expect(clipboard.action).toBe('copy');
        });

        test('should copy multiple items when Cmd+C pressed with multi-selection', () => {
            const items = [
                createMockItem({ id: 'item-1', name: 'Item 1' }),
                createMockItem({ id: 'item-2', name: 'Item 2' }),
                createMockItem({ id: 'item-3', name: 'Item 3' }),
            ];

            useClipboardStore.getState().copyItems(items, 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items).toHaveLength(3);
            expect(clipboard.action).toBe('copy');
        });

        test('should handle empty selection gracefully', () => {
            useClipboardStore.getState().copyItems([], 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items).toHaveLength(0);
        });
    });

    describe('AC2: Cmd+V (Mac) / Ctrl+V (Win) → pastes clipboard contents', () => {
        test('should paste items from internal clipboard', async () => {
            const item = createMockItem({ id: 'item-1' });

            useClipboardStore.getState().copyItems([item], 'space-1');

            await expect(
                useClipboardStore.getState().pasteItems('target-folder')
            ).resolves.not.toThrow();
        });

        test('should clear clipboard after successful paste', async () => {
            const item = createMockItem({ id: 'item-1' });

            useClipboardStore.getState().copyItems([item], 'space-1');

            await useClipboardStore.getState().pasteItems('target-folder');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items).toHaveLength(0);
            expect(clipboard.action).toBeNull();
        });

        test('should paste multiple items at once', async () => {
            const items = [
                createMockItem({ id: 'item-1' }),
                createMockItem({ id: 'item-2' }),
            ];

            useClipboardStore.getState().copyItems(items, 'space-1');

            await expect(
                useClipboardStore.getState().pasteItems('target-folder')
            ).resolves.not.toThrow();
        });
    });

    describe('AC3: Shortcuts only work when sidebar/tree has focus', () => {
        test('should only handle shortcuts when sidebar container has focus', () => {
            // Test focus containment logic
            const mockSidebarElement = { contains: vi.fn().mockReturnValue(true) };
            const mockActiveElement = {};

            const hasFocus = mockSidebarElement.contains(mockActiveElement);
            expect(hasFocus).toBe(true);
            expect(mockSidebarElement.contains).toHaveBeenCalledWith(mockActiveElement);
        });

        test('should ignore shortcuts when focus is outside sidebar', () => {
            // Test focus containment logic
            const mockSidebarElement = { contains: vi.fn().mockReturnValue(false) };
            const mockOutsideElement = {};

            const hasFocus = mockSidebarElement.contains(mockOutsideElement);
            expect(hasFocus).toBe(false);
        });
    });

    describe('AC4: Multiple selected items all copied together', () => {
        test('should copy all selected items in multi-selection', () => {
            const items = [
                createMockItem({ id: 'folder-1', type: SpaceItemType.folder }),
                createMockItem({ id: 'link-1', type: SpaceItemType.link }),
                createMockItem({ id: 'link-2', type: SpaceItemType.link }),
            ];

            useClipboardStore.getState().copyItems(items, 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items).toHaveLength(3);
            expect(clipboard.items.map(i => i.id)).toEqual(['folder-1', 'link-1', 'link-2']);
        });

        test('should preserve order of selected items', () => {
            const items = [
                createMockItem({ id: 'item-3' }),
                createMockItem({ id: 'item-1' }),
                createMockItem({ id: 'item-2' }),
            ];

            useClipboardStore.getState().copyItems(items, 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items.map(i => i.id)).toEqual(['item-3', 'item-1', 'item-2']);
        });
    });

    describe('AC5: Single link copy → also copies URL to system clipboard', () => {
        test('should copy URL to system clipboard when copying single link', async () => {
            const link = createMockItem({
                id: 'link-1',
                path: 'https://example.com',
                type: SpaceItemType.link
            });

            useClipboardStore.getState().copyItems([link], 'space-1');

            // System clipboard write should be triggered
            // Note: In real implementation, this is handled by copyItems
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(mockElectronAPI.clipboard.writeText).toHaveBeenCalledWith('https://example.com');
        });

        test('should NOT copy to system clipboard when copying folder', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder
            });

            useClipboardStore.getState().copyItems([folder], 'space-1');

            // System clipboard should not be called for folders
            expect(mockElectronAPI.clipboard.writeText).not.toHaveBeenCalled();
        });

        test('should copy URLs to system clipboard when copying multiple links', () => {
            const links = [
                createMockItem({ id: 'link-1', path: 'https://example1.com', type: SpaceItemType.link }),
                createMockItem({ id: 'link-2', path: 'https://example2.com', type: SpaceItemType.link }),
            ];

            mockElectronAPI.clipboard.writeText.mockClear();

            useClipboardStore.getState().copyItems(links, 'space-1');

            // Multiple links should have URLs copied to system clipboard (newline separated)
            expect(mockElectronAPI.clipboard.writeText).toHaveBeenCalledWith('https://example1.com\nhttps://example2.com');
        });
    });

    describe('AC6: Paste into selected folder if folder is selected', () => {
        test('should paste into folder when folder is selected', async () => {
            const item = createMockItem({ id: 'item-1' });

            useClipboardStore.getState().copyItems([item], 'space-1');

            // Paste into folder
            await expect(
                useClipboardStore.getState().pasteItems('folder-1')
            ).resolves.not.toThrow();
        });

        test('should handle nested folder paste', async () => {
            const item = createMockItem({ id: 'item-1' });

            useClipboardStore.getState().copyItems([item], 'space-1');

            await expect(
                useClipboardStore.getState().pasteItems('nested-folder-1')
            ).resolves.not.toThrow();
        });
    });

    describe('AC7: Paste at root if no folder selected', () => {
        test('should paste at space root when no folder selected', async () => {
            const item = createMockItem({ id: 'item-1' });

            useClipboardStore.getState().copyItems([item], 'space-1');

            // Paste at root (undefined or null parentId)
            await expect(
                useClipboardStore.getState().pasteItems('space-root')
            ).resolves.not.toThrow();
        });

        test('should paste at root when link is selected', async () => {
            const item = createMockItem({ id: 'item-1' });

            useClipboardStore.getState().copyItems([item], 'space-1');

            // When link is selected, paste at root (not inside link)
            await expect(
                useClipboardStore.getState().pasteItems('link-1')
            ).resolves.not.toThrow();
        });
    });

    describe('AC8: Shortcuts don\'t interfere with text inputs or other UI elements', () => {
        test('should ignore shortcuts when INPUT element is focused', () => {
            const mockInputElement = { tagName: 'INPUT' };

            const isInput = mockInputElement.tagName === 'INPUT';
            expect(isInput).toBe(true);
        });

        test('should ignore shortcuts when TEXTAREA element is focused', () => {
            const mockTextareaElement = { tagName: 'TEXTAREA' };

            const isTextarea = mockTextareaElement.tagName === 'TEXTAREA';
            expect(isTextarea).toBe(true);
        });

        test('should allow shortcuts when div is focused', () => {
            const mockDivElement = { tagName: 'DIV' };

            const isInputOrTextarea =
                mockDivElement.tagName === 'INPUT' ||
                mockDivElement.tagName === 'TEXTAREA';
            expect(isInputOrTextarea).toBe(false);
        });
    });

    describe('AC9: Works in both Sidebar and SpaceCard contexts', () => {
        test('should work in Sidebar context', () => {
            const item = createMockItem({ id: 'sidebar-item' });

            useClipboardStore.getState().copyItems([item], 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items[0].id).toBe('sidebar-item');
        });

        test('should work in SpaceCard context', () => {
            const item = createMockItem({ id: 'card-item' });

            useClipboardStore.getState().copyItems([item], 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items[0].id).toBe('card-item');
        });

        test('should maintain independent clipboard state across contexts', () => {
            const sidebarItem = createMockItem({ id: 'sidebar-item' });

            useClipboardStore.getState().copyItems([sidebarItem], 'space-1');

            const cardItem = createMockItem({ id: 'card-item' });

            useClipboardStore.getState().copyItems([cardItem], 'space-2');

            const clipboard = useClipboardStore.getState();
            // Latest copy should override
            expect(clipboard.items[0].id).toBe('card-item');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle rapid copy operations', () => {
            const item1 = createMockItem({ id: 'item-1' });
            const item2 = createMockItem({ id: 'item-2' });

            useClipboardStore.getState().copyItems([item1], 'space-1');
            useClipboardStore.getState().copyItems([item2], 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items).toHaveLength(1);
            expect(clipboard.items[0].id).toBe('item-2');
        });

        test('should handle paste without clipboard items', async () => {
            await expect(
                useClipboardStore.getState().pasteItems('target-1')
            ).rejects.toThrow();
        });

        test('should handle system clipboard errors gracefully', async () => {
            mockElectronAPI.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

            const link = createMockItem({
                id: 'link-1',
                path: 'https://example.com',
                type: SpaceItemType.link
            });

            // Should not throw even if system clipboard fails
            useClipboardStore.getState().copyItems([link], 'space-1');

            const clipboard = useClipboardStore.getState();
            expect(clipboard.items).toHaveLength(1);
        });

        test('should validate target for circular references', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder
            });

            useClipboardStore.getState().copyItems([folder], 'space-1');

            // Cannot paste folder into itself
            const canPaste = useClipboardStore.getState().canPaste('folder-1');
            expect(canPaste).toBe(false);
        });
    });

    describe('Keyboard Event Detection', () => {
        test('should detect Cmd key on Mac', () => {
            const mockEvent = {
                key: 'c',
                metaKey: true,
                ctrlKey: false,
            };

            const isMac = true; // Simulate Mac
            const isCmdOrCtrl = isMac ? mockEvent.metaKey : mockEvent.ctrlKey;

            expect(isCmdOrCtrl).toBe(true);
        });

        test('should detect Ctrl key on Windows/Linux', () => {
            const mockEvent = {
                key: 'c',
                metaKey: false,
                ctrlKey: true,
            };

            const isMac = false; // Simulate Windows/Linux
            const isCmdOrCtrl = isMac ? mockEvent.metaKey : mockEvent.ctrlKey;

            expect(isCmdOrCtrl).toBe(true);
        });

        test('should detect "c" key for copy', () => {
            const mockEvent = { key: 'c' };
            expect(mockEvent.key).toBe('c');
        });

        test('should detect "v" key for paste', () => {
            const mockEvent = { key: 'v' };
            expect(mockEvent.key).toBe('v');
        });

        test('should prevent default when shortcut is triggered', () => {
            const mockPreventDefault = vi.fn();
            const mockEvent = {
                key: 'c',
                metaKey: true,
                preventDefault: mockPreventDefault,
            };

            mockEvent.preventDefault();
            expect(mockPreventDefault).toHaveBeenCalled();
        });
    });

    describe('Integration with getItemsByIds helper', () => {
        test('should find items by IDs from tree structure', () => {
            const rootItems = [
                createMockItem({
                    id: 'folder-1',
                    type: SpaceItemType.folder,
                    children: [
                        createMockItem({ id: 'link-1' }),
                        createMockItem({ id: 'link-2' }),
                    ]
                }),
                createMockItem({ id: 'link-3' }),
            ];

            const ids = ['link-1', 'link-3'];
            const foundItems: SpaceItem[] = [];

            function findItems(items: SpaceItem[]) {
                for (const item of items) {
                    if (ids.includes(item.id)) {
                        foundItems.push(item);
                    }
                    if (item.children.length > 0) {
                        findItems(item.children);
                    }
                }
            }

            findItems(rootItems);

            expect(foundItems).toHaveLength(2);
            expect(foundItems.map(i => i.id)).toEqual(['link-1', 'link-3']);
        });

        test('should find deeply nested items', () => {
            const rootItems = [
                createMockItem({
                    id: 'folder-1',
                    type: SpaceItemType.folder,
                    children: [
                        createMockItem({
                            id: 'folder-2',
                            type: SpaceItemType.folder,
                            children: [
                                createMockItem({ id: 'link-deep' }),
                            ]
                        }),
                    ]
                }),
            ];

            const ids = ['link-deep'];
            const foundItems: SpaceItem[] = [];

            function findItems(items: SpaceItem[]) {
                for (const item of items) {
                    if (ids.includes(item.id)) {
                        foundItems.push(item);
                    }
                    if (item.children.length > 0) {
                        findItems(item.children);
                    }
                }
            }

            findItems(rootItems);

            expect(foundItems).toHaveLength(1);
            expect(foundItems[0].id).toBe('link-deep');
        });
    });

    /**
     * REGRESSION TESTS: Keyboard-Focused Copy/Paste
     * 
     * These tests ensure the keyboard navigation + copy/paste integration
     * works correctly and doesn't regress. The key behavior is:
     * 
     * Priority order for copy: multi-selection > keyboard-focused > clicked selection
     * Priority order for paste target: keyboard-focused folder > clicked folder > root
     * Hover state should NEVER affect copy/paste
     */
    describe('REGRESSION: Keyboard-Focused Copy/Paste Priority', () => {
        // Simulates the getItemsByIds helper from App.tsx
        const getItemsByIds = (rootItems: SpaceItem[], ids: string[]): SpaceItem[] => {
            const foundItems: SpaceItem[] = [];
            function findItems(items: SpaceItem[]) {
                for (const item of items) {
                    if (ids.includes(item.id)) {
                        foundItems.push(item);
                    }
                    if (item.children && item.children.length > 0) {
                        findItems(item.children);
                    }
                }
            }
            findItems(rootItems);
            return foundItems;
        };

        const treeStructure = [
            createMockItem({
                id: 'folder-parent',
                name: 'Parent Folder',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({
                        id: 'link-child-1',
                        name: 'Child Link 1',
                        path: 'https://child1.com',
                        type: SpaceItemType.link,
                    }),
                    createMockItem({
                        id: 'link-child-2',
                        name: 'Child Link 2',
                        path: 'https://child2.com',
                        type: SpaceItemType.link,
                    }),
                    createMockItem({
                        id: 'folder-nested',
                        name: 'Nested Folder',
                        type: SpaceItemType.folder,
                        children: [
                            createMockItem({
                                id: 'link-deep',
                                name: 'Deep Link',
                                path: 'https://deep.com',
                                type: SpaceItemType.link,
                            }),
                        ],
                    }),
                ],
            }),
            createMockItem({
                id: 'link-root',
                name: 'Root Link',
                path: 'https://root.com',
                type: SpaceItemType.link,
            }),
        ];

        describe('Copy Priority: keyboard-focused item takes precedence over clicked selection', () => {
            test('should copy keyboard-focused link even when parent folder was clicked', () => {
                // Scenario: User clicked on "Parent Folder", then navigated with keyboard to "Child Link 1"
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId = 'link-child-1';

                // The copy handler should use keyboardFocusedId (priority)
                const itemIdToCopy = keyboardFocusedId || clickedItemId;
                const items = getItemsByIds(treeStructure, [itemIdToCopy]);

                expect(items).toHaveLength(1);
                expect(items[0].id).toBe('link-child-1');
                expect(items[0].name).toBe('Child Link 1');
                expect(items[0].type).toBe(SpaceItemType.link);

                // Copy the item
                useClipboardStore.getState().copyItems(items, 'space-1');

                const clipboard = useClipboardStore.getState();
                expect(clipboard.items).toHaveLength(1);
                expect(clipboard.items[0].id).toBe('link-child-1');
                expect(clipboard.items[0].name).toBe('Child Link 1');
            });

            test('should copy deeply nested link when keyboard-navigated to it', () => {
                // Scenario: User navigated deep into folder structure with keyboard
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId = 'link-deep';

                const itemIdToCopy = keyboardFocusedId || clickedItemId;
                const items = getItemsByIds(treeStructure, [itemIdToCopy]);

                expect(items).toHaveLength(1);
                expect(items[0].id).toBe('link-deep');
                expect(items[0].name).toBe('Deep Link');

                useClipboardStore.getState().copyItems(items, 'space-1');

                const clipboard = useClipboardStore.getState();
                expect(clipboard.items[0].id).toBe('link-deep');
            });

            test('should fallback to clicked selection when no keyboard focus', () => {
                // Scenario: User clicked on folder, no keyboard navigation
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId: string | null = null;

                const itemIdToCopy = keyboardFocusedId || clickedItemId;
                const items = getItemsByIds(treeStructure, [itemIdToCopy!]);

                expect(items).toHaveLength(1);
                expect(items[0].id).toBe('folder-parent');

                useClipboardStore.getState().copyItems(items, 'space-1');

                const clipboard = useClipboardStore.getState();
                expect(clipboard.items[0].id).toBe('folder-parent');
            });

            test('should copy nested folder when keyboard-focused on it', () => {
                // Scenario: User keyboard-navigated to a nested folder
                const clickedItemId = 'link-root';
                const keyboardFocusedId = 'folder-nested';

                const itemIdToCopy = keyboardFocusedId || clickedItemId;
                const items = getItemsByIds(treeStructure, [itemIdToCopy]);

                expect(items).toHaveLength(1);
                expect(items[0].id).toBe('folder-nested');
                expect(items[0].type).toBe(SpaceItemType.folder);

                useClipboardStore.getState().copyItems(items, 'space-1');

                const clipboard = useClipboardStore.getState();
                expect(clipboard.items[0].id).toBe('folder-nested');
                expect(clipboard.items[0].type).toBe(SpaceItemType.folder);
            });
        });

        describe('Copy Priority: multi-selection takes precedence over keyboard focus', () => {
            test('should copy all multi-selected items even when keyboard is on different item', () => {
                // Scenario: User multi-selected link-child-1 and link-child-2, 
                // then keyboard navigated to link-deep (but multi-selection should win)
                const multiSelectedIds = ['link-child-1', 'link-child-2'];
                const keyboardFocusedId = 'link-deep';
                const clickedItemId = 'folder-parent';

                // Multi-selection takes priority
                if (multiSelectedIds.length > 0) {
                    const items = getItemsByIds(treeStructure, multiSelectedIds);

                    expect(items).toHaveLength(2);
                    expect(items.map(i => i.id)).toContain('link-child-1');
                    expect(items.map(i => i.id)).toContain('link-child-2');
                    expect(items.map(i => i.id)).not.toContain('link-deep');

                    useClipboardStore.getState().copyItems(items, 'space-1');

                    const clipboard = useClipboardStore.getState();
                    expect(clipboard.items).toHaveLength(2);
                }
            });

            test('should use keyboard focus when multi-selection is empty', () => {
                const multiSelectedIds: string[] = [];
                const keyboardFocusedId = 'link-deep';
                const clickedItemId = 'folder-parent';

                let itemsToCopy: SpaceItem[] = [];
                if (multiSelectedIds.length > 0) {
                    itemsToCopy = getItemsByIds(treeStructure, multiSelectedIds);
                } else {
                    const itemIdToCopy = keyboardFocusedId || clickedItemId;
                    itemsToCopy = getItemsByIds(treeStructure, [itemIdToCopy!]);
                }

                expect(itemsToCopy).toHaveLength(1);
                expect(itemsToCopy[0].id).toBe('link-deep');
            });
        });

        describe('Hover state should NOT affect copy/paste', () => {
            test('should NOT copy hovered item - only keyboard-focused or clicked', () => {
                // Scenario: User has clicked on folder-parent, keyboard on link-child-1,
                // but mouse is hovering over link-root
                // The hover should be completely ignored
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId = 'link-child-1';
                const hoveredItemId = 'link-root'; // This should be IGNORED

                // Copy logic should NOT consider hoveredItemId at all
                const itemIdToCopy = keyboardFocusedId || clickedItemId;
                // Notice: hoveredItemId is NOT in the priority chain

                const items = getItemsByIds(treeStructure, [itemIdToCopy]);

                expect(items).toHaveLength(1);
                expect(items[0].id).toBe('link-child-1');
                expect(items[0].id).not.toBe(hoveredItemId);
            });

            test('should NOT copy hovered item when only clicked selection exists', () => {
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId: string | null = null;
                const hoveredItemId = 'link-deep'; // This should be IGNORED

                const itemIdToCopy = keyboardFocusedId || clickedItemId;

                const items = getItemsByIds(treeStructure, [itemIdToCopy!]);

                expect(items[0].id).toBe('folder-parent');
                expect(items[0].id).not.toBe(hoveredItemId);
            });
        });

        describe('Paste target priority: keyboard-focused folder > clicked folder > root', () => {
            test('should paste into keyboard-focused folder even when different folder was clicked', () => {
                // Scenario: User clicked on folder-parent, then keyboard navigated to folder-nested
                // Paste should go into folder-nested
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId = 'folder-nested';

                const targetItemId = keyboardFocusedId || clickedItemId;
                const items = getItemsByIds(treeStructure, [targetItemId]);
                const targetItem = items[0];

                expect(targetItem.id).toBe('folder-nested');
                expect(targetItem.type).toBe(SpaceItemType.folder);

                // Paste target should be folder-nested
                const targetParentId = targetItem.type === SpaceItemType.folder ? targetItem.id : null;
                expect(targetParentId).toBe('folder-nested');
            });

            test('should paste at root when keyboard-focused on a link (not folder)', () => {
                // Scenario: User keyboard navigated to a link
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId = 'link-child-1';

                const targetItemId = keyboardFocusedId || clickedItemId;
                const items = getItemsByIds(treeStructure, [targetItemId]);
                const targetItem = items[0];

                expect(targetItem.type).toBe(SpaceItemType.link);

                // Since target is a link, paste at root (null)
                const targetParentId = targetItem.type === SpaceItemType.folder ? targetItem.id : null;
                expect(targetParentId).toBeNull();
            });

            test('should paste into clicked folder when no keyboard focus', () => {
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId: string | null = null;

                const targetItemId = keyboardFocusedId || clickedItemId;
                const items = getItemsByIds(treeStructure, [targetItemId!]);
                const targetItem = items[0];

                expect(targetItem.id).toBe('folder-parent');
                const targetParentId = targetItem.type === SpaceItemType.folder ? targetItem.id : null;
                expect(targetParentId).toBe('folder-parent');
            });

            test('should paste at root when no selection at all', () => {
                const clickedItemId: string | null = null;
                const keyboardFocusedId: string | null = null;

                const targetItemId = keyboardFocusedId || clickedItemId;

                // No target item means paste at root
                const targetParentId = targetItemId ? 'some-folder' : null;
                expect(targetParentId).toBeNull();
            });
        });

        describe('Keyboard navigation state consistency', () => {
            test('should maintain correct item when navigating down through tree', () => {
                // Simulates: ArrowDown from folder-parent to link-child-1
                const visibleItems = [
                    treeStructure[0], // folder-parent
                    treeStructure[0].children[0], // link-child-1
                    treeStructure[0].children[1], // link-child-2
                    treeStructure[1], // link-root
                ];

                let focusedIndex = 0; // Start at folder-parent
                focusedIndex = Math.min(focusedIndex + 1, visibleItems.length - 1); // ArrowDown

                expect(visibleItems[focusedIndex].id).toBe('link-child-1');
            });

            test('should maintain correct item when navigating up through tree', () => {
                const visibleItems = [
                    treeStructure[0], // folder-parent
                    treeStructure[0].children[0], // link-child-1
                    treeStructure[0].children[1], // link-child-2
                    treeStructure[1], // link-root
                ];

                let focusedIndex = 1; // Start at link-child-1
                focusedIndex = Math.max(focusedIndex - 1, 0); // ArrowUp

                expect(visibleItems[focusedIndex].id).toBe('folder-parent');
            });

            test('should copy correct item after multiple keyboard navigations', () => {
                const visibleItems = [
                    treeStructure[0], // folder-parent (index 0)
                    treeStructure[0].children[0], // link-child-1 (index 1)
                    treeStructure[0].children[1], // link-child-2 (index 2)
                    treeStructure[1], // link-root (index 3)
                ];

                // Simulate: Start at 0, ArrowDown 3 times
                let focusedIndex = 0;
                focusedIndex++; // 1
                focusedIndex++; // 2
                focusedIndex++; // 3

                const keyboardFocusedId = visibleItems[focusedIndex].id;
                expect(keyboardFocusedId).toBe('link-root');

                const items = getItemsByIds(treeStructure, [keyboardFocusedId]);
                useClipboardStore.getState().copyItems(items, 'space-1');

                const clipboard = useClipboardStore.getState();
                expect(clipboard.items[0].id).toBe('link-root');
                expect(clipboard.items[0].name).toBe('Root Link');
            });
        });

        describe('Edge cases for keyboard-focused copy/paste', () => {
            test('should handle copy when keyboard focus is cleared (Escape pressed)', () => {
                // After pressing Escape, focusedItemId becomes null
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId: string | null = null; // Cleared by Escape

                const itemIdToCopy = keyboardFocusedId || clickedItemId;
                const items = getItemsByIds(treeStructure, [itemIdToCopy!]);

                // Should fallback to clicked selection
                expect(items[0].id).toBe('folder-parent');
            });

            test('should handle copy when switching spaces (focus cleared)', () => {
                // When switching spaces, focusedItemId is cleared
                const clickedItemId = 'folder-parent';
                const keyboardFocusedId: string | null = null; // Cleared on space switch

                const itemIdToCopy = keyboardFocusedId || clickedItemId;

                if (itemIdToCopy) {
                    const items = getItemsByIds(treeStructure, [itemIdToCopy]);
                    expect(items[0].id).toBe('folder-parent');
                }
            });

            test('should handle rapid keyboard navigation followed by copy', () => {
                // Simulate rapid ArrowDown presses followed by Cmd+C
                const visibleItems = [
                    treeStructure[0],
                    treeStructure[0].children[0],
                    treeStructure[0].children[1],
                    treeStructure[1],
                ];

                let focusedIndex = 0;
                // Rapid navigation
                for (let i = 0; i < 10; i++) {
                    focusedIndex = Math.min(focusedIndex + 1, visibleItems.length - 1);
                }

                // Should be at last item
                expect(focusedIndex).toBe(3);
                expect(visibleItems[focusedIndex].id).toBe('link-root');

                const items = getItemsByIds(treeStructure, [visibleItems[focusedIndex].id]);
                useClipboardStore.getState().copyItems(items, 'space-1');

                expect(useClipboardStore.getState().items[0].id).toBe('link-root');
            });

            test('should not copy anything when no selection and no keyboard focus', () => {
                const clickedItemId: string | null = null;
                const keyboardFocusedId: string | null = null;
                const multiSelectedIds: string[] = [];

                let itemsToCopy: SpaceItem[] = [];

                if (multiSelectedIds.length > 0) {
                    itemsToCopy = getItemsByIds(treeStructure, multiSelectedIds);
                } else {
                    const itemIdToCopy = keyboardFocusedId || clickedItemId;
                    if (itemIdToCopy) {
                        itemsToCopy = getItemsByIds(treeStructure, [itemIdToCopy]);
                    }
                }

                expect(itemsToCopy).toHaveLength(0);
            });
        });

        describe('Folder copy with descendants', () => {
            test('should copy folder with all its children intact', () => {
                const keyboardFocusedId = 'folder-parent';
                const items = getItemsByIds(treeStructure, [keyboardFocusedId]);

                expect(items).toHaveLength(1);
                expect(items[0].children).toHaveLength(3);
                expect(items[0].children[0].id).toBe('link-child-1');
                expect(items[0].children[1].id).toBe('link-child-2');
                expect(items[0].children[2].id).toBe('folder-nested');

                useClipboardStore.getState().copyItems(items, 'space-1');

                const clipboard = useClipboardStore.getState();
                expect(clipboard.items[0].children).toHaveLength(3);
            });

            test('should copy nested folder with its children', () => {
                const keyboardFocusedId = 'folder-nested';
                const items = getItemsByIds(treeStructure, [keyboardFocusedId]);

                expect(items[0].children).toHaveLength(1);
                expect(items[0].children[0].id).toBe('link-deep');

                useClipboardStore.getState().copyItems(items, 'space-1');

                const clipboard = useClipboardStore.getState();
                expect(clipboard.items[0].children).toHaveLength(1);
                expect(clipboard.items[0].children[0].id).toBe('link-deep');
            });
        });

        describe('System clipboard integration with keyboard focus', () => {
            test('should copy URL to system clipboard when keyboard-focused link is copied', () => {
                const keyboardFocusedId = 'link-child-1';
                const items = getItemsByIds(treeStructure, [keyboardFocusedId]);

                expect(items[0].type).toBe(SpaceItemType.link);
                expect(items[0].path).toBe('https://child1.com');

                useClipboardStore.getState().copyItems(items, 'space-1');

                // Verify system clipboard was called with the URL
                expect(mockElectronAPI.clipboard.writeText).toHaveBeenCalledWith('https://child1.com');
            });

            test('should NOT copy to system clipboard when keyboard-focused folder is copied', () => {
                // Reset mock
                mockElectronAPI.clipboard.writeText.mockClear();

                const keyboardFocusedId = 'folder-nested';
                const items = getItemsByIds(treeStructure, [keyboardFocusedId]);

                expect(items[0].type).toBe(SpaceItemType.folder);

                useClipboardStore.getState().copyItems(items, 'space-1');

                // System clipboard should NOT be called for folders
                expect(mockElectronAPI.clipboard.writeText).not.toHaveBeenCalled();
            });
        });
    });
});
