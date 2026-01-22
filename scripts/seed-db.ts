#!/usr/bin/env npx ts-node
/**
 * Database Seed Script
 * 
 * Seeds the SQLite database with sample data for development/testing.
 * Run with: npx ts-node scripts/seed-db.ts
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../resources/db/spaces.sqlite');

interface SeedSpace {
    id: string;
    name: string;
    iconName: string;
    accentColor: string;
}

interface SeedItem {
    id: string;
    spaceId: string;
    parentId: string | null;
    name: string;
    path: string;
    type: 'link' | 'folder' | 'file' | 'localFolder' | 'localFile';
}

function seed(dbPath: string): void {
    console.log(`Seeding database at: ${dbPath}`);

    if (!fs.existsSync(dbPath)) {
        console.error(`Database file not found: ${dbPath}`);
        console.log('Creating new database...');
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }

    const db = new Database(dbPath);

    try {
        const profileId = 'default-profile';
        const userId = 'default-user';
        const now = Date.now();

        // Sample spaces
        const spaces: SeedSpace[] = [
            { id: randomUUID(), name: 'Work', iconName: 'briefcase', accentColor: '#3B82F6' },
            { id: randomUUID(), name: 'Personal', iconName: 'user', accentColor: '#10B981' },
            { id: randomUUID(), name: 'Learning', iconName: 'book-open', accentColor: '#8B5CF6' },
        ];

        // Insert spaces
        const insertSpace = db.prepare(`
            INSERT OR REPLACE INTO spaces (id, profile_id, user_id, name, icon_name, accent_color, sort_order, is_expanded, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        `);

        for (let i = 0; i < spaces.length; i++) {
            const space = spaces[i];
            insertSpace.run(space.id, profileId, userId, space.name, space.iconName, space.accentColor, i, now);
            console.log(`Created space: ${space.name}`);
        }

        // Sample items for Work space
        const workItems: SeedItem[] = [
            { id: randomUUID(), spaceId: spaces[0].id, parentId: null, name: 'GitHub', path: 'https://github.com', type: 'link' },
            { id: randomUUID(), spaceId: spaces[0].id, parentId: null, name: 'Jira', path: 'https://jira.atlassian.com', type: 'link' },
            { id: randomUUID(), spaceId: spaces[0].id, parentId: null, name: 'Projects', path: '', type: 'folder' },
        ];

        // Sample items for Personal space
        const personalItems: SeedItem[] = [
            { id: randomUUID(), spaceId: spaces[1].id, parentId: null, name: 'YouTube', path: 'https://youtube.com', type: 'link' },
            { id: randomUUID(), spaceId: spaces[1].id, parentId: null, name: 'Netflix', path: 'https://netflix.com', type: 'link' },
        ];

        // Sample items for Learning space
        const learningItems: SeedItem[] = [
            { id: randomUUID(), spaceId: spaces[2].id, parentId: null, name: 'MDN Web Docs', path: 'https://developer.mozilla.org', type: 'link' },
            { id: randomUUID(), spaceId: spaces[2].id, parentId: null, name: 'TypeScript Docs', path: 'https://www.typescriptlang.org/docs/', type: 'link' },
            { id: randomUUID(), spaceId: spaces[2].id, parentId: null, name: 'React Docs', path: 'https://react.dev', type: 'link' },
        ];

        const allItems = [...workItems, ...personalItems, ...learningItems];

        // Insert items
        const insertItem = db.prepare(`
            INSERT OR REPLACE INTO space_items (
                id, space_id, parent_id, name, path, type, is_expanded, sort_order, created_at,
                favicon_url, description, visit_count, last_visited,
                is_pinned, pin_position,
                local_path, security_bookmark, last_synced_at, is_watching
            ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, 0)
        `);

        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            insertItem.run(item.id, item.spaceId, item.parentId, item.name, item.path, item.type, i, now);
            console.log(`Created item: ${item.name}`);
        }

        console.log(`\nSeeding completed: ${spaces.length} spaces, ${allItems.length} items`);

    } finally {
        db.close();
    }
}

// Run seed
seed(DB_PATH);
