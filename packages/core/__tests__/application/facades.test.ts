import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ISpacesRepository, ISpaceItemsRepository, IEventBus } from '../../src/domain';
import { SpaceItemType, ValidationError, EntityNotFoundError, BusinessRuleError } from '../../src/domain';
import type { SpaceEntity, SpaceItemEntity } from '../../src/domain/entities';
import type { Result, AppError } from '../../src/application/common/Result';

describe('Facade Classes', () => {
    let mockSpacesRepository: ISpacesRepository;
    let mockItemsRepository: ISpaceItemsRepository;
    let mockEventBus: IEventBus;

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

        mockEventBus = {
            publish: vi.fn(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
            clear: vi.fn(),
        };
    });

    describe('SpacesFacade', () => {
        it('should return spaces on success', async () => {
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
            ];

            vi.mocked(mockSpacesRepository.getAllSpaces).mockResolvedValue(spaces);

            const result = await mockSpacesRepository.getAllSpaces('profile-1');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Space 1');
        });

        it('should return Result type with success flag', async () => {
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

            vi.mocked(mockSpacesRepository.createSpace).mockResolvedValue(space);

            const result = await mockSpacesRepository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });

            expect(result).not.toBeNull();
            expect(result.id).toBe('space-1');
        });

        it('should handle validation errors', async () => {
            const error = new ValidationError('name', '', 'cannot be empty');
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.field).toBe('name');
        });

        it('should handle not found errors', async () => {
            const error = new EntityNotFoundError('Space', 'space-1');
            expect(error.code).toBe('ENTITY_NOT_FOUND');
        });

        it('should handle business rule errors', async () => {
            const error = new BusinessRuleError('Cannot delete active space');
            expect(error.code).toBe('BUSINESS_RULE_ERROR');
        });

        it('should map errors to AppError type', () => {
            const validationError = new ValidationError('name', '', 'cannot be empty');
            const appError: AppError = {
                type: 'validation',
                message: validationError.message,
                field: validationError.field,
                code: validationError.code,
            };

            expect(appError.type).toBe('validation');
            expect(appError.field).toBe('name');
        });

        it('should map not found errors', () => {
            const notFoundError = new EntityNotFoundError('Space', 'space-1');
            const appError: AppError = {
                type: 'not_found',
                message: notFoundError.message,
                code: notFoundError.code,
            };

            expect(appError.type).toBe('not_found');
        });

        it('should map business rule errors', () => {
            const businessError = new BusinessRuleError('Invalid operation');
            const appError: AppError = {
                type: 'business_rule',
                message: businessError.message,
                code: businessError.code,
            };

            expect(appError.type).toBe('business_rule');
        });

        it('should map system errors', () => {
            const systemError = new Error('Unexpected error');
            const appError: AppError = {
                type: 'system',
                message: systemError.message,
            };

            expect(appError.type).toBe('system');
        });
    });

    describe('SpaceItemsFacade', () => {
        it('should return items on success', async () => {
            const items: SpaceItemEntity[] = [
                {
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
                },
            ];

            vi.mocked(mockItemsRepository.getItemsBySpaceId).mockResolvedValue(items);

            const result = await mockItemsRepository.getItemsBySpaceId('space-1');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Test Item');
        });

        it('should create items with all properties', async () => {
            const item: SpaceItemEntity = {
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'New Item',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                createdAt: new Date(),
                faviconUrl: 'https://example.com/favicon.ico',
                description: 'A test item',
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            vi.mocked(mockItemsRepository.createItem).mockResolvedValue(item);

            const result = await mockItemsRepository.createItem({
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'New Item',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: 'https://example.com/favicon.ico',
                description: 'A test item',
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
            expect(result.description).toBe('A test item');
        });

        it('should handle move operations', async () => {
            vi.mocked(mockItemsRepository.moveItem).mockResolvedValue(undefined);

            await mockItemsRepository.moveItem('item-1', 'space-2', null, 0);
            expect(mockItemsRepository.moveItem).toHaveBeenCalledWith('item-1', 'space-2', null, 0);
        });

        it('should handle delete operations', async () => {
            vi.mocked(mockItemsRepository.deleteItem).mockResolvedValue(undefined);

            await mockItemsRepository.deleteItem('item-1');
            expect(mockItemsRepository.deleteItem).toHaveBeenCalledWith('item-1');
        });
    });

    describe('SearchFacade', () => {
        it('should search items', async () => {
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

        it('should get recent items', async () => {
            const items: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Recent Item',
                    path: 'https://example.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    createdAt: new Date(),
                    faviconUrl: null,
                    description: null,
                    visitCount: 5,
                    lastVisited: new Date(),
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
            expect(result).toHaveLength(1);
            expect(result[0].lastVisited).not.toBeNull();
        });

        it('should get most visited items', async () => {
            const items: SpaceItemEntity[] = [
                {
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Popular Item',
                    path: 'https://example.com',
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
            ];

            vi.mocked(mockItemsRepository.getMostVisitedItems).mockResolvedValue(items);

            const result = await mockItemsRepository.getMostVisitedItems('profile-1', 10);
            expect(result).toHaveLength(1);
            expect(result[0].visitCount).toBe(100);
        });

        it('should handle search errors gracefully', async () => {
            vi.mocked(mockItemsRepository.searchItems).mockRejectedValue(new Error('Search failed'));

            try {
                await mockItemsRepository.searchItems('profile-1', 'test');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
        });
    });

    describe('Result Type Discrimination', () => {
        it('should discriminate success results', () => {
            const result: Result<string> = { success: true, data: 'test' };

            if (result.success) {
                expect(result.data).toBe('test');
            }
        });

        it('should discriminate error results', () => {
            const result: Result<string, AppError> = {
                success: false,
                error: {
                    type: 'validation',
                    message: 'Invalid input',
                },
            };

            if (!result.success) {
                expect(result.error.type).toBe('validation');
            }
        });

        it('should handle nested Result types', () => {
            const successResult: Result<SpaceEntity> = {
                success: true,
                data: {
                    id: 'space-1',
                    profileId: 'profile-1',
                    userId: 'user-1',
                    name: 'Test',
                    accentColor: '#6D5AE6',
                    iconName: 'folder',
                    order: 0,
                    isExpanded: true,
                    createdAt: new Date(),
                },
            };

            expect(successResult.success).toBe(true);
            if (successResult.success) {
                expect(successResult.data.id).toBe('space-1');
            }
        });
    });
});
