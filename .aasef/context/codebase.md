# Codebase Structure

## Project Type
**Spayce** - A desktop browser application built with Electron, featuring a space-based tab organization system. This is a TypeScript monorepo implementing Clean Architecture patterns with a migration from Flutter to web technologies.

## Key Directories
- `packages/` - Monorepo packages following Clean Architecture layers
  - `core/` - Domain and Application layers (entities, use cases, queries)
  - `infrastructure/` - Database and services implementation (SQLite repositories)
  - `react-ui/` - Presentation layer hooks and React components
  - `shared/` - Reusable UI components and design system
  - `desktop/` - Electron application (main process, renderer, preload)
- `scripts/` - Build, migration, and development automation scripts
- `IMPLEMENTATION_PLAN/` - Detailed project specifications and migration phases
- `project_ops/` - Documentation and Flutter migration specs
- `resources/db/` - SQLite database files
- `.windsurf/workflows/` - AI workflow definitions

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `package.json` - Root package with workspace dependencies
- `tsconfig.json` - TypeScript configuration for monorepo
- `vitest.config.ts` - Test configuration
- `SPACES_MIGRATION_PLAN.md` - Migration strategy from Flutter
- `TESTING_GUIDE.md` - Testing procedures and standards
- `NODE_VERSION_SETUP.md` - Node.js version management guide

## Patterns Observed
- **Clean Architecture**: Strict layer separation (domain → application → infrastructure → presentation)
- **Monorepo Structure**: pnpm workspaces with clear package boundaries
- **Test-Driven**: Comprehensive test suites in each package
- **Migration-Focused**: Extensive documentation for Flutter-to-Electron migration
- **Script Automation**: Heavy use of shell scripts for development workflows
- **Phase-Based Implementation**: Structured implementation plan with 7 phases

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite + Zustand + CSS Modules + Vite
- **Architecture**: Follow Clean Architecture - domain entities are readonly, use repository interfaces
- **Database**: SQLite with better-sqlite3 driver, NOT SurrealDB (despite any legacy files)
- **Styling**: CSS Modules with design tokens, NOT Tailwind
- **State**: Zustand for UI state, data hooks for business data
- **Testing**: Vitest for unit tests, comprehensive test coverage expected
- **Migration Context**: This is an active migration from Flutter, so some legacy references may exist
- **Focus on Specs**: Check `IMPLEMENTATION_PLAN/` for detailed feature specifications
- **Package Dependencies**: Core has zero production deps, infrastructure implements domain interfaces