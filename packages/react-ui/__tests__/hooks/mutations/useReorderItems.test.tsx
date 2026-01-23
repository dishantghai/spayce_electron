import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReorderItems } from '../../../src/hooks/mutations/useReorderItems';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade } from '@spayce/core/application';
import { InvalidationProvider } from '../../../src/hooks/common/InvalidationContext';

vi.mock('@spayce/infrastructure', async () => {
    const actual = await vi.importActual('@spayce/infrastructure');
    return {
        ...actual,
        serviceRegistry: {
            get: vi.fn(),
        },
    };
});

describe('useReorderItems', () => {
    let mockFacade: Partial<SpaceItemsFacade>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockFacade = {
            reorderItems: vi.fn(),
        };

        vi.mocked(serviceRegistry.get).mockReturnValue(mockFacade as SpaceItemsFacade);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <InvalidationProvider>{ children } </InvalidationProvider>;

    it('should reorder items successfully', async () => {
        const spaceId = 'space-1';
        const parentId = 'folder-1';
        const orderedItemIds = ['item-1', 'item-2', 'item-3'];

        vi.mocked(mockFacade.reorderItems!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderItems(), { wrapper });

        await act(async () => {
            await result.current.mutate(spaceId, parentId, orderedItemIds);
        });

        expect(mockFacade.reorderItems).toHaveBeenCalledWith({
            spaceId,
            parentId,
            orderedItemIds,
        });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should reorder root level items (null parentId)', async () => {
        const spaceId = 'space-1';
        const parentId = null;
        const orderedItemIds = ['item-1', 'item-2', 'item-3'];

        vi.mocked(mockFacade.reorderItems!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderItems(), { wrapper });

        await act(async () => {
            await result.current.mutate(spaceId, parentId, orderedItemIds);
        });

        expect(mockFacade.reorderItems).toHaveBeenCalledWith({
            spaceId,
            parentId,
            orderedItemIds,
        });
    });

    it('should handle reorder failure', async () => {
        const spaceId = 'space-1';
        const parentId = 'folder-1';
        const orderedItemIds = ['item-1', 'item-2'];
        const error = { type: 'validation' as const, message: 'Invalid order' };

        vi.mocked(mockFacade.reorderItems!).mockResolvedValue({
            success: false,
            error,
        });

        const { result } = renderHook(() => useReorderItems(), { wrapper });

        await act(async () => {
            const reorderResult = await result.current.mutate(spaceId, parentId, orderedItemIds);
            expect(reorderResult).toBe(false);
        });

        expect(result.current.error).toEqual(error);
    });

    it('should handle system errors', async () => {
        const spaceId = 'space-1';
        const parentId = 'folder-1';
        const orderedItemIds = ['item-1', 'item-2'];

        vi.mocked(mockFacade.reorderItems!).mockRejectedValue(new Error('Database error'));

        const { result } = renderHook(() => useReorderItems(), { wrapper });

        await act(async () => {
            const reorderResult = await result.current.mutate(spaceId, parentId, orderedItemIds);
            expect(reorderResult).toBe(false);
        });

        expect(result.current.error).toEqual({
            type: 'system',
            message: 'Database error',
        });
    });

    it('should handle empty item list', async () => {
        const spaceId = 'space-1';
        const parentId = 'folder-1';
        const orderedItemIds: string[] = [];

        vi.mocked(mockFacade.reorderItems!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderItems(), { wrapper });

        await act(async () => {
            await result.current.mutate(spaceId, parentId, orderedItemIds);
        });

        expect(mockFacade.reorderItems).toHaveBeenCalledWith({
            spaceId,
            parentId,
            orderedItemIds,
        });
    });

    it('should return success boolean', async () => {
        const spaceId = 'space-1';
        const parentId = null;
        const orderedItemIds = ['item-1', 'item-2'];

        vi.mocked(mockFacade.reorderItems!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderItems(), { wrapper });

        let reorderResult: any;
        await act(async () => {
            reorderResult = await result.current.mutate(spaceId, parentId, orderedItemIds);
        });

        expect(reorderResult).toBe(true);
    });
});
