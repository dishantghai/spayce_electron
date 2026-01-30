import type Database from 'better-sqlite3';

export class DatabaseInitializer {
    constructor(private readonly db: Database.Database) { }

    initialize(): void {
        this.db.pragma('foreign_keys = ON');
        this.createTables();
    }

    private createTables(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS spaces (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                accent_color TEXT NOT NULL DEFAULT '#6D5AE6',
                icon_name TEXT NOT NULL DEFAULT 'folder',
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_expanded INTEGER NOT NULL DEFAULT 1,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS space_items (
                id TEXT PRIMARY KEY,
                space_id TEXT NOT NULL,
                parent_id TEXT,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                type TEXT NOT NULL,
                is_expanded INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                favicon_url TEXT,
                description TEXT,
                visit_count INTEGER NOT NULL DEFAULT 0,
                last_visited INTEGER,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                pin_position INTEGER,
                local_path TEXT,
                security_bookmark TEXT,
                last_synced_at INTEGER,
                is_watching INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES space_items(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS migrations (
                id TEXT PRIMARY KEY,
                applied_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_spaces_profile ON spaces(profile_id);
            CREATE INDEX IF NOT EXISTS idx_items_space ON space_items(space_id);
            CREATE INDEX IF NOT EXISTS idx_items_parent ON space_items(parent_id);
            CREATE INDEX IF NOT EXISTS idx_items_pinned ON space_items(space_id, is_pinned);
        `);
    }
}
