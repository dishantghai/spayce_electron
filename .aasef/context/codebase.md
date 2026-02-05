# Codebase Structure

## Project Type
**Spayce** - An Electron-based desktop application with browser integration capabilities, built as a monorepo using clean architecture principles. The project appears to be migrating from a Flutter codebase to a TypeScript/React implementation.

## Key Directories
- `packages/core/` - Domain and application layers with entities, use cases, and business logic
- `packages/infrastructure/` - SQLite database implementation and service layer
- `packages/react-ui/` - Presentation layer with React hooks and UI components  
- `packages/shared/` - Reusable components and design system tokens
- `packages/desktop/` - Electron main process and renderer configuration
- `project_ops/spayce_migration/` - Migration specifications and component specs (F001-F008)
- `scripts/` - Build, migration, and development utility scripts
- `docs/` - Technical documentation and setup guides
- `BROWSER_INTEGRATION_PLAN/` - Phased browser integration implementation plan
- `.aasef/` - AASEF framework context and specifications

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `package.json` - Root package with workspace dependencies
- `tsconfig.json` - TypeScript configuration for the monorepo
- `vitest.config.ts` - Testing configuration using Vitest
- `resources/db/spaces.sqlite` - SQLite database file
- `test-imports.mjs` - Import verification script
- Multiple session summary files indicating active development iterations

## Patterns Observed
- **Clean Architecture**: Strict layered architecture with domain, application, infrastructure, and presentation layers
- **Monorepo Structure**: Each package has its own `package.json`, `tsconfig.json`, and test configuration
- **Test Coverage**: Comprehensive test suites in `__tests__` directories across packages
- **Migration Documentation**: Extensive documentation of fixes, sessions, and implementation progress
- **Build Tooling**: Multiple scripts for environment setup, database migration, and verification
- **Workspace Dependencies**: Packages reference each other using workspace protocol (`workspace:*`)

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite + Vite + pnpm workspaces (per authoritative tech decisions)
- **Architecture**: Follow clean architecture patterns - domain entities are readonly, use repository interfaces, Result<T> pattern for error handling
- **Database**: SQLite with better-sqlite3, NOT SurrealDB (despite any legacy file references)
- **Styling**: CSS Modules with design tokens, NOT Tailwind
- **State Management**: Zustand for UI state, data hooks for business data
- **Focus Areas**: Browser integration, multi-tab support, and migration from Flutter codebase
- **Active Development**: Multiple session summaries indicate ongoing development with specific focus on context menus and browser integration
- **Testing Strategy**: Vitest for unit tests, comprehensive test coverage across all packages