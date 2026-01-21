import type Database from 'better-sqlite3';
import type { SpaceEntity, ISpacesRepository } from '@spayce/core';
import { DatabaseError } from '../../errors/DatabaseError';

interface SpaceRow {
    id: string;
    profile_id: string;
    user_id: string;
    name: string;
    accent_color: string;
    icon_name: string;
    sort_order: number;
    is_expanded: number;
    created_at: number;
}

export class SqliteSpacesRepository implements ISpacesRepository {
    constructor(private readonly db: Database.Database) { }

    async getAllSpaces(profileId: string): Promise<SpaceEntity[]> {
        try {
            const rows = this.db
                .prepare(
                    `
                SELECT id, profile_id, user_id, name, accent_color, icon_name,
                       sort_order, is_expanded, created_at
                FROM spaces
                WHERE profile_id = ?
                ORDER BY sort_order ASC, created_at DESC
            `
                )
                .all(profileId) as SpaceRow[];

            return rows.map(this.mapRowToEntity);
        } catch (error) {
            throw new DatabaseError('getAllSpaces', error as Error);
        }
    }

    async getSpaceById(id: string): Promise<SpaceEntity | null> {
        try {
            const row = this.db
                .prepare(
                    `
                SELECT id, profile_id, user_id, name, accent_color, icon_name,
                       sort_order, is_expanded, created_at
                FROM spaces WHERE id = ?
            `
                )
                .get(id) as SpaceRow | undefined;

            return row ? this.mapRowToEntity(row) : null;
        } catch (error) {
            throw new DatabaseError('getSpaceById', error as Error);
        }
    }

    async searchSpaces(profileId: string, query: string): Promise<SpaceEntity[]> {
        try {
            const rows = this.db
                .prepare(
                    `
                SELECT id, profile_id, user_id, name, accent_color, icon_name,
                       sort_order, is_expanded, created_at
                FROM spaces
                WHERE profile_id = ? AND name LIKE ?
                ORDER BY name ASC
            `
                )
                .all(profileId, `%${query}%`) as SpaceRow[];

            return rows.map(this.mapRowToEntity);
        } catch (error) {
            throw new DatabaseError('searchSpaces', error as Error);
        }
    }

    async createSpace(space: Omit<SpaceEntity, 'createdAt'>): Promise<SpaceEntity> {
        try {
            const now = new Date();
            this.db
                .prepare(
                    `
                INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name,
                                   sort_order, is_expanded, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
                )
                .run(
                    space.id,
                    space.profileId,
                    space.userId,
                    space.name,
                    space.accentColor,
                    space.iconName,
                    space.order,
                    space.isExpanded ? 1 : 0,
                    now.getTime()
                );

            return { ...space, createdAt: now };
        } catch (error) {
            throw new DatabaseError('createSpace', error as Error);
        }
    }

    async updateSpace(space: SpaceEntity): Promise<void> {
        try {
            const result = this.db
                .prepare(
                    `
                UPDATE spaces
                SET name = ?, accent_color = ?, icon_name = ?, sort_order = ?, is_expanded = ?
                WHERE id = ?
            `
                )
                .run(
                    space.name,
                    space.accentColor,
                    space.iconName,
                    space.order,
                    space.isExpanded ? 1 : 0,
                    space.id
                );

            if (result.changes === 0) {
                throw new Error(`Space with id '${space.id}' not found`);
            }
        } catch (error) {
            throw new DatabaseError('updateSpace', error as Error);
        }
    }

    async deleteSpace(id: string): Promise<void> {
        try {
            this.db.prepare('DELETE FROM spaces WHERE id = ?').run(id);
        } catch (error) {
            throw new DatabaseError('deleteSpace', error as Error);
        }
    }

    async reorderSpaces(profileId: string, orderedIds: string[]): Promise<void> {
        try {
            const stmt = this.db.prepare('UPDATE spaces SET sort_order = ? WHERE id = ? AND profile_id = ?');

            const transaction = this.db.transaction(() => {
                orderedIds.forEach((id, index) => {
                    stmt.run(index, id, profileId);
                });
            });

            transaction();
        } catch (error) {
            throw new DatabaseError('reorderSpaces', error as Error);
        }
    }

    private mapRowToEntity(row: SpaceRow): SpaceEntity {
        return {
            id: row.id,
            profileId: row.profile_id,
            userId: row.user_id,
            name: row.name,
            accentColor: row.accent_color,
            iconName: row.icon_name,
            order: row.sort_order,
            isExpanded: row.is_expanded === 1,
            createdAt: new Date(row.created_at),
        };
    }
}
