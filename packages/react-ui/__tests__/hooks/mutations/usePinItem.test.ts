import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock serviceRegistry
const mockPinItem = vi.fn();
vi.mock('@spayce/infrastructure', () => ({
    serviceRegistry: {
        get: vi.fn(() => ({
            pinItem: mockPinItem,
        })),
    },
    SERVICE_KEYS: {
        SPACE_ITEMS_REPOSITORY: 'spaceItemsRepository',
    },
}));

// Mock invalidation
const mockInvalidate = vi.fn();
vi.mock('../../../src/hooks/common/InvalidationContext', () => ({
    useInvalidation: () => ({ invalidate: mockInvalidate }),
}));

import { usePinItem } from '../../../src/hooks/mutations/usePinItem';

describe('Feature: F022 - usePinItem Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('mutate (pinItem)', () => {
        it('should call repository.pinItem with correct parameters', async () => {
            mockPinItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => usePinItem());

            await act(async () => {
                await result.current.mutate('item-123', 0, 'space-1');
            });

            expect(mockPinItem).toHaveBeenCalledWith('item-123', 0);
        });

        it('should invalidate pins and space-items on success', async () => {
            mockPinItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => usePinItem());

            await act(async () => {
                await result.current.mutate('item-123', 0, 'space-1');
            });

            expect(mockInvalidate).toHaveBeenCalledWith('pins');
            expect(mockInvalidate).toHaveBeenCalledWith('space-items:space-1');
        });

        it('should return true on success', async () => {
            mockPinItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => usePinItem());

            let success;
            await act(async () => {
                success = await result.current.mutate('item-123', 0);
            });

            expect(success).toBe(true);
        });

        it('should return false and set error on failure', async () => {
            mockPinItem.mockRejectedValue(new Error('Failed to pin'));

            const { result } = renderHook(() => usePinItem());

            let success;
            await act(async () => {
                success = await result.current.mutate('item-123', 0);
            });

            expect(success).toBe(false);
            expect(result.current.error).toBeTruthy();
        });

        it('should set loading state during operation', async () => {
            let resolvePin: (value?: unknown) => void;
            mockPinItem.mockImplementation(() => new Promise(r => { resolvePin = r; }));

            const { result } = renderHook(() => usePinItem());

            expect(result.current.loading).toBe(false);

            // Start mutation without awaiting to check loading state
            act(() => {
                result.current.mutate('item-123', 0);
            });

            // Loading should be true during operation
            expect(result.current.loading).toBe(true);

            await act(async () => {
                resolvePin!(undefined);
            });

            expect(result.current.loading).toBe(false);
        });

        it('should handle pinning at different positions', async () => {
            mockPinItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => usePinItem());

            await act(async () => {
                await result.current.mutate('item-1', 5);
            });

            expect(mockPinItem).toHaveBeenCalledWith('item-1', 5);
        });
    });
});
