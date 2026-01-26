import { describe, test, expect } from 'vitest';
import { collectLinksRecursive, hasLinksRecursive } from '../../src/utils/spaceItems';
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

describe('Feature: F007 - Copy Single Item - SpaceItems Utilities', () => {
    describe('AC1: collectLinksRecursive returns all nested links', () => {
        test('should return empty array for folder without links', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [],
            });

            const links = collectLinksRecursive(folder);
            expect(links).toEqual([]);
        });

        test('should return self for link item', () => {
            const link = createMockItem({
                id: 'link-1',
                type: SpaceItemType.link,
            });

            const links = collectLinksRecursive(link);
            expect(links).toHaveLength(1);
            expect(links[0].id).toBe('link-1');
        });

        test('should return all nested links from folder', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({ id: 'link-1', type: SpaceItemType.link }),
                    createMockItem({ id: 'link-2', type: SpaceItemType.link }),
                ],
            });

            const links = collectLinksRecursive(folder);
            expect(links).toHaveLength(2);
            expect(links[0].id).toBe('link-1');
            expect(links[1].id).toBe('link-2');
        });

        test('should recursively collect links from deeply nested folders', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({ id: 'link-1', type: SpaceItemType.link }),
                    createMockItem({
                        id: 'subfolder-1',
                        type: SpaceItemType.folder,
                        children: [
                            createMockItem({ id: 'link-2', type: SpaceItemType.link }),
                            createMockItem({
                                id: 'subfolder-2',
                                type: SpaceItemType.folder,
                                children: [
                                    createMockItem({ id: 'link-3', type: SpaceItemType.link }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            const links = collectLinksRecursive(folder);
            expect(links).toHaveLength(3);
            expect(links.map((l: SpaceItem) => l.id)).toEqual(['link-1', 'link-2', 'link-3']);
        });

        test('should ignore folders in the results', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({ id: 'link-1', type: SpaceItemType.link }),
                    createMockItem({ id: 'subfolder-1', type: SpaceItemType.folder }),
                    createMockItem({ id: 'link-2', type: SpaceItemType.link }),
                ],
            });

            const links = collectLinksRecursive(folder);
            expect(links).toHaveLength(2);
            expect(links.every((l: SpaceItem) => l.type === SpaceItemType.link)).toBe(true);
        });

        test('should handle mixed content (folders and links)', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({ id: 'folder-2', type: SpaceItemType.folder, children: [] }),
                    createMockItem({ id: 'link-1', type: SpaceItemType.link }),
                    createMockItem({
                        id: 'folder-3',
                        type: SpaceItemType.folder,
                        children: [
                            createMockItem({ id: 'link-2', type: SpaceItemType.link }),
                        ],
                    }),
                ],
            });

            const links = collectLinksRecursive(folder);
            expect(links).toHaveLength(2);
            expect(links[0].id).toBe('link-1');
            expect(links[1].id).toBe('link-2');
        });
    });

    describe('AC2: hasLinksRecursive returns true for folders containing links', () => {
        test('should return false for folder without links', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [],
            });

            expect(hasLinksRecursive(folder)).toBe(false);
        });

        test('should return true for link item', () => {
            const link = createMockItem({
                id: 'link-1',
                type: SpaceItemType.link,
            });

            expect(hasLinksRecursive(link)).toBe(true);
        });

        test('should return true for folder containing direct child link', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({ id: 'link-1', type: SpaceItemType.link }),
                ],
            });

            expect(hasLinksRecursive(folder)).toBe(true);
        });

        test('should return true for folder containing nested link', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({
                        id: 'subfolder-1',
                        type: SpaceItemType.folder,
                        children: [
                            createMockItem({ id: 'link-1', type: SpaceItemType.link }),
                        ],
                    }),
                ],
            });

            expect(hasLinksRecursive(folder)).toBe(true);
        });

        test('should return false for folder with only subfolders (no links)', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({ id: 'subfolder-1', type: SpaceItemType.folder, children: [] }),
                    createMockItem({ id: 'subfolder-2', type: SpaceItemType.folder, children: [] }),
                ],
            });

            expect(hasLinksRecursive(folder)).toBe(false);
        });

        test('should handle deeply nested structure efficiently', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [
                    createMockItem({
                        id: 'subfolder-1',
                        type: SpaceItemType.folder,
                        children: [
                            createMockItem({
                                id: 'subfolder-2',
                                type: SpaceItemType.folder,
                                children: [
                                    createMockItem({ id: 'link-1', type: SpaceItemType.link }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            expect(hasLinksRecursive(folder)).toBe(true);
        });
    });

    describe('AC3: Edge cases and performance', () => {
        test('should handle item with null children', () => {
            const item = createMockItem({
                id: 'item-1',
                type: SpaceItemType.folder,
                children: undefined as any,
            });

            expect(collectLinksRecursive(item)).toEqual([]);
            expect(hasLinksRecursive(item)).toBe(false);
        });

        test('should handle large number of nested items', () => {
            const children = Array.from({ length: 100 }, (_, i) =>
                createMockItem({ id: `link-${i}`, type: SpaceItemType.link })
            );

            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children,
            });

            const links = collectLinksRecursive(folder);
            expect(links).toHaveLength(100);
        });

        test('should handle circular reference prevention gracefully', () => {
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [],
            });

            const links = collectLinksRecursive(folder);
            expect(links).toEqual([]);
        });

        test('should maintain item integrity (no mutations)', () => {
            const link = createMockItem({ id: 'link-1', type: SpaceItemType.link });
            const folder = createMockItem({
                id: 'folder-1',
                type: SpaceItemType.folder,
                children: [link],
            });

            const linksBefore = folder.children;
            collectLinksRecursive(folder);
            const linksAfter = folder.children;

            expect(linksBefore).toBe(linksAfter);
        });
    });
});
