import { describe, it, expect } from 'vitest';
import { SpaceCreatedEvent, SpaceDeletedEvent, SpaceRenamedEvent } from '../../../src/domain/events/SpaceEvents';

describe('Space Domain Events', () => {
    describe('SpaceCreatedEvent', () => {
        it('should create event with correct type', () => {
            const event = new SpaceCreatedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.type).toBe('space.created');
        });

        it('should include payload data', () => {
            const event = new SpaceCreatedEvent({
                spaceId: 'space-123',
                profileId: 'profile-456',
            });

            expect(event.payload.spaceId).toBe('space-123');
            expect(event.payload.profileId).toBe('profile-456');
        });

        it('should have timestamp', () => {
            const event = new SpaceCreatedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });

        it('should have readonly properties', () => {
            const event = new SpaceCreatedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(() => {
                // @ts-expect-error - testing immutability
                event.type = 'different.type';
            }).toThrow();
        });
    });

    describe('SpaceDeletedEvent', () => {
        it('should create event with correct type', () => {
            const event = new SpaceDeletedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.type).toBe('space.deleted');
        });

        it('should include payload data', () => {
            const event = new SpaceDeletedEvent({
                spaceId: 'deleted-space',
                profileId: 'profile-1',
            });

            expect(event.payload.spaceId).toBe('deleted-space');
            expect(event.payload.profileId).toBe('profile-1');
        });

        it('should have timestamp', () => {
            const event = new SpaceDeletedEvent({
                spaceId: 'space-1',
                profileId: 'profile-1',
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });
    });

    describe('SpaceRenamedEvent', () => {
        it('should create event with correct type', () => {
            const event = new SpaceRenamedEvent({
                spaceId: 'space-1',
                oldName: 'Old Name',
                newName: 'New Name',
            });

            expect(event.type).toBe('space.renamed');
        });

        it('should include old and new names', () => {
            const event = new SpaceRenamedEvent({
                spaceId: 'space-1',
                oldName: 'Work',
                newName: 'Personal',
            });

            expect(event.payload.oldName).toBe('Work');
            expect(event.payload.newName).toBe('Personal');
            expect(event.payload.spaceId).toBe('space-1');
        });

        it('should have timestamp', () => {
            const event = new SpaceRenamedEvent({
                spaceId: 'space-1',
                oldName: 'Old',
                newName: 'New',
            });

            expect(event.timestamp).toBeInstanceOf(Date);
        });
    });

    describe('Event consistency', () => {
        it('should all events have type property', () => {
            const created = new SpaceCreatedEvent({ spaceId: 's1', profileId: 'p1' });
            const deleted = new SpaceDeletedEvent({ spaceId: 's1', profileId: 'p1' });
            const renamed = new SpaceRenamedEvent({ spaceId: 's1', oldName: 'old', newName: 'new' });

            expect(created.type).toBeTruthy();
            expect(deleted.type).toBeTruthy();
            expect(renamed.type).toBeTruthy();
        });

        it('should all events have timestamp', () => {
            const created = new SpaceCreatedEvent({ spaceId: 's1', profileId: 'p1' });
            const deleted = new SpaceDeletedEvent({ spaceId: 's1', profileId: 'p1' });
            const renamed = new SpaceRenamedEvent({ spaceId: 's1', oldName: 'old', newName: 'new' });

            expect(created.timestamp).toBeInstanceOf(Date);
            expect(deleted.timestamp).toBeInstanceOf(Date);
            expect(renamed.timestamp).toBeInstanceOf(Date);
        });

        it('should all events have payload', () => {
            const created = new SpaceCreatedEvent({ spaceId: 's1', profileId: 'p1' });
            const deleted = new SpaceDeletedEvent({ spaceId: 's1', profileId: 'p1' });
            const renamed = new SpaceRenamedEvent({ spaceId: 's1', oldName: 'old', newName: 'new' });

            expect(created.payload).toBeDefined();
            expect(deleted.payload).toBeDefined();
            expect(renamed.payload).toBeDefined();
        });
    });
});
