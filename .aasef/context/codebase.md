# Codebase Structure

## Project Type
**Electron-based desktop application** with browser integration capabilities, built as a TypeScript monorepo using clean architecture principles. The app appears to be "Spayce" - a space/item management tool with browsing features.

## Key Directories
- `packages/` - Monorepo packages following clean architecture layers
- `packages/core/` - Domain and application layers (business logic)
- `packages/infrastructure/` - Database and services implementation
- `packages/react-ui/` - Presentation layer hooks and components
- `packages/shared/` - Reusable React components and theme system
- `packages/desktop/` - Electron application (main/renderer processes)
- `scripts/` - Development and migration utilities
- `docs/` - Technical documentation and setup guides
- `BROWSER_INTEGRATION_PLAN/` - Phased browser integration strategy
- `project_ops/` - Project documentation and migration specs
- `.aasef/` - AASEF framework for project context

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `tsconfig.json` - Root TypeScript configuration
- `vitest.config.ts` - Testing configuration
- `resources/db/spaces.sqlite` - SQLite database file
- `scripts/migrate-db.ts` - Database migration utilities
- `scripts/seed-db.ts` - Database seeding script

## Patterns Observed
- **Clean Architecture**: Clear separation of domain, application, infrastructure, and presentation layers
- **Monorepo Structure**: Each package has its own `package.json`, `tsconfig.json`, and build config
- **Test Organization**: Tests co-located with source code using `__tests__` directories
- **Migration-First Development**: Extensive migration documentation and verification scripts
- **Comprehensive Documentation**: Detailed guides for setup, testing, and architecture decisions

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite + Vite + pnpm workspaces (per Tech Decisions)
- **Architecture**: Follow clean architecture with readonly domain entities and repository patterns
- **Database**: Uses SQLite with better-sqlite3, not SurrealDB (despite any legacy files)
- **Styling**: CSS Modules with design tokens, not Tailwind
- **State Management**: Zustand for UI state, data hooks for business data
- **Testing**: Vitest for unit tests, comprehensive test coverage expected
- **Migration Context**: Project appears to be migrating from Flutter to Electron (see migration specs)
- **Browser Integration**: Planned multi-phase browser integration using WebContentsView
- **Focus on Implementation**: Extensive documentation suggests this is an actively developed project with specific architectural requirements