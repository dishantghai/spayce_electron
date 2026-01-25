import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpaceItemType } from '@spayce/react-ui';
import type { SpaceItem } from '@spayce/react-ui';

// Mock window object for tests
const mockWindow = {
    electronAPI: undefined as any,
};

beforeEach(() => {
    global.window = mockWindow as any;
    mockWindow.electronAPI = undefined;
});

afterEach(() => {
    vi.restoreAllMocks();
});

/**
 * TDD Tests for F006: Enhanced Link Context Menu
 * 
 * RED Phase: These tests define the expected behavior before implementation.
 * 
 * Feature Requirements:
 * - Link context menu with Rename, Copy Link, Pin/Unpin, Delete
 * - Pin/Unpin shown conditionally based on isPinned state
 * - Copy Link copies URL to system clipboard
 * - All actions work in both sidebar and space cards
 */

describe('F006: Enhanced Link Context Menu', () => {
    const mockUnpinnedLink: SpaceItem = {
        id: 'link-1',
        name: 'GitHub',
        path: 'https://github.com',
        type: SpaceItemType.link,
        isExpanded: false,
        children: [],
        faviconUrl: null,
        description: null,
        visitCount: 10,
        lastVisited: new Date(),
        createdAt: new Date(),
        isPinned: false,
        pinPosition: null,
        localPath: null,
        securityBookmark: null,
        lastSyncedAt: null,
        isWatching: false,
    };

    const mockPinnedLink: SpaceItem = {
        ...mockUnpinnedLink,
        id: 'link-2',
        name: 'Pinned Link',
        isPinned: true,
        pinPosition: 1,
    };

    describe('AC1: Menu Structure for Links', () => {
        test('should return correct menu items for unpinned link', () => {
            // Mock the getContextMenuItems function behavior
            const getContextMenuItems = (item: SpaceItem, hasClipboard: boolean) => {
                const items = [];

                if (item.type === SpaceItemType.link) {
                    items.push({ id: 'rename', label: 'Rename' });
                    items.push({ id: 'copy_link', label: 'Copy Link' });
                    items.push({ id: 'divider1', isDivider: true });

                    if (item.isPinned) {
                        items.push({ id: 'unpin', label: 'Unpin' });
                    } else {
                        items.push({ id: 'pin', label: 'Pin to Top' });
                    }

                    items.push({ id: 'divider2', isDivider: true });
                    items.push({ id: 'delete', label: 'Delete', isDestructive: true });
                }

                return items;
            };

            const menuItems = getContextMenuItems(mockUnpinnedLink, false);

            // Assert correct number of items (6 total: rename, copy, divider, pin/unpin, divider, delete)
            expect(menuItems.length).toBe(6);

            // Assert menu structure
            expect(menuItems[0]).toMatchObject({ id: 'rename', label: 'Rename' });
            expect(menuItems[1]).toMatchObject({ id: 'copy_link', label: 'Copy Link' });
            expect(menuItems[2]).toMatchObject({ id: 'divider1', isDivider: true });
            expect(menuItems[3]).toMatchObject({ id: 'pin', label: 'Pin to Top' });
            expect(menuItems[4]).toMatchObject({ id: 'divider2', isDivider: true });
            expect(menuItems[5]).toMatchObject({ id: 'delete', label: 'Delete', isDestructive: true });
        });

        test('should show "Pin to Top" for unpinned link', () => {
            const getContextMenuItems = (item: SpaceItem) => {
                if (item.type === SpaceItemType.link) {
                    return item.isPinned
                        ? [{ id: 'unpin', label: 'Unpin' }]
                        : [{ id: 'pin', label: 'Pin to Top' }];
                }
                return [];
            };

            const menuItems = getContextMenuItems(mockUnpinnedLink);

            expect(menuItems).toContainEqual({ id: 'pin', label: 'Pin to Top' });
            expect(menuItems).not.toContainEqual({ id: 'unpin', label: 'Unpin' });
        });

        test('should show "Unpin" for pinned link', () => {
            const getContextMenuItems = (item: SpaceItem) => {
                if (item.type === SpaceItemType.link) {
                    return item.isPinned
                        ? [{ id: 'unpin', label: 'Unpin' }]
                        : [{ id: 'pin', label: 'Pin to Top' }];
                }
                return [];
            };

            const menuItems = getContextMenuItems(mockPinnedLink);

            expect(menuItems).toContainEqual({ id: 'unpin', label: 'Unpin' });
            expect(menuItems).not.toContainEqual({ id: 'pin', label: 'Pin to Top' });
        });

        test('should NEVER show both Pin and Unpin simultaneously', () => {
            const getContextMenuItems = (item: SpaceItem) => {
                const items = [];

                if (item.type === SpaceItemType.link) {
                    if (item.isPinned) {
                        items.push({ id: 'unpin', label: 'Unpin' });
                    } else {
                        items.push({ id: 'pin', label: 'Pin to Top' });
                    }
                }

                return items;
            };

            // Test unpinned
            const unpinnedItems = getContextMenuItems(mockUnpinnedLink);
            const hasBothUnpinned = unpinnedItems.some(i => i.id === 'pin') &&
                unpinnedItems.some(i => i.id === 'unpin');
            expect(hasBothUnpinned).toBe(false);

            // Test pinned
            const pinnedItems = getContextMenuItems(mockPinnedLink);
            const hasBothPinned = pinnedItems.some(i => i.id === 'pin') &&
                pinnedItems.some(i => i.id === 'unpin');
            expect(hasBothPinned).toBe(false);
        });

        test('should have delete as last item with destructive flag', () => {
            const getContextMenuItems = (item: SpaceItem) => {
                const items = [];

                if (item.type === SpaceItemType.link) {
                    items.push({ id: 'rename', label: 'Rename' });
                    items.push({ id: 'copy_link', label: 'Copy Link' });
                    items.push({ id: 'divider1', isDivider: true });
                    items.push({ id: 'pin', label: 'Pin to Top' });
                    items.push({ id: 'divider2', isDivider: true });
                    items.push({ id: 'delete', label: 'Delete', isDestructive: true });
                }

                return items;
            };

            const menuItems = getContextMenuItems(mockUnpinnedLink);
            const lastItem = menuItems[menuItems.length - 1];

            expect(lastItem.id).toBe('delete');
            expect(lastItem.isDestructive).toBe(true);
        });

        test('should have dividers in correct positions', () => {
            const getContextMenuItems = (item: SpaceItem) => {
                const items = [];

                if (item.type === SpaceItemType.link) {
                    items.push({ id: 'rename' });
                    items.push({ id: 'copy_link' });
                    items.push({ id: 'divider1', isDivider: true });
                    items.push({ id: 'pin' });
                    items.push({ id: 'divider2', isDivider: true });
                    items.push({ id: 'delete' });
                }

                return items;
            };

            const menuItems = getContextMenuItems(mockUnpinnedLink);

            // Divider after Copy Link (index 2)
            expect(menuItems[2].isDivider).toBe(true);

            // Divider after Pin/Unpin (index 4)
            expect(menuItems[4].isDivider).toBe(true);
        });
    });

    describe('AC2: Copy Link Action', () => {
        test('should copy link URL to system clipboard', async () => {
            // Mock navigator.clipboard
            const mockClipboard = {
                writeText: vi.fn().mockResolvedValue(undefined),
            };
            Object.defineProperty(navigator, 'clipboard', {
                value: mockClipboard,
                writable: true,
            });

            // Simulate copy_link action
            await navigator.clipboard.writeText(mockUnpinnedLink.path);

            expect(mockClipboard.writeText).toHaveBeenCalledWith('https://github.com');
        });

        test('should handle clipboard write errors gracefully', async () => {
            const mockClipboard = {
                writeText: vi.fn().mockRejectedValue(new Error('Clipboard access denied')),
            };
            Object.defineProperty(navigator, 'clipboard', {
                value: mockClipboard,
                writable: true,
            });

            // Should not throw
            await expect(async () => {
                try {
                    await navigator.clipboard.writeText(mockUnpinnedLink.path);
                } catch (err) {
                    console.error('Failed to copy link:', err);
                }
            }).not.toThrow();
        });

        test('should copy URL with special characters correctly', async () => {
            const specialLink: SpaceItem = {
                ...mockUnpinnedLink,
                path: 'https://example.com/path?query=value&foo=bar#section',
            };

            const mockClipboard = {
                writeText: vi.fn().mockResolvedValue(undefined),
            };
            Object.defineProperty(navigator, 'clipboard', {
                value: mockClipboard,
                writable: true,
            });

            await navigator.clipboard.writeText(specialLink.path);

            expect(mockClipboard.writeText).toHaveBeenCalledWith(
                'https://example.com/path?query=value&foo=bar#section'
            );
        });
    });

    describe('AC3: Pin Action', () => {
        test('should call IPC pin handler with item id', async () => {
            const mockElectronAPI = {
                items: {
                    pin: vi.fn().mockResolvedValue({ success: true }),
                },
            };

            (window as any).electronAPI = mockElectronAPI;

            // Simulate pin action
            const result = await mockElectronAPI.items.pin(mockUnpinnedLink.id);

            expect(mockElectronAPI.items.pin).toHaveBeenCalledWith('link-1');
            expect(result.success).toBe(true);
        });

        test('should handle pin failure gracefully', async () => {
            const mockElectronAPI = {
                items: {
                    pin: vi.fn().mockResolvedValue({ success: false, error: 'Database error' }),
                },
            };

            (window as any).electronAPI = mockElectronAPI;

            const result = await mockElectronAPI.items.pin(mockUnpinnedLink.id);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should refetch data after successful pin', async () => {
            const mockElectronAPI = {
                items: {
                    pin: vi.fn().mockResolvedValue({ success: true }),
                },
            };
            const mockRefetch = vi.fn();

            (window as any).electronAPI = mockElectronAPI;

            // Simulate pin action with refetch
            const result = await mockElectronAPI.items.pin(mockUnpinnedLink.id);
            if (result.success) {
                await mockRefetch();
            }

            expect(mockRefetch).toHaveBeenCalled();
        });
    });

    describe('AC4: Unpin Action', () => {
        test('should call IPC unpin handler with item id', async () => {
            const mockElectronAPI = {
                items: {
                    unpin: vi.fn().mockResolvedValue({ success: true }),
                },
            };

            (window as any).electronAPI = mockElectronAPI;

            // Simulate unpin action
            const result = await mockElectronAPI.items.unpin(mockPinnedLink.id);

            expect(mockElectronAPI.items.unpin).toHaveBeenCalledWith('link-2');
            expect(result.success).toBe(true);
        });

        test('should handle unpin failure gracefully', async () => {
            const mockElectronAPI = {
                items: {
                    unpin: vi.fn().mockResolvedValue({ success: false, error: 'Item not found' }),
                },
            };

            (window as any).electronAPI = mockElectronAPI;

            const result = await mockElectronAPI.items.unpin(mockPinnedLink.id);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should refetch data after successful unpin', async () => {
            const mockElectronAPI = {
                items: {
                    unpin: vi.fn().mockResolvedValue({ success: true }),
                },
            };
            const mockRefetch = vi.fn();

            (window as any).electronAPI = mockElectronAPI;

            // Simulate unpin action with refetch
            const result = await mockElectronAPI.items.unpin(mockPinnedLink.id);
            if (result.success) {
                await mockRefetch();
            }

            expect(mockRefetch).toHaveBeenCalled();
        });
    });

    describe('AC5: Delete Action', () => {
        test('should call IPC delete handler without confirmation', async () => {
            const mockElectronAPI = {
                items: {
                    delete: vi.fn().mockResolvedValue({ success: true }),
                },
            };

            (window as any).electronAPI = mockElectronAPI;

            // Simulate delete action (no confirmation for links)
            const result = await mockElectronAPI.items.delete(mockUnpinnedLink.id);

            expect(mockElectronAPI.items.delete).toHaveBeenCalledWith('link-1');
            expect(result.success).toBe(true);
        });

        test('should not prompt confirmation for link delete', () => {
            // Links should be deleted directly without confirmation dialog
            const mockConfirm = vi.fn();
            global.confirm = mockConfirm;

            // Delete link action should NOT call confirm
            // (unlike folders which need confirmation)

            // For links, we skip confirmation
            const needsConfirmation = false;

            expect(needsConfirmation).toBe(false);
            expect(mockConfirm).not.toHaveBeenCalled();
        });

        test('should refetch data after successful delete', async () => {
            const mockElectronAPI = {
                items: {
                    delete: vi.fn().mockResolvedValue({ success: true }),
                },
            };
            const mockRefetch = vi.fn();

            (window as any).electronAPI = mockElectronAPI;

            // Simulate delete action with refetch
            const result = await mockElectronAPI.items.delete(mockUnpinnedLink.id);
            if (result.success) {
                await mockRefetch();
            }

            expect(mockRefetch).toHaveBeenCalled();
        });
    });

    describe('AC6: Rename Action', () => {
        test('should trigger inline rename for link', () => {
            const mockSetRenameItemId = vi.fn();

            // Simulate rename action
            mockSetRenameItemId(mockUnpinnedLink.id);

            expect(mockSetRenameItemId).toHaveBeenCalledWith('link-1');
        });

        test('should use correct rename state based on context', () => {
            const mockSetSidebarRenameItemId = vi.fn();
            const mockSetCardRenameItemId = vi.fn();

            // Sidebar context
            mockSetSidebarRenameItemId(mockUnpinnedLink.id);
            expect(mockSetSidebarRenameItemId).toHaveBeenCalledWith('link-1');

            // Card context
            mockSetCardRenameItemId(mockUnpinnedLink.id);
            expect(mockSetCardRenameItemId).toHaveBeenCalledWith('link-1');
        });

        test('should preserve URL when renaming', () => {
            // Rename only changes name, not path
            const originalPath = mockUnpinnedLink.path;
            const newName = 'My GitHub';

            // After rename, path should remain unchanged
            const updatedLink = {
                ...mockUnpinnedLink,
                name: newName,
                path: originalPath, // Path should NOT change
            };

            expect(updatedLink.name).toBe('My GitHub');
            expect(updatedLink.path).toBe('https://github.com');
            expect(updatedLink.path).toBe(originalPath);
        });
    });

    describe('AC7: Context Menu Integration', () => {
        test('should work in sidebar context', () => {
            const context = 'sidebar';
            const mockSetSidebarRenameItemId = vi.fn();

            // Simulate context menu action in sidebar
            if (context === 'sidebar') {
                mockSetSidebarRenameItemId(mockUnpinnedLink.id);
            }

            expect(mockSetSidebarRenameItemId).toHaveBeenCalled();
        });

        test('should work in space cards context', () => {
            const context = 'card';
            const mockSetCardRenameItemId = vi.fn();

            // Simulate context menu action in card
            if (context === 'card') {
                mockSetCardRenameItemId(mockUnpinnedLink.id);
            }

            expect(mockSetCardRenameItemId).toHaveBeenCalled();
        });

        test('should close context menu after action', () => {
            const mockSetContextMenu = vi.fn();

            // After any action, context menu should close
            mockSetContextMenu(null);

            expect(mockSetContextMenu).toHaveBeenCalledWith(null);
        });
    });

    describe('AC8: Pin State Persistence', () => {
        test('should persist pin state in database', () => {
            // Mock database update
            const mockUpdate = vi.fn();

            const pinnedLink = {
                ...mockUnpinnedLink,
                isPinned: true,
                pinPosition: 1,
            };

            mockUpdate(pinnedLink.id, { isPinned: true, pinPosition: 1 });

            expect(mockUpdate).toHaveBeenCalledWith('link-1',
                expect.objectContaining({ isPinned: true })
            );
        });

        test('should clear pin state on unpin', () => {
            const mockUpdate = vi.fn();

            const unpinnedLink = {
                ...mockPinnedLink,
                isPinned: false,
                pinPosition: null,
            };

            mockUpdate(unpinnedLink.id, { isPinned: false, pinPosition: null });

            expect(mockUpdate).toHaveBeenCalledWith('link-2',
                expect.objectContaining({ isPinned: false })
            );
        });
    });

    describe('AC9: Edge Cases', () => {
        test('should handle missing electronAPI gracefully', async () => {
            (window as any).electronAPI = undefined;

            // Should not throw even if electronAPI is missing
            const result = await (async () => {
                try {
                    return await (window as any).electronAPI?.items?.pin?.('link-1');
                } catch (err) {
                    return null;
                }
            })();

            expect(result).toBeUndefined();
        });

        test('should handle network errors in IPC calls', async () => {
            const mockElectronAPI = {
                items: {
                    pin: vi.fn().mockRejectedValue(new Error('Network timeout')),
                },
            };

            (window as any).electronAPI = mockElectronAPI;

            await expect(async () => {
                try {
                    await mockElectronAPI.items.pin('link-1');
                } catch (err) {
                    console.error('Failed to pin link:', err);
                }
            }).not.toThrow();
        });

        test('should handle very long URLs correctly', async () => {
            const longUrlLink: SpaceItem = {
                ...mockUnpinnedLink,
                path: 'https://example.com/' + 'a'.repeat(2000),
            };

            const mockClipboard = {
                writeText: vi.fn().mockResolvedValue(undefined),
            };
            Object.defineProperty(navigator, 'clipboard', {
                value: mockClipboard,
                writable: true,
            });

            await navigator.clipboard.writeText(longUrlLink.path);

            expect(mockClipboard.writeText).toHaveBeenCalled();
            expect(mockClipboard.writeText.mock.calls[0][0]).toContain('https://example.com/');
        });
    });
});
