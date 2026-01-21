import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServiceBootstrap } from '../src/bootstrap/ServiceBootstrap';
import { serviceRegistry, SERVICE_KEYS } from '../src/di/ServiceRegistry';
import type { ISpacesRepository, ISpaceItemsRepository, IEventBus, ILogger } from '@spayce/core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ServiceBootstrap', () => {
    let testDbPath: string;

    beforeEach(() => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spayce-test-'));
        testDbPath = path.join(tempDir, 'test.sqlite');
    });

    afterEach(() => {
        ServiceBootstrap.shutdown();
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('initialize', () => {
        it('should register all required services', () => {
            ServiceBootstrap.initialize({ databasePath: testDbPath });

            expect(serviceRegistry.has(SERVICE_KEYS.DATABASE)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.LOGGER)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.EVENT_BUS)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACES_REPOSITORY)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY)).toBe(true);
        });

        it('should create database file', () => {
            ServiceBootstrap.initialize({ databasePath: testDbPath });

            serviceRegistry.get(SERVICE_KEYS.DATABASE);

            expect(fs.existsSync(testDbPath)).toBe(true);
        });

        it('should provide working repositories', async () => {
            ServiceBootstrap.initialize({ databasePath: testDbPath });

            const spacesRepo = serviceRegistry.get<ISpacesRepository>(SERVICE_KEYS.SPACES_REPOSITORY);

            const space = await spacesRepo.createSpace({
                id: 'test-space',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });

            expect(space.id).toBe('test-space');

            const retrieved = await spacesRepo.getSpaceById('test-space');
            expect(retrieved?.name).toBe('Test Space');
        });

        it('should provide working event bus', async () => {
            ServiceBootstrap.initialize({ databasePath: testDbPath });

            const eventBus = serviceRegistry.get<IEventBus>(SERVICE_KEYS.EVENT_BUS);

            let eventReceived = false;
            eventBus.subscribe('test.event', async () => {
                eventReceived = true;
            });

            await eventBus.publish({ type: 'test.event', timestamp: new Date(), payload: {} });

            expect(eventReceived).toBe(true);
        });

        it('should provide logger with custom prefix', () => {
            ServiceBootstrap.initialize({ databasePath: testDbPath, logPrefix: '[Test]' });

            const logger = serviceRegistry.get<ILogger>(SERVICE_KEYS.LOGGER);
            expect(logger).toBeDefined();
        });
    });

    describe('shutdown', () => {
        it('should clear all registrations', () => {
            ServiceBootstrap.initialize({ databasePath: testDbPath });
            ServiceBootstrap.shutdown();

            expect(serviceRegistry.has(SERVICE_KEYS.DATABASE)).toBe(false);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACES_REPOSITORY)).toBe(false);
        });

        it('should not throw if called without initialize', () => {
            expect(() => ServiceBootstrap.shutdown()).not.toThrow();
        });
    });
});
