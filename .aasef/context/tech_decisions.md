# Tech Decisions - AUTHORITATIVE

> **CRITICAL**: All implementations MUST use ONLY the packages and technologies listed here.
> Do NOT suggest alternatives to decided technologies.

## Core Stack

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| **Desktop Framework** | Electron | 30+ | WebContentsView for multi-tab browser |
| **UI Framework** | React | 18+ | Mature ecosystem, AI-friendly |
| **Build Tool** | Vite | 5+ | Fast dev experience |
| **Language** | TypeScript | 5.x | Strict type safety |
| **Package Manager** | pnpm | 8+ | Efficient workspace management |
| **Monorepo** | pnpm workspaces | - | Native workspace support |

## Database

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Embedded Database** | SQLite | Reliable, proven, offline-first |
| **Node Driver** | better-sqlite3 | Synchronous API, fast |
| **Location** | `{userData}/spayce.db` | User data directory |

## State Management

| Component | Technology | Usage |
|-----------|------------|-------|
| **Global State** | Zustand | UI state, navigation, spaces |
| **Persistence** | zustand/persist | Local storage persistence |
| **Form State** | React useState | Simple component state |

## Styling

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **CSS Strategy** | CSS Modules | Scoped styles, design token integration |
| **Variables** | CSS Custom Properties | Theme tokens as CSS vars |
| **Animations** | CSS Transitions | Native, performant |

## UI Components

| Component | Technology |
|-----------|------------|
| **Icons** | Lucide React |
| **Fonts** | Inter (UI), JetBrains Mono (code) |

## Browser Integration

| Component | Technology |
|-----------|------------|
| **Tab Views** | WebContentsView (Electron 30+) |
| **Ad Blocking** | @cliqz/adblocker-electron (planned) |

## Testing

| Component | Technology |
|-----------|------------|
| **Unit Tests** | Vitest |
| **Component Tests** | React Testing Library |
| **E2E Tests** | Playwright (planned) |

## Project Structure

```
spayce_electron/
├── packages/
│   ├── shared/                 # Shared React components & utilities
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── TreeView.tsx
│   │   │   │   ├── TreeItem.tsx
│   │   │   │   ├── TreeItemIcon.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── ContextMenu.tsx
│   │   │   │   ├── CreateSpaceView.tsx
│   │   │   │   ├── SpaceHeader.tsx
│   │   │   │   ├── BottomBar.tsx
│   │   │   │   ├── PinnedLinksGrid.tsx
│   │   │   │   ├── SidebarTabs.tsx
│   │   │   │   └── spaces/
│   │   │   │       ├── SpacesScreen.tsx
│   │   │   │       ├── SpaceCard.tsx
│   │   │   │       └── SpacesBottomBar.tsx
│   │   │   ├── stores/         # Zustand state stores
│   │   │   │   ├── navigation.ts
│   │   │   │   └── spaces.ts
│   │   │   ├── models/         # Data models
│   │   │   ├── theme/          # Design system tokens
│   │   │   │   ├── colors.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   ├── radius.ts
│   │   │   │   ├── animations.ts
│   │   │   │   ├── shadows.ts
│   │   │   │   └── typography.ts
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   └── index.ts        # Barrel exports
│   │   ├── __tests__/          # Unit tests
│   │   └── package.json
│   │
│   └── desktop/                # Electron application
│       ├── src/
│       │   ├── main/           # Electron main process
│       │   │   ├── index.ts
│       │   │   └── services/
│       │   ├── renderer/       # React UI entry
│       │   │   ├── App.tsx
│       │   │   └── main.tsx
│       │   └── preload/        # Context bridge
│       └── package.json
│
├── project_ops/                # Project documentation
│   ├── spayce_migration/       # Migration specs
│   │   ├── component-specs/    # F001-F008 component specs
│   │   ├── design-tokens/      # JSON design tokens
│   │   └── docs/               # Reference docs
│   └── REBUILD_PLAN/           # Architecture docs
│
├── .aasef/                     # AASEF framework
│   ├── context/                # Project context files
│   └── specs/                  # Implementation specs
│
├── package.json                # Root monorepo config
├── pnpm-workspace.yaml
├── tsconfig.json
└── vitest.config.ts
```

## Important Architecture Decisions

> **CRITICAL**: This section is ALWAYS included in IDE context during implementation.
> All specs, stories, and code changes MUST conform to these architectural patterns.

### Patterns & Conventions

- **State Management**: Zustand stores in `packages/shared/src/stores/`. Global state flows down via React context, local state via useState.
- **Component Structure**: Each component has `Component.tsx` + `Component.module.css`. Export via barrel files.
- **Data Layer**: SQLite via better-sqlite3 in main process. Renderer accesses via IPC bridge.
- **Focus Management**: Independent focus contexts - sidebar vs spaces screen. Never mix focus domains.
- **Clean Architecture**: Follow layered architecture with `@spayce/core` domain layer. Domain entities are immutable (readonly). Repository interfaces define contracts. Use domain events for loose coupling.

### Design Decisions

- **WebContentsView for Tabs**: Use Electron 30+ WebContentsView, NOT deprecated BrowserView
- **CSS Modules**: Use CSS Modules with CSS custom properties for design tokens, NOT Tailwind
- **Theme Tokens**: All colors/spacing/radius from `packages/shared/src/theme/`. Never hardcode values.

### Anti-Patterns to Avoid

- ❌ **Direct DOM manipulation**: Use React state, never `document.querySelector`
- ❌ **Hardcoded colors/spacing**: Always use theme tokens from `theme/` directory
- ❌ **Cross-process state**: Don't share Zustand stores between main/renderer
- ❌ **Deprecated APIs**: No BrowserView, no remote module, no nodeIntegration in renderers
- ❌ **Mutable domain entities**: Never use mutable properties in domain entities. All entity properties must be `readonly`
- ❌ **String dates in domain**: Use `Date` type for all date/time fields, never strings
- ❌ **Direct database access from UI**: Always use repository interfaces, never access database directly from React components
- ❌ **Business logic in UI**: Keep domain logic in `@spayce/core`, UI only handles presentation and user interaction

---

## Architecture Decisions (Detailed)

### 1. Electron with WebContentsView
- Modern API for multi-tab browsing (not deprecated BrowserView)
- Full Chromium integration
- Native OS access for file system operations

### 2. SQLite over SurrealDB
- **Decision**: Use SQLite (better-sqlite3) instead of SurrealDB
- **Rationale**: More mature, simpler setup, proven reliability
- **Schema**: Standard relational tables for spaces, items, tabs

### 3. CSS Modules over Tailwind
- **Decision**: Use CSS Modules with CSS custom properties
- **Rationale**: Exact design token control, scoped styles, smaller bundle
- **Pattern**: `Component.module.css` alongside `Component.tsx`

### 4. Focus Context Management
- **Decision**: Independent focus contexts for sidebar and spaces screen
- **Implementation**: `KeyboardNavigationProvider` with context state
- **Rules**: Click on sidebar → sidebar focus; click on spaces → spaces focus

### 5. Sidebar Modes
- **Decision**: Support both fixed and floating sidebar modes
- **Fixed**: Sidebar always visible, takes layout space
- **Floating**: Sidebar overlays content, can be toggled

### 6. Clean Architecture - Domain Layer (Spec 007)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Package Location | `packages/core/src/domain/` | Centralized domain logic |
| Entity Pattern | Readonly interfaces | Immutability, type safety |
| Repository Pattern | Interfaces with Promise-based async | Framework-agnostic contracts |
| Error Pattern | Class hierarchy extending DomainError | Consistent error handling |
| Validator Pattern | Schema, Format, BusinessRule validators | Multi-layer validation |
| Event Pattern | Typed DomainEvent interface | Loose coupling via events |

**Domain Layer Structure:**
```
packages/core/src/domain/
├── entities/          # SpaceEntity, SpaceItemEntity
├── repositories/      # ISpacesRepository, ISpaceItemsRepository
├── value-objects/     # Color
├── events/            # SpaceCreated, ItemMoved, etc.
├── errors/            # ValidationError, BusinessRuleError, etc.
├── validators/        # CreateSpaceValidator, FormatValidators
├── services/          # IEventBus, ILogger
└── index.ts           # Barrel exports
```

**Key Principles:**
- Zero production dependencies in @spayce/core
- All entities are immutable (readonly properties)
- Date fields use `Date` type, not strings
- Repository interfaces define contracts for infrastructure layer

### 7. Clean Architecture - Infrastructure Layer (Spec 008)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Package Location | `packages/infrastructure/` | Separated from domain |
| Database Driver | better-sqlite3 | Synchronous API, performance |
| Database Schema | INTEGER timestamps | Flutter Drift compatibility |
| Service Pattern | ServiceRegistry singleton | No external DI frameworks |
| Event Bus | InMemoryEventBus | Simple pub/sub for domain events |
| Validation | SchemaValidator + IntegrityChecker | Safe startup checks |

**Infrastructure Layer Structure:**
```
packages/infrastructure/src/
├── bootstrap/         # ServiceBootstrap initialization
├── di/                # ServiceRegistry, SERVICE_KEYS
├── errors/            # DatabaseError, FileSystemError
├── persistence/
│   └── sqlite/
│       ├── SqliteSpacesRepository.ts
│       ├── SqliteSpaceItemsRepository.ts
│       ├── DatabaseInitializer.ts
│       └── validation/
│           ├── SchemaValidator.ts
│           └── IntegrityChecker.ts
├── services/          # InMemoryEventBus, ConsoleLogger
└── index.ts
```

**Key Principles:**
- Use `ServiceBootstrap.initialize({ databasePath })` to start services
- Use `serviceRegistry.get(SERVICE_KEYS.SPACES_REPOSITORY)` to access services
- Database timestamps stored as INTEGER (Unix ms), converted to Date in entities
- Always wrap database operations in try/catch and throw DatabaseError
- Use transactions for multi-row operations (reorder, batch updates)
