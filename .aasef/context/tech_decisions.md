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
│   ├── core/                   # Domain & Application layers
│   │   ├── src/
│   │   │   ├── domain/         # Entities, repositories, validators
│   │   │   └── application/    # Use cases, queries, facades
│   │   └── package.json
│   │
│   ├── infrastructure/         # Database, services implementation
│   │   ├── src/
│   │   │   ├── persistence/    # SQLite repositories
│   │   │   ├── di/             # Service registry
│   │   │   └── services/       # Event bus, logger
│   │   └── package.json
│   │
│   ├── react-ui/               # Presentation layer hooks & components
│   │   ├── src/
│   │   │   ├── hooks/          # Data & mutation hooks
│   │   │   ├── components/     # Error boundaries, skeletons
│   │   │   └── stores/         # UI-only Zustand stores
│   │   └── package.json
│   │
│   ├── shared/                 # Shared React components & utilities
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── theme/          # Design system tokens
│   │   │   └── types/          # TypeScript interfaces
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

### 8. Clean Architecture - Application Layer (Spec 009)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Package Location | `packages/core/src/application/` | Within core package |
| Use Case Pattern | Single execute() method | Clear, testable operations |
| Query Pattern | Separate from commands | CQRS-lite separation |
| Facade Pattern | Thin orchestrators | Simple API for UI layer |
| Error Handling | Result<T, Error> type | UI-friendly error propagation |
| Validation | Schema + Business rule | Multi-layer validation |

**Application Layer Structure:**
```
packages/core/src/application/
├── common/
│   ├── Result.ts          # Result<T, E> type and ok/err helpers
│   ├── idGenerator.ts     # UUID v4 generation
│   ├── UseCase.ts         # UseCase<TInput, TOutput> interface
│   └── index.ts
├── use-cases/
│   ├── spaces/            # Space CRUD operations
│   ├── items/             # SpaceItem CRUD operations
│   ├── pins/              # Pin management operations
│   └── index.ts
├── queries/
│   ├── GetSpacesQuery.ts
│   ├── GetSpaceItemsQuery.ts
│   ├── SearchItemsQuery.ts
│   ├── GetRecentItemsQuery.ts
│   ├── GetMostVisitedItemsQuery.ts
│   └── index.ts
├── facades/
│   ├── SpacesFacade.ts
│   ├── SpaceItemsFacade.ts
│   ├── SearchFacade.ts
│   └── index.ts
└── index.ts
```

**Key Principles:**
- Use cases validate input, sanitize data, emit domain events
- Queries fetch and transform data without side effects
- Facades provide thin wrappers returning Result<T> for UI consumption
- All errors mapped to AppError type with type discrimination
- No external dependencies in application layer (uses domain interfaces)

### 9. React UI Integration - Presentation Layer (Spec 010)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Package Location | `packages/react-ui/` | Separated presentation layer |
| Data Hooks | Custom hooks with useInvalidation | Reactive data fetching |
| Mutation Hooks | useCreateSpace, useDeleteSpace, etc. | Encapsulated mutations |
| Cache Invalidation | InvalidationContext + useInvalidation | Pub/sub pattern for refetch |
| Error Boundaries | DomainErrorBoundary, GlobalErrorBoundary | Graceful error handling |
| UI State | Zustand stores | Navigation, drag-drop state |
| Form Validation | useFormValidation hook | Reusable validation logic |
| Loading States | Skeleton components | Consistent loading UI |

**React UI Layer Structure:**
```
packages/react-ui/src/
├── hooks/
│   ├── common/
│   │   ├── InvalidationContext.tsx  # Pub/sub for cache invalidation
│   │   └── useAsync.ts              # Generic async hook
│   ├── mutations/
│   │   ├── useCreateSpace.ts
│   │   ├── useDeleteSpace.ts
│   │   ├── useUpdateSpace.ts
│   │   ├── useReorderSpaces.ts
│   │   ├── useCreateItem.ts
│   │   ├── useDeleteItem.ts
│   │   ├── useMoveItem.ts
│   │   ├── usePinItem.ts
│   │   └── useUnpinItem.ts
│   ├── useSpaces.ts                 # Data fetching hook
│   ├── useSpaceItems.ts
│   ├── usePinnedItems.ts
│   ├── useRecentItems.ts
│   ├── useFormValidation.ts
│   └── index.ts
├── components/
│   ├── error/
│   │   ├── DomainErrorBoundary.tsx  # Catches component errors
│   │   ├── GlobalErrorBoundary.tsx  # App-level error boundary
│   │   └── ErrorFallback.tsx        # Error UI component
│   ├── common/
│   │   └── Skeleton.tsx             # Loading placeholder
│   └── spaces/
│       └── SpaceListSkeleton.tsx    # Space list loading UI
├── stores/
│   ├── navigationUiStore.ts         # Sidebar, active space
│   └── dragDropUiStore.ts           # Drag-drop state
└── index.ts
```

**Key Principles:**
- **Data Hooks Pattern**: All data fetching via custom hooks that return `{ data, loading, error, refetch }`
- **Invalidation Pattern**: Mutations call `invalidate('key')` to trigger refetch in subscribed hooks
- **Error Boundary Pattern**: Wrap feature areas with DomainErrorBoundary for graceful degradation
- **UI State Separation**: Zustand stores for UI-only state (navigation, drag-drop), NOT business data
- **Form Validation Pattern**: useFormValidation accepts validator schema, returns form state and helpers
- **Loading State Pattern**: Use Skeleton components with design system tokens for consistent loading UI

**Invalidation Keys:**
| Key Pattern | Usage |
|-------------|-------|
| `spaces` | All spaces list |
| `space-items:{spaceId}` | Items for specific space |
| `space-items` | All items (global) |
| `pins` | Pinned items |
| `recent-items` | Recent items list |

**Anti-Patterns for Presentation Layer:**
- ❌ **Direct facade calls in components**: Use data hooks, not direct facade access
- ❌ **Business logic in hooks**: Hooks orchestrate, facades contain logic
- ❌ **Shared state for business data**: Use data hooks, not Zustand for spaces/items
- ❌ **Manual refetch management**: Use InvalidationContext for automatic refetch
- ❌ **Inline error handling**: Use error boundaries for component errors
