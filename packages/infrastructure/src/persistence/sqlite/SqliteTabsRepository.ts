/**
 * SQLite Tabs Repository
 * Story F037: Tab CRUD Infrastructure
 *
 * Implements ITabsRepository for browser tab persistence.
 * Follows patterns from SqliteSpacesRepository.
 */

import type Database from 'better-sqlite3';
import type { TabEntity, CreateTabInput, UpdateTabInput } from '@spayce/core';
import type { ITabsRepository } from '@spayce/core';
import { TabType, CREATE_TAB_DEFAULTS } from '@spayce/core';
import { randomUUID } from 'crypto';

interface TabRow {
    id: string;
    tab_type: string;
    url: string;
    title: string | null;
    favicon_url: string | null;
    origin_space_id: string | null;
    origin_space_item_id: string | null;
    origin_url: string | null;
    is_tracked: number;
    is_active: number;
    is_loading: number;
    loading_progress: number;
    can_go_back: number;
    can_go_forward: number;
    is_secure: number;
    error_code: number | null;
    error_description: string | null;
    position: number;
    created_at: number;
    updated_at: number;
    last_accessed_at: number | null;
}

export class SqliteTabsRepository implements ITabsRepository {
    constructor(private readonly db: Database.Database) {}

    private mapRowToEntity(row: TabRow): TabEntity {
        return {
            id: row.id,
            tabType: row.tab_type as TabType,
            url: row.url,
            title: row.title ?? 'New Tab',
            faviconUrl: row.favicon_url,
            originSpaceId: row.origin_space_id,
            originSpaceItemId: row.origin_space_item_id,
            originUrl: row.origin_url,
            isTracked: Boolean(row.is_tracked),
            isActive: Boolean(row.is_active),
            isLoading: Boolean(row.is_loading),
            loadingProgress: row.loading_progress,
            canGoBack: Boolean(row.can_go_back),
            canGoForward: Boolean(row.can_go_forward),
            isSecure: Boolean(row.is_secure),
            errorCode: row.error_code,
            errorDescription: row.error_description,
            position: row.position,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : null,
        };
    }

    async getAll(): Promise<TabEntity[]> {
        const rows = this.db.prepare(
            'SELECT * FROM browser_tabs ORDER BY position ASC'
        ).all() as TabRow[];
        return rows.map((row) => this.mapRowToEntity(row));
    }

    async getById(id: string): Promise<TabEntity | null> {
        const row = this.db.prepare(
            'SELECT * FROM browser_tabs WHERE id = ?'
        ).get(id) as TabRow | undefined;
        return row ? this.mapRowToEntity(row) : null;
    }

    async getActive(): Promise<TabEntity | null> {
        const row = this.db.prepare(
            'SELECT * FROM browser_tabs WHERE is_active = 1 LIMIT 1'
        ).get() as TabRow | undefined;
        return row ? this.mapRowToEntity(row) : null;
    }

    async getBySpaceItemId(spaceItemId: string): Promise<TabEntity | null> {
        const row = this.db.prepare(
            'SELECT * FROM browser_tabs WHERE origin_space_item_id = ?'
        ).get(spaceItemId) as TabRow | undefined;
        return row ? this.mapRowToEntity(row) : null;
    }

    async getByUrl(url: string): Promise<TabEntity | null> {
        const normalized = this.normalizeUrl(url);
        const rows = this.db.prepare(
            'SELECT * FROM browser_tabs'
        ).all() as TabRow[];

        const matching = rows.find(row => this.normalizeUrl(row.url) === normalized);
        return matching ? this.mapRowToEntity(matching) : null;
    }

    async getBySpaceId(spaceId: string): Promise<TabEntity[]> {
        const rows = this.db.prepare(
            'SELECT * FROM browser_tabs WHERE origin_space_id = ? ORDER BY position ASC'
        ).all(spaceId) as TabRow[];
        return rows.map((row) => this.mapRowToEntity(row));
    }

    async count(): Promise<number> {
        const result = this.db.prepare(
            'SELECT COUNT(*) as count FROM browser_tabs'
        ).get() as { count: number };
        return result.count;
    }

    async countByType(tabType: string): Promise<number> {
        const result = this.db.prepare(
            'SELECT COUNT(*) as count FROM browser_tabs WHERE tab_type = ?'
        ).get(tabType) as { count: number };
        return result.count;
    }

    async create(input: CreateTabInput): Promise<TabEntity> {
        const now = Date.now();
        const id = randomUUID();

        // Get next position
        const maxPos = this.db.prepare(
            'SELECT COALESCE(MAX(position), -1) as max_pos FROM browser_tabs'
        ).get() as { max_pos: number };
        const position = maxPos.max_pos + 1;

        const url = input.url ?? CREATE_TAB_DEFAULTS.url;
        const shouldActivate = input.activate !== false;

        // If activating, deactivate all other tabs first
        if (shouldActivate) {
            this.db.prepare('UPDATE browser_tabs SET is_active = 0').run();
        }

        this.db.prepare(`
            INSERT INTO browser_tabs (
                id, tab_type, url, title, favicon_url,
                origin_space_id, origin_space_item_id, origin_url,
                is_tracked, is_active, is_secure,
                position, created_at, updated_at, last_accessed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            input.tabType ?? CREATE_TAB_DEFAULTS.tabType,
            url,
            input.title ?? CREATE_TAB_DEFAULTS.title,
            input.faviconUrl ?? null,
            input.originSpaceId ?? null,
            input.originSpaceItemId ?? null,
            input.url ?? null, // originUrl = initial URL
            input.originSpaceId ? 1 : 0, // isTracked if has origin
            shouldActivate ? 1 : 0,
            url.startsWith('https://') ? 1 : 0,
            position,
            now,
            now,
            now
        );

        return (await this.getById(id))!;
    }

    async update(input: UpdateTabInput): Promise<TabEntity> {
        const now = Date.now();
        const updates: string[] = ['updated_at = ?'];
        const values: unknown[] = [now];

        if (input.url !== undefined) { updates.push('url = ?'); values.push(input.url); }
        if (input.title !== undefined) { updates.push('title = ?'); values.push(input.title); }
        if (input.faviconUrl !== undefined) { updates.push('favicon_url = ?'); values.push(input.faviconUrl); }
        if (input.isTracked !== undefined) { updates.push('is_tracked = ?'); values.push(input.isTracked ? 1 : 0); }
        if (input.isActive !== undefined) { updates.push('is_active = ?'); values.push(input.isActive ? 1 : 0); }
        if (input.isLoading !== undefined) { updates.push('is_loading = ?'); values.push(input.isLoading ? 1 : 0); }
        if (input.loadingProgress !== undefined) { updates.push('loading_progress = ?'); values.push(input.loadingProgress); }
        if (input.canGoBack !== undefined) { updates.push('can_go_back = ?'); values.push(input.canGoBack ? 1 : 0); }
        if (input.canGoForward !== undefined) { updates.push('can_go_forward = ?'); values.push(input.canGoForward ? 1 : 0); }
        if (input.isSecure !== undefined) { updates.push('is_secure = ?'); values.push(input.isSecure ? 1 : 0); }
        if (input.errorCode !== undefined) { updates.push('error_code = ?'); values.push(input.errorCode); }
        if (input.errorDescription !== undefined) { updates.push('error_description = ?'); values.push(input.errorDescription); }
        if (input.position !== undefined) { updates.push('position = ?'); values.push(input.position); }
        if (input.lastAccessedAt !== undefined) {
            updates.push('last_accessed_at = ?');
            values.push(input.lastAccessedAt?.getTime() ?? null);
        }

        values.push(input.id);

        this.db.prepare(
            `UPDATE browser_tabs SET ${updates.join(', ')} WHERE id = ?`
        ).run(...values);

        const result = await this.getById(input.id);
        if (!result) {
            throw new Error(`Tab not found: ${input.id}`);
        }
        return result;
    }

    async delete(id: string): Promise<void> {
        const tab = await this.getById(id);
        if (!tab) return;

        const wasActive = tab.isActive;
        const position = tab.position;

        this.db.prepare('DELETE FROM browser_tabs WHERE id = ?').run(id);

        // Reorder remaining tabs
        this.db.prepare(
            'UPDATE browser_tabs SET position = position - 1 WHERE position > ?'
        ).run(position);

        // If deleted tab was active, activate adjacent tab
        if (wasActive) {
            const tabs = await this.getAll();
            if (tabs.length > 0) {
                const newActiveIndex = Math.min(position, tabs.length - 1);
                await this.setActive(tabs[newActiveIndex].id);
            }
        }
    }

    async setActive(id: string): Promise<void> {
        const now = Date.now();
        this.db.prepare('UPDATE browser_tabs SET is_active = 0').run();
        this.db.prepare(
            'UPDATE browser_tabs SET is_active = 1, last_accessed_at = ?, updated_at = ? WHERE id = ?'
        ).run(now, now, id);
    }

    async reorder(orderedIds: string[]): Promise<void> {
        const transaction = this.db.transaction(() => {
            orderedIds.forEach((id, index) => {
                this.db.prepare(
                    'UPDATE browser_tabs SET position = ? WHERE id = ?'
                ).run(index, id);
            });
        });
        transaction();
    }

    async deleteOldestInactive(): Promise<void> {
        const oldest = this.db.prepare(
            `SELECT id FROM browser_tabs
             WHERE is_active = 0
             ORDER BY last_accessed_at ASC, created_at ASC
             LIMIT 1`
        ).get() as { id: string } | undefined;

        if (oldest) {
            await this.delete(oldest.id);
        }
    }

    async deleteBySpaceId(spaceId: string): Promise<void> {
        this.db.prepare(
            'DELETE FROM browser_tabs WHERE origin_space_id = ?'
        ).run(spaceId);
    }

    async updateTrackingByUrl(spaceItemId: string, newUrl: string, originUrl: string): Promise<void> {
        const isTracked = this.normalizeUrl(newUrl) === this.normalizeUrl(originUrl) ? 1 : 0;
        this.db.prepare(
            'UPDATE browser_tabs SET is_tracked = ? WHERE origin_space_item_id = ?'
        ).run(isTracked, spaceItemId);
    }

    private normalizeUrl(url: string): string {
        let normalized = url.toLowerCase().trim();
        normalized = normalized.replace(/^https?:\/\//, '');
        if (normalized.startsWith('www.')) {
            normalized = normalized.substring(4);
        }
        if (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        const hashIndex = normalized.indexOf('#');
        if (hashIndex !== -1) {
            normalized = normalized.substring(0, hashIndex);
        }
        return normalized;
    }
}
