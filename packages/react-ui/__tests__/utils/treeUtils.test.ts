import { describe, test, expect } from 'vitest';
import { flattenVisibleItems, getVisibleItemIds, getItemsByIds } from '../../src/utils/treeUtils';
import { SpaceItemType } from '../../src/types';
import type { SpaceItem } from '../../src/types';

// Helper to create test items
function createItem(id: string, name: string, type: SpaceItemType = SpaceItemType.link, children: SpaceItem[] = []): SpaceItem {
    return {
        id,
        name,
        type,
        path: type === SpaceItemType.link ? `/test/${id}` : '',
        isExpanded: false,
        children,
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
    };
}

describe('Feature F018: Tree Utilities for Range Selection', () => {
    describe('flattenVisibleItems', () => {
        test('should return all items when all folders are expanded', () => {
            const items: SpaceItem[] = [
                createItem('folder-1', 'Folder 1', SpaceItemType.folder, [
                    createItem('item-1', 'Item 1'),
                    createItem('item-2', 'Item 2'),
                ]),
                createItem('item-3', 'Item 3'),
            ];
            const expandedIds = new Set(['folder-1']);

            const result = flattenVisibleItems(items, expandedIds);

            expect(result.length).toBe(4);
            expect(result.map(i => i.id)).toEqual(['folder-1', 'item-1', 'item-2', 'item-3']);
        });

        test('should exclude collapsed folder children', () => {
            const items: SpaceItem[] = [
                createItem('folder-1', 'Folder 1', SpaceItemType.folder, [
                    createItem('item-1', 'Item 1'),
                    createItem('item-2', 'Item 2'),
                ]),
                createItem('item-3', 'Item 3'),
            ];
            const expandedIds = new Set<string>(); // folder-1 is collapsed

            const result = flattenVisibleItems(items, expandedIds);

            expect(result.length).toBe(2);
            expect(result.map(i => i.id)).toEqual(['folder-1', 'item-3']);
        });

        test('should handle empty tree', () => {
            const result = flattenVisibleItems([], new Set());
            expect(result).toEqual([]);
        });

        test('should handle deeply nested items', () => {
            const items: SpaceItem[] = [
                createItem('folder-1', 'Folder 1', SpaceItemType.folder, [
                    createItem('folder-2', 'Folder 2', SpaceItemType.folder, [
                        createItem('folder-3', 'Folder 3', SpaceItemType.folder, [
                            createItem('item-deep', 'Deep Item'),
                        ]),
                    ]),
                ]),
            ];
            const expandedIds = new Set(['folder-1', 'folder-2', 'folder-3']);

            const result = flattenVisibleItems(items, expandedIds);

            expect(result.length).toBe(4);
            expect(result.map(i => i.id)).toEqual(['folder-1', 'folder-2', 'folder-3', 'item-deep']);
        });

        test('should stop at collapsed folder in nested structure', () => {
            const items: SpaceItem[] = [
                createItem('folder-1', 'Folder 1', SpaceItemType.folder, [
                    createItem('folder-2', 'Folder 2', SpaceItemType.folder, [
                        createItem('item-deep', 'Deep Item'),
                    ]),
                ]),
            ];
            const expandedIds = new Set(['folder-1']); // folder-2 is collapsed

            const result = flattenVisibleItems(items, expandedIds);

            expect(result.length).toBe(2);
            expect(result.map(i => i.id)).toEqual(['folder-1', 'folder-2']);
        });

        test('should handle localFolder type', () => {
            const items: SpaceItem[] = [
                createItem('local-folder', 'Local Folder', SpaceItemType.localFolder, [
                    createItem('local-file', 'Local File', SpaceItemType.localFile),
                ]),
            ];
            const expandedIds = new Set(['local-folder']);

            const result = flattenVisibleItems(items, expandedIds);

            expect(result.length).toBe(2);
            expect(result.map(i => i.id)).toEqual(['local-folder', 'local-file']);
        });

        test('should maintain tree order', () => {
            const items: SpaceItem[] = [
                createItem('item-1', 'Item 1'),
                createItem('folder-1', 'Folder 1', SpaceItemType.folder, [
                    createItem('item-2', 'Item 2'),
                    createItem('item-3', 'Item 3'),
                ]),
                createItem('item-4', 'Item 4'),
            ];
            const expandedIds = new Set(['folder-1']);

            const result = flattenVisibleItems(items, expandedIds);

            expect(result.map(i => i.id)).toEqual(['item-1', 'folder-1', 'item-2', 'item-3', 'item-4']);
        });
    });

    describe('getVisibleItemIds', () => {
        test('should return IDs in correct order', () => {
            const items: SpaceItem[] = [
                createItem('folder-1', 'Folder 1', SpaceItemType.folder, [
                    createItem('item-1', 'Item 1'),
                ]),
                createItem('item-2', 'Item 2'),
            ];
            const expandedIds = new Set(['folder-1']);

            const result = getVisibleItemIds(items, expandedIds);

            expect(result).toEqual(['folder-1', 'item-1', 'item-2']);
        });

        test('should return empty array for empty tree', () => {
            const result = getVisibleItemIds([], new Set());
            expect(result).toEqual([]);
        });
    });

    describe('getItemsByIds', () => {
        test('should find items at any nesting level', () => {
            const items: SpaceItem[] = [
                createItem('folder-1', 'Folder 1', SpaceItemType.folder, [
                    createItem('item-1', 'Item 1'),
                    createItem('folder-2', 'Folder 2', SpaceItemType.folder, [
                        createItem('item-2', 'Item 2'),
                    ]),
                ]),
                createItem('item-3', 'Item 3'),
            ];

            const result = getItemsByIds(items, ['item-1', 'item-2', 'item-3']);

            expect(result.length).toBe(3);
            expect(result.map(i => i.id)).toContain('item-1');
            expect(result.map(i => i.id)).toContain('item-2');
            expect(result.map(i => i.id)).toContain('item-3');
        });

        test('should return empty array when no IDs match', () => {
            const items: SpaceItem[] = [
                createItem('item-1', 'Item 1'),
            ];

            const result = getItemsByIds(items, ['non-existent']);

            expect(result).toEqual([]);
        });

        test('should handle empty items array', () => {
            const result = getItemsByIds([], ['item-1']);
            expect(result).toEqual([]);
        });

        test('should handle empty IDs array', () => {
            const items: SpaceItem[] = [
                createItem('item-1', 'Item 1'),
            ];

            const result = getItemsByIds(items, []);

            expect(result).toEqual([]);
        });
    });
});
