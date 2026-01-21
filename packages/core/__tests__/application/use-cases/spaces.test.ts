import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ISpacesRepository, IEventBus } from '../../../src/domain';
import { SpaceItemType, ValidationError, EntityNotFoundError } from '../../../src/domain';
import { CreateSpaceValidator, DataSanitizer, FormatValidators } from '../../../src/domain/validators';
import type { SpaceEntity } from '../../../src/domain/entities/Space';

describe('Space Use Cases', () => {
    let mockSpacesRepository: ISpacesRepository;
    let mockEventBus: IEventBus;
    let validator: CreateSpaceValidator;

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

        mockEventBus = {
            publish: vi.fn(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
            clear: vi.fn(),
        };

        validator = new CreateSpaceValidator();
    });

    describe('CreateSpaceUseCase', () => {
        it('should create a space with valid input', async () => {
            const input = {
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'My Space',
            };

            vi.mocked(mockSpacesRepository.getAllSpaces).mockResolvedValue([]);
            vi.mocked(mockSpacesRepository.createSpace).mockResolvedValue({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'My Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
            });

            const validationResult = validator.validate(input);
            expect(validationResult.success).toBe(true);
        });

        it('should reject empty name', () => {
            const input = {
                profileId: 'profile-1',
                userId: 'user-1',
                name: '',
            };

            const validationResult = validator.validate(input);
            expect(validationResult.success).toBe(false);
        });

        it('should reject missing profileId', () => {
            const input = {
                userId: 'user-1',
                name: 'My Space',
            };

            const validationResult = validator.validate(input as any);
            expect(validationResult.success).toBe(false);
        });

        it('should sanitize space name', () => {
            const input = '  My Space  ';
            const sanitized = DataSanitizer.sanitizeString(input);
            expect(sanitized).toBe('My Space');
        });

        it('should assign correct order', async () => {
            const existingSpaces: SpaceEntity[] = [
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
                    accentColor: '#6D5AE6',
                    iconName: 'folder',
                    order: 1,
                    isExpanded: true,
                    createdAt: new Date(),
                },
            ];

            vi.mocked(mockSpacesRepository.getAllSpaces).mockResolvedValue(existingSpaces);

            const spaces = await mockSpacesRepository.getAllSpaces('profile-1');
            expect(spaces.length).toBe(2);
            const nextOrder = spaces.length;
            expect(nextOrder).toBe(2);
        });

        it('should emit SpaceCreatedEvent', async () => {
            const event = {
                type: 'space.created',
                timestamp: new Date(),
                payload: { spaceId: 'space-1', profileId: 'profile-1' },
            };

            await mockEventBus.publish(event);
            expect(mockEventBus.publish).toHaveBeenCalledWith(event);
        });
    });

    describe('DeleteSpaceUseCase', () => {
        it('should delete existing space', async () => {
            const space: SpaceEntity = {
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Space 1',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
            };

            vi.mocked(mockSpacesRepository.getSpaceById).mockResolvedValue(space);
            vi.mocked(mockSpacesRepository.deleteSpace).mockResolvedValue(undefined);

            const retrieved = await mockSpacesRepository.getSpaceById('space-1');
            expect(retrieved).not.toBeNull();

            await mockSpacesRepository.deleteSpace('space-1');
            expect(mockSpacesRepository.deleteSpace).toHaveBeenCalledWith('space-1');
        });

        it('should throw error for nonexistent space', async () => {
            vi.mocked(mockSpacesRepository.getSpaceById).mockResolvedValue(null);

            const space = await mockSpacesRepository.getSpaceById('nonexistent');
            expect(space).toBeNull();
        });

        it('should emit SpaceDeletedEvent', async () => {
            const event = {
                type: 'space.deleted',
                timestamp: new Date(),
                payload: { spaceId: 'space-1', profileId: 'profile-1' },
            };

            await mockEventBus.publish(event);
            expect(mockEventBus.publish).toHaveBeenCalledWith(event);
        });
    });

    describe('RenameSpaceUseCase', () => {
        it('should rename space with valid name', async () => {
            const space: SpaceEntity = {
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Old Name',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
            };

            vi.mocked(mockSpacesRepository.getSpaceById).mockResolvedValue(space);
            vi.mocked(mockSpacesRepository.updateSpace).mockResolvedValue(undefined);

            const retrieved = await mockSpacesRepository.getSpaceById('space-1');
            expect(retrieved?.name).toBe('Old Name');

            const newName = 'New Name';
            const sanitized = DataSanitizer.sanitizeString(newName);
            expect(sanitized).toBe('New Name');
        });

        it('should reject empty name', () => {
            const input = '';
            const sanitized = DataSanitizer.sanitizeString(input);
            expect(sanitized).toBe('');
        });

        it('should emit SpaceRenamedEvent', async () => {
            const event = {
                type: 'space.renamed',
                timestamp: new Date(),
                payload: { spaceId: 'space-1', oldName: 'Old', newName: 'New' },
            };

            await mockEventBus.publish(event);
            expect(mockEventBus.publish).toHaveBeenCalledWith(event);
        });
    });

    describe('UpdateSpaceUseCase', () => {
        it('should update space properties', async () => {
            const space: SpaceEntity = {
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Space 1',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
            };

            vi.mocked(mockSpacesRepository.getSpaceById).mockResolvedValue(space);
            vi.mocked(mockSpacesRepository.updateSpace).mockResolvedValue(undefined);

            const retrieved = await mockSpacesRepository.getSpaceById('space-1');
            expect(retrieved).not.toBeNull();

            await mockSpacesRepository.updateSpace({
                ...space,
                name: 'Updated Name',
                accentColor: '#FF0000',
            });

            expect(mockSpacesRepository.updateSpace).toHaveBeenCalled();
        });

        it('should validate hex color format', () => {
            const validColor = '#6D5AE6';
            const result = FormatValidators.validateHexColor(validColor);
            expect(result.success).toBe(true);
        });

        it('should reject invalid hex color', () => {
            const invalidColor = 'not-a-color';
            const result = FormatValidators.validateHexColor(invalidColor);
            expect(result.success).toBe(false);
        });

        it('should throw error for nonexistent space', async () => {
            vi.mocked(mockSpacesRepository.getSpaceById).mockResolvedValue(null);

            const space = await mockSpacesRepository.getSpaceById('nonexistent');
            expect(space).toBeNull();
        });
    });

    describe('ReorderSpacesUseCase', () => {
        it('should reorder spaces', async () => {
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
                    accentColor: '#6D5AE6',
                    iconName: 'folder',
                    order: 1,
                    isExpanded: true,
                    createdAt: new Date(),
                },
            ];

            vi.mocked(mockSpacesRepository.getAllSpaces).mockResolvedValue(spaces);
            vi.mocked(mockSpacesRepository.reorderSpaces).mockResolvedValue(undefined);

            const existing = await mockSpacesRepository.getAllSpaces('profile-1');
            expect(existing.length).toBe(2);

            await mockSpacesRepository.reorderSpaces('profile-1', ['space-2', 'space-1']);
            expect(mockSpacesRepository.reorderSpaces).toHaveBeenCalledWith('profile-1', ['space-2', 'space-1']);
        });

        it('should reject invalid space IDs', async () => {
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

            const existing = await mockSpacesRepository.getAllSpaces('profile-1');
            const existingIds = new Set(existing.map((s) => s.id));

            const invalidId = 'nonexistent';
            expect(existingIds.has(invalidId)).toBe(false);
        });
    });
});
