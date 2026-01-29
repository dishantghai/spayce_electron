import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSpacesQuery } from '../../../src/application/queries/GetSpacesQuery';
import type { ISpacesRepository, SpaceEntity } from '../../../src/domain';

describe('GetSpacesQuery', () => {
    let query: GetSpacesQuery;
    let mockRepository: ISpacesRepository;

    beforeEach(() => {
        mockRepository = {
            getAllSpaces: vi.fn(),
            getSpaceById: vi.fn(),
            searchSpaces: vi.fn(),
            createSpace: vi.fn(),
            updateSpace: vi.fn(),
            deleteSpace: vi.fn(),
            reorderSpaces: vi.fn(),
        };
        query = new GetSpacesQuery(mockRepository);
    });

    const createMockSpace = (id: string, order: number): SpaceEntity => ({
        id,
        profileId: 'profile-1',
        userId: 'user-1',
        name: `Space ${id}`,
        accentColor: '#6D5AE6',
        iconName: 'folder',
        order,
        isExpanded: true,
        createdAt: new Date(),
    });

    describe('execute()', () => {
        it('should retrieve all spaces for a profile', async () => {
            const mockSpaces = [
                createMockSpace('space-1', 0),
                createMockSpace('space-2', 1),
                createMockSpace('space-3', 2),
            ];

            vi.mocked(mockRepository.getAllSpaces).mockResolvedValue(mockSpaces);

            const result = await query.execute({ profileId: 'profile-1' });

            expect(result).toEqual(mockSpaces);
            expect(mockRepository.getAllSpaces).toHaveBeenCalledWith('profile-1');
        });

        it('should return empty array when no spaces exist', async () => {
            vi.mocked(mockRepository.getAllSpaces).mockResolvedValue([]);

            const result = await query.execute({ profileId: 'profile-1' });

            expect(result).toEqual([]);
        });

        it('should preserve space ordering', async () => {
            const mockSpaces = [
                createMockSpace('space-1', 2),
                createMockSpace('space-2', 0),
                createMockSpace('space-3', 1),
            ];

            vi.mocked(mockRepository.getAllSpaces).mockResolvedValue(mockSpaces);

            const result = await query.execute({ profileId: 'profile-1' });

            expect(result[0].order).toBe(2);
            expect(result[1].order).toBe(0);
            expect(result[2].order).toBe(1);
        });

        it('should handle different profile IDs', async () => {
            const profile1Spaces = [createMockSpace('s1', 0)];
            const profile2Spaces = [createMockSpace('s2', 0)];

            vi.mocked(mockRepository.getAllSpaces)
                .mockResolvedValueOnce(profile1Spaces)
                .mockResolvedValueOnce(profile2Spaces);

            const result1 = await query.execute({ profileId: 'profile-1' });
            const result2 = await query.execute({ profileId: 'profile-2' });

            expect(result1).toEqual(profile1Spaces);
            expect(result2).toEqual(profile2Spaces);
        });

        it('should handle repository errors', async () => {
            vi.mocked(mockRepository.getAllSpaces).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                query.execute({ profileId: 'profile-1' })
            ).rejects.toThrow('Database error');
        });
    });
});
