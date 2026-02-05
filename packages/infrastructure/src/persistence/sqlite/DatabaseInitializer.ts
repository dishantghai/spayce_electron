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

            -- Phase 2: Browser tabs persistence
            CREATE TABLE IF NOT EXISTS browser_tabs (
                id TEXT PRIMARY KEY,
                tab_type TEXT NOT NULL DEFAULT 'web',
                url TEXT NOT NULL,
                title TEXT,
                favicon_url TEXT,
                origin_space_id TEXT,
                origin_space_item_id TEXT,
                origin_url TEXT,
                is_tracked INTEGER NOT NULL DEFAULT 1,
                is_active INTEGER NOT NULL DEFAULT 0,
                is_loading INTEGER NOT NULL DEFAULT 0,
                loading_progress REAL NOT NULL DEFAULT 0,
                can_go_back INTEGER NOT NULL DEFAULT 0,
                can_go_forward INTEGER NOT NULL DEFAULT 0,
                is_secure INTEGER NOT NULL DEFAULT 0,
                error_code INTEGER,
                error_description TEXT,
                position INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                last_accessed_at INTEGER,
                FOREIGN KEY (origin_space_id) REFERENCES spaces(id) ON DELETE SET NULL,
                FOREIGN KEY (origin_space_item_id) REFERENCES space_items(id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_browser_tabs_position ON browser_tabs(position);
            CREATE INDEX IF NOT EXISTS idx_browser_tabs_space_item ON browser_tabs(origin_space_item_id);
            CREATE INDEX IF NOT EXISTS idx_browser_tabs_active ON browser_tabs(is_active);
        `);
    }
}
