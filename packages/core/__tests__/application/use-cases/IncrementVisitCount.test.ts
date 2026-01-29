import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IncrementVisitCountUseCase } from '../../../src/application/use-cases/items/IncrementVisitCountUseCase';
import type { ISpaceItemsRepository } from '../../../src/domain';
import { SpaceItemType, EntityNotFoundError } from '../../../src/domain';

describe('IncrementVisitCountUseCase', () => {
    let useCase: IncrementVisitCountUseCase;
    let mockRepository: ISpaceItemsRepository;

    beforeEach(() => {
        mockRepository = {
            getItemById: vi.fn(),
            incrementVisitCount: vi.fn(),
            getItemsBySpaceId: vi.fn(),
            getItemChildren: vi.fn(),
            getPinnedItems: vi.fn(),
            searchItems: vi.fn(),
            getRecentItems: vi.fn(),
            getMostVisitedItems: vi.fn(),
            createItem: vi.fn(),
            updateItem: vi.fn(),
            deleteItem: vi.fn(),
            deleteItemsBySpaceId: vi.fn(),
            isDuplicateUrl: vi.fn(),
            moveItem: vi.fn(),
            renameItem: vi.fn(),
            reorderItems: vi.fn(),
            pinItem: vi.fn(),
            unpinItem: vi.fn(),
            reorderPins: vi.fn(),
        };
        useCase = new IncrementVisitCountUseCase(mockRepository);
    });

    describe('execute()', () => {
        it('should increment visit count for existing item', async () => {
            const mockItem = {
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
                visitCount: 5,
                lastVisited: new Date('2024-01-01'),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.incrementVisitCount).mockResolvedValue(undefined);

            await useCase.execute({ itemId: 'item-1' });

            expect(mockRepository.getItemById).toHaveBeenCalledWith('item-1');
            expect(mockRepository.incrementVisitCount).toHaveBeenCalledWith('item-1');
        });

        it('should throw EntityNotFoundError when item does not exist', async () => {
            vi.mocked(mockRepository.getItemById).mockResolvedValue(null);

            await expect(
                useCase.execute({ itemId: 'nonexistent' })
            ).rejects.toThrow(EntityNotFoundError);

            expect(mockRepository.getItemById).toHaveBeenCalledWith('nonexistent');
            expect(mockRepository.incrementVisitCount).not.toHaveBeenCalled();
        });

        it('should handle repository errors', async () => {
            const mockItem = {
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test',
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

            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.incrementVisitCount).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                useCase.execute({ itemId: 'item-1' })
            ).rejects.toThrow('Database error');
        });

        it('should work with different item types', async () => {
            const folderItem = {
                id: 'folder-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test Folder',
                path: '',
                type: SpaceItemType.Folder,
                isExpanded: true,
                sortOrder: 0,
                createdAt: new Date(),
                faviconUrl: null,
                description: null,
                visitCount: 10,
                lastVisited: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            vi.mocked(mockRepository.getItemById).mockResolvedValue(folderItem);
            vi.mocked(mockRepository.incrementVisitCount).mockResolvedValue(undefined);

            await useCase.execute({ itemId: 'folder-1' });

            expect(mockRepository.incrementVisitCount).toHaveBeenCalledWith('folder-1');
        });
    });
});
