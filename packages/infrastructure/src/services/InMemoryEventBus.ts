import type { DomainEvent, IEventBus, ILogger } from '@spayce/core';

export class InMemoryEventBus implements IEventBus {
    private handlers = new Map<string, Array<(event: DomainEvent) => Promise<void>>>();

    constructor(private readonly logger?: ILogger) { }

    async publish<T extends DomainEvent>(event: T): Promise<void> {
        const handlers = this.handlers.get(event.type) || [];

        if (handlers.length === 0) {
            this.logger?.debug(`No handlers registered for event: ${event.type}`);
            return;
        }

        this.logger?.debug(`Publishing event ${event.type} to ${handlers.length} handlers`);

        const results = await Promise.allSettled(handlers.map((handler) => handler(event)));

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                this.logger?.error(`Event handler ${index} failed for ${event.type}:`, result.reason);
            }
        });
    }

    subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }

        this.handlers.get(eventType)!.push(handler as (event: DomainEvent) => Promise<void>);
        this.logger?.debug(`Handler subscribed to event: ${eventType}`);
    }

    unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
        const handlers = this.handlers.get(eventType);
        if (!handlers) return;

        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
            this.logger?.debug(`Handler unsubscribed from event: ${eventType}`);
        }
    }

    clear(): void {
        this.handlers.clear();
        this.logger?.debug('All event handlers cleared');
    }

    getHandlerCount(eventType?: string): number {
        if (eventType) {
            return this.handlers.get(eventType)?.length || 0;
        }
        return Array.from(this.handlers.values()).reduce((total, h) => total + h.length, 0);
    }
}
