# Codebase Structure

## Project Type
Electron-based desktop application called "Spayce" - a multi-tab browser with workspace management features, built as a TypeScript monorepo using clean architecture patterns.

## Key Directories
- `packages/` - Monorepo workspace packages (core, infrastructure, react-ui, shared, desktop)
- `packages/core/` - Domain and application layers with entities, use cases, and business logic
- `packages/infrastructure/` - SQLite database implementation and service registry
- `packages/react-ui/` - React hooks for data fetching, mutations, and UI state management
- `packages/desktop/` - Electron main process, renderer, and preload scripts
- `packages/shared/` - Reusable React components and design system tokens
- `scripts/` - Development utilities for database migration, environment setup, and verification
- `docs/` - Technical documentation for testing, native modules, and fixes
- `project_ops/` - Migration specifications and architecture documentation
- `BROWSER_INTEGRATION_PLAN/` - Phased implementation plan for browser features
- `.aasef/` - AASEF framework context and specifications

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `tsconfig.json` - Root TypeScript configuration
- `vitest.config.ts` - Test configuration using Vitest
- `resources/db/spaces.sqlite` - SQLite database file
- `.env` / `.env.local` - Environment configuration
- `.nvmrc` - Node.js version specification
- Multiple session summary and fix documentation files

## Patterns Observed
- **Clean Architecture**: Strict separation between domain (`core`), infrastructure, and presentation layers
- **Monorepo Structure**: pnpm workspaces with TypeScript project references
- **Test-Driven**: Comprehensive test suites in `__tests__` directories across packages
- **Documentation-Heavy**: Extensive markdown documentation for fixes, migrations, and implementation plans
- **Migration-Focused**: Multiple files tracking database and architecture migrations
- **Environment Management**: Scripts for Node.js version management and native module rebuilding

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite (better-sqlite3) + Vite + pnpm workspaces + Zustand + CSS Modules
- **Architecture**: Clean architecture with domain-driven design patterns, immutable entities, repository interfaces
- **Database**: SQLite with better-sqlite3, NOT SurrealDB (despite any legacy files)
- **Styling**: CSS Modules with design tokens, NOT Tailwind
- **State Management**: Zustand for UI state, data hooks for business data
- **Testing**: Vitest for unit tests, React Testing Library for components
- **Focus Areas**: Multi-tab browser integration, workspace management, keyboard navigation
- **Migration Context**: Project appears to be migrating from Flutter to Electron with extensive documentation of the process