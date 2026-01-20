import type { DomainEvent } from '../events/DomainEvent';

export interface IEventBus {
    publish<T extends DomainEvent>(event: T): Promise<void>;
    subscribe<T extends DomainEvent>(
        eventType: string,
        handler: (event: T) => Promise<void>
    ): void;
    unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
    clear(): void;
}
