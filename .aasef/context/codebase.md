# Codebase Structure

## Project Type
Electron-based desktop application with a monorepo architecture implementing a space/tab management system using Clean Architecture principles.

## Key Directories
- `packages/core/` - Domain and application layers with entities, use cases, queries, and facades
- `packages/infrastructure/` - Database persistence layer with SQLite repositories and services
- `packages/react-ui/` - Presentation layer hooks, error boundaries, and UI stores
- `packages/shared/` - Reusable React components and design system
- `packages/desktop/` - Electron main process, renderer, and preload scripts
- `project_ops/` - Project documentation and migration specifications
- `.aasef/` - AASEF framework context and implementation specs

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