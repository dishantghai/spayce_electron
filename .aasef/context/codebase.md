# Codebase Structure

## Project Type
Electron-based desktop application with a monorepo architecture implementing a space/tab management system using Clean Architecture principles.

## Package Structure (Clean Architecture)

### @spayce/core
Domain and application layers with zero production dependencies.
- `src/domain/entities/` - Space, SpaceItem entities (immutable interfaces)
- `src/domain/errors/` - ValidationError, BusinessRuleError, EntityNotFoundError
- `src/domain/events/` - Domain events (SpaceCreated, ItemDeleted, etc.)
- `src/domain/repositories/` - Repository interfaces (ISpacesRepository, ISpaceItemsRepository)
- `src/domain/validators/` - Domain validation logic
- `src/application/use-cases/` - Business operations (CreateSpace, DeleteItem, etc.)
- `src/application/facades/` - Simplified API for UI layer (SpacesFacade, SpaceItemsFacade)
- `src/application/queries/` - Read-only data queries

### @spayce/infrastructure
External service implementations and dependency injection.
- `src/persistence/sqlite/` - SQLite repositories (SqliteSpacesRepository, SqliteSpaceItemsRepository)
- `src/persistence/sqlite/DatabaseInitializer.ts` - Schema creation and migrations
- `src/bootstrap/ServiceBootstrap.ts` - Service initialization
- `src/di/ServiceRegistry.ts` - Dependency injection container
- `src/events/EventBus.ts` - Domain event publishing

### @spayce/react-ui
Reusable React UI layer with hooks, components, theme, and stores.
- `src/theme/` - Design tokens (colors, spacing, typography, radius, shadows, animations)
- `src/components/` - All UI components migrated from packages/shared:
  - `Sidebar.tsx`, `SidebarTabs.tsx` - Navigation components
  - `SpacesScreen.tsx`, `SpaceCard.tsx` - Spaces management
  - `TreeView.tsx`, `TreeItem.tsx` - Hierarchical item display
  - `ContextMenu.tsx` - Right-click context menus
  - `CreateSpaceView.tsx` - Space creation form
  - `PinnedLinksGrid.tsx` - Pinned items display
  - `BottomBar.tsx`, `SpaceHeader.tsx` - UI chrome
  - `error/` - Error boundary components
  - `common/` - Shared components (Skeleton)
- `src/stores/` - UI-only state (Zustand):
  - `navigationUiStore.ts` - Sidebar state, active tab
  - `dragDropUiStore.ts` - Drag and drop state
- `src/types/` - UI type definitions (Space, SpaceItem, etc.)
- `src/hooks/` - Data hooks (NOT exported from main index - require Node.js environment)
  - For Electron renderer, use IPC-based hooks from @spayce/desktop

### @spayce/desktop
Electron application shell.
- `src/main/` - Main process:
  - `index.ts` - App initialization
  - `window.ts` - Window management
  - `ipc/handlers.ts` - IPC handlers for all operations
  - `services/LocalFileSystemService.ts` - File system dialog operations
- `src/renderer/` - React app entry point:
  - `App.tsx` - Main application component
  - `hooks/useSpacesData.ts` - IPC-based data hook
  - `ipc/spacesApi.ts` - IPC client API
- `src/preload/` - Secure IPC bridge

### packages/shared/ [REMOVED]
Legacy shared code has been fully migrated to @spayce/react-ui and removed from the codebase.

## Key Directories
- `project_ops/` - Project documentation and migration specifications
- `.aasef/` - AASEF framework context and implementation specs
- `scripts/` - Migration, seeding, and verification scripts
- `resources/db/` - SQLite database files

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `resources/db/spaces.sqlite` - SQLite database file
- `packages/core/src/domain/entities/` - Space and SpaceItem domain entities
- `packages/core/src/application/facades/` - Application layer facades for UI integration
- `packages/infrastructure/src/persistence/sqlite/` - SQLite repository implementations
- `packages/react-ui/src/hooks/` - Data fetching and mutation hooks
- `packages/desktop/src/main/index.ts` - Electron main process entry point

## Patterns Observed
- **Clean Architecture**: Strict layering with domain → application → infrastructure → presentation
- **Monorepo Structure**: pnpm workspaces with clear package boundaries
- **Test-Driven**: Comprehensive test coverage across all layers (`__tests__/` directories)
- **TypeScript Configuration**: Per-package tsconfig with build info caching
- **Barrel Exports**: Consistent `index.ts` files for clean imports

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite + Zustand + CSS Modules + Vitest
- **Architecture**: Follow Clean Architecture with readonly domain entities and repository interfaces
- **Database**: Use SQLite with better-sqlite3, NOT SurrealDB (despite any legacy files)
- **Styling**: CSS Modules with design tokens, NOT Tailwind
- **State**: Zustand for UI state, data hooks for business data
- **Focus**: Independent focus contexts for sidebar vs main content areas
- **WebViews**: Use WebContentsView (Electron 30+), NOT deprecated BrowserView
- **Domain Layer**: Zero production dependencies, immutable entities, Date types for timestamps
- **Error Handling**: Result<T, Error> pattern in application layer, error boundaries in UI