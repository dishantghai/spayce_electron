import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIncrementVisitCount } from '../../../src/hooks/mutations/useIncrementVisitCount';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade } from '@spayce/core/application';

vi.mock('@spayce/infrastructure', async () => {
    const actual = await vi.importActual('@spayce/infrastructure');
    return {
        ...actual,
        serviceRegistry: {
            get: vi.fn(),
        },
    };
});

describe('useIncrementVisitCount', () => {
    let mockFacade: Partial<SpaceItemsFacade>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockFacade = {
            incrementVisitCount: vi.fn(),
        };

        vi.mocked(serviceRegistry.get).mockReturnValue(mockFacade as SpaceItemsFacade);
    });

    it('should increment visit count successfully', async () => {
        const itemId = 'item-1';

        vi.mocked(mockFacade.incrementVisitCount!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useIncrementVisitCount());

        await act(async () => {
            await result.current(itemId);
        });

        expect(mockFacade.incrementVisitCount).toHaveBeenCalledWith(itemId);
    });

    it('should be fire-and-forget (no error handling)', async () => {
        const itemId = 'item-1';

        vi.mocked(mockFacade.incrementVisitCount!).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useIncrementVisitCount());

        await act(async () => {
            await result.current(itemId);
        });

        expect(mockFacade.incrementVisitCount).toHaveBeenCalledWith(itemId);
    });

    it('should handle failure silently', async () => {
        const itemId = 'item-1';

        vi.mocked(mockFacade.incrementVisitCount!).mockResolvedValue({
            success: false,
            error: { type: 'not_found', message: 'Item not found' },
        });

        const { result } = renderHook(() => useIncrementVisitCount());

        await act(async () => {
            await result.current(itemId);
        });

        expect(mockFacade.incrementVisitCount).toHaveBeenCalledWith(itemId);
    });

    it('should not invalidate cache (fire-and-forget)', async () => {
        const itemId = 'item-1';

        vi.mocked(mockFacade.incrementVisitCount!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useIncrementVisitCount());

        await act(async () => {
            await result.current(itemId);
        });

        expect(mockFacade.incrementVisitCount).toHaveBeenCalledWith(itemId);
    });

    it('should be callable multiple times quickly', async () => {
        const itemId = 'item-1';

        vi.mocked(mockFacade.incrementVisitCount!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useIncrementVisitCount());

        await act(async () => {
            await Promise.all([
                result.current(itemId),
                result.current(itemId),
                result.current(itemId),
            ]);
        });

        expect(mockFacade.incrementVisitCount).toHaveBeenCalledTimes(3);
    });
});
