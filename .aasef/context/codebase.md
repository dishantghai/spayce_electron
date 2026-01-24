# Codebase Structure

## Project Type
Electron desktop application for browser workspace management, built as a TypeScript monorepo with clean architecture principles.

## Key Directories
- `packages/` - Monorepo packages following clean architecture layers
- `packages/core/` - Domain and application layers (business logic)
- `packages/infrastructure/` - Database and services implementation
- `packages/react-ui/` - Presentation layer hooks and components
- `packages/desktop/` - Electron main/renderer processes
- `scripts/` - Development and migration utilities
- `resources/db/` - SQLite database files
- `project_ops/` - Migration specs and documentation
- `.windsurf/` - Workflow definitions

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `package.json` - Root package with workspace dependencies
- `tsconfig.json` - TypeScript configuration with path mapping
- `vitest.config.ts` - Test runner configuration
- `resources/db/spaces.sqlite` - SQLite database file
- `scripts/migrate-db.ts` - Database migration script
- `IMPLEMENTATION_SUMMARY.md` - Project status documentation

## Patterns Observed
- **Clean Architecture**: Layered packages (core → infrastructure → react-ui → desktop)
- **Domain-Driven Design**: Entities, repositories, use cases, and facades
- **Monorepo Structure**: Independent packages with shared dependencies
- **Test Organization**: Tests co-located with source in `__tests__/` directories
- **Migration-First**: Extensive migration scripts and verification tools
- **Configuration Management**: Multiple environment files and build configs

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite + Vite + pnpm workspaces
- **Database**: Uses better-sqlite3 driver with SQLite database
- **Styling**: CSS Modules with CSS custom properties (NOT Tailwind)
- **State Management**: Zustand for UI state, domain data via hooks
- **Architecture**: Strict clean architecture - domain in core, infrastructure separate
- **Focus**: Browser workspace management with spaces, items, and pins
- **Migration Context**: Project appears to be migrating from Flutter to Electron
- **Testing**: Vitest for unit tests, comprehensive test coverage expected