/**
 * Tab Domain Events
 *
 * Events emitted by tab operations for cross-cutting concerns.
 *
 * @see Spec 018 - Browser Domain Layer
 */

import type { DomainEvent } from './DomainEvent';

/**
 * Event fired when a tab is created
 */
export class TabCreatedEvent implements DomainEvent {
    readonly type = 'tab.created' as const;
    readonly timestamp = new Date();

    constructor(
        readonly payload: {
            readonly tabId: string;
            readonly url: string;
            readonly originSpaceId: string | null;
            readonly originSpaceItemId: string | null;
        }
    ) {}
}

/**
 * Event fired when a tab is closed
 */
export class TabClosedEvent implements DomainEvent {
    readonly type = 'tab.closed' as const;
    readonly timestamp = new Date();

    constructor(
        readonly payload: {
            readonly tabId: string;
            readonly wasActive: boolean;
        }
    ) {}
}

/**
 * Event fired when a tab becomes active
 */
export class TabActivatedEvent implements DomainEvent {
    readonly type = 'tab.activated' as const;
    readonly timestamp = new Date();

    constructor(
        readonly payload: {
            readonly tabId: string;
            readonly previousTabId: string | null;
        }
    ) {}
}

/**
 * Event fired when a tab navigates to a new URL
 */
export class TabNavigatedEvent implements DomainEvent {
    readonly type = 'tab.navigated' as const;
    readonly timestamp = new Date();

    constructor(
        readonly payload: {
            readonly tabId: string;
            readonly url: string;
            readonly previousUrl: string;
            readonly isTracked: boolean;
        }
    ) {}
}

/**
 * Event fired when a tab's tracking status changes
 */
export class TabTrackingChangedEvent implements DomainEvent {
    readonly type = 'tab.tracking-changed' as const;
    readonly timestamp = new Date();

    constructor(
        readonly payload: {
            readonly tabId: string;
            readonly originSpaceItemId: string;
            readonly isTracked: boolean;
        }
    ) {}
}

/**
 * Event fired when tabs are reordered
 */
export class TabsReorderedEvent implements DomainEvent {
    readonly type = 'tabs.reordered' as const;
    readonly timestamp = new Date();

    constructor(
        readonly payload: {
            readonly orderedIds: readonly string[];
        }
    ) {}
}
