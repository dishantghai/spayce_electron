import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { SqliteSpacesRepository } from '../src/persistence/sqlite/SqliteSpacesRepository';
import { SqliteSpaceItemsRepository } from '../src/persistence/sqlite/SqliteSpaceItemsRepository';
import { DatabaseInitializer } from '../src/persistence/sqlite/DatabaseInitializer';
import type { SpaceEntity, SpaceItemEntity } from '@spayce/core';
import { SpaceItemType } from '@spayce/core';
import { canRunNativeTests, getNativeTestSkipReason } from './helpers/testDb';

const describeNative = canRunNativeTests() ? describe : describe.skip;
const skipReason = getNativeTestSkipReason();

if (skipReason) {
    console.warn(`⚠️  Skipping native DB tests: ${skipReason}`);
}

describeNative('SqliteSpacesRepository', () => {
    let db: Database.Database;
    let repository: SqliteSpacesRepository;

    beforeEach(() => {
        db = new Database(':memory:');
        const initializer = new DatabaseInitializer(db);
        initializer.initialize();
        repository = new SqliteSpacesRepository(db);
    });

    afterEach(() => {
        db.close();
    });

    describe('createSpace', () => {
        it('should create a space and return it with createdAt', async () => {
            const input = {
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            };

            const result = await repository.createSpace(input);

            expect(result.id).toBe('space-1');
            expect(result.name).toBe('Test Space');
            expect(result.createdAt).toBeInstanceOf(Date);
        });

        it('should persist space to database', async () => {
            await repository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });

            const retrieved = await repository.getSpaceById('space-1');
            expect(retrieved).not.toBeNull();
            expect(retrieved?.name).toBe('Test Space');
        });
    });

    describe('getAllSpaces', () => {
        it('should return all spaces for a profile', async () => {
            await repository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Space 1',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });
            await repository.createSpace({
                id: 'space-2',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Space 2',
                accentColor: '#FF0000',
                iconName: 'star',
                order: 1,
                isExpanded: false,
            });

            const spaces = await repository.getAllSpaces('profile-1');

            expect(spaces).toHaveLength(2);
            expect(spaces[0].name).toBe('Space 1');
            expect(spaces[1].name).toBe('Space 2');
        });

        it('should return empty array for profile with no spaces', async () => {
            const spaces = await repository.getAllSpaces('nonexistent');
            expect(spaces).toHaveLength(0);
        });

        it('should order by sort_order', async () => {
            await repository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Second',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 1,
                isExpanded: true,
            });
            await repository.createSpace({
                id: 'space-2',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'First',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });

            const spaces = await repository.getAllSpaces('profile-1');

            expect(spaces[0].name).toBe('First');
            expect(spaces[1].name).toBe('Second');
        });
    });

    describe('getSpaceById', () => {
        it('should return space by id', async () => {
            await repository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });

            const space = await repository.getSpaceById('space-1');

            expect(space).not.toBeNull();
            expect(space?.name).toBe('Test Space');
            expect(space?.accentColor).toBe('#6D5AE6');
        });

        it('should return null for nonexistent id', async () => {
            const space = await repository.getSpaceById('nonexistent');
            expect(space).toBeNull();
        });
    });

    describe('searchSpaces', () => {
        beforeEach(async () => {
            await repository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Work Projects',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });
            await repository.createSpace({
                id: 'space-2',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Personal',
                accentColor: '#FF0000',
                iconName: 'star',
                order: 1,
                isExpanded: true,
            });
        });

        it('should find spaces matching query', async () => {
            const results = await repository.searchSpaces('profile-1', 'Work');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Work Projects');
        });

        it('should be case-insensitive', async () => {
            const results = await repository.searchSpaces('profile-1', 'work');
            expect(results).toHaveLength(1);
        });

        it('should return empty array for no matches', async () => {
            const results = await repository.searchSpaces('profile-1', 'xyz');
            expect(results).toHaveLength(0);
        });
    });

    describe('updateSpace', () => {
        it('should update space properties', async () => {
            const created = await repository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Original',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });

            await repository.updateSpace({
                ...created,
                name: 'Updated',
                accentColor: '#FF0000',
            });

            const updated = await repository.getSpaceById('space-1');
            expect(updated?.name).toBe('Updated');
            expect(updated?.accentColor).toBe('#FF0000');
        });

        it('should throw error for nonexistent space', async () => {
            const fakeSpace: SpaceEntity = {
                id: 'nonexistent',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
            };

            await expect(repository.updateSpace(fakeSpace)).rejects.toThrow();
        });
    });

    describe('deleteSpace', () => {
        it('should delete space', async () => {
            await repository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });

            await repository.deleteSpace('space-1');

            const space = await repository.getSpaceById('space-1');
            expect(space).toBeNull();
        });

        it('should not throw for nonexistent space', async () => {
            await expect(repository.deleteSpace('nonexistent')).resolves.toBeUndefined();
        });
    });

    describe('reorderSpaces', () => {
        it('should update sort order of spaces', async () => {
            await repository.createSpace({
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'First',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
            });
            await repository.createSpace({
                id: 'space-2',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Second',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 1,
                isExpanded: true,
            });

            await repository.reorderSpaces('profile-1', ['space-2', 'space-1']);

            const spaces = await repository.getAllSpaces('profile-1');
            expect(spaces[0].id).toBe('space-2');
            expect(spaces[1].id).toBe('space-1');
        });
    });
});

describe('SqliteSpaceItemsRepository', () => {
    let db: Database.Database;
    let spacesRepo: SqliteSpacesRepository;
    let itemsRepo: SqliteSpaceItemsRepository;

    beforeEach(async () => {
        db = new Database(':memory:');
        const initializer = new DatabaseInitializer(db);
        initializer.initialize();
        spacesRepo = new SqliteSpacesRepository(db);
        itemsRepo = new SqliteSpaceItemsRepository(db);

        await spacesRepo.createSpace({
            id: 'space-1',
            profileId: 'profile-1',
            userId: 'user-1',
            name: 'Test Space',
            accentColor: '#6D5AE6',
            iconName: 'folder',
            order: 0,
            isExpanded: true,
        });
    });

    afterEach(() => {
        db.close();
    });

    describe('createItem', () => {
        it('should create an item and return it with createdAt', async () => {
            const input = {
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test Link',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            const result = await itemsRepo.createItem(input);

            expect(result.id).toBe('item-1');
            expect(result.name).toBe('Test Link');
            expect(result.createdAt).toBeInstanceOf(Date);
        });
    });

    describe('getItemsBySpaceId', () => {
        it('should return all items for a space', async () => {
            await itemsRepo.createItem({
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Item 1',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            const items = await itemsRepo.getItemsBySpaceId('space-1');

            expect(items).toHaveLength(1);
            expect(items[0].name).toBe('Item 1');
        });
    });

    describe('getItemById', () => {
        it('should return item by id', async () => {
            await itemsRepo.createItem({
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test Item',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: 'https://example.com/favicon.ico',
                description: 'A test item',
                visitCount: 5,
                lastVisited: new Date('2024-01-01'),
                isPinned: true,
                pinPosition: 0,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            const item = await itemsRepo.getItemById('item-1');

            expect(item).not.toBeNull();
            expect(item?.name).toBe('Test Item');
            expect(item?.faviconUrl).toBe('https://example.com/favicon.ico');
            expect(item?.visitCount).toBe(5);
            expect(item?.isPinned).toBe(true);
        });

        it('should return null for nonexistent id', async () => {
            const item = await itemsRepo.getItemById('nonexistent');
            expect(item).toBeNull();
        });
    });

    describe('getItemChildren', () => {
        it('should return children of a parent item', async () => {
            await itemsRepo.createItem({
                id: 'folder-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Folder',
                path: '',
                type: SpaceItemType.Folder,
                isExpanded: true,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });
            await itemsRepo.createItem({
                id: 'child-1',
                spaceId: 'space-1',
                parentId: 'folder-1',
                name: 'Child Item',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            const children = await itemsRepo.getItemChildren('folder-1');

            expect(children).toHaveLength(1);
            expect(children[0].name).toBe('Child Item');
        });
    });

    describe('getPinnedItems', () => {
        it('should return only pinned items for a space', async () => {
            await itemsRepo.createItem({
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Pinned',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: true,
                pinPosition: 0,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });
            await itemsRepo.createItem({
                id: 'item-2',
                spaceId: 'space-1',
                parentId: null,
                name: 'Not Pinned',
                path: 'https://example2.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 1,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            const pinned = await itemsRepo.getPinnedItems('space-1');

            expect(pinned).toHaveLength(1);
            expect(pinned[0].name).toBe('Pinned');
        });
    });

    describe('deleteItem', () => {
        it('should delete item and its children recursively', async () => {
            await itemsRepo.createItem({
                id: 'folder-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Folder',
                path: '',
                type: SpaceItemType.Folder,
                isExpanded: true,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });
            await itemsRepo.createItem({
                id: 'child-1',
                spaceId: 'space-1',
                parentId: 'folder-1',
                name: 'Child',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            await itemsRepo.deleteItem('folder-1');

            expect(await itemsRepo.getItemById('folder-1')).toBeNull();
            expect(await itemsRepo.getItemById('child-1')).toBeNull();
        });
    });

    describe('pinItem and unpinItem', () => {
        it('should pin an item', async () => {
            await itemsRepo.createItem({
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            await itemsRepo.pinItem('item-1', 5);

            const item = await itemsRepo.getItemById('item-1');
            expect(item?.isPinned).toBe(true);
            expect(item?.pinPosition).toBe(5);
        });

        it('should unpin an item', async () => {
            await itemsRepo.createItem({
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: true,
                pinPosition: 0,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            await itemsRepo.unpinItem('item-1');

            const item = await itemsRepo.getItemById('item-1');
            expect(item?.isPinned).toBe(false);
            expect(item?.pinPosition).toBeNull();
        });
    });

    describe('incrementVisitCount', () => {
        it('should increment visit count and update lastVisited', async () => {
            await itemsRepo.createItem({
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            await itemsRepo.incrementVisitCount('item-1');

            const item = await itemsRepo.getItemById('item-1');
            expect(item?.visitCount).toBe(1);
            expect(item?.lastVisited).toBeInstanceOf(Date);
        });
    });
});
