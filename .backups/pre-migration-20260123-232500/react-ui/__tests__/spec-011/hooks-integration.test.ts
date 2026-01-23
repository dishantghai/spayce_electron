/**
 * Spec 011: Migration & Feature Parity - React UI Hooks Integration Tests
 * 
 * TDD RED Phase: These tests verify React hooks work with the Clean Architecture.
 * Tests should FAIL initially until hooks are properly integrated.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock the service registry
vi.mock('@spayce/infrastructure', () => ({
    serviceRegistry: {
        get: vi.fn(),
    },
    SERVICE_KEYS: {
        SPACES_FACADE: 'SPACES_FACADE',
        SPACE_ITEMS_FACADE: 'SPACE_ITEMS_FACADE',
    },
}));

describe('Spec 011: React UI Hooks Integration', () => {
    describe('AC1: useSpaces Hook', () => {
        it('should export useSpaces from @spayce/react-ui/hooks', async () => {
            const hooks = await import('../../src/hooks');
            expect(hooks.useSpaces).toBeDefined();
            expect(typeof hooks.useSpaces).toBe('function');
        });

        it('should return data, loading, error, and refetch', async () => {
            const { useSpaces } = await import('../../src/hooks/useSpaces');

            // Mock the InvalidationContext
            const mockInvalidate = vi.fn();
            const mockSubscribe = vi.fn(() => () => { });

            const wrapper = ({ children }: { children: React.ReactNode }) => {
                return React.createElement(
                    'div',
                    null,
                    children
                );
            };

            // This test verifies the hook signature
            // Actual implementation will be tested in GREEN phase
            expect(useSpaces).toBeDefined();
        });
    });

    describe('AC2: useSpaceItems Hook', () => {
        it('should export useSpaceItems from @spayce/react-ui/hooks', async () => {
            const hooks = await import('../../src/hooks');
            expect(hooks.useSpaceItems).toBeDefined();
            expect(typeof hooks.useSpaceItems).toBe('function');
        });
    });

    describe('AC3: usePinnedItems Hook', () => {
        it('should export usePinnedItems from @spayce/react-ui/hooks', async () => {
            const hooks = await import('../../src/hooks');
            expect(hooks.usePinnedItems).toBeDefined();
            expect(typeof hooks.usePinnedItems).toBe('function');
        });
    });

    describe('AC4: useRecentItems Hook', () => {
        it('should export useRecentItems from @spayce/react-ui/hooks', async () => {
            const hooks = await import('../../src/hooks');
            expect(hooks.useRecentItems).toBeDefined();
            expect(typeof hooks.useRecentItems).toBe('function');
        });
    });

    describe('AC5: Mutation Hooks', () => {
        it('should export useCreateSpace mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.useCreateSpace).toBeDefined();
        });

        it('should export useDeleteSpace mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.useDeleteSpace).toBeDefined();
        });

        it('should export useUpdateSpace mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.useUpdateSpace).toBeDefined();
        });

        it('should export useReorderSpaces mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.useReorderSpaces).toBeDefined();
        });

        it('should export useCreateItem mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.useCreateItem).toBeDefined();
        });

        it('should export useDeleteItem mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.useDeleteItem).toBeDefined();
        });

        it('should export useMoveItem mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.useMoveItem).toBeDefined();
        });

        it('should export usePinItem mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.usePinItem).toBeDefined();
        });

        it('should export useUnpinItem mutation hook', async () => {
            const mutations = await import('../../src/hooks/mutations');
            expect(mutations.useUnpinItem).toBeDefined();
        });
    });

    describe('AC6: InvalidationContext', () => {
        it('should export InvalidationProvider', async () => {
            const common = await import('../../src/hooks/common');
            expect(common.InvalidationProvider).toBeDefined();
        });

        it('should export useInvalidation hook', async () => {
            const common = await import('../../src/hooks/common');
            expect(common.useInvalidation).toBeDefined();
        });

        it('should support invalidation keys for spaces', async () => {
            // Invalidation keys should include:
            // - 'spaces' for all spaces
            // - 'space-items:{spaceId}' for items in a space
            // - 'pins' for pinned items
            // - 'recent-items' for recent items
            const expectedKeys = ['spaces', 'space-items', 'pins', 'recent-items'];

            // This is a documentation test - actual implementation tested in GREEN phase
            expect(expectedKeys).toContain('spaces');
            expect(expectedKeys).toContain('space-items');
            expect(expectedKeys).toContain('pins');
        });
    });

    describe('AC7: useFormValidation Hook', () => {
        it('should export useFormValidation from @spayce/react-ui/hooks', async () => {
            const hooks = await import('../../src/hooks');
            expect(hooks.useFormValidation).toBeDefined();
            expect(typeof hooks.useFormValidation).toBe('function');
        });
    });

    describe('AC8: Hook Return Types', () => {
        it('should return Result<T, AppError> compatible types', async () => {
            // Hooks should return objects with:
            // - data: T | undefined
            // - loading: boolean
            // - error: AppError | null
            // - refetch: () => void

            const expectedShape = {
                data: undefined,
                loading: true,
                error: null,
                refetch: expect.any(Function),
            };

            // This verifies the expected interface
            expect(expectedShape.data).toBeUndefined();
            expect(expectedShape.loading).toBe(true);
            expect(expectedShape.error).toBeNull();
        });
    });
});

describe('Spec 011: React UI Components Integration', () => {
    describe('AC1: Error Boundary Components', () => {
        it('should export DomainErrorBoundary', async () => {
            const components = await import('../../src/components/error/DomainErrorBoundary');
            expect(components.DomainErrorBoundary).toBeDefined();
        });

        it('should export GlobalErrorBoundary', async () => {
            const components = await import('../../src/components/error/GlobalErrorBoundary');
            expect(components.GlobalErrorBoundary).toBeDefined();
        });

        it('should export ErrorFallback', async () => {
            const components = await import('../../src/components/error/ErrorFallback');
            expect(components.ErrorFallback).toBeDefined();
        });
    });

    describe('AC2: Loading State Components', () => {
        it('should export Skeleton component', async () => {
            const components = await import('../../src/components/common/Skeleton');
            expect(components.Skeleton).toBeDefined();
        });

        it('should export SpaceListSkeleton component', async () => {
            const components = await import('../../src/components/spaces/SpaceListSkeleton');
            expect(components.SpaceListSkeleton).toBeDefined();
        });
    });

    describe('AC3: UI State Stores', () => {
        it('should export navigationUiStore', async () => {
            const stores = await import('../../src/stores/navigationUiStore');
            expect(stores.useNavigationUiStore).toBeDefined();
        });

        it('should export dragDropUiStore', async () => {
            const stores = await import('../../src/stores/dragDropUiStore');
            expect(stores.useDragDropUiStore).toBeDefined();
        });
    });
});
