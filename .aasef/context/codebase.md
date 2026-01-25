# Codebase Structure

## Project Type
Modern Electron desktop application with React UI, built as a monorepo using pnpm workspaces. This is a browser/productivity tool called "Spayce" with space-based organization features.

## Key Directories
- `packages/` - Monorepo packages (core, infrastructure, react-ui, shared, desktop)
- `scripts/` - Build, migration, and development automation scripts
- `IMPLEMENTATION_PLAN/` - Detailed phase-by-phase development specifications
- `.windsurf/workflows/` - AI workflow definitions for development automation
- `resources/db/` - SQLite database files
- `project_ops/` - Project documentation and migration specs

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `package.json` - Root package with workspace dependencies
- `tsconfig.json` - TypeScript configuration for the monorepo
- `vitest.config.ts` - Testing configuration
- `SPACES_MIGRATION_PLAN.md` - Migration strategy documentation
- `TESTING_GUIDE.md` - Testing procedures and standards

## Patterns Observed
- **Clean Architecture**: Layered structure with core domain, infrastructure, and presentation layers
- **Package-based Separation**: Each architectural layer in its own package with clear boundaries
- **Comprehensive Testing**: Unit tests for all layers with integration test coverage
- **Migration-focused**: Heavy emphasis on database and feature migration with rollback capabilities
- **Specification-driven**: Detailed implementation plans with phase-by-phase development approach
- **Script Automation**: Extensive shell scripts for development workflows and database operations

## Notes for AI Assistants
- **Tech Stack**: Electron 30+ with React 18+, TypeScript, SQLite (better-sqlite3), Zustand, CSS Modules, Vitest
- **Architecture**: Follow clean architecture patterns - domain in `@spayce/core`, infrastructure separate, React UI hooks-based
- **Database**: SQLite with better-sqlite3, NOT SurrealDB (despite any legacy files)
- **Styling**: CSS Modules with design tokens, NOT Tailwind
- **State**: Zustand for UI state only, data hooks for business data
- **Focus**: WebContentsView for tabs (not deprecated BrowserView)
- **Migration Context**: Project is migrating from Flutter to Electron - many specs reference this transition
- **Testing**: Use Vitest for all testing, comprehensive coverage expected
- **Monorepo**: Use pnpm workspaces, respect package boundaries, follow dependency rules in tech decisions