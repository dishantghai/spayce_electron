import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReorderPins } from '../../../src/hooks/mutations/useReorderPins';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { SpaceItemsFacade } from '@spayce/core/application';
import { InvalidationProvider } from '../../../src/hooks/common/InvalidationContext';

const mockEventBus = {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    publish: vi.fn(),
};

vi.mock('@spayce/infrastructure', async () => {
    const actual = await vi.importActual('@spayce/infrastructure');
    return {
        ...actual,
        serviceRegistry: {
            get: vi.fn(),
        },
    };
});

describe('useReorderPins', () => {
    let mockFacade: Partial<SpaceItemsFacade>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockFacade = {
            reorderPins: vi.fn(),
        };

        vi.mocked(serviceRegistry.get).mockImplementation((key: string) => {
            if (key === SERVICE_KEYS.EVENT_BUS) return mockEventBus;
            return mockFacade as SpaceItemsFacade;
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <InvalidationProvider>{children} </InvalidationProvider>;

    it('should reorder pins successfully', async () => {
        const spaceId = 'space-1';
        const orderedItemIds = ['item-1', 'item-2', 'item-3'];

        vi.mocked(mockFacade.reorderPins!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderPins(), { wrapper });

        await act(async () => {
            await result.current.mutate(spaceId, orderedItemIds);
        });

        expect(mockFacade.reorderPins).toHaveBeenCalledWith(spaceId, orderedItemIds);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should handle empty pins list', async () => {
        const spaceId = 'space-1';
        const orderedItemIds: string[] = [];

        vi.mocked(mockFacade.reorderPins!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderPins(), { wrapper });

        await act(async () => {
            await result.current.mutate(spaceId, orderedItemIds);
        });

        expect(mockFacade.reorderPins).toHaveBeenCalledWith(spaceId, orderedItemIds);
    });

    it('should handle reorder failure', async () => {
        const spaceId = 'space-1';
        const orderedItemIds = ['item-1', 'item-2'];
        const error = { type: 'validation' as const, message: 'Invalid pin order' };

        vi.mocked(mockFacade.reorderPins!).mockResolvedValue({
            success: false,
            error,
        });

        const { result } = renderHook(() => useReorderPins(), { wrapper });

        await act(async () => {
            const reorderResult = await result.current.mutate(spaceId, orderedItemIds);
            expect(reorderResult).toBe(false);
        });

        expect(result.current.error).toEqual(error);
    });

    it('should handle system errors', async () => {
        const spaceId = 'space-1';
        const orderedItemIds = ['item-1', 'item-2'];

        vi.mocked(mockFacade.reorderPins!).mockRejectedValue(new Error('Database error'));

        const { result } = renderHook(() => useReorderPins(), { wrapper });

        await act(async () => {
            const reorderResult = await result.current.mutate(spaceId, orderedItemIds);
            expect(reorderResult).toBe(false);
        });

        expect(result.current.error).toEqual({
            type: 'system',
            message: 'Database error',
        });
    });

    it('should return success boolean', async () => {
        const spaceId = 'space-1';
        const orderedItemIds = ['item-1', 'item-2', 'item-3'];

        vi.mocked(mockFacade.reorderPins!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderPins(), { wrapper });

        let reorderResult: any;
        await act(async () => {
            reorderResult = await result.current.mutate(spaceId, orderedItemIds);
        });

        expect(reorderResult).toBe(true);
    });

    it('should handle single pin', async () => {
        const spaceId = 'space-1';
        const orderedItemIds = ['item-1'];

        vi.mocked(mockFacade.reorderPins!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderPins(), { wrapper });

        await act(async () => {
            await result.current.mutate(spaceId, orderedItemIds);
        });

        expect(mockFacade.reorderPins).toHaveBeenCalledWith(spaceId, orderedItemIds);
    });

    it('should clear previous error on new mutation', async () => {
        const spaceId = 'space-1';

        vi.mocked(mockFacade.reorderPins!).mockResolvedValueOnce({
            success: false,
            error: { type: 'validation', message: 'Error 1' },
        }).mockResolvedValueOnce({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useReorderPins(), { wrapper });

        await act(async () => {
            await result.current.mutate(spaceId, ['item-1']);
        });

        expect(result.current.error).toBeTruthy();

        await act(async () => {
            await result.current.mutate(spaceId, ['item-2']);
        });

        expect(result.current.error).toBe(null);
    });
});
