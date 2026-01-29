import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateItemMetadataUseCase } from '../../../src/application/use-cases/items/UpdateItemMetadataUseCase';
import type { ISpaceItemsRepository } from '../../../src/domain';
import { SpaceItemType, EntityNotFoundError, ValidationError } from '../../../src/domain';

describe('UpdateItemMetadataUseCase', () => {
    let useCase: UpdateItemMetadataUseCase;
    let mockRepository: ISpaceItemsRepository;

    beforeEach(() => {
        mockRepository = {
            getItemById: vi.fn(),
            updateItem: vi.fn(),
            getItemsBySpaceId: vi.fn(),
            getItemChildren: vi.fn(),
            getPinnedItems: vi.fn(),
            searchItems: vi.fn(),
            getRecentItems: vi.fn(),
            getMostVisitedItems: vi.fn(),
            createItem: vi.fn(),
            deleteItem: vi.fn(),
            deleteItemsBySpaceId: vi.fn(),
            isDuplicateUrl: vi.fn(),
            moveItem: vi.fn(),
            renameItem: vi.fn(),
            reorderItems: vi.fn(),
            pinItem: vi.fn(),
            unpinItem: vi.fn(),
            reorderPins: vi.fn(),
            incrementVisitCount: vi.fn(),
        };
        useCase = new UpdateItemMetadataUseCase(mockRepository);
    });

    const createMockItem = (overrides = {}) => ({
        id: 'item-1',
        spaceId: 'space-1',
        parentId: null,
        name: 'Test Item',
        path: 'https://example.com',
        type: SpaceItemType.Link,
        isExpanded: false,
        sortOrder: 0,
        createdAt: new Date(),
        faviconUrl: 'https://example.com/favicon.ico',
        description: 'Test description',
        visitCount: 0,
        lastVisited: null,
        isPinned: false,
        pinPosition: null,
        localPath: null,
        securityBookmark: null,
        lastSyncedAt: null,
        isWatching: false,
        ...overrides,
    });

    describe('execute()', () => {
        it('should update item name', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                name: 'Updated Name',
            });

            expect(result.name).toBe('Updated Name');
            expect(mockRepository.updateItem).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Updated Name' })
            );
        });

        it('should update item description', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                description: 'New description',
            });

            expect(result.description).toBe('New description');
        });

        it('should update favicon URL', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                faviconUrl: 'https://newdomain.com/favicon.ico',
            });

            expect(result.faviconUrl).toBe('https://newdomain.com/favicon.ico');
        });

        it('should update isExpanded', async () => {
            const mockItem = createMockItem({ isExpanded: false });
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                isExpanded: true,
            });

            expect(result.isExpanded).toBe(true);
        });

        it('should update multiple fields simultaneously', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                name: 'New Name',
                description: 'New Description',
                faviconUrl: 'https://new.com/icon.ico',
                isExpanded: true,
            });

            expect(result.name).toBe('New Name');
            expect(result.description).toBe('New Description');
            expect(result.faviconUrl).toBe('https://new.com/icon.ico');
            expect(result.isExpanded).toBe(true);
        });

        it('should allow setting description to null', async () => {
            const mockItem = createMockItem({ description: 'Existing' });
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                description: null,
            });

            expect(result.description).toBeNull();
        });

        it('should allow setting faviconUrl to null', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                faviconUrl: null,
            });

            expect(result.faviconUrl).toBeNull();
        });

        it('should throw EntityNotFoundError when item does not exist', async () => {
            vi.mocked(mockRepository.getItemById).mockResolvedValue(null);

            await expect(
                useCase.execute({ itemId: 'nonexistent', name: 'Test' })
            ).rejects.toThrow(EntityNotFoundError);
        });

        it('should throw ValidationError for empty name', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);

            await expect(
                useCase.execute({ itemId: 'item-1', name: '' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for whitespace-only name', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);

            await expect(
                useCase.execute({ itemId: 'item-1', name: '   ' })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid favicon URL', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);

            await expect(
                useCase.execute({ itemId: 'item-1', faviconUrl: 'not-a-url' })
            ).rejects.toThrow();
        });

        it('should trim and sanitize name', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                name: '  Trimmed Name  ',
            });

            expect(result.name).toBe('Trimmed Name');
        });

        it('should trim and sanitize description', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                description: '  Trimmed Description  ',
            });

            expect(result.description).toBe('Trimmed Description');
        });

        it('should preserve existing values when not updated', async () => {
            const mockItem = createMockItem({
                name: 'Original Name',
                description: 'Original Description',
                faviconUrl: 'https://original.com/icon.ico',
                isExpanded: true,
            });
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                name: 'New Name',
            });

            expect(result.name).toBe('New Name');
            expect(result.description).toBe('Original Description');
            expect(result.faviconUrl).toBe('https://original.com/icon.ico');
            expect(result.isExpanded).toBe(true);
        });

        it('should handle empty description string as null', async () => {
            const mockItem = createMockItem();
            vi.mocked(mockRepository.getItemById).mockResolvedValue(mockItem);
            vi.mocked(mockRepository.updateItem).mockResolvedValue(undefined);

            const result = await useCase.execute({
                itemId: 'item-1',
                description: '',
            });

            expect(result.description).toBeNull();
        });
    });
});
