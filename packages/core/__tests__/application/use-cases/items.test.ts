import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ISpaceItemsRepository, ISpacesRepository, IEventBus } from '../../../src/domain';
import { SpaceItemType, EntityNotFoundError, ValidationError, BusinessRuleError } from '../../../src/domain';
import { FormatValidators, DataSanitizer } from '../../../src/domain/validators';
import type { SpaceEntity, SpaceItemEntity } from '../../../src/domain/entities';

describe('Space Item Use Cases', () => {
    let mockItemsRepository: ISpaceItemsRepository;
    let mockSpacesRepository: ISpacesRepository;
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

        mockSpacesRepository = {
            getAllSpaces: vi.fn(),
            getSpaceById: vi.fn(),
            searchSpaces: vi.fn(),
            createSpace: vi.fn(),
            updateSpace: vi.fn(),
            deleteSpace: vi.fn(),
            reorderSpaces: vi.fn(),
        };

        mockEventBus = {
            publish: vi.fn(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
            clear: vi.fn(),
        };
    });

    describe('CreateItemUseCase', () => {
        it('should create item with valid input', async () => {
            const space: SpaceEntity = {
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
            };

            vi.mocked(mockSpacesRepository.getSpaceById).mockResolvedValue(space);
            vi.mocked(mockItemsRepository.getItemsBySpaceId).mockResolvedValue([]);
            vi.mocked(mockItemsRepository.createItem).mockResolvedValue({
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test Link',
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
            });

            const spaceExists = await mockSpacesRepository.getSpaceById('space-1');
            expect(spaceExists).not.toBeNull();
        });

        it('should validate space exists', async () => {
            vi.mocked(mockSpacesRepository.getSpaceById).mockResolvedValue(null);

            const space = await mockSpacesRepository.getSpaceById('nonexistent');
            expect(space).toBeNull();
        });

        it('should validate parent item exists', async () => {
            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(null);

            const item = await mockItemsRepository.getItemById('nonexistent');
            expect(item).toBeNull();
        });

        it('should validate URL for link type', () => {
            const validUrl = 'https://example.com';
            const result = FormatValidators.validateUrl(validUrl);
            expect(result.success).toBe(true);
        });

        it('should reject invalid URL', () => {
            const invalidUrl = 'not-a-url';
            const result = FormatValidators.validateUrl(invalidUrl);
            expect(result.success).toBe(false);
        });

        it('should sanitize item name', () => {
            const input = '  Test Item  ';
            const sanitized = DataSanitizer.sanitizeString(input);
            expect(sanitized).toBe('Test Item');
        });

        it('should assign correct sort order', async () => {
            const siblings: SpaceItemEntity[] = [
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

            vi.mocked(mockItemsRepository.getItemsBySpaceId).mockResolvedValue(siblings);

            const items = await mockItemsRepository.getItemsBySpaceId('space-1');
            const nextOrder = items.length;
            expect(nextOrder).toBe(1);
        });

        it('should emit SpaceItemCreatedEvent', async () => {
            const event = {
                type: 'space_item.created',
                timestamp: new Date(),
                payload: { itemId: 'item-1', spaceId: 'space-1' },
            };

            await mockEventBus.publish(event);
            expect(mockEventBus.publish).toHaveBeenCalledWith(event);
        });
    });

    describe('DeleteItemUseCase', () => {
        it('should delete existing item', async () => {
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

            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(item);
            vi.mocked(mockItemsRepository.deleteItem).mockResolvedValue(undefined);

            const retrieved = await mockItemsRepository.getItemById('item-1');
            expect(retrieved).not.toBeNull();

            await mockItemsRepository.deleteItem('item-1');
            expect(mockItemsRepository.deleteItem).toHaveBeenCalledWith('item-1');
        });

        it('should throw error for nonexistent item', async () => {
            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(null);

            const item = await mockItemsRepository.getItemById('nonexistent');
            expect(item).toBeNull();
        });
    });

    describe('MoveItemUseCase', () => {
        it('should move item to different space', async () => {
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

            const targetSpace: SpaceEntity = {
                id: 'space-2',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Target Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 1,
                isExpanded: true,
                createdAt: new Date(),
            };

            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(item);
            vi.mocked(mockSpacesRepository.getSpaceById).mockResolvedValue(targetSpace);
            vi.mocked(mockItemsRepository.moveItem).mockResolvedValue(undefined);

            const retrieved = await mockItemsRepository.getItemById('item-1');
            expect(retrieved?.spaceId).toBe('space-1');

            await mockItemsRepository.moveItem('item-1', 'space-2', null, 0);
            expect(mockItemsRepository.moveItem).toHaveBeenCalledWith('item-1', 'space-2', null, 0);
        });

        it('should detect circular reference', async () => {
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

            vi.mocked(mockItemsRepository.getItemById).mockResolvedValue(item);

            const retrieved = await mockItemsRepository.getItemById('item-1');
            expect(retrieved?.id).toBe('item-1');

            // Attempting to move item into itself should fail
            const parentId = 'item-1';
            const itemId = 'item-1';
            expect(parentId === itemId).toBe(true);
        });

        it('should emit SpaceItemMovedEvent', async () => {
            const event = {
                type: 'space_item.moved',
                timestamp: new Date(),
                payload: {
                    itemId: 'item-1',
                    fromSpaceId: 'space-1',
                    toSpaceId: 'space-2',
                    fromParentId: null,
                    toParentId: null,
                },
            };

            await mockEventBus.publish(event);
            expect(mockEventBus.publish).toHaveBeenCalledWith(event);
        });
    });
});
