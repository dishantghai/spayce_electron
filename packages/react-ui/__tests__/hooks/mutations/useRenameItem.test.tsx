import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRenameItem } from '../../../src/hooks/mutations/useRenameItem';
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

describe('useRenameItem', () => {
    let mockFacade: Partial<SpaceItemsFacade>;
    let mockInvalidate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockInvalidate = vi.fn();

        mockFacade = {
            renameItem: vi.fn(),
        };

        vi.mocked(serviceRegistry.get).mockImplementation((key: string) => {
            if (key === SERVICE_KEYS.EVENT_BUS) return mockEventBus;
            return mockFacade as SpaceItemsFacade;
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <InvalidationProvider>{children} </InvalidationProvider>;

    it('should rename item successfully', async () => {
        const itemId = 'item-1';
        const newName = 'New Item Name';

        vi.mocked(mockFacade.renameItem!).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const { result } = renderHook(() => useRenameItem(), { wrapper });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);

        let renameResult: any;
        await act(async () => {
            renameResult = await result.current.mutate(itemId, newName);
        });

        expect(mockFacade.renameItem).toHaveBeenCalledWith(itemId, newName);
        expect(renameResult).toBe(true);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should handle rename failure', async () => {
        const itemId = 'item-1';
        const newName = 'New Name';
        const error = { type: 'validation' as const, message: 'Name already exists' };

        vi.mocked(mockFacade.renameItem!).mockResolvedValue({
            success: false,
            error,
        });

        const { result } = renderHook(() => useRenameItem(), { wrapper });

        await act(async () => {
            const renameResult = await result.current.mutate(itemId, newName);
            expect(renameResult).toBe(false);
        });

        expect(result.current.error).toEqual(error);
        expect(result.current.loading).toBe(false);
    });

    it('should handle system errors', async () => {
        const itemId = 'item-1';
        const newName = 'New Name';

        vi.mocked(mockFacade.renameItem!).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useRenameItem(), { wrapper });

        await act(async () => {
            const renameResult = await result.current.mutate(itemId, newName);
            expect(renameResult).toBe(false);
        });

        expect(result.current.error).toEqual({
            type: 'system',
            message: 'Network error',
        });
        expect(result.current.loading).toBe(false);
    });

    it('should set loading state during operation', async () => {
        const itemId = 'item-1';
        const newName = 'New Name';

        vi.mocked(mockFacade.renameItem!).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: {} as any }), 100))
        );

        const { result } = renderHook(() => useRenameItem(), { wrapper });

        expect(result.current.loading).toBe(false);

        act(() => {
            result.current.mutate(itemId, newName);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(true);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, { timeout: 200 });
    });

    it('should clear previous error on new mutation', async () => {
        const itemId = 'item-1';

        vi.mocked(mockFacade.renameItem!).mockResolvedValueOnce({
            success: false,
            error: { type: 'validation', message: 'Error 1' },
        }).mockResolvedValueOnce({
            success: true,
            data: {} as any,
        });

        const { result } = renderHook(() => useRenameItem(), { wrapper });

        await act(async () => {
            await result.current.mutate(itemId, 'Name 1');
        });

        expect(result.current.error).toBeTruthy();

        await act(async () => {
            await result.current.mutate(itemId, 'Name 2');
        });

        expect(result.current.error).toBe(null);
    });
});
