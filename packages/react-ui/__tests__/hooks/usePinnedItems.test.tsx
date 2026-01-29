import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePinnedItems } from '../../src/hooks/usePinnedItems';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import { SpaceItemType } from '@spayce/core';
import { InvalidationProvider } from '../../src/hooks/common/InvalidationContext';

vi.mock('@spayce/infrastructure', () => ({
    serviceRegistry: {
        get: vi.fn(),
    },
    SERVICE_KEYS: {
        SPACE_ITEMS_FACADE: 'SPACE_ITEMS_FACADE',
    },
}));

describe('usePinnedItems', () => {
    const mockSpaceId = 'space-1';
    const mockPinnedItems = [
        {
            id: 'item-1',
            spaceId: mockSpaceId,
            parentId: null,
            name: 'Pinned Link 1',
            path: 'https://example1.com',
            type: SpaceItemType.Link,
            isExpanded: false,
            sortOrder: 0,
            createdAt: new Date(),
            faviconUrl: 'https://example1.com/favicon.ico',
            description: null,
            visitCount: 10,
            lastVisited: new Date(),
            isPinned: true,
            pinPosition: 0,
            localPath: null,
            securityBookmark: null,
            lastSyncedAt: null,
            isWatching: false,
        },
        {
            id: 'item-2',
            spaceId: mockSpaceId,
            parentId: null,
            name: 'Pinned Link 2',
            path: 'https://example2.com',
            type: SpaceItemType.Link,
            isExpanded: false,
            sortOrder: 1,
            createdAt: new Date(),
            faviconUrl: null,
            description: null,
            visitCount: 5,
            lastVisited: new Date(),
            isPinned: true,
            pinPosition: 1,
            localPath: null,
            securityBookmark: null,
            lastSyncedAt: null,
            isWatching: false,
        },
    ];

    const mockFacade = {
        getPinnedItems: vi.fn(),
        pinItem: vi.fn(),
        unpinItem: vi.fn(),
        reorderPins: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <InvalidationProvider>{children}</InvalidationProvider>
    );

    beforeEach(() => {
        vi.mocked(serviceRegistry.get).mockReturnValue(mockFacade);
        mockFacade.getPinnedItems.mockResolvedValue({
            success: true,
            data: mockPinnedItems,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initial load', () => {
        it('should fetch pinned items on mount', async () => {
            const { result } = renderHook(() => usePinnedItems(mockSpaceId), { wrapper });

            expect(result.current.loading).toBe(true);
            expect(result.current.data).toBeNull();

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(mockPinnedItems);
            expect(result.current.error).toBeNull();
            expect(mockFacade.getPinnedItems).toHaveBeenCalledWith(mockSpaceId);
        });

        it('should handle empty pinned items', async () => {
            mockFacade.getPinnedItems.mockResolvedValue({
                success: true,
                data: [],
            });

            const { result } = renderHook(() => usePinnedItems(mockSpaceId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual([]);
        });

        it('should preserve pin position ordering', async () => {
            const { result } = renderHook(() => usePinnedItems(mockSpaceId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data?.[0].pinPosition).toBe(0);
            expect(result.current.data?.[1].pinPosition).toBe(1);
        });
    });

    describe('error handling', () => {
        it('should handle facade error response', async () => {
            mockFacade.getPinnedItems.mockResolvedValue({
                success: false,
                error: {
                    code: 'FETCH_ERROR',
                    message: 'Failed to fetch pinned items',
                },
            });

            const { result } = renderHook(() => usePinnedItems(mockSpaceId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBeTruthy();
            expect(result.current.data).toBeNull();
        });

        it('should handle network errors', async () => {
            mockFacade.getPinnedItems.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => usePinnedItems(mockSpaceId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error?.message).toBe('Network error');
        });
    });

    describe('refetch', () => {
        it('should refetch pinned items when refetch is called', async () => {
            const { result } = renderHook(() => usePinnedItems(mockSpaceId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            mockFacade.getPinnedItems.mockClear();

            await result.current.refetch();

            expect(mockFacade.getPinnedItems).toHaveBeenCalledWith(mockSpaceId);
        });
    });

    describe('space ID changes', () => {
        it('should refetch when space ID changes', async () => {
            const { result, rerender } = renderHook(
                ({ spaceId }) => usePinnedItems(spaceId),
                { initialProps: { spaceId: 'space-1' }, wrapper }
            );

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            mockFacade.getPinnedItems.mockClear();

            rerender({ spaceId: 'space-2' });

            await waitFor(() => {
                expect(mockFacade.getPinnedItems).toHaveBeenCalledWith('space-2');
            });
        });
    });

    describe('max pins (15)', () => {
        it('should handle maximum pinned items', async () => {
            const maxPins = Array.from({ length: 15 }, (_, i) => ({
                id: `item-${i}`,
                spaceId: mockSpaceId,
                parentId: null,
                name: `Pin ${i}`,
                path: `https://example${i}.com`,
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: i,
                createdAt: new Date(),
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: true,
                pinPosition: i,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            }));

            mockFacade.getPinnedItems.mockResolvedValue({
                success: true,
                data: maxPins,
            });

            const { result } = renderHook(() => usePinnedItems(mockSpaceId), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data?.length).toBe(15);
        });
    });
});
