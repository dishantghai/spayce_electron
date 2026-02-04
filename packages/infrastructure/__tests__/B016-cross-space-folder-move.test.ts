import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { SqliteSpaceItemsRepository } from '../src/persistence/sqlite/SqliteSpaceItemsRepository';
import { SqliteSpacesRepository } from '../src/persistence/sqlite/SqliteSpacesRepository';
import { DatabaseInitializer } from '../src/persistence/sqlite/DatabaseInitializer';
import { canRunNativeTests, getNativeTestSkipReason } from './helpers/testDb';

/**
 * B016: Cross-Space Folder Drag-Drop Loses Children
 *
 * ROOT CAUSE: SqliteSpaceItemsRepository.moveItem() only updates the moved item's
 * space_id. When a folder is moved to a different space, its descendants (children,
 * grandchildren, etc.) remain in the source space with their parent_id still pointing
 * to the moved parent. This causes them to appear as orphaned root items in the
 * source space.
 *
 * FIX: Add a recursive CTE to update all descendants' space_id when moving cross-space.
 * Pattern already exists in deleteItem() — reuse for moveItem().
 *
 * EVIDENCE:
 * - moveItem() lines 291-294: only updates items in newOrderedIds (siblings), not children
 * - deleteItem() lines 234-241: uses recursive CTE to find all descendants
 * - getItemsBySpaceId() groups by space_id, so children with wrong space_id are orphaned
 */

const describeNative = canRunNativeTests() ? describe : describe.skip;
const skipReason = getNativeTestSkipReason();

if (skipReason) {
    console.warn(`\u26a0\ufe0f  Skipping B016 tests: ${skipReason}`);
}

describeNative('B016: Cross-Space Folder Move — Recursive Child Update', () => {
    let db: Database.Database;
    let itemsRepo: SqliteSpaceItemsRepository;
    let spacesRepo: SqliteSpacesRepository;

    const SOURCE_SPACE = 'space-source';
    const TARGET_SPACE = 'space-target';

    beforeEach(async () => {
        db = new Database(':memory:');
        const initializer = new DatabaseInitializer(db);
        initializer.initialize();
        itemsRepo = new SqliteSpaceItemsRepository(db);
        spacesRepo = new SqliteSpacesRepository(db);

        // Create two spaces
        await spacesRepo.createSpace({
            id: SOURCE_SPACE,
            profileId: 'profile-1',
            userId: 'user-1',
            name: 'Source Space',
            accentColor: '#6D5AE6',
            iconName: 'folder',
            order: 0,
            isExpanded: true,
        });
        await spacesRepo.createSpace({
            id: TARGET_SPACE,
            profileId: 'profile-1',
            userId: 'user-1',
            name: 'Target Space',
            accentColor: '#E65A5A',
            iconName: 'folder',
            order: 1,
            isExpanded: true,
        });
    });

    afterEach(() => {
        db.close();
    });

    /**
     * Helper: Create a folder with children in the source space
     *
     * Structure:
     *   folder-1 (root, source space)
     *     ├── child-1 (link)
     *     ├── child-2 (link)
     *     └── subfolder-1 (folder)
     *          ├── grandchild-1 (link)
     *          └── grandchild-2 (link)
     */
    async function createFolderWithChildren() {
        await itemsRepo.createItem({
            id: 'folder-1',
            spaceId: SOURCE_SPACE,
            parentId: null,
            name: 'Test Folder',
            path: '',
            type: 'folder',
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
            spaceId: SOURCE_SPACE,
            parentId: 'folder-1',
            name: 'Child Link 1',
            path: 'https://example.com/1',
            type: 'link',
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
            id: 'child-2',
            spaceId: SOURCE_SPACE,
            parentId: 'folder-1',
            name: 'Child Link 2',
            path: 'https://example.com/2',
            type: 'link',
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

        await itemsRepo.createItem({
            id: 'subfolder-1',
            spaceId: SOURCE_SPACE,
            parentId: 'folder-1',
            name: 'Subfolder',
            path: '',
            type: 'folder',
            isExpanded: false,
            sortOrder: 2,
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
            id: 'grandchild-1',
            spaceId: SOURCE_SPACE,
            parentId: 'subfolder-1',
            name: 'Grandchild Link 1',
            path: 'https://example.com/gc1',
            type: 'link',
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
            id: 'grandchild-2',
            spaceId: SOURCE_SPACE,
            parentId: 'subfolder-1',
            name: 'Grandchild Link 2',
            path: 'https://example.com/gc2',
            type: 'link',
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
    }

    describe('Cross-Space Move: Children Follow Parent', () => {
        it('should move direct children to target space when folder moves cross-space', async () => {
            await createFolderWithChildren();

            // Move folder-1 from source to target space
            await itemsRepo.moveItem('folder-1', TARGET_SPACE, null, 0);

            // Direct children should now be in target space
            const child1 = await itemsRepo.getItemById('child-1');
            const child2 = await itemsRepo.getItemById('child-2');

            expect(child1!.spaceId).toBe(TARGET_SPACE);
            expect(child2!.spaceId).toBe(TARGET_SPACE);
        });

        it('should move grandchildren (nested 2+ levels) to target space', async () => {
            await createFolderWithChildren();

            await itemsRepo.moveItem('folder-1', TARGET_SPACE, null, 0);

            // Grandchildren (inside subfolder-1) should also move
            const gc1 = await itemsRepo.getItemById('grandchild-1');
            const gc2 = await itemsRepo.getItemById('grandchild-2');

            expect(gc1!.spaceId).toBe(TARGET_SPACE);
            expect(gc2!.spaceId).toBe(TARGET_SPACE);
        });

        it('should move nested subfolders to target space', async () => {
            await createFolderWithChildren();

            await itemsRepo.moveItem('folder-1', TARGET_SPACE, null, 0);

            const subfolder = await itemsRepo.getItemById('subfolder-1');
            expect(subfolder!.spaceId).toBe(TARGET_SPACE);
        });

        it('should preserve parent_id relationships (tree structure intact)', async () => {
            await createFolderWithChildren();

            await itemsRepo.moveItem('folder-1', TARGET_SPACE, null, 0);

            const child1 = await itemsRepo.getItemById('child-1');
            const child2 = await itemsRepo.getItemById('child-2');
            const subfolder = await itemsRepo.getItemById('subfolder-1');
            const gc1 = await itemsRepo.getItemById('grandchild-1');
            const gc2 = await itemsRepo.getItemById('grandchild-2');

            // Parent-child relationships must be preserved
            expect(child1!.parentId).toBe('folder-1');
            expect(child2!.parentId).toBe('folder-1');
            expect(subfolder!.parentId).toBe('folder-1');
            expect(gc1!.parentId).toBe('subfolder-1');
            expect(gc2!.parentId).toBe('subfolder-1');
        });

        it('should leave no orphaned items in source space after cross-space move', async () => {
            await createFolderWithChildren();

            await itemsRepo.moveItem('folder-1', TARGET_SPACE, null, 0);

            // Source space should have zero items
            const sourceItems = await itemsRepo.getItemsBySpaceId(SOURCE_SPACE);
            expect(sourceItems).toHaveLength(0);
        });

        it('should have all 6 items in target space after cross-space move', async () => {
            await createFolderWithChildren();

            await itemsRepo.moveItem('folder-1', TARGET_SPACE, null, 0);

            // Target space should have all 6 items
            const targetItems = await itemsRepo.getItemsBySpaceId(TARGET_SPACE);
            expect(targetItems).toHaveLength(6);
        });
    });

    describe('Same-Space Move: No Regression', () => {
        it('should NOT change space_id when reordering within same space', async () => {
            await createFolderWithChildren();

            // Add another root item in source to reorder against
            await itemsRepo.createItem({
                id: 'other-root',
                spaceId: SOURCE_SPACE,
                parentId: null,
                name: 'Other Root',
                path: 'https://example.com/other',
                type: 'link',
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

            // Move folder-1 to position 1 within same space (reorder)
            await itemsRepo.moveItem('folder-1', SOURCE_SPACE, null, 1);

            // All items should still be in source space
            const folder = await itemsRepo.getItemById('folder-1');
            const child1 = await itemsRepo.getItemById('child-1');
            const gc1 = await itemsRepo.getItemById('grandchild-1');

            expect(folder!.spaceId).toBe(SOURCE_SPACE);
            expect(child1!.spaceId).toBe(SOURCE_SPACE);
            expect(gc1!.spaceId).toBe(SOURCE_SPACE);
        });

        it('should NOT change children space_id when moving to different parent in same space', async () => {
            await createFolderWithChildren();

            // Create another folder in same space
            await itemsRepo.createItem({
                id: 'folder-2',
                spaceId: SOURCE_SPACE,
                parentId: null,
                name: 'Folder 2',
                path: '',
                type: 'folder',
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

            // Move folder-1 into folder-2 (same space, different parent)
            await itemsRepo.moveItem('folder-1', SOURCE_SPACE, 'folder-2', 0);

            // All children should still be in source space
            const child1 = await itemsRepo.getItemById('child-1');
            const gc1 = await itemsRepo.getItemById('grandchild-1');

            expect(child1!.spaceId).toBe(SOURCE_SPACE);
            expect(gc1!.spaceId).toBe(SOURCE_SPACE);
        });
    });

    describe('Deep Nesting (3+ Levels)', () => {
        it('should recursively update 4-level deep items on cross-space move', async () => {
            // Create: folder -> subfolder -> sub-subfolder -> deep-item
            await itemsRepo.createItem({
                id: 'deep-folder',
                spaceId: SOURCE_SPACE,
                parentId: null,
                name: 'Deep Folder',
                path: '',
                type: 'folder',
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
                id: 'level-2',
                spaceId: SOURCE_SPACE,
                parentId: 'deep-folder',
                name: 'Level 2',
                path: '',
                type: 'folder',
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
                id: 'level-3',
                spaceId: SOURCE_SPACE,
                parentId: 'level-2',
                name: 'Level 3',
                path: '',
                type: 'folder',
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
                id: 'level-4-item',
                spaceId: SOURCE_SPACE,
                parentId: 'level-3',
                name: 'Level 4 Item',
                path: 'https://example.com/deep',
                type: 'link',
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

            // Move root folder cross-space
            await itemsRepo.moveItem('deep-folder', TARGET_SPACE, null, 0);

            // ALL 4 levels should be in target space
            const l1 = await itemsRepo.getItemById('deep-folder');
            const l2 = await itemsRepo.getItemById('level-2');
            const l3 = await itemsRepo.getItemById('level-3');
            const l4 = await itemsRepo.getItemById('level-4-item');

            expect(l1!.spaceId).toBe(TARGET_SPACE);
            expect(l2!.spaceId).toBe(TARGET_SPACE);
            expect(l3!.spaceId).toBe(TARGET_SPACE);
            expect(l4!.spaceId).toBe(TARGET_SPACE);

            // Tree structure preserved
            expect(l2!.parentId).toBe('deep-folder');
            expect(l3!.parentId).toBe('level-2');
            expect(l4!.parentId).toBe('level-3');
        });
    });

    describe('Atomicity', () => {
        it('should update all descendants atomically (all or none)', async () => {
            await createFolderWithChildren();

            // Move cross-space
            await itemsRepo.moveItem('folder-1', TARGET_SPACE, null, 0);

            // Verify ALL items have consistent space_id (no partial updates)
            const allIds = ['folder-1', 'child-1', 'child-2', 'subfolder-1', 'grandchild-1', 'grandchild-2'];
            const items = await Promise.all(allIds.map(id => itemsRepo.getItemById(id)));

            const spaceIds = new Set(items.map(item => item!.spaceId));
            // All items should be in exactly ONE space (the target)
            expect(spaceIds.size).toBe(1);
            expect(spaceIds.has(TARGET_SPACE)).toBe(true);
        });
    });

    describe('Items Not Belonging to Moved Folder Stay Put', () => {
        it('should not affect other items in source space', async () => {
            await createFolderWithChildren();

            // Add an unrelated item in source space
            await itemsRepo.createItem({
                id: 'unrelated-item',
                spaceId: SOURCE_SPACE,
                parentId: null,
                name: 'Unrelated',
                path: 'https://example.com/unrelated',
                type: 'link',
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

            await itemsRepo.moveItem('folder-1', TARGET_SPACE, null, 0);

            // Unrelated item should stay in source space
            const unrelated = await itemsRepo.getItemById('unrelated-item');
            expect(unrelated!.spaceId).toBe(SOURCE_SPACE);

            // Source space should have exactly 1 item (the unrelated one)
            const sourceItems = await itemsRepo.getItemsBySpaceId(SOURCE_SPACE);
            expect(sourceItems).toHaveLength(1);
            expect(sourceItems[0].id).toBe('unrelated-item');
        });
    });
});
