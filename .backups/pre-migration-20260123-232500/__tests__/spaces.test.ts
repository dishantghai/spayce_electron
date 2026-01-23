import { describe, it, expect } from 'vitest';
import { SpaceItemType } from '../src/types';
import type { Space, SpaceItem } from '../src/types';

describe('Spaces Types', () => {
    describe('SpaceItemType enum', () => {
        it('should have link type', () => {
            expect(SpaceItemType.link).toBe('link');
        });

        it('should have file type', () => {
            expect(SpaceItemType.file).toBe('file');
        });

        it('should have folder type', () => {
            expect(SpaceItemType.folder).toBe('folder');
        });

        it('should have localFolder type', () => {
            expect(SpaceItemType.localFolder).toBe('localFolder');
        });

        it('should have localFile type', () => {
            expect(SpaceItemType.localFile).toBe('localFile');
        });
    });

    describe('Space interface', () => {
        it('should create a valid space object', () => {
            const space: Space = {
                id: 'test-space',
                profileId: 'profile-1',
                userId: 'user-1',
                name: 'Test Space',
                accentColor: '#6D5AE6',
                iconName: 'rocket',
                order: 0,
                isExpanded: true,
                createdAt: new Date(),
                rootItems: [],
            };

            expect(space.id).toBe('test-space');
            expect(space.name).toBe('Test Space');
            expect(space.accentColor).toBe('#6D5AE6');
            expect(space.rootItems).toHaveLength(0);
        });
    });

    describe('SpaceItem interface', () => {
        it('should create a valid folder item', () => {
            const folder: SpaceItem = {
                id: 'folder-1',
                name: 'Test Folder',
                path: '/test',
                type: SpaceItemType.folder,
                isExpanded: false,
                children: [],
                faviconUrl: null,
                description: null,
                visitCount: 0,
                lastVisited: null,
                createdAt: new Date(),
                isPinned: false,
                pinPosition: null,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            expect(folder.type).toBe(SpaceItemType.folder);
            expect(folder.children).toHaveLength(0);
        });

        it('should create a valid link item', () => {
            const link: SpaceItem = {
                id: 'link-1',
                name: 'GitHub',
                path: 'https://github.com',
                type: SpaceItemType.link,
                isExpanded: false,
                children: [],
                faviconUrl: 'https://github.com/favicon.ico',
                description: 'Code hosting',
                visitCount: 42,
                lastVisited: new Date(),
                createdAt: new Date(),
                isPinned: true,
                pinPosition: 0,
                localPath: null,
                securityBookmark: null,
                lastSyncedAt: null,
                isWatching: false,
            };

            expect(link.type).toBe(SpaceItemType.link);
            expect(link.isPinned).toBe(true);
            expect(link.visitCount).toBe(42);
        });
    });
});
