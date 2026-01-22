# Database Migration Guide: SQLite to Alternative Databases

**Comprehensive Step-by-Step Specification for Database Technology Migration**

This guide provides a complete roadmap for migrating the Spayce Electron application from SQLite (better-sqlite3) to an alternative embedded database. We use **SurrealDB** as the primary example, but the principles apply to any database migration.

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Migration Readiness Assessment](#2-migration-readiness-assessment)
3. [Pre-Migration Checklist](#3-pre-migration-checklist)
4. [Phase 1: Infrastructure Preparation](#4-phase-1-infrastructure-preparation)
5. [Phase 2: Repository Implementation](#5-phase-2-repository-implementation)
6. [Phase 3: Bootstrap & Service Registry](#6-phase-3-bootstrap--service-registry)
7. [Phase 4: Data Migration](#7-phase-4-data-migration)
8. [Phase 5: Testing & Validation](#8-phase-5-testing--validation)
9. [Phase 6: Desktop Integration](#9-phase-6-desktop-integration)
10. [Phase 7: Cleanup & Documentation](#10-phase-7-cleanup--documentation)
11. [Architectural Issues & Recommendations](#11-architectural-issues--recommendations)
12. [SurrealDB-Specific Implementation](#12-surrealdb-specific-implementation)
13. [Rollback Strategy](#13-rollback-strategy)
14. [Appendix: File-by-File Change List](#14-appendix-file-by-file-change-list)

---

## 1. Current Architecture Analysis

### 1.1 Database Layer Overview

The current architecture follows a **Clean Architecture / Repository Pattern**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         DESKTOP PACKAGE                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  main/index.ts                                           │    │
│  │  - Initializes ServiceBootstrap with databasePath        │    │
│  │  - Calls ServiceBootstrap.initialize()                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE PACKAGE                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ServiceBootstrap.ts                                     │    │
│  │  - Creates Database instance (better-sqlite3)            │    │
│  │  - Runs DatabaseInitializer                              │    │
│  │  - Registers repositories in ServiceRegistry             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  persistence/sqlite/                                     │    │
│  │  ├── DatabaseInitializer.ts    (schema creation)         │    │
│  │  ├── SqliteSpacesRepository.ts (implements ISpacesRepo)  │    │
│  │  ├── SqliteSpaceItemsRepository.ts (implements IItemsRepo)│   │
│  │  └── validation/                                         │    │
│  │      ├── SchemaValidator.ts                              │    │
│  │      └── IntegrityChecker.ts                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CORE PACKAGE                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  domain/repositories/                                    │    │
│  │  ├── ISpacesRepository.ts      (interface)               │    │
│  │  └── ISpaceItemsRepository.ts  (interface)               │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  domain/entities/                                        │    │
│  │  ├── Space.ts                  (SpaceEntity)             │    │
│  │  └── SpaceItem.ts              (SpaceItemEntity)         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Files Inventory

| File | Package | Purpose | Migration Impact |
|------|---------|---------|------------------|
| `ServiceBootstrap.ts` | infrastructure | Creates DB, registers services | **HIGH** - Must change DB creation |
| `DatabaseInitializer.ts` | infrastructure | Creates tables/schema | **HIGH** - Complete rewrite |
| `SqliteSpacesRepository.ts` | infrastructure | Spaces CRUD | **HIGH** - Complete rewrite |
| `SqliteSpaceItemsRepository.ts` | infrastructure | Items CRUD | **HIGH** - Complete rewrite |
| `SchemaValidator.ts` | infrastructure | Validates schema | **HIGH** - Complete rewrite |
| `IntegrityChecker.ts` | infrastructure | Data integrity | **HIGH** - Complete rewrite |
| `ISpacesRepository.ts` | core | Repository interface | **NONE** - Keep as-is |
| `ISpaceItemsRepository.ts` | core | Repository interface | **NONE** - Keep as-is |
| `SpaceEntity` | core | Domain entity | **NONE** - Keep as-is |
| `SpaceItemEntity` | core | Domain entity | **NONE** - Keep as-is |
| `main/index.ts` | desktop | App entry | **LOW** - Path config only |
| `package.json` (infrastructure) | infrastructure | Dependencies | **MEDIUM** - Add new DB package |
| `package.json` (desktop) | desktop | Dependencies | **MEDIUM** - Add new DB package |

### 1.3 Current Dependencies

```json
// packages/infrastructure/package.json
{
  "dependencies": {
    "better-sqlite3": "^11.10.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13"
  }
}

// packages/desktop/package.json
{
  "dependencies": {
    "better-sqlite3": "^11.10.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13"
  }
}
```

### 1.4 Database Schema (Current SQLite)

```sql
-- spaces table
CREATE TABLE spaces (
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

-- space_items table
CREATE TABLE space_items (
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
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
);

-- migrations table
CREATE TABLE migrations (
    id TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_spaces_profile ON spaces(profile_id);
CREATE INDEX idx_items_space ON space_items(space_id);
CREATE INDEX idx_items_parent ON space_items(parent_id);
CREATE INDEX idx_items_pinned ON space_items(space_id, is_pinned);
```

---

## 2. Migration Readiness Assessment

### 2.1 Architecture Strengths ✅

| Aspect | Status | Notes |
|--------|--------|-------|
| Repository Pattern | ✅ GOOD | Interfaces in core, implementations in infrastructure |
| Dependency Injection | ✅ GOOD | ServiceRegistry allows swapping implementations |
| Domain Entities | ✅ GOOD | Pure TypeScript, no DB-specific code |
| Use Cases | ✅ GOOD | Depend on interfaces, not implementations |
| Facades | ✅ GOOD | Abstract away repository details |

### 2.2 Architecture Weaknesses ⚠️

| Issue | Severity | Location | Recommendation |
|-------|----------|----------|----------------|
| `Database.Database` type leaked | **MEDIUM** | `ServiceBootstrap.ts` line 65, 120 | Create `IDatabase` interface |
| SQLite-specific transactions | **MEDIUM** | `SqliteSpacesRepository.ts` line 146 | Abstract transaction handling |
| Synchronous API assumed | **HIGH** | All repositories use sync `better-sqlite3` | New DB may be async-only |
| Native module dependency | **HIGH** | `better-sqlite3` requires rebuild | New DB may also need native modules |
| Hardcoded `.sqlite` extension | **LOW** | `main/index.ts` line 27-28 | Make configurable |

### 2.3 Migration Complexity Score

```
Overall Complexity: MEDIUM

- Repository layer: Easy (interfaces exist)
- Bootstrap layer: Medium (type changes needed)
- Schema migration: Medium (different DDL syntax)
- Data migration: Medium (need export/import)
- Testing: Medium (need to update test utilities)
- Native modules: High (if new DB uses native code)
```

---

## 3. Pre-Migration Checklist

### 3.1 Before Starting

- [ ] **Backup current database**: `cp resources/db/spaces.sqlite resources/db/spaces.sqlite.backup`
- [ ] **Document current data**: Export all spaces and items to JSON for verification
- [ ] **Run all existing tests**: Ensure baseline is green
- [ ] **Create migration branch**: `git checkout -b feature/surrealdb-migration`
- [ ] **Review new DB documentation**: Understand API, data types, query syntax

### 3.2 Technical Prerequisites

- [ ] **Verify new DB Electron compatibility**: Can it run in Electron main process?
- [ ] **Check native module requirements**: Does it need `electron-rebuild`?
- [ ] **Confirm async/sync API**: Does it support synchronous operations?
- [ ] **Review data type mapping**: How do SQLite types map to new DB?
- [ ] **Check transaction support**: Does it support ACID transactions?

### 3.3 Required Tools

```bash
# Install new database package (example for SurrealDB)
pnpm add surrealdb.js --filter @spayce/infrastructure
pnpm add surrealdb.js --filter @spayce/desktop

# If native module, rebuild for Electron
npx electron-rebuild -f -w surrealdb
```

---

## 4. Phase 1: Infrastructure Preparation

### 4.1 Create Database Abstraction Interface

**File**: `packages/infrastructure/src/persistence/IDatabase.ts` (NEW)

```typescript
/**
 * Database abstraction interface
 * 
 * This interface allows swapping database implementations without
 * changing the repository layer.
 */
export interface IDatabase {
    // Connection management
    connect(): Promise<void>;
    close(): Promise<void>;
    isConnected(): boolean;

    // Query execution
    execute<T>(query: string, params?: unknown[]): Promise<T[]>;
    executeOne<T>(query: string, params?: unknown[]): Promise<T | null>;
    
    // Mutations
    insert<T>(table: string, data: T): Promise<T>;
    update(table: string, id: string, data: Partial<unknown>): Promise<void>;
    delete(table: string, id: string): Promise<void>;

    // Transactions
    transaction<T>(fn: () => Promise<T>): Promise<T>;

    // Schema
    initializeSchema(): Promise<void>;
}

export interface IDatabaseConfig {
    type: 'sqlite' | 'surrealdb' | 'other';
    path?: string;           // For file-based DBs
    url?: string;            // For network DBs
    namespace?: string;      // For SurrealDB
    database?: string;       // For SurrealDB
}
```

### 4.2 Create New Persistence Directory Structure

```bash
packages/infrastructure/src/persistence/
├── index.ts                    # Re-exports
├── IDatabase.ts                # NEW: Database interface
├── sqlite/                     # Existing SQLite implementation
│   ├── index.ts
│   ├── DatabaseInitializer.ts
│   ├── SqliteSpacesRepository.ts
│   ├── SqliteSpaceItemsRepository.ts
│   ├── SqliteDatabase.ts       # NEW: Implements IDatabase
│   └── validation/
│       ├── SchemaValidator.ts
│       └── IntegrityChecker.ts
└── surrealdb/                  # NEW: SurrealDB implementation
    ├── index.ts
    ├── SurrealDatabase.ts      # Implements IDatabase
    ├── SurrealSpacesRepository.ts
    ├── SurrealSpaceItemsRepository.ts
    └── validation/
        ├── SchemaValidator.ts
        └── IntegrityChecker.ts
```

### 4.3 Wrap Existing SQLite in IDatabase

**File**: `packages/infrastructure/src/persistence/sqlite/SqliteDatabase.ts` (NEW)

```typescript
import Database from 'better-sqlite3';
import type { IDatabase, IDatabaseConfig } from '../IDatabase';
import { DatabaseInitializer } from './DatabaseInitializer';

export class SqliteDatabase implements IDatabase {
    private db: Database.Database | null = null;
    private config: IDatabaseConfig;

    constructor(config: IDatabaseConfig) {
        this.config = config;
    }

    async connect(): Promise<void> {
        if (!this.config.path) {
            throw new Error('SQLite requires a file path');
        }
        this.db = new Database(this.config.path);
        this.db.pragma('foreign_keys = ON');
    }

    async close(): Promise<void> {
        this.db?.close();
        this.db = null;
    }

    isConnected(): boolean {
        return this.db !== null && this.db.open;
    }

    async execute<T>(query: string, params: unknown[] = []): Promise<T[]> {
        this.ensureConnected();
        return this.db!.prepare(query).all(...params) as T[];
    }

    async executeOne<T>(query: string, params: unknown[] = []): Promise<T | null> {
        this.ensureConnected();
        const result = this.db!.prepare(query).get(...params);
        return (result as T) ?? null;
    }

    async insert<T>(table: string, data: T): Promise<T> {
        this.ensureConnected();
        const keys = Object.keys(data as object);
        const values = Object.values(data as object);
        const placeholders = keys.map(() => '?').join(', ');
        
        this.db!.prepare(
            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
        ).run(...values);
        
        return data;
    }

    async update(table: string, id: string, data: Partial<unknown>): Promise<void> {
        this.ensureConnected();
        const entries = Object.entries(data as object);
        const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
        const values = entries.map(([, value]) => value);
        
        this.db!.prepare(
            `UPDATE ${table} SET ${setClause} WHERE id = ?`
        ).run(...values, id);
    }

    async delete(table: string, id: string): Promise<void> {
        this.ensureConnected();
        this.db!.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        this.ensureConnected();
        // Note: better-sqlite3 transactions are synchronous
        // We wrap in async for interface compatibility
        const txn = this.db!.transaction(() => {
            // This is a limitation - fn must be sync internally
            // for SQLite transactions
        });
        return fn();
    }

    async initializeSchema(): Promise<void> {
        this.ensureConnected();
        const initializer = new DatabaseInitializer(this.db!);
        initializer.initialize();
    }

    // Expose raw DB for repositories that need it
    getRawDatabase(): Database.Database {
        this.ensureConnected();
        return this.db!;
    }

    private ensureConnected(): void {
        if (!this.db || !this.db.open) {
            throw new Error('Database not connected');
        }
    }
}
```

---

## 5. Phase 2: Repository Implementation

### 5.1 Update Repository Interface (Optional Enhancement)

The current interfaces are already database-agnostic. No changes needed unless you want to add:

```typescript
// Optional: Add batch operations for better performance
export interface ISpacesRepository {
    // ... existing methods ...
    
    // Optional batch operations
    createSpaces?(spaces: Omit<SpaceEntity, 'createdAt'>[]): Promise<SpaceEntity[]>;
    deleteSpaces?(ids: string[]): Promise<void>;
}
```

### 5.2 Create SurrealDB Repository Implementation

**File**: `packages/infrastructure/src/persistence/surrealdb/SurrealSpacesRepository.ts` (NEW)

```typescript
import type { SpaceEntity, ISpacesRepository } from '@spayce/core';
import type { SurrealDatabase } from './SurrealDatabase';
import { DatabaseError } from '../../errors/DatabaseError';

interface SurrealSpaceRecord {
    id: string;
    profile_id: string;
    user_id: string;
    name: string;
    accent_color: string;
    icon_name: string;
    sort_order: number;
    is_expanded: boolean;
    created_at: string; // ISO date string in SurrealDB
}

export class SurrealSpacesRepository implements ISpacesRepository {
    constructor(private readonly db: SurrealDatabase) {}

    async getAllSpaces(profileId: string): Promise<SpaceEntity[]> {
        try {
            const results = await this.db.query<SurrealSpaceRecord[]>(
                'SELECT * FROM spaces WHERE profile_id = $profileId ORDER BY sort_order ASC',
                { profileId }
            );
            return results.map(this.mapRecordToEntity);
        } catch (error) {
            throw new DatabaseError('getAllSpaces', error as Error);
        }
    }

    async getSpaceById(id: string): Promise<SpaceEntity | null> {
        try {
            const result = await this.db.queryOne<SurrealSpaceRecord>(
                'SELECT * FROM spaces WHERE id = $id',
                { id }
            );
            return result ? this.mapRecordToEntity(result) : null;
        } catch (error) {
            throw new DatabaseError('getSpaceById', error as Error);
        }
    }

    async searchSpaces(profileId: string, query: string): Promise<SpaceEntity[]> {
        try {
            const results = await this.db.query<SurrealSpaceRecord[]>(
                'SELECT * FROM spaces WHERE profile_id = $profileId AND name CONTAINS $query ORDER BY name ASC',
                { profileId, query }
            );
            return results.map(this.mapRecordToEntity);
        } catch (error) {
            throw new DatabaseError('searchSpaces', error as Error);
        }
    }

    async createSpace(space: Omit<SpaceEntity, 'createdAt'>): Promise<SpaceEntity> {
        try {
            const now = new Date();
            const record: SurrealSpaceRecord = {
                id: space.id,
                profile_id: space.profileId,
                user_id: space.userId,
                name: space.name,
                accent_color: space.accentColor,
                icon_name: space.iconName,
                sort_order: space.order,
                is_expanded: space.isExpanded,
                created_at: now.toISOString(),
            };

            await this.db.create('spaces', record);
            return { ...space, createdAt: now };
        } catch (error) {
            throw new DatabaseError('createSpace', error as Error);
        }
    }

    async updateSpace(space: SpaceEntity): Promise<void> {
        try {
            await this.db.update('spaces', space.id, {
                name: space.name,
                accent_color: space.accentColor,
                icon_name: space.iconName,
                sort_order: space.order,
                is_expanded: space.isExpanded,
            });
        } catch (error) {
            throw new DatabaseError('updateSpace', error as Error);
        }
    }

    async deleteSpace(id: string): Promise<void> {
        try {
            await this.db.delete('spaces', id);
        } catch (error) {
            throw new DatabaseError('deleteSpace', error as Error);
        }
    }

    async reorderSpaces(profileId: string, orderedIds: string[]): Promise<void> {
        try {
            // SurrealDB supports transactions
            await this.db.transaction(async () => {
                for (let i = 0; i < orderedIds.length; i++) {
                    await this.db.update('spaces', orderedIds[i], {
                        sort_order: i,
                    });
                }
            });
        } catch (error) {
            throw new DatabaseError('reorderSpaces', error as Error);
        }
    }

    private mapRecordToEntity(record: SurrealSpaceRecord): SpaceEntity {
        return {
            id: record.id,
            profileId: record.profile_id,
            userId: record.user_id,
            name: record.name,
            accentColor: record.accent_color,
            iconName: record.icon_name,
            order: record.sort_order,
            isExpanded: record.is_expanded,
            createdAt: new Date(record.created_at),
        };
    }
}
```

### 5.3 Create SurrealDB SpaceItems Repository

**File**: `packages/infrastructure/src/persistence/surrealdb/SurrealSpaceItemsRepository.ts` (NEW)

Follow the same pattern as `SurrealSpacesRepository`, implementing all methods from `ISpaceItemsRepository`:

- `getItemsBySpaceId(spaceId: string)`
- `getItemById(id: string)`
- `getItemChildren(parentId: string)`
- `getPinnedItems(spaceId: string)`
- `searchItems(profileId: string, query: string)`
- `getRecentItems(profileId: string, limit: number)`
- `getMostVisitedItems(profileId: string, limit: number)`
- `createItem(item)`
- `updateItem(item)`
- `deleteItem(id)` - Note: Must handle recursive deletion
- `moveItem(itemId, newSpaceId, newParentId, newOrder)`
- `reorderItems(parentId, orderedIds)`
- `pinItem(itemId, position)`
- `unpinItem(itemId)`
- `reorderPins(spaceId, orderedIds)`
- `incrementVisitCount(itemId)`
- `deleteItemsBySpaceId(spaceId)`
- `isDuplicateUrl(profileId, url)`
- `renameItem(itemId, newName)`

**Key Differences for SurrealDB**:

1. **Recursive Delete**: SQLite uses CTE (`WITH RECURSIVE`). SurrealDB may need different approach:
   ```typescript
   async deleteItem(id: string): Promise<void> {
       // SurrealDB approach - delete children first
       const children = await this.getItemChildren(id);
       for (const child of children) {
           await this.deleteItem(child.id);
       }
       await this.db.delete('space_items', id);
   }
   ```

2. **Date Handling**: SurrealDB uses ISO strings, SQLite uses timestamps:
   ```typescript
   // SQLite: created_at INTEGER (timestamp)
   // SurrealDB: created_at DATETIME (ISO string)
   ```

---

## 6. Phase 3: Bootstrap & Service Registry

### 6.1 Update ServiceBootstrap for Database Abstraction

**File**: `packages/infrastructure/src/bootstrap/ServiceBootstrap.ts`

```typescript
import { serviceRegistry, SERVICE_KEYS } from '../di/ServiceRegistry';
import type { IDatabase, IDatabaseConfig } from '../persistence/IDatabase';
import { SqliteDatabase } from '../persistence/sqlite/SqliteDatabase';
import { SurrealDatabase } from '../persistence/surrealdb/SurrealDatabase';
import { SqliteSpacesRepository } from '../persistence/sqlite/SqliteSpacesRepository';
import { SqliteSpaceItemsRepository } from '../persistence/sqlite/SqliteSpaceItemsRepository';
import { SurrealSpacesRepository } from '../persistence/surrealdb/SurrealSpacesRepository';
import { SurrealSpaceItemsRepository } from '../persistence/surrealdb/SurrealSpaceItemsRepository';
// ... other imports ...

export interface BootstrapConfig {
    database: IDatabaseConfig;
    logPrefix?: string;
}

// Factory function to create appropriate database
function createDatabase(config: IDatabaseConfig): IDatabase {
    switch (config.type) {
        case 'sqlite':
            return new SqliteDatabase(config);
        case 'surrealdb':
            return new SurrealDatabase(config);
        default:
            throw new Error(`Unsupported database type: ${config.type}`);
    }
}

// Factory function to create appropriate repositories
function createRepositories(db: IDatabase, dbType: string) {
    switch (dbType) {
        case 'sqlite':
            const sqliteDb = db as SqliteDatabase;
            return {
                spaces: new SqliteSpacesRepository(sqliteDb.getRawDatabase()),
                items: new SqliteSpaceItemsRepository(sqliteDb.getRawDatabase()),
            };
        case 'surrealdb':
            const surrealDb = db as SurrealDatabase;
            return {
                spaces: new SurrealSpacesRepository(surrealDb),
                items: new SurrealSpaceItemsRepository(surrealDb),
            };
        default:
            throw new Error(`Unsupported database type: ${dbType}`);
    }
}

export class ServiceBootstrap {
    private static database: IDatabase | null = null;

    static async initialize(config: BootstrapConfig): Promise<void> {
        // Create and connect database
        this.database = createDatabase(config.database);
        await this.database.connect();
        await this.database.initializeSchema();

        // Register database
        serviceRegistry.register(SERVICE_KEYS.DATABASE, () => this.database!);

        // Register logger
        serviceRegistry.register(SERVICE_KEYS.LOGGER, () => {
            return new ConsoleLogger(config.logPrefix);
        });

        // Register event bus
        serviceRegistry.register(SERVICE_KEYS.EVENT_BUS, () => {
            const logger = serviceRegistry.get<ILogger>(SERVICE_KEYS.LOGGER);
            return new InMemoryEventBus(logger);
        });

        // Create and register repositories
        const repos = createRepositories(this.database, config.database.type);
        serviceRegistry.register(SERVICE_KEYS.SPACES_REPOSITORY, () => repos.spaces);
        serviceRegistry.register(SERVICE_KEYS.SPACE_ITEMS_REPOSITORY, () => repos.items);

        // Register facades (unchanged - they use interfaces)
        // ... existing facade registration code ...
    }

    static async shutdown(): Promise<void> {
        if (this.database) {
            await this.database.close();
            this.database = null;
        }
        serviceRegistry.clear();
    }
}
```

### 6.2 Update SERVICE_KEYS (Optional)

```typescript
export const SERVICE_KEYS = {
    DATABASE: 'database',
    DATABASE_CONFIG: 'databaseConfig',  // NEW: Store config for reference
    SPACES_REPOSITORY: 'spacesRepository',
    SPACE_ITEMS_REPOSITORY: 'spaceItemsRepository',
    EVENT_BUS: 'eventBus',
    LOGGER: 'logger',
    SPACES_FACADE: 'spacesFacade',
    SPACE_ITEMS_FACADE: 'spaceItemsFacade',
    SEARCH_FACADE: 'searchFacade',
} as const;
```

---

## 7. Phase 4: Data Migration

### 7.1 Create Migration Script

**File**: `packages/infrastructure/scripts/migrate-sqlite-to-surrealdb.ts` (NEW)

```typescript
#!/usr/bin/env tsx
/**
 * SQLite to SurrealDB Migration Script
 * 
 * Usage: npx tsx scripts/migrate-sqlite-to-surrealdb.ts <sqlite-path> <surreal-config>
 */

import Database from 'better-sqlite3';
import { Surreal } from 'surrealdb.js';

interface MigrationConfig {
    sqlitePath: string;
    surrealUrl: string;
    surrealNamespace: string;
    surrealDatabase: string;
}

async function migrate(config: MigrationConfig): Promise<void> {
    console.log('Starting migration...');

    // 1. Connect to SQLite
    const sqlite = new Database(config.sqlitePath, { readonly: true });
    console.log('Connected to SQLite');

    // 2. Connect to SurrealDB
    const surreal = new Surreal();
    await surreal.connect(config.surrealUrl);
    await surreal.use({ namespace: config.surrealNamespace, database: config.surrealDatabase });
    console.log('Connected to SurrealDB');

    // 3. Migrate spaces
    console.log('Migrating spaces...');
    const spaces = sqlite.prepare('SELECT * FROM spaces').all();
    for (const space of spaces) {
        await surreal.create('spaces', {
            id: space.id,
            profile_id: space.profile_id,
            user_id: space.user_id,
            name: space.name,
            accent_color: space.accent_color,
            icon_name: space.icon_name,
            sort_order: space.sort_order,
            is_expanded: space.is_expanded === 1,
            created_at: new Date(space.created_at).toISOString(),
        });
    }
    console.log(`Migrated ${spaces.length} spaces`);

    // 4. Migrate space_items
    console.log('Migrating space items...');
    const items = sqlite.prepare('SELECT * FROM space_items').all();
    for (const item of items) {
        await surreal.create('space_items', {
            id: item.id,
            space_id: item.space_id,
            parent_id: item.parent_id,
            name: item.name,
            path: item.path,
            type: item.type,
            is_expanded: item.is_expanded === 1,
            sort_order: item.sort_order,
            created_at: new Date(item.created_at).toISOString(),
            favicon_url: item.favicon_url,
            description: item.description,
            visit_count: item.visit_count,
            last_visited: item.last_visited ? new Date(item.last_visited).toISOString() : null,
            is_pinned: item.is_pinned === 1,
            pin_position: item.pin_position,
            local_path: item.local_path,
            security_bookmark: item.security_bookmark,
            last_synced_at: item.last_synced_at ? new Date(item.last_synced_at).toISOString() : null,
            is_watching: item.is_watching === 1,
        });
    }
    console.log(`Migrated ${items.length} space items`);

    // 5. Verify migration
    console.log('Verifying migration...');
    const surrealSpaces = await surreal.select('spaces');
    const surrealItems = await surreal.select('space_items');
    
    if (surrealSpaces.length !== spaces.length) {
        throw new Error(`Space count mismatch: SQLite=${spaces.length}, SurrealDB=${surrealSpaces.length}`);
    }
    if (surrealItems.length !== items.length) {
        throw new Error(`Item count mismatch: SQLite=${items.length}, SurrealDB=${surrealItems.length}`);
    }

    console.log('Migration completed successfully!');
    
    // Cleanup
    sqlite.close();
    await surreal.close();
}

// Run migration
const config: MigrationConfig = {
    sqlitePath: process.argv[2] || 'resources/db/spaces.sqlite',
    surrealUrl: process.argv[3] || 'ws://localhost:8000/rpc',
    surrealNamespace: 'spayce',
    surrealDatabase: 'main',
};

migrate(config).catch(console.error);
```

### 7.2 Data Type Mapping

| SQLite Type | SurrealDB Type | Notes |
|-------------|----------------|-------|
| TEXT | string | Direct mapping |
| INTEGER | int | Direct mapping |
| INTEGER (boolean) | bool | Convert 0/1 to false/true |
| INTEGER (timestamp) | datetime | Convert to ISO string |
| NULL | null | Direct mapping |

### 7.3 Rollback Data Migration

```typescript
// Export SurrealDB data back to SQLite format
async function exportToSqlite(surreal: Surreal, sqlitePath: string): Promise<void> {
    const sqlite = new Database(sqlitePath);
    
    // Initialize schema
    const initializer = new DatabaseInitializer(sqlite);
    initializer.initialize();
    
    // Export spaces
    const spaces = await surreal.select('spaces');
    const insertSpace = sqlite.prepare(`
        INSERT INTO spaces (id, profile_id, user_id, name, accent_color, icon_name, sort_order, is_expanded, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const space of spaces) {
        insertSpace.run(
            space.id,
            space.profile_id,
            space.user_id,
            space.name,
            space.accent_color,
            space.icon_name,
            space.sort_order,
            space.is_expanded ? 1 : 0,
            new Date(space.created_at).getTime()
        );
    }
    
    // Export items similarly...
    sqlite.close();
}
```

---

## 8. Phase 5: Testing & Validation

### 8.1 Update Test Utilities

**File**: `packages/infrastructure/__tests__/helpers/testDb.ts`

```typescript
import type { IDatabase, IDatabaseConfig } from '../../src/persistence/IDatabase';
import { SqliteDatabase } from '../../src/persistence/sqlite/SqliteDatabase';
import { SurrealDatabase } from '../../src/persistence/surrealdb/SurrealDatabase';

export function createTestDatabase(type: 'sqlite' | 'surrealdb' = 'sqlite'): IDatabase {
    if (type === 'sqlite') {
        return new SqliteDatabase({
            type: 'sqlite',
            path: ':memory:',
        });
    } else {
        return new SurrealDatabase({
            type: 'surrealdb',
            url: 'mem://',  // In-memory SurrealDB
            namespace: 'test',
            database: 'test',
        });
    }
}

export async function setupTestDatabase(db: IDatabase): Promise<void> {
    await db.connect();
    await db.initializeSchema();
}

export async function teardownTestDatabase(db: IDatabase): Promise<void> {
    await db.close();
}
```

### 8.2 Create Database-Agnostic Repository Tests

**File**: `packages/infrastructure/__tests__/repository-contract.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { IDatabase } from '../src/persistence/IDatabase';
import type { ISpacesRepository } from '@spayce/core';
import { createTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/testDb';

// Run the same tests against both implementations
const databases = ['sqlite', 'surrealdb'] as const;

describe.each(databases)('ISpacesRepository Contract (%s)', (dbType) => {
    let db: IDatabase;
    let repo: ISpacesRepository;

    beforeAll(async () => {
        db = createTestDatabase(dbType);
        await setupTestDatabase(db);
        repo = createRepository(db, dbType);
    });

    afterAll(async () => {
        await teardownTestDatabase(db);
    });

    beforeEach(async () => {
        // Clear data between tests
        await db.execute('DELETE FROM spaces');
    });

    it('should create and retrieve a space', async () => {
        const space = await repo.createSpace({
            id: 'test-1',
            profileId: 'profile-1',
            userId: 'user-1',
            name: 'Test Space',
            accentColor: '#FF0000',
            iconName: 'folder',
            order: 0,
            isExpanded: true,
        });

        expect(space.id).toBe('test-1');
        expect(space.createdAt).toBeInstanceOf(Date);

        const retrieved = await repo.getSpaceById('test-1');
        expect(retrieved).not.toBeNull();
        expect(retrieved?.name).toBe('Test Space');
    });

    it('should return null for non-existent space', async () => {
        const result = await repo.getSpaceById('non-existent');
        expect(result).toBeNull();
    });

    // ... more contract tests ...
});
```

### 8.3 Update Desktop Test Harness

Add database type parameter to test utilities:

```typescript
// packages/desktop/__tests__/setup/test-utils.ts

export function getTestDbPath(type: 'sqlite' | 'surrealdb' = 'sqlite'): string {
    if (type === 'sqlite') {
        return path.join(os.tmpdir(), `spayce-test-${Date.now()}.sqlite`);
    } else {
        return `mem://test-${Date.now()}`; // SurrealDB in-memory URL
    }
}
```

---

## 9. Phase 6: Desktop Integration

### 9.1 Update Main Process Entry

**File**: `packages/desktop/src/main/index.ts`

```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { createMainWindow } from './window';
import { ServiceBootstrap } from '@spayce/infrastructure';
import { registerIpcHandlers } from './ipc/handlers';
import type { IDatabaseConfig } from '@spayce/infrastructure';

let mainWindow: BrowserWindow | null = null;

function getProjectRoot(): string {
    if (app.isPackaged) {
        return path.join(app.getAppPath(), '..');
    }
    return path.join(__dirname, '../../..');
}

function getDatabaseConfig(): IDatabaseConfig {
    const isDev = !app.isPackaged;
    const projectRoot = getProjectRoot();

    // Configuration can be read from environment or config file
    const dbType = process.env.SPAYCE_DB_TYPE || 'sqlite';

    if (dbType === 'sqlite') {
        return {
            type: 'sqlite',
            path: isDev
                ? path.join(projectRoot, 'resources/db/spaces.sqlite')
                : path.join(app.getPath('userData'), 'spayce.db'),
        };
    } else if (dbType === 'surrealdb') {
        return {
            type: 'surrealdb',
            path: isDev
                ? path.join(projectRoot, 'resources/db/spayce.surreal')
                : path.join(app.getPath('userData'), 'spayce.surreal'),
            namespace: 'spayce',
            database: 'main',
        };
    }

    throw new Error(`Unsupported database type: ${dbType}`);
}

async function initialize() {
    try {
        const dbConfig = getDatabaseConfig();
        console.log('[Spayce] Database type:', dbConfig.type);
        console.log('[Spayce] Database path:', dbConfig.path || dbConfig.url);

        await ServiceBootstrap.initialize({
            database: dbConfig,
            logPrefix: '[Spayce]',
        });
        console.log('[Spayce] Services initialized');

        registerIpcHandlers();
        mainWindow = createMainWindow();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        app.quit();
    }
}

app.whenReady().then(initialize);

// ... rest unchanged ...
```

### 9.2 Update Package Dependencies

**File**: `packages/desktop/package.json`

```json
{
  "dependencies": {
    "better-sqlite3": "^11.10.0",
    "surrealdb.js": "^1.0.0"  // Add new DB
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13"
  }
}
```

**File**: `packages/infrastructure/package.json`

```json
{
  "dependencies": {
    "better-sqlite3": "^11.10.0",
    "surrealdb.js": "^1.0.0"  // Add new DB
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13"
  }
}
```

### 9.3 Update Build Script (if needed)

If the new database has native modules:

**File**: `packages/desktop/scripts/build-main.js`

```javascript
// Add to external array
const external = [
    'electron',
    'better-sqlite3',
    'surrealdb.js',  // Add if native
];
```

---

## 10. Phase 7: Cleanup & Documentation

### 10.1 Update Documentation

1. **README.md**: Document database configuration options
2. **TESTING_GUIDE.md**: Add database-specific test instructions
3. **TEST_HARNESS.md**: Update for new database tests

### 10.2 Environment Variables

Create `.env.example`:

```bash
# Database Configuration
SPAYCE_DB_TYPE=sqlite  # Options: sqlite, surrealdb

# SQLite specific
# (uses default paths)

# SurrealDB specific
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_NAMESPACE=spayce
SURREALDB_DATABASE=main
```

### 10.3 Remove Old Code (After Validation)

Once migration is complete and validated:

1. Remove SQLite-specific code if no longer needed
2. Update imports to use new database
3. Remove `better-sqlite3` dependency if not needed

---

## 11. Architectural Issues & Recommendations

### 11.1 Critical Issues to Fix Before Migration

| Issue | Location | Fix Required |
|-------|----------|--------------|
| **Sync vs Async API** | All repositories | SQLite repos use sync API. New DB may be async-only. Must update all callers. |
| **Database type leak** | `ServiceBootstrap.ts:65,120` | Uses `Database.Database` type directly. Should use `IDatabase`. |
| **Transaction model** | `SqliteSpacesRepository.ts:146` | SQLite transactions are sync. New DB may be async. |

### 11.2 Recommended Pre-Migration Refactors

#### 11.2.1 Make Repositories Fully Async

Current code already uses `async/await` but SQLite operations are actually synchronous. This is fine, but verify new DB async operations work correctly.

#### 11.2.2 Create Database Factory

```typescript
// packages/infrastructure/src/persistence/DatabaseFactory.ts
export function createDatabase(config: IDatabaseConfig): IDatabase {
    switch (config.type) {
        case 'sqlite':
            return new SqliteDatabase(config);
        case 'surrealdb':
            return new SurrealDatabase(config);
        default:
            throw new Error(`Unknown database type: ${config.type}`);
    }
}
```

#### 11.2.3 Abstract Transaction Handling

```typescript
// packages/infrastructure/src/persistence/IDatabase.ts
export interface IDatabase {
    // ... existing methods ...
    
    /**
     * Execute multiple operations in a transaction
     * @param operations Array of operations to execute atomically
     */
    transact<T>(operations: (() => Promise<T>)[]): Promise<T[]>;
}
```

### 11.3 Architecture Improvements

| Improvement | Benefit | Effort |
|-------------|---------|--------|
| Add `IDatabase` interface | Easy DB swapping | Low |
| Create `DatabaseFactory` | Centralized DB creation | Low |
| Add repository contract tests | Ensure implementations match | Medium |
| Abstract transaction handling | DB-agnostic transactions | Medium |
| Add migration framework | Automated schema updates | High |

---

## 12. SurrealDB-Specific Implementation

### 12.1 SurrealDB Database Wrapper

**File**: `packages/infrastructure/src/persistence/surrealdb/SurrealDatabase.ts`

```typescript
import { Surreal } from 'surrealdb.js';
import type { IDatabase, IDatabaseConfig } from '../IDatabase';

export class SurrealDatabase implements IDatabase {
    private db: Surreal;
    private config: IDatabaseConfig;
    private connected = false;

    constructor(config: IDatabaseConfig) {
        this.config = config;
        this.db = new Surreal();
    }

    async connect(): Promise<void> {
        const url = this.config.url || `file://${this.config.path}`;
        await this.db.connect(url);
        
        if (this.config.namespace && this.config.database) {
            await this.db.use({
                namespace: this.config.namespace,
                database: this.config.database,
            });
        }
        
        this.connected = true;
    }

    async close(): Promise<void> {
        await this.db.close();
        this.connected = false;
    }

    isConnected(): boolean {
        return this.connected;
    }

    async query<T>(sql: string, vars?: Record<string, unknown>): Promise<T> {
        const result = await this.db.query(sql, vars);
        return result[0] as T;
    }

    async queryOne<T>(sql: string, vars?: Record<string, unknown>): Promise<T | null> {
        const results = await this.query<T[]>(sql, vars);
        return results[0] ?? null;
    }

    async create<T>(table: string, data: T): Promise<T> {
        const result = await this.db.create(table, data);
        return result[0] as T;
    }

    async update(table: string, id: string, data: Partial<unknown>): Promise<void> {
        await this.db.merge(`${table}:${id}`, data);
    }

    async delete(table: string, id: string): Promise<void> {
        await this.db.delete(`${table}:${id}`);
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        // SurrealDB transaction support
        await this.db.query('BEGIN TRANSACTION');
        try {
            const result = await fn();
            await this.db.query('COMMIT TRANSACTION');
            return result;
        } catch (error) {
            await this.db.query('CANCEL TRANSACTION');
            throw error;
        }
    }

    async initializeSchema(): Promise<void> {
        // Define SurrealDB schema
        await this.db.query(`
            DEFINE TABLE spaces SCHEMAFULL;
            DEFINE FIELD id ON spaces TYPE string;
            DEFINE FIELD profile_id ON spaces TYPE string;
            DEFINE FIELD user_id ON spaces TYPE string;
            DEFINE FIELD name ON spaces TYPE string;
            DEFINE FIELD accent_color ON spaces TYPE string DEFAULT '#6D5AE6';
            DEFINE FIELD icon_name ON spaces TYPE string DEFAULT 'folder';
            DEFINE FIELD sort_order ON spaces TYPE int DEFAULT 0;
            DEFINE FIELD is_expanded ON spaces TYPE bool DEFAULT true;
            DEFINE FIELD created_at ON spaces TYPE datetime;
            
            DEFINE INDEX idx_spaces_profile ON spaces FIELDS profile_id;
        `);

        await this.db.query(`
            DEFINE TABLE space_items SCHEMAFULL;
            DEFINE FIELD id ON space_items TYPE string;
            DEFINE FIELD space_id ON space_items TYPE string;
            DEFINE FIELD parent_id ON space_items TYPE option<string>;
            DEFINE FIELD name ON space_items TYPE string;
            DEFINE FIELD path ON space_items TYPE string;
            DEFINE FIELD type ON space_items TYPE string;
            DEFINE FIELD is_expanded ON space_items TYPE bool DEFAULT false;
            DEFINE FIELD sort_order ON space_items TYPE int DEFAULT 0;
            DEFINE FIELD created_at ON space_items TYPE datetime;
            DEFINE FIELD favicon_url ON space_items TYPE option<string>;
            DEFINE FIELD description ON space_items TYPE option<string>;
            DEFINE FIELD visit_count ON space_items TYPE int DEFAULT 0;
            DEFINE FIELD last_visited ON space_items TYPE option<datetime>;
            DEFINE FIELD is_pinned ON space_items TYPE bool DEFAULT false;
            DEFINE FIELD pin_position ON space_items TYPE option<int>;
            DEFINE FIELD local_path ON space_items TYPE option<string>;
            DEFINE FIELD security_bookmark ON space_items TYPE option<string>;
            DEFINE FIELD last_synced_at ON space_items TYPE option<datetime>;
            DEFINE FIELD is_watching ON space_items TYPE bool DEFAULT false;
            
            DEFINE INDEX idx_items_space ON space_items FIELDS space_id;
            DEFINE INDEX idx_items_parent ON space_items FIELDS parent_id;
            DEFINE INDEX idx_items_pinned ON space_items FIELDS space_id, is_pinned;
        `);

        await this.db.query(`
            DEFINE TABLE migrations SCHEMAFULL;
            DEFINE FIELD id ON migrations TYPE string;
            DEFINE FIELD applied_at ON migrations TYPE datetime;
        `);
    }

    // Expose raw client for advanced operations
    getRawClient(): Surreal {
        return this.db;
    }
}
```

### 12.2 SurrealDB Query Syntax Differences

| Operation | SQLite | SurrealDB |
|-----------|--------|-----------|
| Select all | `SELECT * FROM table` | `SELECT * FROM table` |
| Select with condition | `WHERE col = ?` | `WHERE col = $var` |
| Like search | `name LIKE '%query%'` | `name CONTAINS 'query'` |
| Insert | `INSERT INTO table VALUES (...)` | `CREATE table:id CONTENT {...}` |
| Update | `UPDATE table SET col = ? WHERE id = ?` | `UPDATE table:id MERGE {...}` |
| Delete | `DELETE FROM table WHERE id = ?` | `DELETE table:id` |
| Transaction | `BEGIN; ...; COMMIT;` | `BEGIN TRANSACTION; ...; COMMIT TRANSACTION;` |

### 12.3 SurrealDB Electron Integration

SurrealDB can run in multiple modes:

1. **Embedded (file-based)**: `file://path/to/db`
2. **In-memory**: `mem://`
3. **WebSocket (remote)**: `ws://localhost:8000/rpc`

For Electron desktop app, use embedded mode:

```typescript
const config: IDatabaseConfig = {
    type: 'surrealdb',
    path: path.join(app.getPath('userData'), 'spayce.surreal'),
    namespace: 'spayce',
    database: 'main',
};
```

---

## 13. Rollback Strategy

### 13.1 Feature Flag Approach

```typescript
// config/database.ts
export const DATABASE_CONFIG = {
    // Set to 'sqlite' to rollback
    type: process.env.SPAYCE_DB_TYPE || 'sqlite',
};
```

### 13.2 Data Export Before Migration

```bash
# Before migration, export all data
pnpm run db:export --format json --output backup.json

# After rollback, import data
pnpm run db:import --format json --input backup.json
```

### 13.3 Keep Both Implementations

During transition period, keep both SQLite and SurrealDB implementations:

```
persistence/
├── sqlite/      # Keep for rollback
├── surrealdb/   # New implementation
└── index.ts     # Export based on config
```

---

## 14. Appendix: File-by-File Change List

### 14.1 Files to CREATE (New)

| File | Package | Purpose |
|------|---------|---------|
| `persistence/IDatabase.ts` | infrastructure | Database interface |
| `persistence/sqlite/SqliteDatabase.ts` | infrastructure | SQLite wrapper |
| `persistence/surrealdb/index.ts` | infrastructure | SurrealDB exports |
| `persistence/surrealdb/SurrealDatabase.ts` | infrastructure | SurrealDB wrapper |
| `persistence/surrealdb/SurrealSpacesRepository.ts` | infrastructure | Spaces repo |
| `persistence/surrealdb/SurrealSpaceItemsRepository.ts` | infrastructure | Items repo |
| `persistence/surrealdb/validation/SchemaValidator.ts` | infrastructure | Schema validation |
| `persistence/surrealdb/validation/IntegrityChecker.ts` | infrastructure | Data integrity |
| `scripts/migrate-sqlite-to-surrealdb.ts` | infrastructure | Migration script |

### 14.2 Files to MODIFY

| File | Package | Changes |
|------|---------|---------|
| `bootstrap/ServiceBootstrap.ts` | infrastructure | Add database factory, async init |
| `di/ServiceRegistry.ts` | infrastructure | Add DATABASE_CONFIG key |
| `persistence/index.ts` | infrastructure | Export new modules |
| `main/index.ts` | desktop | Add database config |
| `package.json` | infrastructure | Add surrealdb.js |
| `package.json` | desktop | Add surrealdb.js |
| `scripts/build-main.js` | desktop | Add external if native |

### 14.3 Files to KEEP (No Changes)

| File | Package | Reason |
|------|---------|--------|
| `domain/repositories/ISpacesRepository.ts` | core | Interface - DB agnostic |
| `domain/repositories/ISpaceItemsRepository.ts` | core | Interface - DB agnostic |
| `domain/entities/Space.ts` | core | Entity - DB agnostic |
| `domain/entities/SpaceItem.ts` | core | Entity - DB agnostic |
| `application/*` | core | Use cases - DB agnostic |
| `ipc/handlers.ts` | desktop | Uses facades - DB agnostic |
| `preload/index.ts` | desktop | IPC only - DB agnostic |

### 14.4 Files to DELETE (After Migration Complete)

| File | Package | When |
|------|---------|------|
| `persistence/sqlite/*` | infrastructure | Only if fully migrating away from SQLite |
| `better-sqlite3` dependency | both | Only if fully migrating away from SQLite |

---

## Summary

This guide provides a complete roadmap for migrating from SQLite to an alternative database (using SurrealDB as example). The key points are:

1. **Architecture is mostly ready**: Repository pattern and interfaces make migration feasible
2. **Main work is in infrastructure package**: Core and desktop packages need minimal changes
3. **Create abstraction layer first**: `IDatabase` interface enables easy swapping
4. **Test both implementations**: Contract tests ensure consistency
5. **Keep rollback option**: Feature flags and data export enable safe rollback

**Estimated Effort**: 2-3 weeks for a complete migration with testing

**Risk Level**: Medium - Architecture supports it, but async/sync differences need careful handling

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: AI Assistant*
