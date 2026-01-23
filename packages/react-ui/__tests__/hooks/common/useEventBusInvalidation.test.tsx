import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useEventBusInvalidation } from '../../../src/hooks/common/useEventBusInvalidation';
import { InvalidationProvider } from '../../../src/hooks/common/InvalidationContext';
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

describe('useEventBusInvalidation', () => {
    let mockEventBus: {
        subscribe: ReturnType<typeof vi.fn>;
        unsubscribe: ReturnType<typeof vi.fn>;
        publish: ReturnType<typeof vi.fn>;
    };
    let mockInvalidate: ReturnType<typeof vi.fn>;
    let eventHandlers: Map<string, (event: DomainEvent) => Promise<void>>;

    beforeEach(() => {
        vi.clearAllMocks();
        eventHandlers = new Map();
        mockInvalidate = vi.fn();

        mockEventBus = {
            subscribe: vi.fn((eventType: string, handler: (event: DomainEvent) => Promise<void>) => {
                eventHandlers.set(eventType, handler);
            }),
            unsubscribe: vi.fn((eventType: string) => {
                eventHandlers.delete(eventType);
            }),
            publish: vi.fn(),
        };

        vi.mocked(serviceRegistry.get).mockImplementation((key: string) => {
            if (key === SERVICE_KEYS.EVENT_BUS) {
                return mockEventBus as unknown as IEventBus;
            }
            throw new Error(`Unknown service key: ${key}`);
        });
    });

    afterEach(() => {
        eventHandlers.clear();
    });

    describe('Event Bus Connection', () => {
        it('should retrieve event bus from service registry', () => {
            renderHook(() => useEventBusInvalidation(mockInvalidate));

            expect(serviceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.EVENT_BUS);
        });

        it('should subscribe to space events', () => {
            renderHook(() => useEventBusInvalidation(mockInvalidate));

            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space.created',
                expect.any(Function)
            );
            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space.deleted',
                expect.any(Function)
            );
            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space.renamed',
                expect.any(Function)
            );
        });

        it('should subscribe to space item events', () => {
            renderHook(() => useEventBusInvalidation(mockInvalidate));

            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space-item.created',
                expect.any(Function)
            );
            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space-item.deleted',
                expect.any(Function)
            );
            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space-item.moved',
                expect.any(Function)
            );
            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space-item.renamed',
                expect.any(Function)
            );
        });

        it('should subscribe to pin events', () => {
            renderHook(() => useEventBusInvalidation(mockInvalidate));

            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space-item.pinned',
                expect.any(Function)
            );
            expect(mockEventBus.subscribe).toHaveBeenCalledWith(
                'space-item.unpinned',
                expect.any(Function)
            );
        });

        it('should subscribe to at least 10 event types', () => {
            renderHook(() => useEventBusInvalidation(mockInvalidate));

            expect(mockEventBus.subscribe.mock.calls.length).toBeGreaterThanOrEqual(10);
        });
    });

    describe('Event Handling', () => {
        it('should handle space.created event gracefully', async () => {
            renderHook(() => useEventBusInvalidation(mockInvalidate));

            const handler = eventHandlers.get('space.created');
            expect(handler).toBeDefined();

            const event: DomainEvent = {
                type: 'space.created',
                timestamp: new Date(),
                payload: { spaceId: 'space-1', profileId: 'profile-1' },
            };

            await expect(handler!(event)).resolves.not.toThrow();
        });

        it('should handle space-item.created event gracefully', async () => {
            renderHook(() => useEventBusInvalidation(mockInvalidate));

            const handler = eventHandlers.get('space-item.created');
            expect(handler).toBeDefined();

            const event: DomainEvent = {
                type: 'space-item.created',
                timestamp: new Date(),
                payload: { itemId: 'item-1', spaceId: 'space-1' },
            };

            await expect(handler!(event)).resolves.not.toThrow();
        });

        it('should handle errors in event handlers without crashing', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            renderHook(() => useEventBusInvalidation(mockInvalidate));

            const handler = eventHandlers.get('space.created');
            expect(handler).toBeDefined();

            const event: DomainEvent = {
                type: 'space.created',
                timestamp: new Date(),
                payload: { spaceId: 'space-1', profileId: 'profile-1' },
            };

            await expect(handler!(event)).resolves.not.toThrow();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Cleanup', () => {
        it('should unsubscribe from all events on unmount', () => {
            const { unmount } = renderHook(() => useEventBusInvalidation(mockInvalidate));

            const subscribeCount = mockEventBus.subscribe.mock.calls.length;
            expect(subscribeCount).toBeGreaterThan(0);

            unmount();

            expect(mockEventBus.unsubscribe.mock.calls.length).toBe(subscribeCount);
        });

        it('should clear all event handlers on unmount', () => {
            const { unmount } = renderHook(() => useEventBusInvalidation(mockInvalidate));

            expect(eventHandlers.size).toBeGreaterThan(0);

            unmount();

            expect(mockEventBus.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing event bus gracefully', () => {
            vi.mocked(serviceRegistry.get).mockImplementation(() => {
                throw new Error('Event bus not found');
            });

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                renderHook(() => useEventBusInvalidation(mockInvalidate));
            }).not.toThrow();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('[EventBusInvalidation] Failed to initialize:'),
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it('should not crash if event bus is null', () => {
            vi.mocked(serviceRegistry.get).mockReturnValue(null as any);

            expect(() => {
                renderHook(() => useEventBusInvalidation(mockInvalidate));
            }).not.toThrow();
        });
    });
});
