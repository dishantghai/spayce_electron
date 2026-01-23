import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { InvalidationProvider, useInvalidation } from '../../../src/hooks/common/InvalidationContext';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { IEventBus, DomainEvent } from '@spayce/core';

vi.mock('@spayce/infrastructure', async () => {
    const actual = await vi.importActual('@spayce/infrastructure');
    return {
        ...actual,
        serviceRegistry: {
            get: vi.fn(),
        },
    };
});

describe('InvalidationProvider with Event Bus Integration', () => {
    let mockEventBus: {
        subscribe: ReturnType<typeof vi.fn>;
        unsubscribe: ReturnType<typeof vi.fn>;
        publish: ReturnType<typeof vi.fn>;
    };
    let eventHandlers: Map<string, (event: DomainEvent) => Promise<void>>;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <InvalidationProvider>{children}</InvalidationProvider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        eventHandlers = new Map();

        mockEventBus = {
            subscribe: vi.fn((eventType: string, handler: (event: DomainEvent) => Promise<void>) => {
                eventHandlers.set(eventType, handler);
            }),
            unsubscribe: vi.fn(),
            publish: vi.fn(),
        };

        vi.mocked(serviceRegistry.get).mockImplementation((key: string) => {
            if (key === SERVICE_KEYS.EVENT_BUS) {
                return mockEventBus as unknown as IEventBus;
            }
            throw new Error(`Unknown service key: ${key}`);
        });
    });

    describe('Integration', () => {
        it('should connect to event bus when provider mounts', () => {
            renderHook(() => useInvalidation(), { wrapper });

            expect(serviceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.EVENT_BUS);
            expect(mockEventBus.subscribe).toHaveBeenCalled();
        });

        it('should trigger invalidation callback when domain event is published', async () => {
            const invalidationCallback = vi.fn();

            const { result } = renderHook(() => useInvalidation(), { wrapper });

            result.current.subscribe('spaces', invalidationCallback);

            const handler = eventHandlers.get('space.created');
            expect(handler).toBeDefined();

            const event: DomainEvent = {
                type: 'space.created',
                timestamp: new Date(),
                payload: { spaceId: 'space-1', profileId: 'profile-1' },
            };

            await handler!(event);

            await waitFor(() => {
                expect(invalidationCallback).toHaveBeenCalled();
            });
        });

        it('should trigger multiple callbacks for same invalidation key', async () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            const { result } = renderHook(() => useInvalidation(), { wrapper });

            result.current.subscribe('space-items', callback1);
            result.current.subscribe('space-items', callback2);

            const handler = eventHandlers.get('space-item.created');
            expect(handler).toBeDefined();

            const event: DomainEvent = {
                type: 'space-item.created',
                timestamp: new Date(),
                payload: { itemId: 'item-1', spaceId: 'space-1' },
            };

            await handler!(event);

            await waitFor(() => {
                expect(callback1).toHaveBeenCalled();
                expect(callback2).toHaveBeenCalled();
            });
        });

        it('should invalidate multiple keys for item deletion', async () => {
            const spaceItemsCallback = vi.fn();
            const pinnedItemsCallback = vi.fn();
            const recentItemsCallback = vi.fn();

            const { result } = renderHook(() => useInvalidation(), { wrapper });

            result.current.subscribe('space-items', spaceItemsCallback);
            result.current.subscribe('pinned-items', pinnedItemsCallback);
            result.current.subscribe('recent-items', recentItemsCallback);

            const handler = eventHandlers.get('space-item.deleted');
            expect(handler).toBeDefined();

            const event: DomainEvent = {
                type: 'space-item.deleted',
                timestamp: new Date(),
                payload: { itemId: 'item-1', spaceId: 'space-1' },
            };

            await handler!(event);

            await waitFor(() => {
                expect(spaceItemsCallback).toHaveBeenCalled();
                expect(pinnedItemsCallback).toHaveBeenCalled();
                expect(recentItemsCallback).toHaveBeenCalled();
            });
        });

        it('should handle unsubscribe correctly', async () => {
            const callback = vi.fn();

            const { result } = renderHook(() => useInvalidation(), { wrapper });

            const unsubscribe = result.current.subscribe('spaces', callback);

            const handler = eventHandlers.get('space.created');
            expect(handler).toBeDefined();

            const event: DomainEvent = {
                type: 'space.created',
                timestamp: new Date(),
                payload: { spaceId: 'space-1', profileId: 'profile-1' },
            };

            await handler!(event);
            await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

            unsubscribe();

            await handler!(event);
            await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
        });
    });

    describe('Event-to-Key Mapping', () => {
        it('should map space.created to spaces invalidation', async () => {
            const callback = vi.fn();
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            result.current.subscribe('spaces', callback);

            const handler = eventHandlers.get('space.created');
            await handler!({ type: 'space.created', timestamp: new Date(), payload: {} });

            await waitFor(() => expect(callback).toHaveBeenCalled());
        });

        it('should map space-item.pinned to pinned-items invalidation', async () => {
            const callback = vi.fn();
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            result.current.subscribe('pinned-items', callback);

            const handler = eventHandlers.get('space-item.pinned');
            await handler!({ type: 'space-item.pinned', timestamp: new Date(), payload: {} });

            await waitFor(() => expect(callback).toHaveBeenCalled());
        });

        it('should map space-item.moved to space-items invalidation', async () => {
            const callback = vi.fn();
            const { result } = renderHook(() => useInvalidation(), { wrapper });
            result.current.subscribe('space-items', callback);

            const handler = eventHandlers.get('space-item.moved');
            await handler!({ type: 'space-item.moved', timestamp: new Date(), payload: {} });

            await waitFor(() => expect(callback).toHaveBeenCalled());
        });
    });

    // Note: Multiple components sharing the same provider context is tested
    // implicitly through the "trigger multiple callbacks" test above
});
