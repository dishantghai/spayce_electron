import { useEffect, useRef } from 'react';
import { serviceRegistry, SERVICE_KEYS } from '@spayce/infrastructure';
import type { IEventBus, DomainEvent } from '@spayce/core';

/**
 * Hook that bridges domain events from the event bus to React query invalidation.
 * Subscribes to relevant domain events and triggers cache invalidation for affected query keys.
 * 
 * @param invalidate - Function to call when a query key should be invalidated
 */
export function useEventBusInvalidation(invalidate: (key: string) => void): void {
    const eventBusRef = useRef<IEventBus | null>(null);
    const handlersRef = useRef<Map<string, (event: DomainEvent) => Promise<void>>>(new Map());

    useEffect(() => {
        try {
            // Get event bus from service registry
            eventBusRef.current = serviceRegistry.get<IEventBus>(SERVICE_KEYS.EVENT_BUS);

            // Define event handlers that map events to invalidation keys
            const eventHandlers: Record<string, () => void> = {
                // Space events - invalidate spaces list
                'space.created': () => {
                    invalidate('spaces');
                },
                'space.deleted': () => {
                    invalidate('spaces');
                },
                'space.renamed': () => {
                    invalidate('spaces');
                },

                // Space item events - invalidate space items and related queries
                'space-item.created': () => {
                    invalidate('space-items');
                    invalidate('recent-items');
                },
                'space-item.deleted': () => {
                    invalidate('space-items');
                    invalidate('pinned-items');
                    invalidate('recent-items');
                },
                'space-item.moved': () => {
                    invalidate('space-items');
                },
                'space-item.renamed': () => {
                    invalidate('space-items');
                },
                'space-item.pinned': () => {
                    invalidate('pinned-items');
                },
                'space-item.unpinned': () => {
                    invalidate('pinned-items');
                },
                'space-item.reordered': () => {
                    invalidate('space-items');
                },
                'pins.reordered': () => {
                    invalidate('pinned-items');
                },
            };

            // Subscribe to all events
            Object.entries(eventHandlers).forEach(([eventType, handler]) => {
                const asyncHandler = async (event: DomainEvent) => {
                    try {
                        handler();
                    } catch (error) {
                        console.error(`Error handling ${eventType} for invalidation:`, error);
                    }
                };

                handlersRef.current.set(eventType, asyncHandler);
                eventBusRef.current?.subscribe(eventType, asyncHandler);
            });

            console.log('[EventBusInvalidation] Subscribed to', Object.keys(eventHandlers).length, 'domain events');

        } catch (error) {
            console.error('[EventBusInvalidation] Failed to initialize:', error);
        }

        // Cleanup: unsubscribe from all events
        return () => {
            if (eventBusRef.current) {
                handlersRef.current.forEach((handler, eventType) => {
                    eventBusRef.current?.unsubscribe(eventType, handler);
                });
                handlersRef.current.clear();
                console.log('[EventBusInvalidation] Unsubscribed from all events');
            }
        };
    }, [invalidate]);
}
