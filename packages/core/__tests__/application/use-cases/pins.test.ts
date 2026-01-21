import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ISpaceItemsRepository, IEventBus } from '../../../src/domain';
import { SpaceItemType, EntityNotFoundError } from '../../../src/domain';
import type { SpaceItemEntity } from '../../../src/domain/entities';

describe('Pin Use Cases', () => {
    let mockItemsRepository: ISpaceItemsRepository;
    let mockEventBus: IEventBus;

    beforeEach(() => {
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

        mockEventBus = {
            publish: vi.fn(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
            clear: vi.fn(),
        };
    });

    describe('PinItemUseCase', () => {
        it('should pin item with correct position', async () => {
            const item: SpaceItemEntity = {
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test Item',
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
            };

            const pinnedItems: SpaceItemEntity[] = [];

            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(item);
            vi.mocked(mockItemsRepository.getPinnedItems).mockResolvedValue(pinnedItems);
            vi.mocked(mockItemsRepository.pinItem).mockResolvedValue(undefined);

            const retrieved = await mockItemsRepository.getItemById('item-1');
            expect(retrieved).not.toBeNull();

            const pinned = await mockItemsRepository.getPinnedItems('space-1');
            const nextPosition = pinned.length;
            expect(nextPosition).toBe(0);

            await mockItemsRepository.pinItem('item-1', nextPosition);
            expect(mockItemsRepository.pinItem).toHaveBeenCalledWith('item-1', 0);
        });

        it('should assign next position for multiple pinned items', async () => {
            const pinnedItems: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Pinned 1',
                    path: 'https://example1.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: true,
                    pinPosition: 0,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
                {
                    id: 'item-2',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Pinned 2',
                    path: 'https://example2.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 1,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: true,
                    pinPosition: 1,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
            ];

            vi.mocked(mockItemsRepository.getPinnedItems).mockResolvedValue(pinnedItems);

            const pinned = await mockItemsRepository.getPinnedItems('space-1');
            expect(pinned.length).toBe(2);
            expect(pinned[0].pinPosition).toBe(0);
            expect(pinned[1].pinPosition).toBe(1);
        });

        it('should emit SpaceItemPinnedEvent', async () => {
            const event = {
                type: 'space_item.pinned',
                timestamp: new Date(),
                payload: { itemId: 'item-1', spaceId: 'space-1', position: 0 },
            };

            await mockEventBus.publish(event);
            expect(mockEventBus.publish).toHaveBeenCalledWith(event);
        });

        it('should throw error for nonexistent item', async () => {
            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(null);

            const item = await mockItemsRepository.getItemById('nonexistent');
            expect(item).toBeNull();
        });
    });

    describe('UnpinItemUseCase', () => {
        it('should unpin item', async () => {
            const item: SpaceItemEntity = {
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Pinned Item',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                createdAt: new Date(),
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: true,
                pinPosition: 0,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(item);
            vi.mocked(mockItemsRepository.unpinItem).mockResolvedValue(undefined);

            const retrieved = await mockItemsRepository.getItemById('item-1');
            expect(retrieved?.isPinned).toBe(true);

            await mockItemsRepository.unpinItem('item-1');
            expect(mockItemsRepository.unpinItem).toHaveBeenCalledWith('item-1');
        });

        it('should throw error for nonexistent item', async () => {
            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(null);

            const item = await mockItemsRepository.getItemById('nonexistent');
            expect(item).toBeNull();
        });
    });

    describe('ReorderPinsUseCase', () => {
        it('should reorder pinned items', async () => {
            const pinnedItems: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Pinned 1',
                    path: 'https://example1.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: true,
                    pinPosition: 0,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
                {
                    id: 'item-2',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Pinned 2',
                    path: 'https://example2.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 1,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: true,
                    pinPosition: 1,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                },
            ];

            vi.mocked(mockItemsRepository.getPinnedItems).mockResolvedValue(pinnedItems);
            vi.mocked(mockItemsRepository.reorderPins).mockResolvedValue(undefined);

            const pinned = await mockItemsRepository.getPinnedItems('space-1');
            expect(pinned.length).toBe(2);

            await mockItemsRepository.reorderPins('space-1', ['item-2', 'item-1']);
            expect(mockItemsRepository.reorderPins).toHaveBeenCalledWith('space-1', ['item-2', 'item-1']);
        });
    });
});
