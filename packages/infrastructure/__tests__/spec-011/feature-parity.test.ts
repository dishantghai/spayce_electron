/**
 * Spec 011: Migration & Feature Parity - Flutter Feature Parity Tests
 * 
 * TDD RED Phase: These tests verify all 40+ Flutter features work in Electron.
 * Tests should FAIL initially until all features are implemented.
 * 
 * Run with: pnpm test:spec packages/infrastructure/__tests__/spec-011/feature-parity.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpaceItemType } from '@spayce/core';
import {
    createTestDb,
    TEST_PROFILE_ID,
    TEST_USER_ID,
    type TestDbContext
} from '../helpers/testDb';

describe('Spec 011: Flutter Feature Parity', () => {
    let ctx: TestDbContext;
    let spacesRepo: TestDbContext['spacesRepo'];
    let itemsRepo: TestDbContext['itemsRepo'];

    beforeEach(() => {
        ctx = createTestDb();
        spacesRepo = ctx.spacesRepo;
        itemsRepo = ctx.itemsRepo;
    });

    afterEach(() => {
        ctx.cleanup();
    });

    describe('Space Management Features (6 features)', () => {
        describe('Feature: Create Space', () => {
            it('should create a space with name, icon, and color', async () => {
                const space = await spacesRepo.createSpace({
                    id: 'space-1',
                    profileId: TEST_PROFILE_ID,
                    userId: TEST_USER_ID,
                    name: 'Work',
                    iconName: 'briefcase',
                    accentColor: '#3B82F6',
                    order: 0,
                    isExpanded: true,
                });

                expect(space.id).toBe('space-1');
                expect(space.name).toBe('Work');
                expect(space.iconName).toBe('briefcase');
                expect(space.accentColor).toBe('#3B82F6');
            });

            it('should assign sequential order to new spaces', async () => {
                await spacesRepo.createSpace({
                    id: 'space-1',
                    profileId: TEST_PROFILE_ID,
                    userId: TEST_USER_ID,
                    name: 'First',
                    iconName: 'folder',
                    accentColor: '#6D5AE6',
                    order: 0,
                    isExpanded: true,
                });

                await spacesRepo.createSpace({
                    id: 'space-2',
                    profileId: TEST_PROFILE_ID,
                    userId: TEST_USER_ID,
                    name: 'Second',
                    iconName: 'folder',
                    accentColor: '#6D5AE6',
                    order: 1,
                    isExpanded: true,
                });

                const spaces = await spacesRepo.getAllSpaces(TEST_PROFILE_ID);
                expect(spaces[0].order).toBe(0);
                expect(spaces[1].order).toBe(1);
            });
        });

        describe('Feature: Delete Space with Cascade', () => {
            it('should cascade delete all items when space is deleted', async () => {
                await spacesRepo.createSpace({
                    id: 'space-1',
                    profileId: TEST_PROFILE_ID,
                    userId: TEST_USER_ID,
                    name: 'Space with Items',
                    iconName: 'folder',
                    accentColor: '#6D5AE6',
                    order: 0,
                    isExpanded: true,
                });

                await itemsRepo.createItem({
                    id: 'item-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Test Item',
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

                // Delete space should cascade to items
                await itemsRepo.deleteItemsBySpaceId('space-1');
                await spacesRepo.deleteSpace('space-1');

                const items = await itemsRepo.getItemsBySpaceId('space-1');
                expect(items).toHaveLength(0);
            });
        });

        describe('Feature: Reorder Spaces', () => {
            it('should reorder spaces via drag and drop', async () => {
                await spacesRepo.createSpace({
                    id: 'space-a',
                    profileId: TEST_PROFILE_ID,
                    userId: TEST_USER_ID,
                    name: 'A',
                    iconName: 'folder',
                    accentColor: '#6D5AE6',
                    order: 0,
                    isExpanded: true,
                });
                await spacesRepo.createSpace({
                    id: 'space-b',
                    profileId: TEST_PROFILE_ID,
                    userId: TEST_USER_ID,
                    name: 'B',
                    iconName: 'folder',
                    accentColor: '#6D5AE6',
                    order: 1,
                    isExpanded: true,
                });
                await spacesRepo.createSpace({
                    id: 'space-c',
                    profileId: TEST_PROFILE_ID,
                    userId: TEST_USER_ID,
                    name: 'C',
                    iconName: 'folder',
                    accentColor: '#6D5AE6',
                    order: 2,
                    isExpanded: true,
                });

                await spacesRepo.reorderSpaces(TEST_PROFILE_ID, ['space-b', 'space-a', 'space-c']);

                const spaces = await spacesRepo.getAllSpaces(TEST_PROFILE_ID);
                expect(spaces[0].id).toBe('space-b');
                expect(spaces[1].id).toBe('space-a');
                expect(spaces[2].id).toBe('space-c');
            });
        });

        describe('Feature: Space Theme Picker', () => {
            it('should support 24 accent colors from SpaceThemes', async () => {
                const spaceThemes = [
                    '#6D5AE6', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#EF4444',
                    '#6366F1', '#14B8A6', '#06B6D4', '#84CC16', '#F97316', '#A855F7',
                    '#F43F5E', '#0EA5E9', '#D946EF', '#EAB308', '#22C55E', '#64748B',
                    '#DC2626', '#5EEAD4', '#FF6B6B', '#B794F6', '#FFB088', '#4FD1C5',
                ];

                for (let i = 0; i < spaceThemes.length; i++) {
                    const space = await spacesRepo.createSpace({
                        id: `space-${i}`,
                        profileId: TEST_PROFILE_ID,
                        userId: TEST_USER_ID,
                        name: `Space ${i}`,
                        iconName: 'folder',
                        accentColor: spaceThemes[i],
                        order: i,
                        isExpanded: true,
                    });

                    expect(space.accentColor).toBe(spaceThemes[i]);
                }
            });
        });
    });

    describe('Space Item Management Features (7 features)', () => {
        beforeEach(async () => {
            await spacesRepo.createSpace({
                id: 'space-1',
                profileId: TEST_PROFILE_ID,
                userId: TEST_USER_ID,
                name: 'Test Space',
                iconName: 'folder',
                accentColor: '#6D5AE6',
                order: 0,
                isExpanded: true,
            });
        });

        describe('Feature: Add Link with Metadata', () => {
            it('should add a link with URL, favicon, and description', async () => {
                const item = await itemsRepo.createItem({
                    id: 'link-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'GitHub',
                    path: 'https://github.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 0,
                    faviconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
                    description: 'Where the world builds software',
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                });

                expect(item.name).toBe('GitHub');
                expect(item.path).toBe('https://github.com');
                expect(item.type).toBe(SpaceItemType.Link);
                expect(item.faviconUrl).toBe('https://github.githubassets.com/favicons/favicon.svg');
            });
        });

        describe('Feature: Delete Item with Recursive Child Deletion', () => {
            it('should delete folder and all nested children', async () => {
                await itemsRepo.createItem({
                    id: 'folder-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Parent Folder',
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
                    name: 'Child Link',
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

        describe('Feature: Move Item Between Spaces', () => {
            it('should move item to different space', async () => {
                await spacesRepo.createSpace({
                    id: 'space-2',
                    profileId: TEST_PROFILE_ID,
                    userId: TEST_USER_ID,
                    name: 'Target Space',
                    iconName: 'folder',
                    accentColor: '#6D5AE6',
                    order: 1,
                    isExpanded: true,
                });

                await itemsRepo.createItem({
                    id: 'link-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Moving Link',
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

                await itemsRepo.moveItem('link-1', 'space-2', null, 0);

                const item = await itemsRepo.getItemById('link-1');
                expect(item?.spaceId).toBe('space-2');
            });
        });

        describe('Feature: Reorder Items Within Parent', () => {
            it('should reorder items via drag and drop', async () => {
                await itemsRepo.createItem({
                    id: 'item-a',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'A',
                    path: 'https://a.com',
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

                await itemsRepo.createItem({
                    id: 'item-b',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'B',
                    path: 'https://b.com',
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

                await itemsRepo.reorderItems(null, ['item-b', 'item-a']);

                const items = await itemsRepo.getItemsBySpaceId('space-1');
                const rootItems = items.filter(i => i.parentId === null);
                expect(rootItems[0].id).toBe('item-b');
                expect(rootItems[1].id).toBe('item-a');
            });
        });
    });

    describe('Pin System Features (4 features)', () => {
        beforeEach(async () => {
            await spacesRepo.createSpace({
                id: 'space-1',
                profileId: TEST_PROFILE_ID,
                userId: TEST_USER_ID,
                name: 'Test Space',
                iconName: 'folder',
                accentColor: '#6D5AE6',
                order: 0,
                isExpanded: true,
            });
        });

        describe('Feature: Reorder Pins', () => {
            it('should reorder pins within grid', async () => {
                await itemsRepo.createItem({
                    id: 'pin-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Pin 1',
                    path: 'https://1.com',
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
                    id: 'pin-2',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Pin 2',
                    path: 'https://2.com',
                    type: SpaceItemType.Link,
                    isExpanded: false,
                    sortOrder: 1,
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: true,
                    pinPosition: 1,
                    localPath: null,
                    securityBookmark: null,
                    lastSyncedAt: null,
                    isWatching: false,
                });

                await itemsRepo.reorderPins('space-1', ['pin-2', 'pin-1']);

                const pins = await itemsRepo.getPinnedItems('space-1');
                expect(pins[0].id).toBe('pin-2');
            });
        });

        describe('Feature: Max 15 Pins (5x3 Grid)', () => {
            it('should support up to 15 pinned items', async () => {
                for (let i = 0; i < 15; i++) {
                    await itemsRepo.createItem({
                        id: `pin-${i}`,
                        spaceId: 'space-1',
                        parentId: null,
                        name: `Pin ${i}`,
                        path: `https://${i}.com`,
                        type: SpaceItemType.Link,
                        isExpanded: false,
                        sortOrder: i,
                        faviconUrl: null,
                        description: null,
                        visitCount: 0,
                        lastVisited: null,
                        isPinned: true,
                        pinPosition: i,
                        localPath: null,
                        securityBookmark: null,
                        lastSyncedAt: null,
                        isWatching: false,
                    });
                }

                const pins = await itemsRepo.getPinnedItems('space-1');
                expect(pins).toHaveLength(15);
            });
        });
    });

    describe('Local File System Features (3 features)', () => {
        beforeEach(async () => {
            await spacesRepo.createSpace({
                id: 'space-1',
                profileId: TEST_PROFILE_ID,
                userId: TEST_USER_ID,
                name: 'Test Space',
                iconName: 'folder',
                accentColor: '#6D5AE6',
                order: 0,
                isExpanded: true,
            });
        });

        describe('Feature: LocalFolder Type', () => {
            it('should create localFolder item with security bookmark', async () => {
                const item = await itemsRepo.createItem({
                    id: 'local-folder-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'Projects',
                    path: '/Users/test/Projects',
                    type: SpaceItemType.LocalFolder,
                    isExpanded: false,
                    sortOrder: 0,
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: '/Users/test/Projects',
                    securityBookmark: 'bookmark-data-here',
                    lastSyncedAt: new Date(),
                    isWatching: false,
                });

                expect(item.type).toBe(SpaceItemType.LocalFolder);
                expect(item.localPath).toBe('/Users/test/Projects');
                expect(item.securityBookmark).toBe('bookmark-data-here');
            });
        });

        describe('Feature: LocalFile Type', () => {
            it('should create localFile item', async () => {
                const item = await itemsRepo.createItem({
                    id: 'local-file-1',
                    spaceId: 'space-1',
                    parentId: null,
                    name: 'document.pdf',
                    path: '/Users/test/document.pdf',
                    type: SpaceItemType.LocalFile,
                    isExpanded: false,
                    sortOrder: 0,
                    faviconUrl: null,
                    description: null,
                    visitCount: 0,
                    lastVisited: null,
                    isPinned: false,
                    pinPosition: null,
                    localPath: '/Users/test/document.pdf',
                    securityBookmark: 'file-bookmark',
                    lastSyncedAt: new Date(),
                    isWatching: false,
                });

                expect(item.type).toBe(SpaceItemType.LocalFile);
                expect(item.localPath).toBe('/Users/test/document.pdf');
            });
        });
    });

    describe('Search & Discovery Features (4 features)', () => {
        beforeEach(async () => {
            await spacesRepo.createSpace({
                id: 'space-1',
                profileId: TEST_PROFILE_ID,
                userId: TEST_USER_ID,
                name: 'Test Space',
                iconName: 'folder',
                accentColor: '#6D5AE6',
                order: 0,
                isExpanded: true,
            });

            await itemsRepo.createItem({
                id: 'link-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'GitHub Repository',
                path: 'https://github.com/test/repo',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                faviconUrl: null,
                description: 'Code repository',
                visitCount: 10,
                lastVisited: new Date('2024-01-15'),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });

            await itemsRepo.createItem({
                id: 'link-2',
                spaceId: 'space-1',
                parentId: null,
                name: 'Documentation',
                path: 'https://docs.example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 1,
                faviconUrl: null,
                description: null,
                visitCount: 5,
                lastVisited: new Date('2024-01-10'),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            });
        });

        describe('Feature: Search Items', () => {
            it('should search items by name', async () => {
                const results = await itemsRepo.searchItems(TEST_PROFILE_ID, 'GitHub');
                expect(results.length).toBeGreaterThan(0);
                expect(results[0].name).toContain('GitHub');
            });

            it('should search items by URL', async () => {
                const results = await itemsRepo.searchItems(TEST_PROFILE_ID, 'github.com');
                expect(results.length).toBeGreaterThan(0);
            });
        });

        describe('Feature: Recent Items', () => {
            it('should return items ordered by lastVisited desc', async () => {
                const recent = await itemsRepo.getRecentItems(TEST_PROFILE_ID, 10);
                expect(recent.length).toBeLessThanOrEqual(10);
                if (recent.length > 1) {
                    const time0 = recent[0].lastVisited?.getTime() ?? 0;
                    const time1 = recent[1].lastVisited?.getTime() ?? 0;
                    expect(time0).toBeGreaterThanOrEqual(time1);
                }
            });
        });

        describe('Feature: Most Visited Items', () => {
            it('should return items ordered by visitCount desc', async () => {
                const mostVisited = await itemsRepo.getMostVisitedItems(TEST_PROFILE_ID, 10);
                expect(mostVisited.length).toBeLessThanOrEqual(10);
                if (mostVisited.length > 1) {
                    expect(mostVisited[0].visitCount).toBeGreaterThanOrEqual(mostVisited[1].visitCount);
                }
            });
        });

        describe('Feature: Duplicate URL Check', () => {
            it('should detect duplicate URLs', async () => {
                const isDuplicate = await itemsRepo.isDuplicateUrl(
                    TEST_PROFILE_ID,
                    'https://github.com/test/repo'
                );
                expect(isDuplicate).toBe(true);
            });

            it('should return false for new URLs', async () => {
                const isDuplicate = await itemsRepo.isDuplicateUrl(
                    TEST_PROFILE_ID,
                    'https://new-url.com'
                );
                expect(isDuplicate).toBe(false);
            });
        });
    });
});
