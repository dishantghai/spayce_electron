#!/usr/bin/env npx ts-node
/**
 * Database Migration Script
 * 
 * Migrates the SQLite database schema to add missing columns for Flutter parity.
 * Run with: npx ts-node scripts/migrate-db.ts
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../resources/db/spaces.sqlite');

interface ColumnInfo {
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
}

function getTableColumns(db: Database.Database, tableName: string): string[] {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as ColumnInfo[];
    return columns.map(c => c.name);
}

function migrate(dbPath: string): void {
    console.log(`Migrating database at: ${dbPath}`);

    if (!fs.existsSync(dbPath)) {
        console.error(`Database file not found: ${dbPath}`);
        process.exit(1);
    }

    const db = new Database(dbPath);

    try {
        // Enable foreign keys
        db.pragma('foreign_keys = ON');

        // Get current columns
        const spaceItemColumns = getTableColumns(db, 'space_items');
        console.log('Current space_items columns:', spaceItemColumns);

        // Migrations for Flutter parity
        const migrations: { column: string; sql: string }[] = [
            {
                column: 'local_path',
                sql: 'ALTER TABLE space_items ADD COLUMN local_path TEXT NULL',
            },
            {
                column: 'security_bookmark',
                sql: 'ALTER TABLE space_items ADD COLUMN security_bookmark TEXT NULL',
            },
            {
                column: 'last_synced_at',
                sql: 'ALTER TABLE space_items ADD COLUMN last_synced_at INTEGER NULL',
            },
            {
                column: 'is_watching',
                sql: 'ALTER TABLE space_items ADD COLUMN is_watching INTEGER NOT NULL DEFAULT 0',
            },
        ];

        let migrationsRun = 0;

        for (const migration of migrations) {
            if (!spaceItemColumns.includes(migration.column)) {
                console.log(`Adding column: ${migration.column}`);
                db.exec(migration.sql);
                migrationsRun++;
            } else {
                console.log(`Column already exists: ${migration.column}`);
            }
        }

        // Verify migrations
        const updatedColumns = getTableColumns(db, 'space_items');
        console.log('\nUpdated space_items columns:', updatedColumns);
        console.log(`\nMigrations completed: ${migrationsRun}`);

        // Run integrity check
        const integrityResult = db.pragma('integrity_check') as { integrity_check: string }[];
        if (integrityResult[0]?.integrity_check === 'ok') {
            console.log('Database integrity check: PASSED');
        } else {
            console.error('Database integrity check: FAILED', integrityResult);
        }

    } finally {
        db.close();
    }
}

// Run migration
migrate(DB_PATH);
