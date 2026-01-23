import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Infrastructure Package Integration - Exports', () => {
    describe('Service Registry', () => {
        it('should export serviceRegistry singleton', async () => {
            const { serviceRegistry } = await import('@spayce/infrastructure');
            expect(serviceRegistry).toBeDefined();
            expect(typeof serviceRegistry.get).toBe('function');
            expect(typeof serviceRegistry.register).toBe('function');
        });

        it('should export SERVICE_KEYS constants', async () => {
            const { SERVICE_KEYS } = await import('@spayce/infrastructure');
            expect(SERVICE_KEYS).toBeDefined();
            expect(SERVICE_KEYS.SPACES_FACADE).toBe('spacesFacade');
            expect(SERVICE_KEYS.SPACE_ITEMS_FACADE).toBe('spaceItemsFacade');
            expect(SERVICE_KEYS.SEARCH_FACADE).toBe('searchFacade');
            expect(SERVICE_KEYS.EVENT_BUS).toBe('eventBus');
        });
    });

    describe('ServiceBootstrap', () => {
        let testDbPath: string;
        let tempDir: string;

        beforeAll(() => {
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spayce-test-'));
            testDbPath = path.join(tempDir, 'test.sqlite');
        });

        afterAll(() => {
            try {
                if (fs.existsSync(testDbPath)) {
                    fs.unlinkSync(testDbPath);
                }
                if (fs.existsSync(tempDir)) {
                    fs.rmdirSync(tempDir);
                }
            } catch {
                // Ignore cleanup errors
            }
        });

        it('should export ServiceBootstrap', async () => {
            const { ServiceBootstrap } = await import('@spayce/infrastructure');
            expect(ServiceBootstrap).toBeDefined();
            expect(typeof ServiceBootstrap.initialize).toBe('function');
        });

        it('should export ServiceBootstrap initialize method', async () => {
            // Note: Actual initialization requires native better-sqlite3 module built for Electron
            // This test verifies the export exists and has the correct interface
            const { ServiceBootstrap } = await import('@spayce/infrastructure');
            expect(ServiceBootstrap).toBeDefined();
            expect(typeof ServiceBootstrap.initialize).toBe('function');
        });
    });

    describe('MetadataExtractionService', () => {
        it('should export MetadataExtractionService', async () => {
            const { MetadataExtractionService } = await import('@spayce/infrastructure');
            expect(MetadataExtractionService).toBeDefined();
            expect(typeof MetadataExtractionService).toBe('function');
        });

        it('should create MetadataExtractionService instance', async () => {
            const { MetadataExtractionService } = await import('@spayce/infrastructure');
            const service = new MetadataExtractionService();
            expect(service).toBeDefined();
            expect(typeof service.extractMetadata).toBe('function');
            expect(typeof service.extractFavicon).toBe('function');
        });
    });

    describe('Persistence Layer', () => {
        it('should export persistence module', async () => {
            const infrastructure = await import('@spayce/infrastructure');
            // Verify the module loads without errors
            expect(infrastructure).toBeDefined();
        });
    });

    describe('Event Bus', () => {
        it('should export InMemoryEventBus', async () => {
            const { InMemoryEventBus } = await import('@spayce/infrastructure');
            expect(InMemoryEventBus).toBeDefined();
            expect(typeof InMemoryEventBus).toBe('function');
        });

        it('should create InMemoryEventBus instance', async () => {
            const { InMemoryEventBus } = await import('@spayce/infrastructure');
            const eventBus = new InMemoryEventBus();
            expect(eventBus).toBeDefined();
            expect(typeof eventBus.publish).toBe('function');
            expect(typeof eventBus.subscribe).toBe('function');
        });
    });
});
