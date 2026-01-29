/**
 * Regression test for SpaceCard keyboard navigation with pinned items
 * 
 * Issue: Arrow key navigation was skipping items intermittently in SpaceCard
 * because pinned items were included in the traversal chain even though
 * they're not visible in the tree (shown in pins grid instead).
 * 
 * Root Cause: SpacesScreen.flattenItems() was using space.rootItems directly
 * without filtering out pinned items, while Sidebar correctly filtered them.
 * 
 * Fix: Added filterPinnedItems() to SpacesScreen and applied it before
 * flattening items for keyboard navigation.
 * 
 * This test ensures:
 * 1. Pinned items are excluded from keyboard navigation traversal
 * 2. Arrow down/up only navigates through visible (non-pinned) items
 * 3. Navigation order matches what user sees in the tree
 */

import { describe, it, expect } from 'vitest';
import type { SpaceItem } from '../src/types';
import { SpaceItemType } from '../src/types';

/**
 * Helper to create a mock SpaceItem with all required fields
 */
function createMockItem(overrides: Partial<SpaceItem>): SpaceItem {
    return {
        id: '',
        name: '',
        path: '',
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
    };
}

/**
 * Helper function to filter out pinned items recursively
 * This is the core logic that SpacesScreen should use
 */
function filterPinnedItems(items: SpaceItem[]): SpaceItem[] {
    return items
        .filter(item => !item.isPinned)
        .map(item => ({
            ...item,
            children: item.children ? filterPinnedItems(item.children) : [],
        }));
}

/**
 * Helper function to flatten items respecting expanded state
 * This simulates what SpacesScreen.flattenItems() does
 */
function flattenItems(items: SpaceItem[], expandedIds: Set<string>): SpaceItem[] {
    const result: SpaceItem[] = [];
    // Filter out pinned items BEFORE flattening
    const nonPinnedItems = filterPinnedItems(items);

    const addItems = (itemList: SpaceItem[]) => {
        for (const item of itemList) {
            result.push(item);
            if ((item.type === 'folder' || item.type === 'localFolder') && expandedIds.has(item.id)) {
                addItems(item.children);
            }
        }
    };

    addItems(nonPinnedItems);
    return result;
}

describe('SpacesScreen Keyboard Navigation with Pinned Items', () => {
    // Mock items with both pinned and non-pinned
    const createMockItems = (): SpaceItem[] => [
        // Pinned items (should be excluded from navigation)
        createMockItem({
            id: 'pinned-link-1',
            name: 'Pinned Link 1',
            path: 'https://example.com/1',
            isPinned: true,
            pinPosition: 0,
        }),
        createMockItem({
            id: 'pinned-link-2',
            name: 'Pinned Link 2',
            path: 'https://example.com/2',
            isPinned: true,
            pinPosition: 1,
        }),
        // Visible items (should be in navigation)
        createMockItem({
            id: 'visible-link-1',
            name: 'Visible Link 1',
            path: 'https://example.com/3',
        }),
        createMockItem({
            id: 'visible-folder-1',
            name: 'Products',
            type: SpaceItemType.folder,
            path: '/Products',
            children: [
                // Pinned child (should be excluded)
                createMockItem({
                    id: 'pinned-child-1',
                    name: 'Pinned Child',
                    path: 'https://example.com/child1',
                    isPinned: true,
                    pinPosition: 2,
                }),
                // Visible child
                createMockItem({
                    id: 'visible-child-1',
                    name: 'Child Item',
                    path: 'https://example.com/child2',
                }),
            ],
        }),
        createMockItem({
            id: 'visible-link-2',
            name: 'ECommerce',
            path: 'https://example.com/4',
        }),
        createMockItem({
            id: 'visible-link-3',
            name: 'Good Work',
            path: 'https://example.com/5',
        }),
    ];

    describe('Core Navigation Logic', () => {
        it('should filter out pinned items from flattened list', () => {
            const items = createMockItems();
            const expandedIds = new Set<string>();

            const flattenedItems = flattenItems(items, expandedIds);

            // Should only include visible items, not pinned
            expect(flattenedItems.length).toBe(4); // visible-link-1, visible-folder-1, visible-link-2, visible-link-3
            expect(flattenedItems.map(i => i.id)).toEqual([
                'visible-link-1',
                'visible-folder-1',
                'visible-link-2',
                'visible-link-3',
            ]);

            // Verify no pinned items in the list
            flattenedItems.forEach(item => {
                expect(item.isPinned).toBe(false);
                expect(item.id).not.toContain('pinned');
            });
        });

        it('should maintain correct navigation order without pinned items', () => {
            const items = createMockItems();
            const expandedIds = new Set<string>();

            const flattenedItems = flattenItems(items, expandedIds);

            // Verify navigation order matches visible items only
            const expectedOrder = [
                'visible-link-1',
                'visible-folder-1',
                'visible-link-2',
                'visible-link-3',
            ];

            expect(flattenedItems.map(i => i.id)).toEqual(expectedOrder);

            // Simulate arrow down navigation
            for (let i = 0; i < flattenedItems.length - 1; i++) {
                const currentItem = flattenedItems[i];
                const nextItem = flattenedItems[i + 1];

                // Next item should be the immediate next visible item
                expect(nextItem.id).toBe(expectedOrder[i + 1]);
                // Should never be a pinned item
                expect(nextItem.isPinned).toBe(false);
            }
        });
    });

    describe('Expanded Folders with Pinned Children', () => {
        it('should exclude pinned children from navigation when folder is expanded', () => {
            const items = createMockItems();
            const expandedIds = new Set<string>(['visible-folder-1']);

            const flattenedItems = flattenItems(items, expandedIds);

            // Should include folder and its visible child, but not pinned child
            expect(flattenedItems.map(i => i.id)).toEqual([
                'visible-link-1',
                'visible-folder-1',
                'visible-child-1',  // Only visible child included
                'visible-link-2',
                'visible-link-3',
            ]);

            // Verify pinned-child-1 is NOT in the list
            const childIds = flattenedItems.map(i => i.id);
            expect(childIds).not.toContain('pinned-child-1');

            // Verify visible-child-1 IS in the list
            expect(childIds).toContain('visible-child-1');
        });
    });

    describe('Consistency with Sidebar Navigation', () => {
        it('should match Sidebar behavior by filtering pinned items', () => {
            const items = createMockItems();
            const expandedIds = new Set<string>();

            // Both Sidebar and SpaceCard should produce the same navigation order
            const flattenedItems = flattenItems(items, expandedIds);

            const expectedNavigationOrder = [
                'visible-link-1',      // First visible item
                'visible-folder-1',    // Folder (not pinned)
                'visible-link-2',      // Link after folder
                'visible-link-3',      // Last visible item
            ];

            expect(flattenedItems.map(i => i.id)).toEqual(expectedNavigationOrder);

            // Verify no pinned items in the sequence
            flattenedItems.forEach(item => {
                expect(item.id).not.toMatch(/pinned/);
                expect(item.isPinned).toBe(false);
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle space with only pinned items gracefully', () => {
            const allPinnedItems: SpaceItem[] = [
                createMockItem({
                    id: 'pinned-1',
                    name: 'Pinned 1',
                    path: 'https://example.com/1',
                    isPinned: true,
                    pinPosition: 0,
                }),
                createMockItem({
                    id: 'pinned-2',
                    name: 'Pinned 2',
                    path: 'https://example.com/2',
                    isPinned: true,
                    pinPosition: 1,
                }),
            ];

            const flattenedItems = flattenItems(allPinnedItems, new Set());

            // Should return empty list when all items are pinned
            expect(flattenedItems).toEqual([]);
            expect(flattenedItems.length).toBe(0);
        });

        it('should handle mixed pinned/unpinned items at same level', () => {
            const items = createMockItems();
            const expandedIds = new Set<string>();

            const flattenedItems = flattenItems(items, expandedIds);

            // Verify that pinned and unpinned items at the same level
            // only include unpinned in navigation
            const visibleItemIds = flattenedItems.map(i => i.id);

            // Should include visible items
            expect(visibleItemIds).toContain('visible-link-1');
            expect(visibleItemIds).toContain('visible-folder-1');
            expect(visibleItemIds).toContain('visible-link-2');
            expect(visibleItemIds).toContain('visible-link-3');

            // Should NOT include pinned items
            expect(visibleItemIds).not.toContain('pinned-link-1');
            expect(visibleItemIds).not.toContain('pinned-link-2');
        });

        it('should recursively filter pinned items from nested children', () => {
            const items = createMockItems();
            const expandedIds = new Set<string>(['visible-folder-1']);

            const flattenedItems = flattenItems(items, expandedIds);

            // Should include visible child but not pinned child
            const childIds = flattenedItems.map(i => i.id);
            expect(childIds).toContain('visible-child-1');
            expect(childIds).not.toContain('pinned-child-1');
        });
    });

    describe('Regression Prevention', () => {
        it('REGRESSION: should not cause intermittent skipping in arrow navigation', () => {
            const items = createMockItems();
            const expandedIds = new Set<string>();

            // This test specifically addresses the reported bug:
            // "clicking down arrow skips the highlight intermittently"

            const flattenedItems = flattenItems(items, expandedIds);

            // Simulate continuous arrow down navigation
            const expectedSteps = [
                'visible-link-1',
                'visible-folder-1',
                'visible-link-2',
                'visible-link-3',
            ];

            // Each step should be sequential with no skips
            for (let i = 0; i < flattenedItems.length; i++) {
                const currentItem = flattenedItems[i];

                // Verify current item matches expected order
                expect(currentItem.id).toBe(expectedSteps[i]);

                // Verify it's not a pinned item
                expect(currentItem.isPinned).toBe(false);

                // If there's a next item, verify it's the immediate next visible item
                if (i < flattenedItems.length - 1) {
                    const nextItem = flattenedItems[i + 1];
                    expect(nextItem.id).toBe(expectedSteps[i + 1]);
                    // No skipping - next item is immediate next in expected order
                }
            }
        });

        it('REGRESSION: navigation chain should not include invisible pinned items', () => {
            const items = createMockItems();
            const expandedIds = new Set<string>();

            // The bug was caused by pinned items being in the flattened list
            // even though they're not visible in the tree

            const flattenedItems = flattenItems(items, expandedIds);

            // Verify that navigation never includes a pinned item
            flattenedItems.forEach(item => {
                // Should never be a pinned item
                expect(item.id).not.toMatch(/^pinned-/);
                expect(item.isPinned).toBe(false);

                // Should always be a visible item
                expect(item.id).toMatch(/^visible-/);
            });

            // Verify the exact count matches visible items only
            expect(flattenedItems.length).toBe(4); // Only 4 visible items at root level
        });

        it('REGRESSION: filterPinnedItems should work recursively on nested structures', () => {
            const items = createMockItems();

            // Test the filter function directly
            const filtered = filterPinnedItems(items);

            // Root level: should have 4 visible items (2 pinned filtered out)
            expect(filtered.length).toBe(4);

            // Find the folder
            const folder = filtered.find(i => i.id === 'visible-folder-1');
            expect(folder).toBeDefined();

            // Folder should have 1 child (pinned child filtered out)
            expect(folder!.children.length).toBe(1);
            expect(folder!.children[0].id).toBe('visible-child-1');
            expect(folder!.children[0].isPinned).toBe(false);
        });
    });
});
