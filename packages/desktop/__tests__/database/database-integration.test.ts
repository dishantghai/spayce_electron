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

// Helper to check if we can run native module tests
function canRunNativeTests(): boolean {
    const moduleInfo = findNativeModule('better-sqlite3');
    if (moduleInfo.architecture && moduleInfo.architecture !== process.arch) {
        return false;
    }
    return true;
}

describe('Database Integration', () => {
    describe('Development Database (skip if arch mismatch)', () => {
        const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');
        let canRun = false;

        beforeAll(() => {
            canRun = canRunNativeTests();
            if (!canRun) console.log('Skipping: arch mismatch');
        });

        it('should have development database file', () => {
            expect(fs.existsSync(devDbPath)).toBe(true);
        });

        it('should have valid database schema', () => {
            if (!canRun) return;
            const result = verifyDatabaseSchema(devDbPath);
            expect(result.valid).toBe(true);
            if (!result.valid) {
                console.error('Schema validation errors:', result.errors);
            }
        });

        it('should have required tables', () => {
            if (!canRun) return;
            const result = verifyDatabaseSchema(devDbPath);
            expect(result.tables).toContain('spaces');
            expect(result.tables).toContain('space_items');
        });

        it('should have seeded data', () => {
            if (!canRun) return;
            const db = new Database(devDbPath, { readonly: true });
            const spaces = db.prepare('SELECT COUNT(*) as count FROM spaces').get() as { count: number };
            expect(spaces.count).toBeGreaterThan(0);
            db.close();
        });
    });

    describe('Database Initialization (skip if arch mismatch)', () => {
        let testDbPath: string;
        let db: Database.Database;
        let canRun = false;

        beforeEach(() => {
            if (!canRunNativeTests()) return;
            canRun = true;
            testDbPath = getTestDbPath();
            db = new Database(testDbPath);
        });

        afterEach(() => {
            if (!canRun) return;
            db.close();
            cleanupTestDb(testDbPath);
        });

        it('should create all required tables', () => {
            if (!canRun) return;
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();

            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'")
                .all() as { name: string }[];
            const tableNames = tables.map(t => t.name);

            expect(tableNames).toContain('spaces');
            expect(tableNames).toContain('space_items');
        });

        it('should create spaces table with correct columns', () => {
            if (!canRun) return;
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
            if (!canRun) return;
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
            if (!canRun) return;
            const initializer = new DatabaseInitializer(db);

            // Run twice - should not throw
            expect(() => {
                initializer.initialize();
                initializer.initialize();
            }).not.toThrow();
        });
    });

    describe('Service Bootstrap Database Integration (skip if arch mismatch)', () => {
        let testDbPath: string;
        let canRun = false;

        beforeAll(() => {
            if (!canRunNativeTests()) {
                console.log('Skipping Service Bootstrap tests: arch mismatch');
                return;
            }
            canRun = true;
            testDbPath = getTestDbPath();
            ServiceBootstrap.initialize({ databasePath: testDbPath });
        });

        afterAll(() => {
            if (canRun) {
                ServiceBootstrap.shutdown();
                cleanupTestDb(testDbPath);
            }
        });

        it('should create database file', () => {
            if (!canRun) return;
            expect(fs.existsSync(testDbPath)).toBe(true);
        });

        it('should register database in service registry', () => {
            if (!canRun) return;
            expect(serviceRegistry.has(SERVICE_KEYS.DATABASE)).toBe(true);
        });

        it('should register repositories', () => {
            if (!canRun) return;
            expect(serviceRegistry.has(SERVICE_KEYS.SPACES_REPOSITORY)).toBe(true);
            expect(serviceRegistry.has(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY)).toBe(true);
        });

        it('should support CRUD operations through repository', async () => {
            if (!canRun) return;
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

    describe('Database Concurrency (skip if arch mismatch)', () => {
        let testDbPath: string;
        let canRun = false;

        beforeAll(() => {
            if (!canRunNativeTests()) return;
            canRun = true;
            testDbPath = getTestDbPath();
            ServiceBootstrap.initialize({ databasePath: testDbPath });
        });

        afterAll(() => {
            if (canRun) {
                ServiceBootstrap.shutdown();
                cleanupTestDb(testDbPath);
            }
        });

        it('should handle concurrent reads', async () => {
            if (!canRun) return;
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

    describe('Database Error Handling (skip if arch mismatch)', () => {
        let testDbPath: string;
        let canRun = false;

        beforeAll(() => {
            if (!canRunNativeTests()) return;
            canRun = true;
            testDbPath = getTestDbPath();
            ServiceBootstrap.initialize({ databasePath: testDbPath });
        });

        afterAll(() => {
            if (canRun) {
                ServiceBootstrap.shutdown();
                cleanupTestDb(testDbPath);
            }
        });

        it('should handle non-existent ID gracefully', async () => {
            if (!canRun) return;
            const spacesRepo = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_REPOSITORY);
            const result = await spacesRepo.getSpaceById('non-existent-id');
            expect(result).toBeNull();
        });

        it('should return empty array for profile with no spaces', async () => {
            if (!canRun) return;
            const spacesRepo = serviceRegistry.get<any>(SERVICE_KEYS.SPACES_REPOSITORY);
            const result = await spacesRepo.getAllSpaces('non-existent-profile');
            expect(result).toEqual([]);
        });
    });
});

describe('Database Seeding (skip if arch mismatch)', () => {
    const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');
    let canRun = false;

    beforeAll(() => {
        canRun = canRunNativeTests();
    });

    it('should have expected seed data structure', () => {
        if (!canRun) return;
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
        if (!canRun) return;
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
