# Codebase Structure

## Project Type
Electron desktop application called "Spayce" - a spatial browser/workspace manager using clean architecture with a monorepo structure.

## Key Directories
- `packages/core/` - Domain and application layers (business logic, use cases, queries)
- `packages/infrastructure/` - Database and service implementations (SQLite repositories)
- `packages/react-ui/` - Presentation layer hooks and React components
- `packages/shared/` - Reusable UI components and design system
- `packages/desktop/` - Electron application (main process, renderer, preload)
- `scripts/` - Development and migration utilities
- `IMPLEMENTATION_PLAN/` - Detailed implementation specifications and phases
- `project_ops/` - Project documentation and migration specs
- `.aasef/` - AASEF framework context and specs
- `resources/db/` - SQLite database files

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `vitest.config.ts` - Test configuration using Vitest
- `tsconfig.json` - TypeScript configuration
- `SPACES_MIGRATION_PLAN.md` - Migration documentation
- `TESTING_GUIDE.md` - Testing procedures and guidelines
- `scripts/migrate-db.ts` - Database migration script
- `resources/db/spaces.sqlite` - SQLite database file

## Patterns Observed
- **Clean Architecture**: Strict layered approach with domain/application/infrastructure/presentation separation
- **Monorepo Structure**: pnpm workspaces with distinct package responsibilities
- **Test-Driven**: Comprehensive test suites in each package with Vitest
- **Migration-Focused**: Multiple migration scripts and documentation suggesting active development/refactoring
- **Phase-Based Implementation**: Structured implementation plan with numbered phases
- **TypeScript-First**: Full TypeScript adoption across all packages

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite + Zustand + CSS Modules + Vitest (per AUTHORITATIVE tech decisions)
- **Architecture**: Follow clean architecture patterns - domain entities are readonly, use repository interfaces, Result<T> pattern for error handling
- **Database**: SQLite with better-sqlite3 driver, not SurrealDB despite any legacy file references
- **State Management**: Zustand for UI state, data hooks for business data fetching
- **Focus Management**: Independent focus contexts for sidebar vs spaces screen
- **Migration Context**: Project appears to be migrating from Flutter to Electron (see migration plans)
- **Testing**: Use Vitest for all testing, comprehensive test coverage expected
- **Styling**: CSS Modules with design tokens, never hardcode styles