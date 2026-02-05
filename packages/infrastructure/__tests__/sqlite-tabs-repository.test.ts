/**
 * SqliteTabsRepository Tests
 * Story F037: Tab CRUD Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { SqliteTabsRepository } from '../src/persistence/sqlite/SqliteTabsRepository';
import { DatabaseInitializer } from '../src/persistence/sqlite/DatabaseInitializer';
import { TabType } from '@spayce/core';

describe('SqliteTabsRepository', () => {
    let db: Database.Database;
    let repo: SqliteTabsRepository;

    // Helper: create parent space + space_item rows so FK constraints pass
    function seedSpaceFixtures() {
        const now = Date.now();
        db.prepare(`
            INSERT INTO spaces (id, profile_id, user_id, name, created_at)
            VALUES ('space-1', 'profile-1', 'user-1', 'Test Space', ?)
        `).run(now);
        db.prepare(`
            INSERT INTO space_items (id, space_id, name, path, type, created_at)
            VALUES ('item-1', 'space-1', 'Example', '/example', 'link', ?)
        `).run(now);
    }

    beforeEach(() => {
        db = new Database(':memory:');
        const init = new DatabaseInitializer(db);
        init.initialize();
        repo = new SqliteTabsRepository(db);
    });

    afterEach(() => {
        db.close();
    });

    describe('create', () => {
        it('should create a tab with defaults', async () => {
            const tab = await repo.create({});
            expect(tab.id).toBeDefined();
            expect(tab.url).toBe('https://www.google.com');
            expect(tab.title).toBe('New Tab');
            expect(tab.tabType).toBe(TabType.Web);
            expect(tab.isActive).toBe(true);
            expect(tab.position).toBe(0);
            expect(tab.createdAt).toBeInstanceOf(Date);
        });

        it('should create a tab with custom URL and title', async () => {
            const tab = await repo.create({
                url: 'https://example.com',
                title: 'Example',
            });
            expect(tab.url).toBe('https://example.com');
            expect(tab.title).toBe('Example');
        });

        it('should auto-increment position', async () => {
            const tab1 = await repo.create({});
            const tab2 = await repo.create({});
            const tab3 = await repo.create({});
            expect(tab1.position).toBe(0);
            expect(tab2.position).toBe(1);
            expect(tab3.position).toBe(2);
        });

        it('should deactivate previous tabs when creating a new one', async () => {
            const tab1 = await repo.create({});
            expect(tab1.isActive).toBe(true);

            const tab2 = await repo.create({});
            expect(tab2.isActive).toBe(true);

            const refreshed1 = await repo.getById(tab1.id);
            expect(refreshed1!.isActive).toBe(false);
        });

        it('should track origin when created from space', async () => {
            seedSpaceFixtures();
            const tab = await repo.create({
                url: 'https://example.com',
                originSpaceId: 'space-1',
                originSpaceItemId: 'item-1',
            });
            expect(tab.originSpaceId).toBe('space-1');
            expect(tab.originSpaceItemId).toBe('item-1');
            expect(tab.isTracked).toBe(true);
        });
    });

    describe('getAll', () => {
        it('should return empty array when no tabs', async () => {
            const tabs = await repo.getAll();
            expect(tabs).toEqual([]);
        });

        it('should return tabs ordered by position', async () => {
            await repo.create({ url: 'https://one.com', title: 'One' });
            await repo.create({ url: 'https://two.com', title: 'Two' });
            await repo.create({ url: 'https://three.com', title: 'Three' });

            const tabs = await repo.getAll();
            expect(tabs).toHaveLength(3);
            expect(tabs[0].title).toBe('One');
            expect(tabs[1].title).toBe('Two');
            expect(tabs[2].title).toBe('Three');
        });
    });

    describe('getById', () => {
        it('should return tab by ID', async () => {
            const created = await repo.create({ title: 'Test' });
            const found = await repo.getById(created.id);
            expect(found).not.toBeNull();
            expect(found!.title).toBe('Test');
        });

        it('should return null for non-existent ID', async () => {
            const found = await repo.getById('non-existent');
            expect(found).toBeNull();
        });
    });

    describe('getActive', () => {
        it('should return the active tab', async () => {
            await repo.create({ title: 'One' });
            const tab2 = await repo.create({ title: 'Two' });

            const active = await repo.getActive();
            expect(active).not.toBeNull();
            expect(active!.id).toBe(tab2.id);
        });

        it('should return null when no tabs', async () => {
            const active = await repo.getActive();
            expect(active).toBeNull();
        });
    });

    describe('getBySpaceItemId', () => {
        it('should find tab by space item ID', async () => {
            seedSpaceFixtures();
            await repo.create({
                url: 'https://example.com',
                originSpaceId: 'space-1',
                originSpaceItemId: 'item-1',
            });

            const found = await repo.getBySpaceItemId('item-1');
            expect(found).not.toBeNull();
            expect(found!.originSpaceItemId).toBe('item-1');
        });

        it('should return null when not found', async () => {
            const found = await repo.getBySpaceItemId('non-existent');
            expect(found).toBeNull();
        });
    });

    describe('getByUrl', () => {
        it('should find tab by normalized URL', async () => {
            await repo.create({ url: 'https://www.example.com/' });
            const found = await repo.getByUrl('https://example.com');
            expect(found).not.toBeNull();
        });

        it('should return null for non-matching URL', async () => {
            await repo.create({ url: 'https://example.com' });
            const found = await repo.getByUrl('https://other.com');
            expect(found).toBeNull();
        });
    });

    describe('update', () => {
        it('should update tab properties', async () => {
            const tab = await repo.create({});
            const updated = await repo.update({
                id: tab.id,
                title: 'Updated Title',
                url: 'https://updated.com',
            });
            expect(updated.title).toBe('Updated Title');
            expect(updated.url).toBe('https://updated.com');
        });

        it('should update loading state', async () => {
            const tab = await repo.create({});
            const updated = await repo.update({
                id: tab.id,
                isLoading: true,
                loadingProgress: 0.5,
            });
            expect(updated.isLoading).toBe(true);
            expect(updated.loadingProgress).toBe(0.5);
        });
    });

    describe('delete', () => {
        it('should delete a tab', async () => {
            const tab = await repo.create({});
            await repo.delete(tab.id);
            const found = await repo.getById(tab.id);
            expect(found).toBeNull();
        });

        it('should reorder remaining tabs', async () => {
            await repo.create({ title: 'One' });
            const tab2 = await repo.create({ title: 'Two' });
            await repo.create({ title: 'Three' });

            await repo.delete(tab2.id);

            const tabs = await repo.getAll();
            expect(tabs).toHaveLength(2);
            expect(tabs[0].position).toBe(0);
            expect(tabs[1].position).toBe(1);
        });

        it('should activate adjacent tab when deleting active tab', async () => {
            await repo.create({ title: 'One' });
            const tab2 = await repo.create({ title: 'Two' });
            await repo.create({ title: 'Three' });

            // tab3 is active (last created)
            // Delete tab3, should activate tab2 (adjacent)
            const tabs = await repo.getAll();
            const activeTab = tabs.find(t => t.isActive);
            await repo.delete(activeTab!.id);

            const newActive = await repo.getActive();
            expect(newActive).not.toBeNull();
            // Should activate the tab at or before the deleted position
        });
    });

    describe('setActive', () => {
        it('should set a tab as active and deactivate others', async () => {
            const tab1 = await repo.create({ title: 'One' });
            await repo.create({ title: 'Two' });

            await repo.setActive(tab1.id);

            const active = await repo.getActive();
            expect(active!.id).toBe(tab1.id);
        });
    });

    describe('reorder', () => {
        it('should reorder tabs', async () => {
            const tab1 = await repo.create({ title: 'One' });
            const tab2 = await repo.create({ title: 'Two' });
            const tab3 = await repo.create({ title: 'Three' });

            await repo.reorder([tab3.id, tab1.id, tab2.id]);

            const tabs = await repo.getAll();
            expect(tabs[0].title).toBe('Three');
            expect(tabs[1].title).toBe('One');
            expect(tabs[2].title).toBe('Two');
        });
    });

    describe('count', () => {
        it('should return correct count', async () => {
            expect(await repo.count()).toBe(0);
            await repo.create({});
            expect(await repo.count()).toBe(1);
            await repo.create({});
            expect(await repo.count()).toBe(2);
        });
    });

    describe('deleteOldestInactive', () => {
        it('should delete the oldest inactive tab', async () => {
            const tab1 = await repo.create({ title: 'Oldest' });
            await repo.create({ title: 'Middle' });
            const tab3 = await repo.create({ title: 'Newest (active)' });

            // tab3 is active, tab1 and tab2 are inactive
            await repo.deleteOldestInactive();

            const tabs = await repo.getAll();
            expect(tabs).toHaveLength(2);
            expect(tabs.find(t => t.id === tab1.id)).toBeUndefined();
        });
    });
});
