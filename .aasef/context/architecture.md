# Spayce Electron Architecture

## Overview

Spayce Electron follows **Clean Architecture** principles with clear separation of concerns across multiple packages.

## Package Structure

```
packages/
├── core/           # Domain & Application layers (pure TypeScript)
├── infrastructure/ # External services, database, DI
├── react-ui/       # React components, hooks, UI state
├── desktop/        # Electron main/renderer processes
└── shared/         # [DEPRECATED] Legacy shared code
```

## Layer Dependencies

The dependency rule is: **outer layers depend on inner layers, never the reverse**.

```
┌─────────────────────────────────────────────────────────────┐
│                      packages/desktop                        │
│                   (Electron App Shell)                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  @spayce/core   │  │@spayce/react-ui │  │@spayce/infra    │
│    (Domain)     │◄─│    (UI Layer)   │  │  (External)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        ▲                    │                    │
        │                    │                    │
        └────────────────────┴────────────────────┘
                    depends on core
```

## Package Purposes

### @spayce/core
**Purpose**: Pure domain logic with zero external dependencies

- **Domain Layer**: Entities, Value Objects, Domain Events, Errors
- **Application Layer**: Use Cases, Facades, Queries
- **Repository Interfaces**: Contracts for data access

**Key Principle**: No dependencies on external libraries or frameworks.

### @spayce/infrastructure
**Purpose**: External service implementations

- **Persistence**: SQLite repositories (better-sqlite3)
- **Bootstrap**: Service initialization and DI container
- **Event Bus**: Domain event publishing/subscription

**Key Principle**: Implements interfaces defined in @spayce/core.

### @spayce/react-ui
**Purpose**: Reusable React UI layer

- **Hooks**: Data fetching (useSpaces, useSpaceItems, usePinnedItems)
- **Mutations**: State mutations (useCreateSpace, useDeleteItem, etc.)
- **Components**: Reusable UI components
- **Stores**: UI-only state (Zustand)

**Key Principle**: Depends on @spayce/core for types, not infrastructure.

### @spayce/desktop
**Purpose**: Electron application shell

- **Main Process**: Window management, IPC, native APIs
- **Renderer Process**: React app entry point
- **Preload**: Secure IPC bridge

**Key Principle**: Thin shell that composes other packages.

## Data Flow

```
User Action
    │
    ▼
React Component (react-ui)
    │
    ▼
Custom Hook (useSpaces, useMutation)
    │
    ▼
Facade (SpacesFacade)
    │
    ▼
Use Case (CreateSpaceUseCase)
    │
    ▼
Repository Interface (ISpacesRepository)
    │
    ▼
SQLite Repository (SqliteSpacesRepository)
    │
    ▼
Database (better-sqlite3)
```

## Key Patterns

### 1. Service Registry Pattern
```typescript
// Registration
serviceRegistry.register(SERVICE_KEYS.SPACES_FACADE, spacesFacade);

// Resolution
const facade = serviceRegistry.get<SpacesFacade>(SERVICE_KEYS.SPACES_FACADE);
```

### 2. Result Type Pattern
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Usage
const result = await facade.createSpace(input);
if (result.ok) {
    // Handle success
} else {
    // Handle error
}
```

### 3. Invalidation Pattern (React UI)
```typescript
// After mutation, invalidate cache
const { invalidate } = useInvalidation();
await createSpace(input);
invalidate('spaces');
```

### 4. Immutable Entities
```typescript
// Entities are readonly interfaces
interface SpaceEntity {
    readonly id: string;
    readonly name: string;
    // ...
}
```

## Database Schema

### spaces table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| profile_id | TEXT | User profile ID |
| user_id | TEXT | User ID |
| name | TEXT | Space name |
| accent_color | TEXT | Hex color code |
| icon_name | TEXT | Lucide icon name |
| sort_order | INTEGER | Display order |
| is_expanded | INTEGER | Boolean (0/1) |
| created_at | INTEGER | Unix timestamp (ms) |

### space_items table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| space_id | TEXT | FK to spaces |
| parent_id | TEXT | FK to space_items (nullable) |
| name | TEXT | Item name |
| path | TEXT | URL or file path |
| type | TEXT | link/folder/file/localFolder/localFile |
| is_expanded | INTEGER | Boolean (0/1) |
| sort_order | INTEGER | Display order |
| created_at | INTEGER | Unix timestamp (ms) |
| favicon_url | TEXT | Favicon URL (nullable) |
| description | TEXT | Item description (nullable) |
| visit_count | INTEGER | Visit counter |
| last_visited | INTEGER | Unix timestamp (nullable) |
| is_pinned | INTEGER | Boolean (0/1) |
| pin_position | INTEGER | Pin grid position (nullable) |
| local_path | TEXT | Local file path (nullable) |
| security_bookmark | TEXT | macOS security bookmark (nullable) |
| last_synced_at | INTEGER | Unix timestamp (nullable) |
| is_watching | INTEGER | Boolean (0/1) |

## Migration from packages/shared/

The legacy `packages/shared/` has been migrated to the new structure:

| Old Location | New Location |
|--------------|--------------|
| `@spayce/shared/types` | `@spayce/core` |
| `@spayce/shared/hooks` | `@spayce/react-ui/hooks` |
| `@spayce/shared/stores/spaces` | `@spayce/react-ui/hooks` |
| `@spayce/shared/components` | `@spayce/react-ui/components` |

## Flutter Feature Parity

All 40+ features from the Flutter app are implemented:

- ✅ Space CRUD operations
- ✅ Item CRUD operations
- ✅ Drag-and-drop reordering
- ✅ Pin system (5x3 grid)
- ✅ Local file/folder support
- ✅ Search functionality
- ✅ Recent/Most visited items
- ✅ Duplicate URL detection
