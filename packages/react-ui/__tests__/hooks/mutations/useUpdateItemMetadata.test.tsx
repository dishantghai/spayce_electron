import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdateItemMetadata } from '../../../src/hooks/mutations/useUpdateItemMetadata';
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

describe('useUpdateItemMetadata', () => {
    let mockFacade: Partial<SpaceItemsFacade>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockFacade = {
            updateItemMetadata: vi.fn(),
        };

        vi.mocked(serviceRegistry.get).mockImplementation((key: string) => {
            if (key === SERVICE_KEYS.EVENT_BUS) return mockEventBus;
            return mockFacade as SpaceItemsFacade;
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <InvalidationProvider>{children} </InvalidationProvider>;

    it('should update item metadata successfully', async () => {
        const itemId = 'item-1';
        const metadata = {
            name: 'Updated Name',
            description: 'Updated description',
            faviconUrl: 'https://example.com/favicon.ico',
            isExpanded: true,
        };

        vi.mocked(mockFacade.updateItemMetadata!).mockResolvedValue({
            success: true,
            data: { id: itemId, ...metadata } as any,
        });

        const { result } = renderHook(() => useUpdateItemMetadata(), { wrapper });

        let updateResult: any;
        await act(async () => {
            updateResult = await result.current.mutate(itemId, metadata);
        });

        expect(mockFacade.updateItemMetadata).toHaveBeenCalledWith({ itemId, ...metadata });
        expect(updateResult).toEqual({ id: itemId, ...metadata });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should update partial metadata', async () => {
        const itemId = 'item-1';
        const metadata = { faviconUrl: 'https://example.com/favicon.ico' };

        vi.mocked(mockFacade.updateItemMetadata!).mockResolvedValue({
            success: true,
            data: { id: itemId, ...metadata } as any,
        });

        const { result } = renderHook(() => useUpdateItemMetadata(), { wrapper });

        await act(async () => {
            await result.current.mutate(itemId, metadata);
        });

        expect(mockFacade.updateItemMetadata).toHaveBeenCalledWith({ itemId, ...metadata });
    });

    it('should handle null values in metadata', async () => {
        const itemId = 'item-1';
        const metadata = {
            description: null,
            faviconUrl: null,
        };

        vi.mocked(mockFacade.updateItemMetadata!).mockResolvedValue({
            success: true,
            data: { id: itemId, ...metadata } as any,
        });

        const { result } = renderHook(() => useUpdateItemMetadata(), { wrapper });

        await act(async () => {
            await result.current.mutate(itemId, metadata);
        });

        expect(mockFacade.updateItemMetadata).toHaveBeenCalledWith({ itemId, ...metadata });
    });

    it('should handle update failure', async () => {
        const itemId = 'item-1';
        const metadata = { name: 'New Name' };
        const error = { type: 'validation' as const, message: 'Invalid metadata' };

        vi.mocked(mockFacade.updateItemMetadata!).mockResolvedValue({
            success: false,
            error,
        });

        const { result } = renderHook(() => useUpdateItemMetadata(), { wrapper });

        await act(async () => {
            const updateResult = await result.current.mutate(itemId, metadata);
            expect(updateResult).toBe(null);
        });

        expect(result.current.error).toEqual(error);
    });

    it('should handle system errors', async () => {
        const itemId = 'item-1';
        const metadata = { name: 'New Name' };

        vi.mocked(mockFacade.updateItemMetadata!).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useUpdateItemMetadata(), { wrapper });

        await act(async () => {
            const updateResult = await result.current.mutate(itemId, metadata);
            expect(updateResult).toBe(null);
        });

        expect(result.current.error).toEqual({
            type: 'system',
            message: 'Network error',
        });
    });

    it('should set loading state during operation', async () => {
        const itemId = 'item-1';
        const metadata = { name: 'New Name' };

        vi.mocked(mockFacade.updateItemMetadata!).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: {} as any }), 100))
        );

        const { result } = renderHook(() => useUpdateItemMetadata(), { wrapper });

        expect(result.current.loading).toBe(false);

        act(() => {
            result.current.mutate(itemId, metadata);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(true);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, { timeout: 200 });
    });
});
