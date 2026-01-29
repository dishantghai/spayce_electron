import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock serviceRegistry
const mockReorderPins = vi.fn();
vi.mock('@spayce/infrastructure', () => ({
    serviceRegistry: {
        get: vi.fn(() => ({
            reorderPins: mockReorderPins,
        })),
    },
    SERVICE_KEYS: {
        SPACE_ITEMS_FACADE: 'spaceItemsFacade',
    },
}));

// Mock invalidation
const mockInvalidate = vi.fn();
vi.mock('../../../src/hooks/common/InvalidationContext', () => ({
    useInvalidation: () => ({ invalidate: mockInvalidate }),
}));

import { useReorderPins } from '../../../src/hooks/mutations/useReorderPins';

describe('Feature: F022/F023 - useReorderPins Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('mutate (reorderPins)', () => {
        it('should call facade.reorderPins with correct parameters', async () => {
            mockReorderPins.mockResolvedValue({ success: true });

            const { result } = renderHook(() => useReorderPins());

            await act(async () => {
                await result.current.mutate('space-1', ['item-1', 'item-2', 'item-3']);
            });

            expect(mockReorderPins).toHaveBeenCalledWith('space-1', ['item-1', 'item-2', 'item-3']);
        });

        it('should invalidate pinned-items on success', async () => {
            mockReorderPins.mockResolvedValue({ success: true });

            const { result } = renderHook(() => useReorderPins());

            await act(async () => {
                await result.current.mutate('space-1', ['item-1', 'item-2']);
            });

            expect(mockInvalidate).toHaveBeenCalledWith('pinned-items:space-1');
            expect(mockInvalidate).toHaveBeenCalledWith('pinned-items');
        });

        it('should not invalidate on failure', async () => {
            mockReorderPins.mockResolvedValue({ success: false, error: { type: 'system', message: 'Failed' } });

            const { result } = renderHook(() => useReorderPins());

            await act(async () => {
                await result.current.mutate('space-1', ['item-1']);
            });

            expect(mockInvalidate).not.toHaveBeenCalled();
        });

        it('should return true on success', async () => {
            mockReorderPins.mockResolvedValue({ success: true });

            const { result } = renderHook(() => useReorderPins());

            let success;
            await act(async () => {
                success = await result.current.mutate('space-1', ['item-1']);
            });

            expect(success).toBe(true);
        });

        it('should return false on failure', async () => {
            mockReorderPins.mockResolvedValue({ success: false, error: { type: 'system', message: 'Failed' } });

            const { result } = renderHook(() => useReorderPins());

            let success;
            await act(async () => {
                success = await result.current.mutate('space-1', ['item-1']);
            });

            expect(success).toBe(false);
        });

        it('should handle empty array', async () => {
            mockReorderPins.mockResolvedValue({ success: true });

            const { result } = renderHook(() => useReorderPins());

            await act(async () => {
                await result.current.mutate('space-1', []);
            });

            expect(mockReorderPins).toHaveBeenCalledWith('space-1', []);
        });

        it('should handle API errors gracefully', async () => {
            mockReorderPins.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useReorderPins());

            let success;
            await act(async () => {
                success = await result.current.mutate('space-1', ['item-1']);
            });

            expect(success).toBe(false);
            expect(result.current.error).toBeTruthy();
        });
    });
});
