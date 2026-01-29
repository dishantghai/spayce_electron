import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { SchemaValidator } from '../src/persistence/sqlite/validation/SchemaValidator';
import { IntegrityChecker } from '../src/persistence/sqlite/validation/IntegrityChecker';
import { DatabaseInitializer } from '../src/persistence/sqlite/DatabaseInitializer';
import { canRunNativeTests, getNativeTestSkipReason } from './helpers/testDb';

const describeNative = canRunNativeTests() ? describe : describe.skip;
const skipReason = getNativeTestSkipReason();

if (skipReason) {
    console.warn(`⚠️  Skipping validation tests: ${skipReason}`);
}

describeNative('SchemaValidator', () => {
    let db: Database.Database;

    beforeEach(() => {
        db = new Database(':memory:');
    });

    afterEach(() => {
        db.close();
    });

    describe('validateSchema', () => {
        it('should return valid for correct schema', () => {
            const initializer = new DatabaseInitializer(db);
            initializer.initialize();

            const validator = new SchemaValidator(db);
            const result = validator.validateSchema();

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect missing tables', () => {
            const validator = new SchemaValidator(db);
            const result = validator.validateSchema();

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Required table 'spaces' not found");
            expect(result.errors).toContain("Required table 'space_items' not found");
            expect(result.errors).toContain("Required table 'migrations' not found");
        });

        it('should detect missing columns', () => {
            db.exec(`
                CREATE TABLE spaces (id TEXT PRIMARY KEY);
                CREATE TABLE space_items (id TEXT PRIMARY KEY);
                CREATE TABLE migrations (id TEXT PRIMARY KEY);
            `);

            const validator = new SchemaValidator(db);
            const result = validator.validateSchema();

            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("Missing column 'profile_id'"))).toBe(true);
        });
    });
});

describeNative('IntegrityChecker', () => {
    let db: Database.Database;

    beforeEach(() => {
        db = new Database(':memory:');
        const initializer = new DatabaseInitializer(db);
        initializer.initialize();
    });

    afterEach(() => {
        db.close();
    });

    describe('performIntegrityCheck', () => {
        it('should return valid for empty database', () => {
            const checker = new IntegrityChecker(db);
            const result = checker.performIntegrityCheck();

            expect(result.isValid).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        it('should return valid for valid data', () => {
            db.prepare(
                `
                INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name, sort_order, is_expanded, created_at)
                VALUES ('space-1', 'profile-1', 'user-1', 'Test', '#6D5AE6', 'folder', 0, 1, ?)
            `
            ).run(Date.now());

            db.prepare(
                `
                INSERT INTO space_items (id, space_id, parent_id, name, path, type, is_expanded, sort_order, created_at, is_pinned, visit_count, is_watching)
                VALUES ('item-1', 'space-1', NULL, 'Test Item', 'https://example.com', 'link', 0, 0, ?, 0, 0, 0)
            `
            ).run(Date.now());

            const checker = new IntegrityChecker(db);
            const result = checker.performIntegrityCheck();

            expect(result.isValid).toBe(true);
        });

        it('should detect orphaned items', () => {
            // Disable foreign keys temporarily to insert orphaned data
            db.pragma('foreign_keys = OFF');
            db.prepare(
                `
                INSERT INTO space_items (id, space_id, parent_id, name, path, type, is_expanded, sort_order, created_at, is_pinned, visit_count, is_watching)
                VALUES ('item-1', 'nonexistent-space', NULL, 'Orphan', 'https://example.com', 'link', 0, 0, ?, 0, 0, 0)
            `
            ).run(Date.now());
            db.pragma('foreign_keys = ON');

            const checker = new IntegrityChecker(db);
            const result = checker.performIntegrityCheck();

            expect(result.isValid).toBe(false);
            expect(result.issues.some((i) => i.type === 'foreign_key_violation')).toBe(true);
        });

        it('should detect invalid color formats', () => {
            db.prepare(
                `
                INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name, sort_order, is_expanded, created_at)
                VALUES ('space-1', 'profile-1', 'user-1', 'Test', 'invalid-color', 'folder', 0, 1, ?)
            `
            ).run(Date.now());

            const checker = new IntegrityChecker(db);
            const result = checker.performIntegrityCheck();

            expect(result.issues.some((i) => i.type === 'invalid_format')).toBe(true);
        });
    });
});
