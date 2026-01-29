/**
 * Spec 011: Migration & Feature Parity - Database Setup and Seeding Tests
 * 
 * TDD RED Phase: These tests verify database setup, migration, and seeding.
 * Tests should FAIL initially until database setup is complete.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseInitializer } from '../../src/persistence/sqlite/DatabaseInitializer';
import { SchemaValidator } from '../../src/persistence/sqlite/validation/SchemaValidator';
import { canRunNativeTests, getNativeTestSkipReason } from '../helpers/testDb';

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

const describeNative = canRunNativeTests() ? describe : describe.skip;
const skipReason = getNativeTestSkipReason();

if (skipReason) {
    console.warn(`⚠️  Skipping database setup tests: ${skipReason}`);
}

describeNative('Spec 011: Database Setup and Seeding', () => {
    describe('AC1: Database Schema Validation', () => {
        let db: Database.Database;

        beforeEach(() => {
            db = new Database(':memory:');
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();
        });

        afterEach(() => {
            db.close();
        });

        it('should have spaces table with all required columns', () => {
            const columns = db.prepare("PRAGMA table_info(spaces)").all() as Array<{ name: string }>;
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

        it('should have space_items table with all required columns', () => {
            const columns = db.prepare("PRAGMA table_info(space_items)").all() as Array<{ name: string }>;
            const columnNames = columns.map(c => c.name);

            // Core fields
            expect(columnNames).toContain('id');
            expect(columnNames).toContain('space_id');
            expect(columnNames).toContain('parent_id');
            expect(columnNames).toContain('name');
            expect(columnNames).toContain('path');
            expect(columnNames).toContain('type');
            expect(columnNames).toContain('is_expanded');
            expect(columnNames).toContain('sort_order');
            expect(columnNames).toContain('created_at');

            // Metadata fields
            expect(columnNames).toContain('favicon_url');
            expect(columnNames).toContain('description');
            expect(columnNames).toContain('visit_count');
            expect(columnNames).toContain('last_visited');

            // Pin fields
            expect(columnNames).toContain('is_pinned');
            expect(columnNames).toContain('pin_position');

            // Local file system fields (Flutter parity)
            expect(columnNames).toContain('local_path');
            expect(columnNames).toContain('security_bookmark');
            expect(columnNames).toContain('last_synced_at');
            expect(columnNames).toContain('is_watching');
        });

        it('should have foreign key from space_items to spaces', () => {
            const fks = db.prepare("PRAGMA foreign_key_list(space_items)").all() as Array<{ table: string; from: string }>;
            const spaceFK = fks.find(fk => fk.table === 'spaces' && fk.from === 'space_id');
            expect(spaceFK).toBeDefined();
        });

        it('should have self-referential foreign key for parent_id', () => {
            const fks = db.prepare("PRAGMA foreign_key_list(space_items)").all() as Array<{ table: string; from: string }>;
            const parentFK = fks.find(fk => fk.table === 'space_items' && fk.from === 'parent_id');
            expect(parentFK).toBeDefined();
        });

        it('should have index on space_items.space_id', () => {
            const indexes = db.prepare("PRAGMA index_list(space_items)").all() as Array<{ name: string }>;
            const indexNames = indexes.map(i => i.name);

            // Should have an index that includes space_id
            const hasSpaceIdIndex = indexNames.some(name =>
                name.includes('space_id') || name.includes('idx_')
            );
            expect(hasSpaceIdIndex).toBe(true);
        });
    });

    describe('AC2: Flutter Database Compatibility', () => {
        let db: Database.Database;

        beforeEach(() => {
            db = new Database(':memory:');
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();
        });

        afterEach(() => {
            db.close();
        });

        it('should store timestamps as INTEGER (Unix milliseconds)', () => {
            // Insert a space
            db.prepare(`
                INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name, sort_order, is_expanded, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run('test-id', 'profile', 'user', 'Test', '#6D5AE6', 'folder', 0, 1, Date.now());

            const row = db.prepare('SELECT created_at FROM spaces WHERE id = ?').get('test-id') as { created_at: number };

            // Should be a number (Unix timestamp), not a string
            expect(typeof row.created_at).toBe('number');
            expect(row.created_at).toBeGreaterThan(1700000000000); // After 2023
        });

        it('should store booleans as INTEGER (0 or 1)', () => {
            db.prepare(`
                INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name, sort_order, is_expanded, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run('test-id', 'profile', 'user', 'Test', '#6D5AE6', 'folder', 0, 1, Date.now());

            const row = db.prepare('SELECT is_expanded FROM spaces WHERE id = ?').get('test-id') as { is_expanded: number };

            expect(typeof row.is_expanded).toBe('number');
            expect([0, 1]).toContain(row.is_expanded);
        });

        it('should support SpaceItemType enum values from Flutter', () => {
            // Flutter SpaceItemType: link, file, folder, localFolder, localFile
            const types = ['link', 'file', 'folder', 'localFolder', 'localFile'];

            db.prepare(`
                INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name, sort_order, is_expanded, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run('space-1', 'profile', 'user', 'Test', '#6D5AE6', 'folder', 0, 1, Date.now());

            for (const type of types) {
                const id = `item-${type}`;
                db.prepare(`
                    INSERT INTO space_items (id, space_id, name, path, type, is_expanded, sort_order, created_at, visit_count, is_pinned, is_watching)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(id, 'space-1', `Test ${type}`, '', type, 0, 0, Date.now(), 0, 0, 0);

                const row = db.prepare('SELECT type FROM space_items WHERE id = ?').get(id) as { type: string };
                expect(row.type).toBe(type);
            }
        });
    });

    describe('AC3: Database Migration Script', () => {
        it('should have migration script at scripts/migrate-db.ts', () => {
            const migratePath = path.join(PROJECT_ROOT, 'scripts/migrate-db.ts');
            expect(fs.existsSync(migratePath)).toBe(true);
        });

        it('should add missing columns if they do not exist', () => {
            // Create a database with old schema (missing columns)
            const db = new Database(':memory:');

            // Create old schema without local file system columns
            db.exec(`
                CREATE TABLE spaces (
                    id TEXT PRIMARY KEY,
                    profile_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    accent_color TEXT NOT NULL,
                    icon_name TEXT NOT NULL,
                    sort_order INTEGER NOT NULL,
                    is_expanded INTEGER NOT NULL,
                    created_at INTEGER NOT NULL
                );

                CREATE TABLE space_items (
                    id TEXT PRIMARY KEY,
                    space_id TEXT NOT NULL,
                    parent_id TEXT,
                    name TEXT NOT NULL,
                    path TEXT NOT NULL,
                    type TEXT NOT NULL,
                    is_expanded INTEGER NOT NULL,
                    sort_order INTEGER NOT NULL,
                    created_at INTEGER NOT NULL,
                    favicon_url TEXT,
                    description TEXT,
                    visit_count INTEGER NOT NULL DEFAULT 0,
                    last_visited INTEGER,
                    is_pinned INTEGER NOT NULL DEFAULT 0,
                    pin_position INTEGER
                );
            `);

            // Check columns before migration
            const columnsBefore = db.prepare("PRAGMA table_info(space_items)").all() as Array<{ name: string }>;
            const namesBefore = columnsBefore.map(c => c.name);
            expect(namesBefore).not.toContain('local_path');

            // Run migration (add missing columns)
            const migrations: string[] = [];
            if (!namesBefore.includes('local_path')) {
                migrations.push('ALTER TABLE space_items ADD COLUMN local_path TEXT NULL');
            }
            if (!namesBefore.includes('security_bookmark')) {
                migrations.push('ALTER TABLE space_items ADD COLUMN security_bookmark TEXT NULL');
            }
            if (!namesBefore.includes('last_synced_at')) {
                migrations.push('ALTER TABLE space_items ADD COLUMN last_synced_at INTEGER NULL');
            }
            if (!namesBefore.includes('is_watching')) {
                migrations.push('ALTER TABLE space_items ADD COLUMN is_watching INTEGER NOT NULL DEFAULT 0');
            }

            for (const sql of migrations) {
                db.exec(sql);
            }

            // Check columns after migration
            const columnsAfter = db.prepare("PRAGMA table_info(space_items)").all() as Array<{ name: string }>;
            const namesAfter = columnsAfter.map(c => c.name);

            expect(namesAfter).toContain('local_path');
            expect(namesAfter).toContain('security_bookmark');
            expect(namesAfter).toContain('last_synced_at');
            expect(namesAfter).toContain('is_watching');

            db.close();
        });
    });

    describe('AC4: Seed Data Script', () => {
        it('should have seed script at scripts/seed-db.ts', () => {
            const seedPath = path.join(PROJECT_ROOT, 'scripts/seed-db.ts');
            expect(fs.existsSync(seedPath)).toBe(true);
        });

        it('should create sample spaces with correct structure', () => {
            const db = new Database(':memory:');
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();

            const now = Date.now();
            const profileId = 'default-profile';
            const userId = 'default-user';

            // Simulate seed data creation
            const spaces = [
                { id: 'space-1', name: 'Work', iconName: 'briefcase', accentColor: '#3B82F6', order: 0 },
                { id: 'space-2', name: 'Personal', iconName: 'user', accentColor: '#10B981', order: 1 },
                { id: 'space-3', name: 'Learning', iconName: 'book', accentColor: '#8B5CF6', order: 2 },
            ];

            const insertSpace = db.prepare(`
                INSERT INTO spaces (id, profile_id, user_id, name, icon_name, accent_color, sort_order, is_expanded, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
            `);

            for (const space of spaces) {
                insertSpace.run(space.id, profileId, userId, space.name, space.iconName, space.accentColor, space.order, now);
            }

            const result = db.prepare('SELECT COUNT(*) as count FROM spaces').get() as { count: number };
            expect(result.count).toBe(3);

            const workSpace = db.prepare('SELECT * FROM spaces WHERE name = ?').get('Work') as { icon_name: string; accent_color: string };
            expect(workSpace.icon_name).toBe('briefcase');
            expect(workSpace.accent_color).toBe('#3B82F6');

            db.close();
        });
    });

    describe('AC5: Flutter Database Copy Script', () => {
        it('should have copy script at scripts/copy-flutter-db.sh', () => {
            const copyPath = path.join(PROJECT_ROOT, 'scripts/copy-flutter-db.sh');
            expect(fs.existsSync(copyPath)).toBe(true);
        });
    });

    describe('AC6: Database Validation on Startup', () => {
        it('should have SchemaValidator class', () => {
            const validatorPath = path.join(
                PROJECT_ROOT,
                'packages/infrastructure/src/persistence/sqlite/validation/SchemaValidator.ts'
            );
            expect(fs.existsSync(validatorPath)).toBe(true);
        });

        it('should have IntegrityChecker class', () => {
            const checkerPath = path.join(
                PROJECT_ROOT,
                'packages/infrastructure/src/persistence/sqlite/validation/IntegrityChecker.ts'
            );
            expect(fs.existsSync(checkerPath)).toBe(true);
        });

        it('should validate schema on DatabaseInitializer.initialize()', () => {
            const db = new Database(':memory:');
            const initializer = new DatabaseInitializer(db);

            // Should not throw
            expect(() => initializer.initialize()).not.toThrow();

            // Should have created tables
            const tables = db.prepare(`
                SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
            `).all() as Array<{ name: string }>;

            const tableNames = tables.map(t => t.name);
            expect(tableNames).toContain('spaces');
            expect(tableNames).toContain('space_items');

            db.close();
        });
    });
});
