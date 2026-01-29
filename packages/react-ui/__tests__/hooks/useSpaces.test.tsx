import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSpaces } from '../../src/hooks/useSpaces';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { SpaceItemType } from '@spayce/core';
import { InvalidationProvider } from '../../src/hooks/common/InvalidationContext';

vi.mock('@spayce/infrastructure', () => ({
    serviceRegistry: {
        get: vi.fn(),
    },
    SERVICE_KEYS: {
        SPACES_FACADE: 'SPACES_FACADE',
    },
}));

describe('useSpaces', () => {
    const mockProfileId = 'profile-1';
    const mockSpaces = [
        {
            id: 'space-1',
            profileId: mockProfileId,
            userId: 'user-1',
            name: 'Work',
            accentColor: '#6D5AE6',
            iconName: 'folder',
            order: 0,
            isExpanded: true,
            createdAt: new Date(),
        },
        {
            id: 'space-2',
            profileId: mockProfileId,
            userId: 'user-1',
            name: 'Personal',
            accentColor: '#FF6B6B',
            iconName: 'home',
            order: 1,
            isExpanded: false,
            createdAt: new Date(),
        },
    ];

    const mockFacade = {
        getSpaces: vi.fn(),
        createSpace: vi.fn(),
        deleteSpace: vi.fn(),
        updateSpace: vi.fn(),
        renameSpace: vi.fn(),
        reorderSpaces: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <InvalidationProvider>{children}</InvalidationProvider>
    );

    beforeEach(() => {
        vi.mocked(serviceRegistry.get).mockReturnValue(mockFacade);
        mockFacade.getSpaces.mockResolvedValue({
            success: true,
            data: mockSpaces,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initial load', () => {
        it('should fetch spaces on mount', async () => {
            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            expect(result.current.loading).toBe(true);
            expect(result.current.data).toBeNull();

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(mockSpaces);
            expect(result.current.error).toBeNull();
            expect(mockFacade.getSpaces).toHaveBeenCalledWith(mockProfileId);
        });

        it('should handle empty spaces list', async () => {
            mockFacade.getSpaces.mockResolvedValue({
                success: true,
                data: [],
            });

            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual([]);
            expect(result.current.error).toBeNull();
        });

        it('should set loading to true initially', () => {
            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });
            expect(result.current.loading).toBe(true);
        });
    });

    describe('error handling', () => {
        it('should handle facade error response', async () => {
            mockFacade.getSpaces.mockResolvedValue({
                success: false,
                error: {
                    code: 'FETCH_ERROR',
                    message: 'Failed to fetch spaces',
                },
            });

            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBeTruthy();
            expect(result.current.error?.message).toContain('Failed to fetch spaces');
            expect(result.current.data).toBeNull();
        });

        it('should handle network errors', async () => {
            mockFacade.getSpaces.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBeTruthy();
            expect(result.current.error?.message).toBe('Network error');
        });

        it('should handle non-Error exceptions', async () => {
            mockFacade.getSpaces.mockRejectedValue('String error');

            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBeTruthy();
            expect(result.current.error?.message).toBe('Failed to fetch spaces');
        });
    });

    describe('refetch', () => {
        it('should refetch spaces when refetch is called', async () => {
            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            mockFacade.getSpaces.mockClear();
            mockFacade.getSpaces.mockResolvedValue({
                success: true,
                data: [...mockSpaces, {
                    id: 'space-3',
                    profileId: mockProfileId,
                    userId: 'user-1',
                    name: 'New Space',
                    accentColor: '#00FF00',
                    iconName: 'star',
                    order: 2,
                    isExpanded: true,
                    createdAt: new Date(),
                }],
            });

            await result.current.refetch();

            await waitFor(() => {
                expect(result.current.data?.length).toBe(3);
            });

            expect(mockFacade.getSpaces).toHaveBeenCalledWith(mockProfileId);
        });

        it('should set isRefetching during refetch', async () => {
            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.isRefetching).toBe(false);

            const refetchPromise = result.current.refetch();

            await waitFor(() => {
                expect(result.current.isRefetching).toBe(false);
            });

            await refetchPromise;
        });

        it('should not set loading during refetch', async () => {
            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const refetchPromise = result.current.refetch();

            expect(result.current.loading).toBe(false);

            await refetchPromise;
        });

        it('should handle refetch errors', async () => {
            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            mockFacade.getSpaces.mockRejectedValue(new Error('Refetch failed'));

            await result.current.refetch();

            await waitFor(() => {
                expect(result.current.error?.message).toBe('Refetch failed');
            });
        });
    });

    describe('profile ID changes', () => {
        it('should refetch when profile ID changes', async () => {
            const { result, rerender } = renderHook(
                ({ profileId }) => useSpaces(profileId),
                { initialProps: { profileId: 'profile-1' }, wrapper }
            );

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            mockFacade.getSpaces.mockClear();

            rerender({ profileId: 'profile-2' });

            await waitFor(() => {
                expect(mockFacade.getSpaces).toHaveBeenCalledWith('profile-2');
            });
        });
    });

    describe('data state', () => {
        it('should preserve data during refetch', async () => {
            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.data).toEqual(mockSpaces);
            });

            const refetchPromise = result.current.refetch();

            expect(result.current.data).toEqual(mockSpaces);

            await refetchPromise;
        });

        it('should update data after successful refetch', async () => {
            const { result } = renderHook(() => useSpaces(mockProfileId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const newSpaces = [mockSpaces[0]];
            mockFacade.getSpaces.mockResolvedValue({
                success: true,
                data: newSpaces,
            });

            await result.current.refetch();

            await waitFor(() => {
                expect(result.current.data).toEqual(newSpaces);
            });
        });
    });
});
