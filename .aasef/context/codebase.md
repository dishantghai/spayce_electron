# Codebase Structure

## Project Type
**Electron-based desktop application** implementing a multi-tab browser with spaces/collections management. Uses a **monorepo architecture** with clean architecture principles (Domain-Driven Design).

## Monorepo Packages
- `@spayce/core` (`packages/core/`) - Domain and application layers (entities, use cases, queries)
- `@spayce/infrastructure` (`packages/infrastructure/`) - Database and services implementation (SQLite repositories)
- `@spayce/react-ui` (`packages/react-ui/`) - Presentation layer hooks and React components
- `packages/shared/` - Reusable UI components and design system (being migrated into above packages)
- `packages/desktop/` - Electron main/renderer processes
- `scripts/` - Development and migration utilities
- `docs/` - Technical documentation and setup guides
- `BROWSER_INTEGRATION_PLAN/` - Multi-phase browser integration roadmap
- `.aasef/` - AASEF framework specifications and context

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `vitest.config.ts` - Testing configuration for Vitest
- `tsconfig.json` - Root TypeScript configuration
- `resources/db/spaces.sqlite` - SQLite database file
- `scripts/seed-db.ts` - Database seeding script
- `scripts/migrate-db.ts` - Database migration utilities

## Patterns Observed
- **Clean Architecture**: Strict separation of domain, application, infrastructure, and presentation layers
- **Monorepo Structure**: Each package has its own `package.json`, `tsconfig.json`, and test configuration
- **Test Coverage**: Comprehensive test suites in `__tests__/` directories with integration tests
- **Migration System**: Structured approach to database and codebase migrations
- **Documentation-Driven**: Extensive docs for setup, testing, and architectural decisions

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite (better-sqlite3) + Vite + pnpm workspaces
- **State Management**: Zustand for UI state, domain data via custom hooks with invalidation pattern
- **Styling**: CSS Modules with CSS custom properties (design tokens), NOT Tailwind
- **Database**: SQLite with better-sqlite3, NOT SurrealDB (despite any legacy file references)
- **Architecture**: Follow clean architecture - domain entities are readonly, use repository interfaces
- **Browser Integration**: Uses WebContentsView (Electron 30+), NOT deprecated BrowserView
- **Focus Management**: Independent contexts for sidebar vs spaces screen
- **Error Handling**: Result<T, Error> pattern in application layer, error boundaries in React
- **Testing**: Vitest for unit tests, comprehensive test coverage across all layers