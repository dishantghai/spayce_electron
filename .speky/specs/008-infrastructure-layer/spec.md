# Spec 008: Infrastructure & Database Layer

## Overview

Implement the Infrastructure layer with SQLite repository implementations, database schema, migrations, schema validation, service registry, and event bus implementation. This layer provides concrete implementations of the interfaces defined in Spec 007.

## Dependencies & Scope Coordination

**Dependencies:**
- **Spec 001**: Project foundation (better-sqlite3 driver, database path configuration)
- **Spec 007** (Core Domain Layer): Must be completeities, repository interfaces, events)

**Integration Points:**
- Implements all repository interfaces from Spec 007
- Implements IEventBus and ILogger interfaces from Spec 007
- Uses entities and error types from Spec 007
- Provides service registry consumed by Spec 009 (Application Layer)

**This Spec Covers:**
- SQLite repository implementations (SqliteSpacesRepository, SqliteSpaceItemsRepository)
- Database schema (spaces, space_items, migrations tables)
- Schema validation and data integrity checks
- Migration framework with backup/rollback
- Service registry pattern (no DI framework)
- InMemoryEventBus implementation
- ConsoleLogger implementation

## User Stories

### US-008-001: SQLite Repository Implementation
- **As a developer**, I want repositories that persist data to SQLite so that user data survives app restarts
- **Acceptance Criteria:**
  - Given I create a space via the repository
  - When I restart the application
  - Then the space data is still available
  - And all fields are correctly persisted and retrieved

### US-008-002: Flutter Database Integration
- **As a Spayce user**, I want my existing Flutter app data available in the Electron app
- **Acceptance Criteria:**
  - Given I have spaces in the Flutter app
  - When I open the Electron app
  - Then all my spaces and items are visible
  - And I can modify them without data loss

### US-008-003: Service Registry
- **As a developer**, I want a simple service registry so that I can manage service dependencies without external DI frameworks
- **Acceptance Criteria:**
  - Given I register a service factory
  - When I request the service
  - Then I receive the singleton instance
  - And subsequent requests return the same instance

### US-008-004: Schema Validation
- **As a developer**, I want database schema validation so that incompatible databases are detected before data corruption
- **Acceptance Criteria:**
  - Given a database with missing columns
  - When the app starts
  - Then a clear error message indicates which columns are missing
  - And migration options are presented

## MVP Scope

### Included:
- `SqliteSpacesRepository` implementing `ISpacesRepository`
- `SqliteSpaceItemsRepository` implementing `ISpaceItemsRepository`
- Database schema creation and migrations
- Schema validation (SchemaValidator)
- Data integrity checks (IntegrityChecker)
- Migration executor with backup/rollback
- Service registry pattern (ServiceFactory, ServiceRegistry)
- InMemoryEventBus implementation
- ConsoleLogger implementation
- Database connection management

### Excluded:
- Use cases and facades (see Spec 009)
- React integration (see Spec 010)
- SurrealDB implementation (future spec)
- Remote/cloud database support

## Out of Scope

- Alternative database backends (SurrealDB, PostgreSQL)
- Cloud synchronization
- Real-time database subscriptions
- Advanced caching strategies

## Tech Decisions Update Required

After completing this spec, update `.speky/context/tech_decisions.md` to add:

```markdown
## Clean Architecture - Infrastructure Layer

| Decision | Value | Rationale |
|----------|-------|-----------|
| Package Location | `packages/infrastructure/` | Separated from domain |
| Database Driver | better-sqlite3 | Synchronous API, performance |
| Database Path | `{userData}/spaces.sqlite` | Standard Electron location |
| Service Pattern | ServiceRegistry singleton | No external DI frameworks |
| Event Bus | InMemoryEventBus | Simple pub/sub for domain events |
| Migration Strategy | Schema-based with backup | Safe upgrades with rollback |
```

---

## Requirements

### R1: SQLite Repository Implementations

#### 1.1 SqliteSpacesRepository

```typescript
// packages/infrastructure/src/persistence/sqlite/SqliteSpacesRepository.ts
import Database from 'better-sqlite3';
import { SpaceEntity, ISpacesRepository } from '@spayce/core';
import { DatabaseError } from '../errors';

export class SqliteSpacesRepository implements ISpacesRepository {
  constructor(private readonly db: Database.Database) {}
  
  async getAllSpaces(profileId: string): Promise<SpaceEntity[]> {
    try {
      const rows = this.db.prepare(`
        SELECT id, profile_id, user_id, name, accent_color, icon_name, 
               sort_order, is_expanded, created_at
        FROM spaces 
        WHERE profile_id = ?
        ORDER BY sort_order ASC, created_at DESC
      `).all(profileId);
      
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      throw new DatabaseError('getAllSpaces', error as Error);
    }
  }
  
  async getSpaceById(id: string): Promise<SpaceEntity | null> {
    try {
      const row = this.db.prepare(`
        SELECT id, profile_id, user_id, name, accent_color, icon_name,
               sort_order, is_expanded, created_at
        FROM spaces WHERE id = ?
      `).get(id);
      
      return row ? this.mapRowToEntity(row) : null;
    } catch (error) {
      throw new DatabaseError('getSpaceById', error as Error);
    }
  }
  
  async searchSpaces(profileId: string, query: string): Promise<SpaceEntity[]> {
    try {
      const rows = this.db.prepare(`
        SELECT id, profile_id, user_id, name, accent_color, icon_name,
               sort_order, is_expanded, created_at
        FROM spaces 
        WHERE profile_id = ? AND name LIKE ?
        ORDER BY name ASC
      `).all(profileId, `%${query}%`);
      
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      throw new DatabaseError('searchSpaces', error as Error);
    }
  }
  
  async createSpace(space: Omit<SpaceEntity, 'createdAt'>): Promise<SpaceEntity> {
    try {
      const now = new Date();
      this.db.prepare(`
        INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name, 
                           sort_order, is_expanded, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        space.id, space.profileId, space.userId, space.name,
        space.accentColor, space.iconName, space.order, space.isExpanded ? 1 : 0,
        now.toISOString()
      );
      
      return { ...space, createdAt: now };
    } catch (error) {
      throw new DatabaseError('createSpace', error as Error);
    }
  }
  
  async updateSpace(space: SpaceEntity): Promise<void> {
    try {
      const result = this.db.prepare(`
        UPDATE spaces 
        SET name = ?, accent_color = ?, icon_name = ?, sort_order = ?, is_expanded = ?
        WHERE id = ?
      `).run(
        space.name, space.accentColor, space.iconName, 
        space.order, space.isExpanded ? 1 : 0, space.id
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
      const stmt = this.db.prepare(
        'UPDATE spaces SET sort_order = ? WHERE id = ? AND profile_id = ?'
      );
      
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
  
  private mapRowToEntity(row: any): SpaceEntity {
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
```

#### 1.2 SqliteSpaceItemsRepository

```typescript
// packages/infrastructure/src/persistence/sqlite/SqliteSpaceItemsRepository.ts
import Database from 'better-sqlite3';
import { SpaceItemEntity, SpaceItemType, ISpaceItemsRepository } from '@spayce/core';
import { DatabaseError } from '../errors';

export class SqliteSpaceItemsRepository implements ISpaceItemsRepository {
  constructor(private readonly db: Database.Database) {}
  
  async getItemsBySpaceId(spaceId: string): Promise<SpaceItemEntity[]> {
    try {
      const rows = this.db.prepare(`
        SELECT * FROM space_items 
        WHERE space_id = ?
        ORDER BY sort_order ASC, created_at ASC
      `).all(spaceId);
      
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      throw new DatabaseError('getItemsBySpaceId', error as Error);
    }
  }
  
  async getItemById(id: string): Promise<SpaceItemEntity | null> {
    try {
      const row = this.db.prepare('SELECT * FROM space_items WHERE id = ?').get(id);
      return row ? this.mapRowToEntity(row) : null;
    } catch (error) {
      throw new DatabaseError('getItemById', error as Error);
    }
  }
  
  async getItemChildren(parentId: string): Promise<SpaceItemEntity[]> {
    try {
      const rows = this.db.prepare(`
        SELECT * FROM space_items 
        WHERE parent_id = ?
        ORDER BY sort_order ASC
      `).all(parentId);
      
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      throw new DatabaseError('getItemChildren', error as Error);
    }
  }
  
  async getPinnedItems(spaceId: string): Promise<SpaceItemEntity[]> {
    try {
      const rows = this.db.prepare(`
        SELECT * FROM space_items 
        WHERE space_id = ? AND is_pinned = 1
        ORDER BY pin_position ASC
      `).all(spaceId);
      
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      throw new DatabaseError('getPinnedItems', error as Error);
    }
  }
  
  async searchItems(profileId: string, query: string): Promise<SpaceItemEntity[]> {
    try {
      const rows = this.db.prepare(`
        SELECT si.* FROM space_items si
        INNER JOIN spaces s ON si.space_id = s.id
        WHERE s.profile_id = ? AND (si.name LIKE ? OR si.path LIKE ?)
        ORDER BY si.name ASC
        LIMIT 50
      `).all(profileId, `%${query}%`, `%${query}%`);
      
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      throw new DatabaseError('searchItems', error as Error);
    }
  }
  
  async getRecentItems(profileId: string, limit: number): Promise<SpaceItemEntity[]> {
    try {
      const rows = this.db.prepare(`
        SELECT si.* FROM space_items si
        INNER JOIN spaces s ON si.space_id = s.id
        WHERE s.profile_id = ? AND si.last_visited IS NOT NULL
        ORDER BY si.last_visited DESC
        LIMIT ?
      `).all(profileId, limit);
      
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      throw new DatabaseError('getRecentItems', error as Error);
    }
  }
  
  async getMostVisitedItems(profileId: string, limit: number): Promise<SpaceItemEntity[]> {
    try {
      const rows = this.db.prepare(`
        SELECT si.* FROM space_items si
        INNER JOIN spaces s ON si.space_id = s.id
        WHERE s.profile_id = ? AND si.visit_count > 0
        ORDER BY si.visit_count DESC
        LIMIT ?
      `).all(profileId, limit);
      
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      throw new DatabaseError('getMostVisitedItems', error as Error);
    }
  }
  
  async createItem(item: Omit<SpaceItemEntity, 'createdAt'>): Promise<SpaceItemEntity> {
    try {
      const now = new Date();
      this.db.prepare(`
        INSERT INTO space_items (
          id, space_id, parent_id, name, path, type, is_expanded, sort_order, created_at,
          favicon_url, description, visit_count, last_visited,
          is_pinned, pin_position,
          local_path, security_bookmark, last_synced_at, is_watching
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.id, item.spaceId, item.parentId, item.name, item.path, item.type,
        item.isExpanded ? 1 : 0, item.sortOrder, now.toISOString(),
        item.faviconUrl, item.description, item.visitCount,
        item.lastVisited?.toISOString() ?? null,
        item.isPinned ? 1 : 0, item.pinPosition,
        item.localPath, item.securityBookmark, 
        item.lastSyncedAt?.toISOString() ?? null, item.isWatching ? 1 : 0
      );
      
      return { ...item, createdAt: now };
    } catch (error) {
      throw new DatabaseError('createItem', error as Error);
    }
  }
  
  async updateItem(item: SpaceItemEntity): Promise<void> {
    try {
      this.db.prepare(`
        UPDATE space_items SET
          name = ?, path = ?, is_expanded = ?, sort_order = ?,
          favicon_url = ?, description = ?,
          is_pinned = ?, pin_position = ?,
          local_path = ?, security_bookmark = ?, 
          last_synced_at = ?, is_watching = ?
        WHERE id = ?
      `).run(
        item.name, item.path, item.isExpanded ? 1 : 0, item.sortOrder,
        item.faviconUrl, item.description,
        item.isPinned ? 1 : 0, item.pinPosition,
        item.localPath, item.securityBookmark,
        item.lastSyncedAt?.toISOString() ?? null, item.isWatching ? 1 : 0,
        item.id
      );
    } catch (error) {
      throw new DatabaseError('updateItem', error as Error);
    }
  }
  
  async deleteItem(id: string): Promise<void> {
    try {
      // Also delete all children recursively
      this.db.prepare(`
        WITH RECURSIVE item_tree AS (
          SELECT id FROM space_items WHERE id = ?
          UNION ALL
          SELECT si.id FROM space_items si
          INNER JOIN item_tree it ON si.parent_id = it.id
        )
        DELETE FROM space_items WHERE id IN (SELECT id FROM item_tree)
      `).run(id);
    } catch (error) {
      throw new DatabaseError('deleteItem', error as Error);
    }
  }
  
  async moveItem(
    itemId: string, 
    newSpaceId: string, 
    newParentId: string | null, 
    newOrder: number
  ): Promise<void> {
    try {
      this.db.prepare(`
        UPDATE space_items 
        SET space_id = ?, parent_id = ?, sort_order = ?
        WHERE id = ?
      `).run(newSpaceId, newParentId, newOrder, itemId);
    } catch (error) {
      throw new DatabaseError('moveItem', error as Error);
    }
  }
  
  async reorderItems(parentId: string | null, orderedIds: string[]): Promise<void> {
    try {
      const stmt = this.db.prepare(
        'UPDATE space_items SET sort_order = ? WHERE id = ?'
      );
      
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
      this.db.prepare(`
        UPDATE space_items 
        SET is_pinned = 1, pin_position = ?
        WHERE id = ?
      `).run(position, itemId);
    } catch (error) {
      throw new DatabaseError('pinItem', error as Error);
    }
  }
  
  async unpinItem(itemId: string): Promise<void> {
    try {
      this.db.prepare(`
        UPDATE space_items 
        SET is_pinned = 0, pin_position = NULL
        WHERE id = ?
      `).run(itemId);
    } catch (error) {
      throw new DatabaseError('unpinItem', error as Error);
    }
  }
  
  async reorderPins(spaceId: string, orderedIds: string[]): Promise<void> {
    try {
      const stmt = this.db.prepare(
        'UPDATE space_items SET pin_position = ? WHERE id = ? AND space_id = ?'
      );
      
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
      this.db.prepare(`
        UPDATE space_items 
        SET visit_count = visit_count + 1, last_visited = ?
        WHERE id = ?
      `).run(new Date().toISOString(), itemId);
    } catch (error) {
      throw new DatabaseError('incrementVisitCount', error as Error);
    }
  }
  
  private mapRowToEntity(row: any): SpaceItemEntity {
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
```

---

### R2: Database Schema and Migrations

#### 2.1 Schema Definition

```sql
-- packages/infrastructure/src/persistence/sqlite/schema/schema.sql
-- Matches Flutter's Drift schema for compatibility

CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  accent_color TEXT NOT NULL DEFAULT '#6D5AE6',
  icon_name TEXT NOT NULL DEFAULT 'folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_expanded INTEGER NOT NULL DEFAULT 1 CHECK (is_expanded IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS space_items (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('link', 'file', 'folder', 'localFolder', 'localFile')),
  is_expanded INTEGER NOT NULL DEFAULT 0 CHECK (is_expanded IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  
  -- Link metadata
  favicon_url TEXT,
  description TEXT,
  visit_count INTEGER NOT NULL DEFAULT 0,
  last_visited TEXT,
  
  -- Pin fields
  is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  pin_position INTEGER,
  
  -- Local file system fields
  local_path TEXT,
  security_bookmark TEXT,
  last_synced_at TEXT,
  is_watching INTEGER NOT NULL DEFAULT 0 CHECK (is_watching IN (0, 1)),
  
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  schema_version INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spaces_profile ON spaces(profile_id);
CREATE INDEX IF NOT EXISTS idx_items_space ON space_items(space_id);
CREATE INDEX IF NOT EXISTS idx_items_parent ON space_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_items_pinned ON space_items(space_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_items_visited ON space_items(last_visited);
CREATE INDEX IF NOT EXISTS idx_items_visit_count ON space_items(visit_count);
```

#### 2.2 Database Initializer

```typescript
// packages/infrastructure/src/persistence/sqlite/DatabaseInitializer.ts
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export class DatabaseInitializer {
  constructor(private readonly db: Database.Database) {}
  
  async initialize(): Promise<void> {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Create tables
    this.createTables();
    
    // Run any pending migrations
    await this.runMigrations();
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
        created_at TEXT NOT NULL
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
        created_at TEXT NOT NULL,
        favicon_url TEXT,
        description TEXT,
        visit_count INTEGER NOT NULL DEFAULT 0,
        last_visited TEXT,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        pin_position INTEGER,
        local_path TEXT,
        security_bookmark TEXT,
        last_synced_at TEXT,
        is_watching INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL,
        schema_version INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_spaces_profile ON spaces(profile_id);
      CREATE INDEX IF NOT EXISTS idx_items_space ON space_items(space_id);
      CREATE INDEX IF NOT EXISTS idx_items_parent ON space_items(parent_id);
      CREATE INDEX IF NOT EXISTS idx_items_pinned ON space_items(space_id, is_pinned);
    `);
  }
  
  private async runMigrations(): Promise<void> {
    // Migration logic here
  }
}
```

---

### R3: Schema Validation and Integrity Checks

#### 3.1 SchemaValidator

```typescript
// packages/infrastructure/src/persistence/sqlite/validation/SchemaValidator.ts
import Database from 'better-sqlite3';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ColumnSpec {
  name: string;
  type: string;
  notNull: boolean;
}

export class SchemaValidator {
  constructor(private readonly db: Database.Database) {}
  
  validateSchema(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Check required tables exist
    const requiredTables = ['spaces', 'space_items', 'migrations'];
    for (const table of requiredTables) {
      if (!this.tableExists(table)) {
        result.errors.push(`Required table '${table}' not found`);
        result.isValid = false;
      }
    }
    
    if (!result.isValid) return result;
    
    // Validate column types and constraints
    this.validateSpacesTable(result);
    this.validateSpaceItemsTable(result);
    
    return result;
  }
  
  private tableExists(tableName: string): boolean {
    const row = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName);
    
    return row !== undefined;
  }
  
  private validateSpacesTable(result: ValidationResult): void {
    const requiredColumns: ColumnSpec[] = [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'profile_id', type: 'TEXT', notNull: true },
      { name: 'user_id', type: 'TEXT', notNull: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'accent_color', type: 'TEXT', notNull: true },
      { name: 'icon_name', type: 'TEXT', notNull: true },
      { name: 'sort_order', type: 'INTEGER', notNull: true },
      { name: 'is_expanded', type: 'INTEGER', notNull: true },
      { name: 'created_at', type: 'TEXT', notNull: true }
    ];
    
    this.validateTableColumns('spaces', requiredColumns, result);
  }
  
  private validateSpaceItemsTable(result: ValidationResult): void {
    const requiredColumns: ColumnSpec[] = [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'space_id', type: 'TEXT', notNull: true },
      { name: 'parent_id', type: 'TEXT', notNull: false },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'path', type: 'TEXT', notNull: true },
      { name: 'type', type: 'TEXT', notNull: true },
      { name: 'is_expanded', type: 'INTEGER', notNull: true },
      { name: 'sort_order', type: 'INTEGER', notNull: true },
      { name: 'created_at', type: 'TEXT', notNull: true },
      { name: 'is_pinned', type: 'INTEGER', notNull: true },
      { name: 'visit_count', type: 'INTEGER', notNull: true },
      { name: 'local_path', type: 'TEXT', notNull: false },
      { name: 'security_bookmark', type: 'TEXT', notNull: false },
      { name: 'last_synced_at', type: 'TEXT', notNull: false },
      { name: 'is_watching', type: 'INTEGER', notNull: true }
    ];
    
    this.validateTableColumns('space_items', requiredColumns, result);
  }
  
  private validateTableColumns(
    tableName: string,
    requiredColumns: ColumnSpec[],
    result: ValidationResult
  ): void {
    const schema = this.db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    
    for (const required of requiredColumns) {
      const actual = schema.find(col => col.name === required.name);
      
      if (!actual) {
        result.errors.push(`Missing column '${required.name}' in table '${tableName}'`);
        result.isValid = false;
        continue;
      }
      
      if (actual.type !== required.type) {
        result.warnings.push(
          `Column '${required.name}' in table '${tableName}' has type '${actual.type}', expected '${required.type}'`
        );
      }
    }
  }
}
```

#### 3.2 IntegrityChecker

```typescript
// packages/infrastructure/src/persistence/sqlite/validation/IntegrityChecker.ts
import Database from 'better-sqlite3';

export interface IntegrityResult {
  isValid: boolean;
  issues: IntegrityIssue[];
}

export interface IntegrityIssue {
  type: 'foreign_key_violation' | 'invalid_format' | 'duplicate_key' | 'missing_required';
  table: string;
  message: string;
  affectedRows: number;
}

export class IntegrityChecker {
  constructor(private readonly db: Database.Database) {}
  
  performIntegrityCheck(): IntegrityResult {
    const result: IntegrityResult = {
      isValid: true,
      issues: []
    };
    
    this.checkForeignKeyIntegrity(result);
    this.validateDataFormats(result);
    this.checkDuplicateKeys(result);
    
    return result;
  }
  
  private checkForeignKeyIntegrity(result: IntegrityResult): void {
    // Check space_items.space_id references spaces.id
    const orphanedItems = this.db.prepare(`
      SELECT COUNT(*) as count FROM space_items si 
      LEFT JOIN spaces s ON si.space_id = s.id 
      WHERE s.id IS NULL
    `).get() as { count: number };
    
    if (orphanedItems.count > 0) {
      result.issues.push({
        type: 'foreign_key_violation',
        table: 'space_items',
        message: `${orphanedItems.count} items reference non-existent spaces`,
        affectedRows: orphanedItems.count
      });
      result.isValid = false;
    }
    
    // Check space_items.parent_id references space_items.id
    const orphanedChildren = this.db.prepare(`
      SELECT COUNT(*) as count FROM space_items si1 
      LEFT JOIN space_items si2 ON si1.parent_id = si2.id 
      WHERE si1.parent_id IS NOT NULL AND si2.id IS NULL
    `).get() as { count: number };
    
    if (orphanedChildren.count > 0) {
      result.issues.push({
        type: 'foreign_key_violation',
        table: 'space_items',
        message: `${orphanedChildren.count} items reference non-existent parent items`,
        affectedRows: orphanedChildren.count
      });
      result.isValid = false;
    }
  }
  
  private validateDataFormats(result: IntegrityResult): void {
    // Validate hex colors
    const invalidColors = this.db.prepare(`
      SELECT COUNT(*) as count FROM spaces 
      WHERE accent_color NOT GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
    `).get() as { count: number };
    
    if (invalidColors.count > 0) {
      result.issues.push({
        type: 'invalid_format',
        table: 'spaces',
        message: `${invalidColors.count} spaces have invalid accent_color format`,
        affectedRows: invalidColors.count
      });
    }
  }
  
  private checkDuplicateKeys(result: IntegrityResult): void {
    const tables = ['spaces', 'space_items'];
    
    for (const table of tables) {
      const duplicates = this.db.prepare(`
        SELECT COUNT(*) as count FROM (
          SELECT id, COUNT(*) as c FROM ${table} GROUP BY id HAVING COUNT(*) > 1
        )
      `).get() as { count: number };
      
      if (duplicates.count > 0) {
        result.issues.push({
          type: 'duplicate_key',
          table,
          message: `${duplicates.count} duplicate primary keys found`,
          affectedRows: duplicates.count
        });
        result.isValid = false;
      }
    }
  }
}
```

---

### R4: Service Registry Pattern

#### 4.1 ServiceRegistry

```typescript
// packages/infrastructure/src/di/ServiceRegistry.ts
export interface ServiceRegistration<T = any> {
  key: string;
  factory: () => T;
  singleton: boolean;
  instance?: T;
}

export class ServiceRegistry {
  private registrations = new Map<string, ServiceRegistration>();
  
  register<T>(key: string, factory: () => T, singleton = true): void {
    this.registrations.set(key, {
      key,
      factory,
      singleton,
      instance: undefined
    });
  }
  
  get<T>(key: string): T {
    const registration = this.registrations.get(key);
    if (!registration) {
      throw new Error(`Service not registered: ${key}`);
    }
    
    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      return registration.instance;
    }
    
    return registration.factory();
  }
  
  has(key: string): boolean {
    return this.registrations.has(key);
  }
  
  clear(): void {
    this.registrations.clear();
  }
}

// Global registry instance
export const serviceRegistry = new ServiceRegistry();

// Service keys
export const SERVICE_KEYS = {
  DATABASE: 'database',
  SPACES_REPOSITORY: 'spacesRepository',
  SPACE_ITEMS_REPOSITORY: 'spaceItemsRepository',
  EVENT_BUS: 'eventBus',
  LOGGER: 'logger',
  SPACES_FACADE: 'spacesFacade',
  SPACE_ITEMS_FACADE: 'spaceItemsFacade'
} as const;
```

#### 4.2 ServiceBootstrap

```typescript
// packages/infrastructure/src/bootstrap/ServiceBootstrap.ts
import Database from 'better-sqlite3';
import { serviceRegistry, SERVICE_KEYS } from '../di/ServiceRegistry';
import { SqliteSpacesRepository } from '../persistence/sqlite/SqliteSpacesRepository';
import { SqliteSpaceItemsRepository } from '../persistence/sqlite/SqliteSpaceItemsRepository';
import { InMemoryEventBus } from '../services/InMemoryEventBus';
import { ConsoleLogger } from '../services/ConsoleLogger';
import { DatabaseInitializer } from '../persistence/sqlite/DatabaseInitializer';

export interface BootstrapConfig {
  databasePath: string;
}

export class ServiceBootstrap {
  static async initialize(config: BootstrapConfig): Promise<void> {
    // Register database
    serviceRegistry.register(SERVICE_KEYS.DATABASE, () => {
      const db = new Database(config.databasePath);
      const initializer = new DatabaseInitializer(db);
      initializer.initialize();
      return db;
    });
    
    // Register logger
    serviceRegistry.register(SERVICE_KEYS.LOGGER, () => {
      return new ConsoleLogger();
    });
    
    // Register event bus
    serviceRegistry.register(SERVICE_KEYS.EVENT_BUS, () => {
      const logger = serviceRegistry.get(SERVICE_KEYS.LOGGER);
      return new InMemoryEventBus(logger);
    });
    
    // Register repositories
    serviceRegistry.register(SERVICE_KEYS.SPACES_REPOSITORY, () => {
      const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
      return new SqliteSpacesRepository(db);
    });
    
    serviceRegistry.register(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY, () => {
      const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
      return new SqliteSpaceItemsRepository(db);
    });
  }
  
  static shutdown(): void {
    const db = serviceRegistry.get<Database.Database>(SERVICE_KEYS.DATABASE);
    db?.close();
    serviceRegistry.clear();
  }
}
```

---

### R5: Event Bus and Logger Implementations

#### 5.1 InMemoryEventBus

```typescript
// packages/infrastructure/src/services/InMemoryEventBus.ts
import { DomainEvent, IEventBus, ILogger } from '@spayce/core';

export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, Array<(event: any) => Promise<void>>>();
  
  constructor(private readonly logger?: ILogger) {}
  
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    if (handlers.length === 0) {
      this.logger?.debug(`No handlers registered for event: ${event.type}`);
      return;
    }
    
    this.logger?.debug(`Publishing event ${event.type} to ${handlers.length} handlers`);
    
    const results = await Promise.allSettled(
      handlers.map(handler => handler(event))
    );
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger?.error(`Event handler ${index} failed for ${event.type}:`, result.reason);
      }
    });
  }
  
  subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: (event: T) => Promise<void>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    this.logger?.debug(`Handler subscribed to event: ${eventType}`);
  }
  
  unsubscribe(eventType: string, handler: (event: any) => Promise<void>): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;
    
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.logger?.debug(`Handler unsubscribed from event: ${eventType}`);
    }
  }
  
  clear(): void {
    this.handlers.clear();
    this.logger?.debug('All event handlers cleared');
  }
  
  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.length || 0;
    }
    return Array.from(this.handlers.values()).reduce((total, h) => total + h.length, 0);
  }
}
```

#### 5.2 ConsoleLogger

```typescript
// packages/infrastructure/src/services/ConsoleLogger.ts
import { ILogger } from '@spayce/core';

export class ConsoleLogger implements ILogger {
  private readonly prefix: string;
  
  constructor(prefix = '[Spayce]') {
    this.prefix = prefix;
  }
  
  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.prefix} [DEBUG]`, message, ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    console.info(`${this.prefix} [INFO]`, message, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix} [WARN]`, message, ...args);
  }
  
  error(message: string, ...args: any[]): void {
    console.error(`${this.prefix} [ERROR]`, message, ...args);
  }
}
```

---

### R6: Infrastructure Errors

```typescript
// packages/infrastructure/src/errors/DatabaseError.ts
import { DomainError } from '@spayce/core';

export class DatabaseError extends DomainError {
  constructor(operation: string, originalError: Error) {
    super(`Database operation failed: ${operation}`, 'DATABASE_ERROR', {
      operation,
      originalError: originalError.message
    });
  }
}

// packages/infrastructure/src/errors/FileSystemError.ts
export class FileSystemError extends DomainError {
  constructor(operation: string, path: string, originalError: Error) {
    super(`File system operation failed: ${operation}`, 'FILE_SYSTEM_ERROR', {
      operation,
      path,
      originalError: originalError.message
    });
  }
}
```

---

### R7: Package Structure

```
packages/infrastructure/
├── src/
│   ├── persistence/
│   │   └── sqlite/
│   │       ├── SqliteSpacesRepository.ts
│   │       ├── SqliteSpaceItemsRepository.ts
│   │       ├── DatabaseInitializer.ts
│   │       ├── schema/
│   │       │   └── schema.sql
│   │       ├── validation/
│   │       │   ├── SchemaValidator.ts
│   │       │   ├── IntegrityChecker.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── di/
│   │   ├── ServiceRegistry.ts
│   │   └── index.ts
│   ├── bootstrap/
│   │   ├── ServiceBootstrap.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── InMemoryEventBus.ts
│   │   ├── ConsoleLogger.ts
│   │   └── index.ts
│   ├── errors/
│   │   ├── DatabaseError.ts
│   │   ├── FileSystemError.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## Acceptance Criteria

### SQLite Repositories
- [ ] `SqliteSpacesRepository` implements all 7 methods of `ISpacesRepository`
- [ ] `SqliteSpaceItemsRepository` implements all 14 methods of `ISpaceItemsRepository`
- [ ] All repository methods correctly map DB rows to domain entities
- [ ] Repository methods wrap errors in `DatabaseError`
- [ ] `deleteItem` recursively deletes children
- [ ] Transactions used for multi-row operations (reorder)

### Database Schema
- [ ] Schema creates all 3 tables (spaces, space_items, migrations)
- [ ] All columns match Flutter Drift schema
- [ ] Foreign keys enabled and enforced
- [ ] Indexes created for common queries
- [ ] CASCADE delete on space_items.space_id

### Schema Validation
- [ ] `SchemaValidator.validateSchema()` returns detailed `ValidationResult`
- [ ] Missing tables detected with clear error messages
- [ ] Missing columns detected with clear error messages
- [ ] Type mismatches reported as warnings
- [ ] Validation runs on app startup

### Integrity Checking
- [ ] `IntegrityChecker` detects orphaned space_items
- [ ] Invalid format data (bad hex colors) detected
- [ ] Duplicate primary keys detected
- [ ] Results include affected row counts

### Service Registry
- [ ] `serviceRegistry.register()` stores factory functions
- [ ] `serviceRegistry.get()` returns singleton instances
- [ ] `serviceRegistry.has()` checks registration
- [ ] `serviceRegistry.clear()` removes all registrations
- [ ] Non-existent service throws descriptive error

### Service Bootstrap
- [ ] `ServiceBootstrap.initialize()` registers all services
- [ ] Database connection opened on init
- [ ] Tables created on first run
- [ ] `ServiceBootstrap.shutdown()` closes DB and clears registry

### Event Bus
- [ ] `InMemoryEventBus.publish()` calls all registered handlers
- [ ] Handlers execute in parallel with `Promise.allSettled`
- [ ] Failed handlers don't block others
- [ ] `subscribe()` and `unsubscribe()` work correctly
- [ ] `clear()` removes all handlers
- [ ] `getHandlerCount()` returns accurate counts

### Logger
- [ ] `ConsoleLogger` implements all 4 `ILogger` methods
- [ ] Debug logs only in development mode
- [ ] Log messages include prefix and level

### Infrastructure Errors
- [ ] `DatabaseError` includes operation and original message
- [ ] `FileSystemError` includes operation, path, and original message
- [ ] All infrastructure errors extend `DomainError`

### Integration
- [ ] Package builds successfully
- [ ] All tests pass with in-memory SQLite
- [ ] Real database operations tested
- [ ] Works with existing Flutter database

## Dependencies

- 001 (project-foundation)
- 007-core-domain-layer

## Estimated Duration
3-4 days

## Related Specs
- **Spec 007**: Provides interfaces this spec implements
- **Spec 009**: Consumes repositories via facades
- **Spec 010**: Uses service registry for dependency access
