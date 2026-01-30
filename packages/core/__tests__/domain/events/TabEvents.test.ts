import { describe, it, expect } from 'vitest';
import {
    TabCreatedEvent,
    TabClosedEvent,
    TabActivatedEvent,
    TabNavigatedEvent,
    TabTrackingChangedEvent,
    TabsReorderedEvent,
} from '../../../src/domain/events/TabEvents';

describe('Tab Domain Events', () => {
    describe('TabCreatedEvent', () => {
        it('should create event with correct type', () => {
            const event = new TabCreatedEvent({
                tabId: 'tab-1',
                url: 'https://example.com',
                originSpaceId: null,
                originSpaceItemId: null,
            });

            expect(event.type).toBe('tab.created');
        });

        it('should include payload data', () => {
            const event = new TabCreatedEvent({
                tabId: 'tab-123',
                url: 'https://example.com/page',
                originSpaceId: 'space-1',
                originSpaceItemId: 'item-1',
            });

            expect(event.payload.tabId).toBe('tab-123');
            expect(event.payload.url).toBe('https://example.com/page');
            expect(event.payload.originSpaceId).toBe('space-1');
            expect(event.payload.originSpaceItemId).toBe('item-1');
        });

        it('should have timestamp', () => {
            const event = new TabCreatedEvent({
                tabId: 'tab-1',
                url: 'https://example.com',
                originSpaceId: null,
                originSpaceItemId: null,
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });

        it('should accept null origin fields', () => {
            const event = new TabCreatedEvent({
                tabId: 'tab-1',
                url: 'https://example.com',
                originSpaceId: null,
                originSpaceItemId: null,
            });

            expect(event.payload.originSpaceId).toBeNull();
            expect(event.payload.originSpaceItemId).toBeNull();
        });
    });

    describe('TabClosedEvent', () => {
        it('should create event with correct type', () => {
            const event = new TabClosedEvent({
                tabId: 'tab-1',
                wasActive: false,
            });

            expect(event.type).toBe('tab.closed');
        });

        it('should include wasActive flag in payload', () => {
            const activeEvent = new TabClosedEvent({
                tabId: 'tab-1',
                wasActive: true,
            });

            const inactiveEvent = new TabClosedEvent({
                tabId: 'tab-2',
                wasActive: false,
            });

            expect(activeEvent.payload.wasActive).toBe(true);
            expect(inactiveEvent.payload.wasActive).toBe(false);
        });

        it('should have timestamp', () => {
            const event = new TabClosedEvent({
                tabId: 'tab-1',
                wasActive: false,
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });

        it('should include tabId in payload', () => {
            const event = new TabClosedEvent({
                tabId: 'tab-closed-123',
                wasActive: true,
            });

            expect(event.payload.tabId).toBe('tab-closed-123');
        });
    });

    describe('TabActivatedEvent', () => {
        it('should create event with correct type', () => {
            const event = new TabActivatedEvent({
                tabId: 'tab-1',
                previousTabId: null,
            });

            expect(event.type).toBe('tab.activated');
        });

        it('should include previousTabId in payload', () => {
            const event = new TabActivatedEvent({
                tabId: 'tab-2',
                previousTabId: 'tab-1',
            });

            expect(event.payload.tabId).toBe('tab-2');
            expect(event.payload.previousTabId).toBe('tab-1');
        });

        it('should accept null previousTabId', () => {
            const event = new TabActivatedEvent({
                tabId: 'tab-1',
                previousTabId: null,
            });

            expect(event.payload.previousTabId).toBeNull();
        });

        it('should have timestamp', () => {
            const event = new TabActivatedEvent({
                tabId: 'tab-1',
                previousTabId: null,
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });
    });

    describe('TabNavigatedEvent', () => {
        it('should create event with correct type', () => {
            const event = new TabNavigatedEvent({
                tabId: 'tab-1',
                url: 'https://new-url.com',
                previousUrl: 'https://old-url.com',
                isTracked: true,
            });

            expect(event.type).toBe('tab.navigated');
        });

        it('should include navigation details in payload', () => {
            const event = new TabNavigatedEvent({
                tabId: 'tab-1',
                url: 'https://example.com/new-page',
                previousUrl: 'https://example.com/old-page',
                isTracked: false,
            });

            expect(event.payload.tabId).toBe('tab-1');
            expect(event.payload.url).toBe('https://example.com/new-page');
            expect(event.payload.previousUrl).toBe('https://example.com/old-page');
            expect(event.payload.isTracked).toBe(false);
        });

        it('should have timestamp', () => {
            const event = new TabNavigatedEvent({
                tabId: 'tab-1',
                url: 'https://new-url.com',
                previousUrl: 'https://old-url.com',
                isTracked: true,
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });

        it('should include tracking status', () => {
            const trackedEvent = new TabNavigatedEvent({
                tabId: 'tab-1',
                url: 'https://same-origin.com',
                previousUrl: 'https://same-origin.com/old',
                isTracked: true,
            });

            const untrackedEvent = new TabNavigatedEvent({
                tabId: 'tab-1',
                url: 'https://different-site.com',
                previousUrl: 'https://same-origin.com',
                isTracked: false,
            });

            expect(trackedEvent.payload.isTracked).toBe(true);
            expect(untrackedEvent.payload.isTracked).toBe(false);
        });
    });

    describe('TabTrackingChangedEvent', () => {
        it('should create event with correct type', () => {
            const event = new TabTrackingChangedEvent({
                tabId: 'tab-1',
                originSpaceItemId: 'item-1',
                isTracked: false,
            });

            expect(event.type).toBe('tab.tracking-changed');
        });

        it('should include tracking details in payload', () => {
            const event = new TabTrackingChangedEvent({
                tabId: 'tab-123',
                originSpaceItemId: 'item-456',
                isTracked: false,
            });

            expect(event.payload.tabId).toBe('tab-123');
            expect(event.payload.originSpaceItemId).toBe('item-456');
            expect(event.payload.isTracked).toBe(false);
        });

        it('should have timestamp', () => {
            const event = new TabTrackingChangedEvent({
                tabId: 'tab-1',
                originSpaceItemId: 'item-1',
                isTracked: true,
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });

        it('should track both tracked and untracked states', () => {
            const becameTracked = new TabTrackingChangedEvent({
                tabId: 'tab-1',
                originSpaceItemId: 'item-1',
                isTracked: true,
            });

            const becameUntracked = new TabTrackingChangedEvent({
                tabId: 'tab-1',
                originSpaceItemId: 'item-1',
                isTracked: false,
            });

            expect(becameTracked.payload.isTracked).toBe(true);
            expect(becameUntracked.payload.isTracked).toBe(false);
        });
    });

    describe('TabsReorderedEvent', () => {
        it('should create event with correct type', () => {
            const event = new TabsReorderedEvent({
                orderedIds: ['tab-1', 'tab-2', 'tab-3'],
            });

            expect(event.type).toBe('tabs.reordered');
        });

        it('should include ordered IDs in payload', () => {
            const orderedIds = ['tab-3', 'tab-1', 'tab-2'];
            const event = new TabsReorderedEvent({ orderedIds });

            expect(event.payload.orderedIds).toEqual(orderedIds);
            expect(event.payload.orderedIds).toHaveLength(3);
        });

        it('should have timestamp', () => {
            const event = new TabsReorderedEvent({
                orderedIds: ['tab-1'],
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });

        it('should handle empty array', () => {
            const event = new TabsReorderedEvent({
                orderedIds: [],
            });

            expect(event.payload.orderedIds).toEqual([]);
        });

        it('should preserve order of IDs', () => {
            const orderedIds = ['tab-5', 'tab-2', 'tab-8', 'tab-1'];
            const event = new TabsReorderedEvent({ orderedIds });

            expect(event.payload.orderedIds[0]).toBe('tab-5');
            expect(event.payload.orderedIds[1]).toBe('tab-2');
            expect(event.payload.orderedIds[2]).toBe('tab-8');
            expect(event.payload.orderedIds[3]).toBe('tab-1');
        });
    });

    describe('Event consistency', () => {
        it('should all events have type property', () => {
            const created = new TabCreatedEvent({ tabId: 't1', url: 'https://a.com', originSpaceId: null, originSpaceItemId: null });
            const closed = new TabClosedEvent({ tabId: 't1', wasActive: false });
            const activated = new TabActivatedEvent({ tabId: 't1', previousTabId: null });
            const navigated = new TabNavigatedEvent({ tabId: 't1', url: 'https://b.com', previousUrl: 'https://a.com', isTracked: true });
            const tracking = new TabTrackingChangedEvent({ tabId: 't1', originSpaceItemId: 'i1', isTracked: false });
            const reordered = new TabsReorderedEvent({ orderedIds: ['t1'] });

            expect(created.type).toBeTruthy();
            expect(closed.type).toBeTruthy();
            expect(activated.type).toBeTruthy();
            expect(navigated.type).toBeTruthy();
            expect(tracking.type).toBeTruthy();
            expect(reordered.type).toBeTruthy();
        });

        it('should all events have timestamp', () => {
            const created = new TabCreatedEvent({ tabId: 't1', url: 'https://a.com', originSpaceId: null, originSpaceItemId: null });
            const closed = new TabClosedEvent({ tabId: 't1', wasActive: false });
            const activated = new TabActivatedEvent({ tabId: 't1', previousTabId: null });
            const navigated = new TabNavigatedEvent({ tabId: 't1', url: 'https://b.com', previousUrl: 'https://a.com', isTracked: true });
            const tracking = new TabTrackingChangedEvent({ tabId: 't1', originSpaceItemId: 'i1', isTracked: false });
            const reordered = new TabsReorderedEvent({ orderedIds: ['t1'] });

            expect(created.timestamp).toBeInstanceOf(Date);
            expect(closed.timestamp).toBeInstanceOf(Date);
            expect(activated.timestamp).toBeInstanceOf(Date);
            expect(navigated.timestamp).toBeInstanceOf(Date);
            expect(tracking.timestamp).toBeInstanceOf(Date);
            expect(reordered.timestamp).toBeInstanceOf(Date);
        });

        it('should all events have payload', () => {
            const created = new TabCreatedEvent({ tabId: 't1', url: 'https://a.com', originSpaceId: null, originSpaceItemId: null });
            const closed = new TabClosedEvent({ tabId: 't1', wasActive: false });
            const activated = new TabActivatedEvent({ tabId: 't1', previousTabId: null });
            const navigated = new TabNavigatedEvent({ tabId: 't1', url: 'https://b.com', previousUrl: 'https://a.com', isTracked: true });
            const tracking = new TabTrackingChangedEvent({ tabId: 't1', originSpaceItemId: 'i1', isTracked: false });
            const reordered = new TabsReorderedEvent({ orderedIds: ['t1'] });

            expect(created.payload).toBeDefined();
            expect(closed.payload).toBeDefined();
            expect(activated.payload).toBeDefined();
            expect(navigated.payload).toBeDefined();
            expect(tracking.payload).toBeDefined();
            expect(reordered.payload).toBeDefined();
        });

        it('should events have correct type values', () => {
            const created = new TabCreatedEvent({ tabId: 't1', url: 'https://a.com', originSpaceId: null, originSpaceItemId: null });
            const closed = new TabClosedEvent({ tabId: 't1', wasActive: false });
            const activated = new TabActivatedEvent({ tabId: 't1', previousTabId: null });
            const navigated = new TabNavigatedEvent({ tabId: 't1', url: 'https://b.com', previousUrl: 'https://a.com', isTracked: true });
            const tracking = new TabTrackingChangedEvent({ tabId: 't1', originSpaceItemId: 'i1', isTracked: false });
            const reordered = new TabsReorderedEvent({ orderedIds: ['t1'] });

            expect(created.type).toBe('tab.created');
            expect(closed.type).toBe('tab.closed');
            expect(activated.type).toBe('tab.activated');
            expect(navigated.type).toBe('tab.navigated');
            expect(tracking.type).toBe('tab.tracking-changed');
            expect(reordered.type).toBe('tabs.reordered');
        });
    });
});
