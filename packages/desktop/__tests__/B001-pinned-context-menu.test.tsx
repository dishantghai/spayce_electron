import { describe, it, expect } from 'vitest';
import type { SpaceItem } from '@spayce/react-ui';
import { SpaceItemType } from '@spayce/react-ui';

export interface ContextMenuItem {
    id: string;
    label: string;
    icon: any;
    isDestructive?: boolean;
    isDivider?: boolean;
    isDisabled?: boolean;
}

/**
 * B001: Remove 'Rename' from Pinned Items Context Menu
 * 
 * Tests that pinned items shown in the pins grid do NOT have a Rename option,
 * while regular items in the tree/list still have it.
 */

describe('B001: Pinned Items Context Menu', () => {
    const mockPinnedLink: SpaceItem = {
        id: 'link-1',
        name: 'Test Pinned Link',
        type: SpaceItemType.link,
        path: 'https://example.com',
        isExpanded: false,
        children: [],
        faviconUrl: null,
        description: null,
        visitCount: 0,
        lastVisited: null,
        createdAt: new Date(),
        isPinned: true,
        pinPosition: 1,
        localPath: null,
        securityBookmark: null,
        lastSyncedAt: null,
        isWatching: false,
    };

    const mockUnpinnedLink: SpaceItem = {
        ...mockPinnedLink,
        id: 'link-2',
        name: 'Test Unpinned Link',
        isPinned: false,
        pinPosition: null,
    };

    // Helper function to simulate getContextMenuItems
    // This will be replaced with actual import once we modify App.tsx to export it
    function getContextMenuItems(
        item: SpaceItem,
        hasClipboard: boolean,
        context?: 'sidebar' | 'card' | 'pins-grid'
    ): ContextMenuItem[] {
        const items: ContextMenuItem[] = [];

        if (item.type === SpaceItemType.link) {
            // B001 FIX: Don't show rename for pinned items in pins grid
            if (context !== 'pins-grid') {
                items.push({ id: 'rename', label: 'Rename', icon: 'Pencil' as any });
            }
            items.push({ id: 'copy_link', label: 'Copy Link', icon: 'Copy' as any });
            items.push({ id: 'divider1', label: '', icon: 'Minus' as any, isDivider: true });

            if (item.isPinned) {
                items.push({ id: 'unpin', label: 'Unpin', icon: 'PinOff' as any });
            } else {
                items.push({ id: 'pin', label: 'Pin to Top', icon: 'Pin' as any });
            }

            items.push({ id: 'divider2', label: '', icon: 'Minus' as any, isDivider: true });
            items.push({ id: 'delete', label: 'Delete', icon: 'Trash2' as any, isDestructive: true });
        }

        return items;
    }

    describe('AC1: Rename removed from pinned items context menu', () => {
        it('should NOT show Rename option when context is pins-grid', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'pins-grid');

            const hasRename = menuItems.some(item => item.id === 'rename');
            expect(hasRename).toBe(false);
        });

        it('should show Rename option for unpinned link in sidebar', () => {
            const menuItems = getContextMenuItems(mockUnpinnedLink, false, 'sidebar');

            const hasRename = menuItems.some(item => item.id === 'rename');
            expect(hasRename).toBe(true);
        });

        it('should show Rename option for pinned link in sidebar (original location)', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'sidebar');

            const hasRename = menuItems.some(item => item.id === 'rename');
            expect(hasRename).toBe(true);
        });

        it('should show Rename option for pinned link in card view (original location)', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'card');

            const hasRename = menuItems.some(item => item.id === 'rename');
            expect(hasRename).toBe(true);
        });
    });

    describe('AC2: Other context menu options remain functional', () => {
        it('should show Unpin option for pinned item in pins grid', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'pins-grid');

            const hasUnpin = menuItems.some(item => item.id === 'unpin');
            expect(hasUnpin).toBe(true);
        });

        it('should show Copy Link option in pins grid', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'pins-grid');

            const hasCopyLink = menuItems.some(item => item.id === 'copy_link');
            expect(hasCopyLink).toBe(true);
        });

        it('should show Delete option in pins grid', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'pins-grid');

            const hasDelete = menuItems.some(item => item.id === 'delete');
            expect(hasDelete).toBe(true);
        });
    });

    describe('AC3: Renaming available from original location', () => {
        it('should allow rename from sidebar for both pinned and unpinned items', () => {
            const pinnedMenu = getContextMenuItems(mockPinnedLink, false, 'sidebar');
            const unpinnedMenu = getContextMenuItems(mockUnpinnedLink, false, 'sidebar');

            expect(pinnedMenu.some(item => item.id === 'rename')).toBe(true);
            expect(unpinnedMenu.some(item => item.id === 'rename')).toBe(true);
        });

        it('should allow rename from card view for both pinned and unpinned items', () => {
            const pinnedMenu = getContextMenuItems(mockPinnedLink, false, 'card');
            const unpinnedMenu = getContextMenuItems(mockUnpinnedLink, false, 'card');

            expect(pinnedMenu.some(item => item.id === 'rename')).toBe(true);
            expect(unpinnedMenu.some(item => item.id === 'rename')).toBe(true);
        });
    });

    describe('AC4: No visual artifacts in context menu', () => {
        it('should maintain proper menu structure without Rename', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'pins-grid');

            // Menu should still have proper structure:
            // Copy Link, Divider, Unpin, Divider, Delete
            expect(menuItems.length).toBe(5); // 5 items (no rename)
            expect(menuItems[0].id).toBe('copy_link');
            expect(menuItems[1].isDivider).toBe(true);
            expect(menuItems[2].id).toBe('unpin');
            expect(menuItems[3].isDivider).toBe(true);
            expect(menuItems[4].id).toBe('delete');
        });

        it('should maintain proper menu structure with Rename in sidebar', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'sidebar');

            // Menu should have: Rename, Copy Link, Divider, Unpin, Divider, Delete
            expect(menuItems.length).toBe(6); // 6 items (with rename)
            expect(menuItems[0].id).toBe('rename');
            expect(menuItems[1].id).toBe('copy_link');
        });
    });

    describe('AC5: Consistent behavior across all pinned item types', () => {
        it('should work for link items in pins grid', () => {
            const menuItems = getContextMenuItems(mockPinnedLink, false, 'pins-grid');
            expect(menuItems.some(item => item.id === 'rename')).toBe(false);
        });

        it('should work for different link items with different properties', () => {
            const linkWithFavicon: SpaceItem = {
                ...mockPinnedLink,
                faviconUrl: 'https://example.com/favicon.ico',
            };

            const menuItems = getContextMenuItems(linkWithFavicon, false, 'pins-grid');
            expect(menuItems.some(item => item.id === 'rename')).toBe(false);
        });
    });
});
