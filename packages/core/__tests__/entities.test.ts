import { describe, it, expect } from 'vitest';
import type { SpaceEntity } from '../src/domain/entities/Space';
import { SpaceItemType } from '../src/domain/entities/SpaceItem';
import type { SpaceItemEntity } from '../src/domain/entities/SpaceItem';

describe('Domain Entities', () => {
    describe('SpaceEntity', () => {
        it('should have all 9 required readonly properties', () => {
            const space: SpaceEntity = {
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date('2026-01-20T00:00:00Z'),
            };

            expect(space.id).toBe('space-1');
            expect(space.profileId).toBe('profile-1');
            expect(space.userId).toBe('user-1');
            expect(space.name).toBe('Test Space');
            expect(space.accentColor).toBe('#6D5AE6');
            expect(space.iconName).toBe('folder');
            expect(space.order).toBe(0);
            expect(space.isExpanded).toBe(true);
            expect(space.createdAt).toBeInstanceOf(Date);
        });

        it('should use Date type for createdAt, not string', () => {
            const space: SpaceEntity = {
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
            };

            expect(space.createdAt).toBeInstanceOf(Date);
            expect(typeof space.createdAt).not.toBe('string');
        });

        it('should use string type for all ID fields', () => {
            const space: SpaceEntity = {
                id: 'space-1',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'folder',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
            };

            expect(typeof space.id).toBe('string');
            expect(typeof space.profileId).toBe('string');
            expect(typeof space.userId).toBe('string');
        });
    });

    describe('SpaceItemEntity', () => {
        it('should have all 20 required readonly properties', () => {
            const item: SpaceItemEntity = {
                id: 'item-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Test Item',
                path: 'https://example.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                createdAt: new Date('2026-01-20T00:00:00Z'),
                faviconUrl: 'https://example.com/favicon.ico',
                description: 'A test link',
                visitCount: 5,
                lastVisited: new Date('2026-01-19T00:00:00Z'),
                isPinned: true,
                pinPosition: 0,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            expect(item.id).toBe('item-1');
            expect(item.spaceId).toBe('space-1');
            expect(item.parentId).toBeNull();
            expect(item.name).toBe('Test Item');
            expect(item.path).toBe('https://example.com');
            expect(item.type).toBe(SpaceItemType.Link);
            expect(item.isExpanded).toBe(false);
            expect(item.sortOrder).toBe(0);
            expect(item.createdAt).toBeInstanceOf(Date);
            expect(item.faviconUrl).toBe('https://example.com/favicon.ico');
            expect(item.description).toBe('A test link');
            expect(item.visitCount).toBe(5);
            expect(item.lastVisited).toBeInstanceOf(Date);
            expect(item.isPinned).toBe(true);
            expect(item.pinPosition).toBe(0);
            expect(item.localPath).toBeNull();
            expect(item.securityBookmark).toBeNull();
            expect(item.lastSyncedAt).toBeNull();
            expect(item.isWatching).toBe(false);
        });

        it('should support folder type with parentId', () => {
            const folder: SpaceItemEntity = {
                id: 'folder-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'My Folder',
                path: '/my-folder',
                type: SpaceItemType.Folder,
                isExpanded: true,
                sortOrder: 0,
                createdAt: new Date(),
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

            expect(folder.type).toBe(SpaceItemType.Folder);
            expect(folder.parentId).toBeNull();
        });

        it('should support nested items with parentId', () => {
            const nestedItem: SpaceItemEntity = {
                id: 'nested-1',
                spaceId: 'space-1',
                parentId: 'folder-1',
                name: 'Nested Link',
                path: 'https://nested.com',
                type: SpaceItemType.Link,
                isExpanded: false,
                sortOrder: 0,
                createdAt: new Date(),
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

            expect(nestedItem.parentId).toBe('folder-1');
        });

        it('should support local folder type with localPath', () => {
            const localFolder: SpaceItemEntity = {
                id: 'local-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'Documents',
                path: '/Users/test/Documents',
                type: SpaceItemType.LocalFolder,
                isExpanded: false,
                sortOrder: 0,
                createdAt: new Date(),
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: '/Users/test/Documents',
                securityBookmark: 'bookmark-data',
                lastSyncedAt: new Date(),
                isWatching: true,
            };

            expect(localFolder.type).toBe(SpaceItemType.LocalFolder);
            expect(localFolder.localPath).toBe('/Users/test/Documents');
            expect(localFolder.securityBookmark).toBe('bookmark-data');
            expect(localFolder.isWatching).toBe(true);
        });

        it('should support local file type', () => {
            const localFile: SpaceItemEntity = {
                id: 'file-1',
                spaceId: 'space-1',
                parentId: null,
                name: 'notes.txt',
                path: '/Users/test/notes.txt',
                type: SpaceItemType.LocalFile,
                isExpanded: false,
                sortOrder: 0,
                createdAt: new Date(),
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                isPinned: false,
                pinPosition: null,
                localPath: '/Users/test/notes.txt',
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            expect(localFile.type).toBe(SpaceItemType.LocalFile);
        });
    });

    describe('SpaceItemType enum', () => {
        it('should have 5 values: Link, File, Folder, LocalFolder, LocalFile', () => {
            expect(SpaceItemType.Link).toBe('link');
            expect(SpaceItemType.File).toBe('file');
            expect(SpaceItemType.Folder).toBe('folder');
            expect(SpaceItemType.LocalFolder).toBe('localFolder');
            expect(SpaceItemType.LocalFile).toBe('localFile');
        });

        it('should have exactly 5 enum values', () => {
            const values = Object.values(SpaceItemType);
            expect(values).toHaveLength(5);
        });
    });
});
