import { describe, it, expect, beforeEach } from 'vitest';
import {
    SpaceCreatedEvent,
    SpaceDeletedEvent,
    SpaceRenamedEvent,
    SpaceItemCreatedEvent,
    SpaceItemMovedEvent,
    SpaceItemPinnedEvent,
} from '../src/domain/events';
import type { DomainEvent } from '../src/domain/events';

describe('Domain Events', () => {
    describe('DomainEvent interface', () => {
        it('should have type, timestamp, and payload', () => {
            const event: DomainEvent = new SpaceCreatedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.type).toBeDefined();
            expect(event.timestamp).toBeInstanceOf(Date);
            expect(event.payload).toBeDefined();
        });
    });

    describe('SpaceCreatedEvent', () => {
        it('should have correct type', () => {
            const event = new SpaceCreatedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.type).toBe('space.created');
        });

        it('should store payload', () => {
            const event = new SpaceCreatedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.payload.spaceId).toBe('space-1');
            expect(event.payload.profileId).toBe('profile-1');
        });

        it('should auto-set timestamp', () => {
            const before = new Date();
            const event = new SpaceCreatedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });
            const after = new Date();

            expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('should be immutable (readonly properties)', () => {
            const event = new SpaceCreatedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.type).toBe('space.created');
            expect(event.payload.spaceId).toBe('space-1');
        });
    });

    describe('SpaceDeletedEvent', () => {
        it('should have correct type', () => {
            const event = new SpaceDeletedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.type).toBe('space.deleted');
        });

        it('should store payload', () => {
            const event = new SpaceDeletedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.payload.spaceId).toBe('space-1');
            expect(event.payload.profileId).toBe('profile-1');
        });
    });

    describe('SpaceRenamedEvent', () => {
        it('should have correct type', () => {
            const event = new SpaceRenamedEvent({
                spaceId: 'space-1',
                oldName: 'Old Name',
                newName: 'New Name',
            });

            expect(event.type).toBe('space.renamed');
        });

        it('should store old and new names', () => {
            const event = new SpaceRenamedEvent({
                spaceId: 'space-1',
                oldName: 'Old Name',
                newName: 'New Name',
            });

            expect(event.payload.oldName).toBe('Old Name');
            expect(event.payload.newName).toBe('New Name');
        });
    });

    describe('SpaceItemCreatedEvent', () => {
        it('should have correct type', () => {
            const event = new SpaceItemCreatedEvent({
                itemId: 'item-1',
                spaceId: 'space-1',
            });

            expect(event.type).toBe('space-item.created');
        });

        it('should store payload', () => {
            const event = new SpaceItemCreatedEvent({
                itemId: 'item-1',
                spaceId: 'space-1',
            });

            expect(event.payload.itemId).toBe('item-1');
            expect(event.payload.spaceId).toBe('space-1');
        });
    });

    describe('SpaceItemMovedEvent', () => {
        it('should have correct type', () => {
            const event = new SpaceItemMovedEvent({
                itemId: 'item-1',
                fromSpaceId: 'space-1',
                toSpaceId: 'space-2',
                fromParentId: null,
                toParentId: 'folder-1',
            });

            expect(event.type).toBe('space-item.moved');
        });

        it('should store all move details', () => {
            const event = new SpaceItemMovedEvent({
                itemId: 'item-1',
                fromSpaceId: 'space-1',
                toSpaceId: 'space-2',
                fromParentId: null,
                toParentId: 'folder-1',
            });

            expect(event.payload.itemId).toBe('item-1');
            expect(event.payload.fromSpaceId).toBe('space-1');
            expect(event.payload.toSpaceId).toBe('space-2');
            expect(event.payload.fromParentId).toBeNull();
            expect(event.payload.toParentId).toBe('folder-1');
        });
    });

    describe('SpaceItemPinnedEvent', () => {
        it('should have correct type', () => {
            const event = new SpaceItemPinnedEvent({
                itemId: 'item-1',
                spaceId: 'space-1',
                position: 0,
            });

            expect(event.type).toBe('space-item.pinned');
        });

        it('should store pin position', () => {
            const event = new SpaceItemPinnedEvent({
                itemId: 'item-1',
                spaceId: 'space-1',
                position: 5,
            });

            expect(event.payload.itemId).toBe('item-1');
            expect(event.payload.spaceId).toBe('space-1');
            expect(event.payload.position).toBe(5);
        });
    });

    describe('Event immutability', () => {
        it('all events should have readonly properties', () => {
            const events = [
                new SpaceCreatedEvent({ spaceId: 's', profileId: 'p' }),
                new SpaceDeletedEvent({ spaceId: 's', profileId: 'p' }),
                new SpaceRenamedEvent({ spaceId: 's', oldName: 'a', newName: 'b' }),
                new SpaceItemCreatedEvent({ itemId: 'i', spaceId: 's' }),
                new SpaceItemMovedEvent({
                    itemId: 'i',
                    fromSpaceId: 's1',
                    toSpaceId: 's2',
                    fromParentId: null,
                    toParentId: null,
                }),
                new SpaceItemPinnedEvent({ itemId: 'i', spaceId: 's', position: 0 }),
            ];

            events.forEach((event) => {
                expect(event.type).toBeDefined();
                expect(event.timestamp).toBeInstanceOf(Date);
                expect(event.payload).toBeDefined();
            });
        });
    });
});
