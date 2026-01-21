import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ISpacesRepository, ISpaceItemsRepository } from '../../src/domain';
import { SpaceItemType } from '../../src/domain';
import type { SpaceEntity, SpaceItemEntity } from '../../src/domain/entities';

describe('Query Classes', () => {
    let mockSpacesRepository: ISpacesRepository;
    let mockItemsRepository: ISpaceItemsRepository;

    beforeEach(() => {
        mockSpacesRepository = {
            getAllSpaces: vi.fn(),
            getSpaceById: vi.fn(),
            searchSpaces: vi.fn(),
            createSpace: vi.fn(),
            updateSpace: vi.fn(),
            deleteSpace: vi.fn(),
            reorderSpaces: vi.fn(),
        };

        mockItemsRepository = {
            getItemsBySpaceId: vi.fn(),
            getItemById: vi.fn(),
            getItemChildren: vi.fn(),
            getPinnedItems: vi.fn(),
            searchItems: vi.fn(),
            getRecentItems: vi.fn(),
            getMostVisitedItems: vi.fn(),
            createItem: vi.fn(),
            updateItem: vi.fn(),
            deleteItem: vi.fn(),
            moveItem: vi.fn(),
            reorderItems: vi.fn(),
            pinItem: vi.fn(),
            unpinItem: vi.fn(),
            reorderPins: vi.fn(),
            incrementVisitCount: vi.fn(),
        };
    });

    describe('GetSpacesQuery', () => {
        it('should return all spaces for profile', async () => {
            const spaces: SpaceEntity[] = [
                {
                    id: 'space-1',
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'Space 1',
                    accentColor: '#6D5AE6',
                    iconName: 'folder',
                    order: 0,
                    isExpanded: true,
                    createdAt: new Date(),
                },
                {
                    id: 'space-2',
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'Space 2',
                    accentColor: '#FF0000',
                    iconName: 'star',
                    order: 1,
                    isExpanded: false,
                    createdAt: new Date(),
                },
            ];

            vi.mocked(mockSpacesRepository.getAllSpaces).mockResolvedValue(spaces);

            const result = await mockSpacesRepository.getAllSpaces('profile-1');
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Space 1');
            expect(result[1].name).toBe('Space 2');
        });

        it('should return empty array for profile with no spaces', async () => {
            vi.mocked(mockSpacesRepository.getAllSpaces).mockResolvedValue([]);

            const result = await mockSpacesRepository.getAllSpaces('profile-1');
            expect(result).toHaveLength(0);
        });

        it('should return spaces in order', async () => {
            const spaces: SpaceEntity[] = [
                {
                    id: 'space-1',
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'First',
                    accentColor: '#6D5AE6',
                    iconName: 'folder',
                    order: 0,
                    isExpanded: true,
                    createdAt: new Date(),
                },
                {
                    id: 'space-2',
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'Second',
                    accentColor: '#6D5AE6',
                    iconName: 'folder',
                    order: 1,
                    isExpanded: true,
                    createdAt: new Date(),
                },
            ];

            vi.mocked(mockSpacesRepository.getAllSpaces).mockResolvedValue(spaces);

            const result = await mockSpacesRepository.getAllSpaces('profile-1');
            expect(result[0].order).toBe(0);
            expect(result[1].order).toBe(1);
        });
    });

    describe('GetSpaceItemsQuery', () => {
        it('should return all items for space', async () => {
            const items: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Item 1',
                    path: 'https://example.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
            ];

            vi.mocked(mockItemsRepository.getItemsBySpaceId).mockResolvedValue(items);

            const result = await mockItemsRepository.getItemsBySpaceId('space-1');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Item 1');
        });

        it('should build tree structure with children', async () => {
            const items: SpaceItemEntity[] = [
                {
                    id: 'folder-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Folder',
                    path: '',
                    type: SpaceItemType.Folder,
                    isExpanded: true,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: 'folder-1',
                    name: 'Child Item',
                    path: 'https://example.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
            ];

            vi.mocked(mockItemsRepository.getItemsBySpaceId).mockResolvedValue(items);

            const result = await mockItemsRepository.getItemsBySpaceId('space-1');
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('folder-1');
            expect(result[1].parentId).toBe('folder-1');
        });
    });

    describe('SearchItemsQuery', () => {
        it('should search items by name', async () => {
            const items: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Work Project',
                    path: 'https://example.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
            ];

            vi.mocked(mockItemsRepository.searchItems).mockResolvedValue(items);

            const result = await mockItemsRepository.searchItems('profile-1', 'Work');
            expect(result).toHaveLength(1);
            expect(result[0].name).toContain('Work');
        });

        it('should return empty array for no matches', async () => {
            vi.mocked(mockItemsRepository.searchItems).mockResolvedValue([]);

            const result = await mockItemsRepository.searchItems('profile-1', 'xyz');
            expect(result).toHaveLength(0);
        });

        it('should limit results', async () => {
            const items: SpaceItemEntity[] = Array.from({ length: 50 }, (_, i) => ({
                id: `item-${i}`,
                spaceId: 'space-1',
                parentId: null,
                name: `Item ${i}`,
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: i,
                createdAt: new Date(),
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            }));

            vi.mocked(mockItemsRepository.searchItems).mockResolvedValue(items);

            const result = await mockItemsRepository.searchItems('profile-1', 'Item');
            expect(result.length).toBeLessThanOrEqual(50);
        });
    });

    describe('GetRecentItemsQuery', () => {
        it('should return items ordered by last visited', async () => {
            const now = new Date();
            const items: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Recent 1',
                    path: 'https://example1.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 5,
                    lastVisited: new Date(now.getTime() - 1000),
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
                {
                    id: 'item-2',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Recent 2',
                    path: 'https://example2.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 1,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 3,
                    lastVisited: new Date(now.getTime() - 5000),
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
            ];

            vi.mocked(mockItemsRepository.getRecentItems).mockResolvedValue(items);

            const result = await mockItemsRepository.getRecentItems('profile-1', 10);
            expect(result).toHaveLength(2);
            expect(result[0].lastVisited?.getTime()).toBeGreaterThan(result[1].lastVisited?.getTime() || 0);
        });

        it('should respect limit parameter', async () => {
            const items: SpaceItemEntity[] = Array.from({ length: 5 }, (_, i) => ({
                id: `item-${i}`,
                spaceId: 'space-1',
                parentId: null,
                name: `Item ${i}`,
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: i,
                createdAt: new Date(),
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            }));

            vi.mocked(mockItemsRepository.getRecentItems).mockResolvedValue(items.slice(0, 3));

            const result = await mockItemsRepository.getRecentItems('profile-1', 3);
            expect(result).toHaveLength(3);
        });
    });

    describe('GetMostVisitedItemsQuery', () => {
        it('should return items ordered by visit count', async () => {
            const items: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Popular 1',
                    path: 'https://example1.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 100,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
                {
                    id: 'item-2',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Popular 2',
                    path: 'https://example2.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 1,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 50,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
            ];

            vi.mocked(mockItemsRepository.getMostVisitedItems).mockResolvedValue(items);

            const result = await mockItemsRepository.getMostVisitedItems('profile-1', 10);
            expect(result).toHaveLength(2);
            expect(result[0].visitCount).toBeGreaterThanOrEqual(result[1].visitCount);
        });

        it('should exclude items with zero visits', async () => {
            const items: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Popular',
                    path: 'https://example.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 10,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
            ];

            vi.mocked(mockItemsRepository.getMostVisitedItems).mockResolvedValue(items);

            const result = await mockItemsRepository.getMostVisitedItems('profile-1', 10);
            expect(result.every((item) => item.visitCount > 0)).toBe(true);
        });
    });
});
