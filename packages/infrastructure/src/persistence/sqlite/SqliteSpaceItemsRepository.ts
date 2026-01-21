import type Database from 'better-sqlite3';
import type { SpaceItemEntity, ISpaceItemsRepository } from '@spayce/core';
import { SpaceItemType } from '@spayce/core';
import { DatabaseError } from '../../errors/DatabaseError';

interface SpaceItemRow {
    id: string;
    space_id: string;
    parent_id: string | null;
    name: string;
    path: string;
    type: string;
    is_expanded: number;
    sort_order: number;
    created_at: number;
    favicon_url: string | null;
    description: string | null;
    visit_count: number;
    last_visited: number | null;
    is_pinned: number;
    pin_position: number | null;
    local_path: string | null;
    security_bookmark: string | null;
    last_synced_at: number | null;
    is_watching: number;
}

export class SqliteSpaceItemsRepository implements ISpaceItemsRepository {
    constructor(private readonly db: Database.Database) { }

    async getItemsBySpaceId(spaceId: string): Promise<SpaceItemEntity[]> {
        try {
            const rows = this.db
                .prepare(
                    `
                SELECT * FROM space_items
                WHERE space_id = ?
                ORDER BY sort_order ASC, created_at ASC
            `
                )
                .all(spaceId) as SpaceItemRow[];

            return rows.map(this.mapRowToEntity);
        } catch (error) {
            throw new DatabaseError('getItemsBySpaceId', error as Error);
        }
    }

    async getItemById(id: string): Promise<SpaceItemEntity | null> {
        try {
            const row = this.db.prepare('SELECT * FROM space_items WHERE id = ?').get(id) as SpaceItemRow | undefined;
            return row ? this.mapRowToEntity(row) : null;
        } catch (error) {
            throw new DatabaseError('getItemById', error as Error);
        }
    }

    async getItemChildren(parentId: string): Promise<SpaceItemEntity[]> {
        try {
            const rows = this.db
                .prepare(
                    `
                SELECT * FROM space_items
                WHERE parent_id = ?
                ORDER BY sort_order ASC
            `
                )
                .all(parentId) as SpaceItemRow[];

            return rows.map(this.mapRowToEntity);
        } catch (error) {
            throw new DatabaseError('getItemChildren', error as Error);
        }
    }

    async getPinnedItems(spaceId: string): Promise<SpaceItemEntity[]> {
        try {
            const rows = this.db
                .prepare(
                    `
                SELECT * FROM space_items
                WHERE space_id = ? AND is_pinned = 1
                ORDER BY pin_position ASC
            `
                )
                .all(spaceId) as SpaceItemRow[];

            return rows.map(this.mapRowToEntity);
        } catch (error) {
            throw new DatabaseError('getPinnedItems', error as Error);
        }
    }

    async searchItems(profileId: string, query: string): Promise<SpaceItemEntity[]> {
        try {
            const rows = this.db
                .prepare(
                    `
                SELECT si.* FROM space_items si
                INNER JOIN spaces s ON si.space_id = s.id
                WHERE s.profile_id = ? AND (si.name LIKE ? OR si.path LIKE ?)
                ORDER BY si.name ASC
                LIMIT 50
            `
                )
                .all(profileId, `%${query}%`, `%${query}%`) as SpaceItemRow[];

            return rows.map(this.mapRowToEntity);
        } catch (error) {
            throw new DatabaseError('searchItems', error as Error);
        }
    }

    async getRecentItems(profileId: string, limit: number): Promise<SpaceItemEntity[]> {
        try {
            const rows = this.db
                .prepare(
                    `
                SELECT si.* FROM space_items si
                INNER JOIN spaces s ON si.space_id = s.id
                WHERE s.profile_id = ? AND si.last_visited IS NOT NULL
                ORDER BY si.last_visited DESC
                LIMIT ?
            `
                )
                .all(profileId, limit) as SpaceItemRow[];

            return rows.map(this.mapRowToEntity);
        } catch (error) {
            throw new DatabaseError('getRecentItems', error as Error);
        }
    }

    async getMostVisitedItems(profileId: string, limit: number): Promise<SpaceItemEntity[]> {
        try {
            const rows = this.db
                .prepare(
                    `
                SELECT si.* FROM space_items si
                INNER JOIN spaces s ON si.space_id = s.id
                WHERE s.profile_id = ? AND si.visit_count > 0
                ORDER BY si.visit_count DESC
                LIMIT ?
            `
                )
                .all(profileId, limit) as SpaceItemRow[];

            return rows.map(this.mapRowToEntity);
        } catch (error) {
            throw new DatabaseError('getMostVisitedItems', error as Error);
        }
    }

    async createItem(item: Omit<SpaceItemEntity, 'createdAt'>): Promise<SpaceItemEntity> {
        try {
            const now = new Date();
            this.db
                .prepare(
                    `
                INSERT INTO space_items (
                    id, space_id, parent_id, name, path, type, is_expanded, sort_order, created_at,
                    favicon_url, description, visit_count, last_visited,
                    is_pinned, pin_position,
                    local_path, security_bookmark, last_synced_at, is_watching
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
                )
                .run(
                    item.id,
                    item.spaceId,
                    item.parentId,
                    item.name,
                    item.path,
                    item.type,
                    item.isExpanded ? 1 : 0,
                    item.sortOrder,
                    now.getTime(),
                    item.faviconUrl,
                    item.description,
                    item.visitCount,
                    item.lastVisited?.getTime() ?? null,
                    item.isPinned ? 1 : 0,
                    item.pinPosition,
                    item.localPath,
                    item.securityBookmark,
                    item.lastSyncedAt?.getTime() ?? null,
                    item.isWatching ? 1 : 0
                );

            return { ...item, createdAt: now };
        } catch (error) {
            throw new DatabaseError('createItem', error as Error);
        }
    }

    async updateItem(item: SpaceItemEntity): Promise<void> {
        try {
            this.db
                .prepare(
                    `
                UPDATE space_items SET
                    name = ?, path = ?, is_expanded = ?, sort_order = ?,
                    favicon_url = ?, description = ?,
                    is_pinned = ?, pin_position = ?,
                    local_path = ?, security_bookmark = ?,
                    last_synced_at = ?, is_watching = ?
                WHERE id = ?
            `
                )
                .run(
                    item.name,
                    item.path,
                    item.isExpanded ? 1 : 0,
                    item.sortOrder,
                    item.faviconUrl,
                    item.description,
                    item.isPinned ? 1 : 0,
                    item.pinPosition,
                    item.localPath,
                    item.securityBookmark,
                    item.lastSyncedAt?.getTime() ?? null,
                    item.isWatching ? 1 : 0,
                    item.id
                );
        } catch (error) {
            throw new DatabaseError('updateItem', error as Error);
        }
    }

    async deleteItem(id: string): Promise<void> {
        try {
            this.db
                .prepare(
                    `
                WITH RECURSIVE item_tree AS (
                    SELECT id FROM space_items WHERE id = ?
                    UNION ALL
                    SELECT si.id FROM space_items si
                    INNER JOIN item_tree it ON si.parent_id = it.id
                )
                DELETE FROM space_items WHERE id IN (SELECT id FROM item_tree)
            `
                )
                .run(id);
        } catch (error) {
            throw new DatabaseError('deleteItem', error as Error);
        }
    }

    async moveItem(itemId: string, newSpaceId: string, newParentId: string | null, newOrder: number): Promise<void> {
        try {
            this.db
                .prepare(
                    `
                UPDATE space_items
                SET space_id = ?, parent_id = ?, sort_order = ?
                WHERE id = ?
            `
                )
                .run(newSpaceId, newParentId, newOrder, itemId);
        } catch (error) {
            throw new DatabaseError('moveItem', error as Error);
        }
    }

    async reorderItems(_parentId: string | null, orderedIds: string[]): Promise<void> {
        try {
            const stmt = this.db.prepare('UPDATE space_items SET sort_order = ? WHERE id = ?');

            const transaction = this.db.transaction(() => {
                orderedIds.forEach((id, index) => {
                    stmt.run(index, id);
                });
            });

            transaction();
        } catch (error) {
            throw new DatabaseError('reorderItems', error as Error);
        }
    }

    async pinItem(itemId: string, position: number): Promise<void> {
        try {
            this.db
                .prepare(
                    `
                UPDATE space_items
                SET is_pinned = 1, pin_position = ?
                WHERE id = ?
            `
                )
                .run(position, itemId);
        } catch (error) {
            throw new DatabaseError('pinItem', error as Error);
        }
    }

    async unpinItem(itemId: string): Promise<void> {
        try {
            this.db
                .prepare(
                    `
                UPDATE space_items
                SET is_pinned = 0, pin_position = NULL
                WHERE id = ?
            `
                )
                .run(itemId);
        } catch (error) {
            throw new DatabaseError('unpinItem', error as Error);
        }
    }

    async reorderPins(spaceId: string, orderedIds: string[]): Promise<void> {
        try {
            const stmt = this.db.prepare('UPDATE space_items SET pin_position = ? WHERE id = ? AND space_id = ?');

            const transaction = this.db.transaction(() => {
                orderedIds.forEach((id, index) => {
                    stmt.run(index, id, spaceId);
                });
            });

            transaction();
        } catch (error) {
            throw new DatabaseError('reorderPins', error as Error);
        }
    }

    async incrementVisitCount(itemId: string): Promise<void> {
        try {
            this.db
                .prepare(
                    `
                UPDATE space_items
                SET visit_count = visit_count + 1, last_visited = ?
                WHERE id = ?
            `
                )
                .run(Date.now(), itemId);
        } catch (error) {
            throw new DatabaseError('incrementVisitCount', error as Error);
        }
    }

    private mapRowToEntity(row: SpaceItemRow): SpaceItemEntity {
        return {
            id: row.id,
            spaceId: row.space_id,
            parentId: row.parent_id,
            name: row.name,
            path: row.path,
            type: row.type as SpaceItemType,
            isExpanded: row.is_expanded === 1,
            sortOrder: row.sort_order,
            createdAt: new Date(row.created_at),
            faviconUrl: row.favicon_url,
            description: row.description,
            visitCount: row.visit_count,
            lastVisited: row.last_visited ? new Date(row.last_visited) : null,
            isPinned: row.is_pinned === 1,
            pinPosition: row.pin_position,
            localPath: row.local_path,
            securityBookmark: row.security_bookmark,
            lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
            isWatching: row.is_watching === 1,
        };
    }
}
