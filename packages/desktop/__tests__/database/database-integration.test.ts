/**
 * Database Integration Tests
 * 
 * These tests verify that the database layer works correctly end-to-end,
 * from initialization through CRUD operations.
 * 
 * CRITICAL: These tests ensure the SQLite database is properly initialized
 * and all data operations work correctly.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import {
    WORKSPACE_ROOT,
    getTestDbPath,
    cleanupTestDb,
    verifyDatabaseSchema,
    findNativeModule,
} from '../setup/test-utils';
import { ServiceBootstrap, serviceRegistry, SERVICE_KEYS, DatabaseInitializer } from '@spayce/infrastructure';

describe('Database Integration', () => {
    describe('Development Database', () => {
        const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');

        it('should have development database file', () => {
            expect(fs.existsSync(devDbPath)).toBe(true);
        });

        it('should have valid database schema', () => {
            const result = verifyDatabaseSchema(devDbPath);
            expect(result.valid).toBe(true);
            if (!result.valid) {
                console.error('Schema validation errors:', result.errors);
            }
        });

        it('should have required tables', () => {
            const result = verifyDatabaseSchema(devDbPath);
            expect(result.tables).toContain('spaces');
            expect(result.tables).toContain('space_items');
        });

        it('should have seeded data', () => {
            const db = new Database(devDbPath, { readonly: true });
            const spaces = db.prepare('SELECT COUNT(*) as count FROM spaces').get() as { count: number };
            expect(spaces.count).toBeGreaterThan(0);
            db.close();
        });
    });

    describe('Database Initialization', () => {
        let testDbPath: string;
        let db: Database.Database;

        beforeEach(() => {
            testDbPath = getTestDbPath();
            db = new Database(testDbPath);
        });

        afterEach(() => {
            db.close();
            cleanupTestDb(testDbPath);
        });

        it('should create all required tables', () => {
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();

            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'")
                .all() as { name: string }[];
            const tableNames = tables.map(t => t.name);

            expect(tableNames).toContain('spaces');
            expect(tableNames).toContain('space_items');
        });

        it('should create spaces table with correct columns', () => {
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();

            const columns = db.prepare("PRAGMA table_info(spaces)").all() as { name: string }[];
            const columnNames = columns.map(c => c.name);

            expect(columnNames).toContain('id');
            expect(columnNames).toContain('profile_id');
            expect(columnNames).toContain('user_id');
            expect(columnNames).toContain('name');
            expect(columnNames).toContain('accent_color');
            expect(columnNames).toContain('icon_name');
            expect(columnNames).toContain('sort_order');
            expect(columnNames).toContain('is_expanded');
            expect(columnNames).toContain('created_at');
        });

        it('should create space_items table with correct columns', () => {
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();

            const columns = db.prepare("PRAGMA table_info(space_items)").all() as { name: string }[];
            const columnNames = columns.map(c => c.name);

            expect(columnNames).toContain('id');
            expect(columnNames).toContain('space_id');
            expect(columnNames).toContain('parent_id');
            expect(columnNames).toContain('name');
            expect(columnNames).toContain('path');
            expect(columnNames).toContain('type');
            expect(columnNames).toContain('sort_order');
        });

        it('should be idempotent (can run multiple times)', () => {
            const initializer = new DatabaseInitializer(db);

            // Run twice - should not throw
            expect(() => {
                initializer.initialize();
                initializer.initialize();
            }).not.toThrow();
        });
    });

    describe('Service Bootstrap Database Integration', () => {
        let testDbPath: string;
        let canRunIntegrationTests = false;

        beforeAll(() => {
            // Check if we can run integration tests (requires native module)
            const moduleInfo = findNativeModule('better-sqlite3');
            const nodeArch = process.arch;

            if (moduleInfo.architecture && moduleInfo.architecture !== nodeArch) {
                console.log(`Skipping integration tests: arch mismatch (Node: ${nodeArch}, Module: ${moduleInfo.architecture})`);
                return;
            }

            canRunIntegrationTests = true;
            testDbPath = getTestDbPath();
            ServiceBootstrap.initialize({ databasePath: testDbPath });
        });

        afterAll(() => {
            if (canRunIntegrationTests) {
                ServiceBootstrap.shutdown();
                cleanupTestDb(testDbPath);
            }
        });

        it('should create database file', () => {
            if (!canRunIntegrationTests) return;
            expect(fs.existsSync(testDbPath)).toBe(true);
        });

        it('should register database in service registry', () => {
            if (!canRunIntegrationTests) return;
            expect(serviceRegistry.has(SERVICE_KEYS.DATABASE)).toBe(true);
        });

        it('should register repositories', () => {
            if (!canRunIntegrationTests) return;
            expect(serviceRegistry.has(SERVICE_KEYS.SPACES_REPOSITORY)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY)).toBe(true);
        });

        it('should support CRUD operations through repository', async () => {
            if (!canRunIntegrationTests) return;
            const spacesRepo = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_REPOSITORY);

            // Create
            const space = await spacesRepo.createSpace({
                id: 'test-space-crud',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'CRUD Test Space',
                accentColor: '#FF0000',
                iconName: 'star',
                order: 0,
                isExpanded: true,
            });
            expect(space.id).toBe('test-space-crud');

            // Read
            const retrieved = await spacesRepo.getSpaceById('test-space-crud');
            expect(retrieved).not.toBeNull();
            expect(retrieved?.name).toBe('CRUD Test Space');

            // Update
            await spacesRepo.updateSpace({ ...retrieved!, name: 'Updated Name' });
            const updated = await spacesRepo.getSpaceById('test-space-crud');
            expect(updated?.name).toBe('Updated Name');

            // Delete
            await spacesRepo.deleteSpace('test-space-crud');
            const deleted = await spacesRepo.getSpaceById('test-space-crud');
            expect(deleted).toBeNull();
        });
    });

    describe('Database Operations Performance', () => {
        let testDbPath: string;

        beforeAll(() => {
            testDbPath = getTestDbPath();
            ServiceBootstrap.initialize({ databasePath: testDbPath });
        });

        afterAll(() => {
            ServiceBootstrap.shutdown();
            cleanupTestDb(testDbPath);
        });

        it('should handle concurrent reads', async () => {
            const spacesRepo = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_REPOSITORY);

            // Create test data
            await spacesRepo.createSpace({
                id: 'concurrent-test',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Concurrent Test',
                accentColor: '#FF0000',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });

            // Run concurrent reads
            const reads = await Promise.all([
                spacesRepo.getSpaceById('concurrent-test'),
                spacesRepo.getSpaceById('concurrent-test'),
                spacesRepo.getSpaceById('concurrent-test'),
                spacesRepo.getAllSpaces('profile-1'),
                spacesRepo.getAllSpaces('profile-1'),
            ]);

            // All should succeed
            expect(reads[0]?.name).toBe('Concurrent Test');
            expect(reads[1]?.name).toBe('Concurrent Test');
            expect(reads[2]?.name).toBe('Concurrent Test');
        });
    });

    describe('Database Error Handling', () => {
        let testDbPath: string;

        beforeAll(() => {
            testDbPath = getTestDbPath();
            ServiceBootstrap.initialize({ databasePath: testDbPath });
        });

        afterAll(() => {
            ServiceBootstrap.shutdown();
            cleanupTestDb(testDbPath);
        });

        it('should handle non-existent ID gracefully', async () => {
            const spacesRepo = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_REPOSITORY);
            const result = await spacesRepo.getSpaceById('non-existent-id');
            expect(result).toBeNull();
        });

        it('should return empty array for profile with no spaces', async () => {
            const spacesRepo = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_REPOSITORY);
            const result = await spacesRepo.getAllSpaces('non-existent-profile');
            expect(result).toEqual([]);
        });
    });
});

describe('Database Seeding', () => {
    const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');

    it('should have expected seed data structure', () => {
        const db = new Database(devDbPath, { readonly: true });

        const spaces = db.prepare('SELECT * FROM spaces LIMIT 5').all() as any[];

        for (const space of spaces) {
            expect(space.id).toBeDefined();
            expect(space.name).toBeDefined();
            expect(space.profile_id).toBeDefined();
            expect(space.accent_color).toBeDefined();
            expect(space.icon_name).toBeDefined();
        }

        db.close();
    });

    it('should have items linked to spaces', () => {
        const db = new Database(devDbPath, { readonly: true });

        const items = db.prepare('SELECT * FROM space_items LIMIT 5').all() as any[];

        if (items.length > 0) {
            for (const item of items) {
                expect(item.space_id).toBeDefined();
                expect(item.name).toBeDefined();
                expect(item.type).toBeDefined();
            }
        }

        db.close();
    });
});
