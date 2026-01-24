# Codebase Structure

## Project Type
**Electron desktop application** - A monorepo workspace for "Spayce", a browser-like desktop app with spaces/tabs management, migrating from Flutter to TypeScript/React/Electron stack.

## Key Directories
- `packages/` - Monorepo packages with clean architecture layers
  - `packages/core/` - Domain & Application layers (entities, use cases, queries)
  - `packages/infrastructure/` - Database & services implementation (SQLite repositories)
  - `packages/react-ui/` - Presentation layer hooks & components
  - `packages/shared/` - Reusable React components & design system
  - `packages/desktop/` - Electron main/renderer processes
- `scripts/` - Build, migration, and development automation scripts
- `IMPLEMENTATION_PLAN/` - Detailed phase-by-phase implementation specs
- `.windsurf/workflows/` - Windsurf IDE workflow configurations
- `resources/db/` - SQLite database files

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `vitest.config.ts` - Testing configuration for Vitest
- `tsconfig.json` - Root TypeScript configuration
- `SPACES_MIGRATION_PLAN.md` - Migration strategy from Flutter
- `TESTING_GUIDE.md` - Testing procedures and standards
- `scripts/migrate-db.ts` - Database migration automation
- `scripts/verify-features.ts` - Feature verification scripts

## Patterns Observed
- **Clean Architecture**: Layered approach with domain/application/infrastructure/presentation separation
- **Monorepo Structure**: pnpm workspaces with package interdependencies
- **Test-Driven**: Comprehensive test suites in `__tests__/` directories
- **Migration Focus**: Extensive documentation and tooling for Flutter→Electron migration
- **Spec-Driven Development**: Detailed implementation plans and architectural decisions
- **Database-First**: SQLite as primary data store with migration scripts

## Notes for AI Assistants
- **Tech Stack**: Electron 30+, React 18+, TypeScript 5.x, Vite 5+, pnpm 8+, SQLite with better-sqlite3
- **Architecture**: Follow clean architecture patterns - domain entities are readonly, use repository interfaces
- **Styling**: CSS Modules with CSS custom properties (NOT Tailwind)
- **State**: Zustand for UI state, data hooks for business data
- **Database**: SQLite via better-sqlite3 in main process, accessed via IPC bridge
- **Testing**: Vitest for unit tests, comprehensive test coverage expected
- **Migration Context**: Project is actively migrating from Flutter, may contain legacy references
- **Focus Management**: Independent focus contexts for sidebar vs spaces screen
- **WebContentsView**: Use Electron 30+ WebContentsView for tabs, NOT deprecated BrowserView