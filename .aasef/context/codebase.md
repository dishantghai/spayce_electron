# Codebase Structure

## Project Type
**Spayce** - A desktop browser application built with Electron, featuring workspace management and multi-tab browsing capabilities. Uses a monorepo structure with clean architecture and domain-driven design.

## Key Directories
- `packages/core/` - Domain layer with entities, repositories, validators, and business logic
- `packages/desktop/` - Electron application (main process, renderer, preload)
- `packages/shared/` - Shared React components, stores, models, and theme system
- `resources/db/` - SQLite database files
- `.windsurf/workflows/` - AI workflow documentation
- `project_ops/` - Project documentation and migration specs

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `packages/core/src/domain/entities/Space.ts` - Core Space entity
- `packages/core/src/domain/entities/SpaceItem.ts` - Space item entity
- `packages/desktop/src/main/index.ts` - Electron main process entry
- `packages/desktop/src/renderer/App.tsx` - React UI root component
- `packages/shared/src/stores/spaces.ts` - Zustand state management for spaces
- `packages/shared/src/components/Sidebar.tsx` - Main sidebar component
- `packages/shared/src/theme/colors.ts` - Design system color tokens
- `vitest.config.ts` - Testing configuration

## Patterns Observed
- **Clean Architecture**: Domain layer in `@spayce/core` with readonly entities and repository interfaces
- **Monorepo Structure**: Three packages (core, desktop, shared) with clear separation of concerns
- **CSS Modules**: Component-scoped styling with `.module.css` files
- **Barrel Exports**: `index.ts` files for clean imports
- **Test Co-location**: `__tests__/` directories alongside source code
- **Domain Events**: Event-driven architecture with typed domain events
- **Validation Layers**: Schema, format, and business rule validators

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite + Zustand + CSS Modules + Vite + pnpm workspaces
- **Database**: SQLite with better-sqlite3 (not SurrealDB despite any legacy files)
- **State Management**: Zustand stores in `packages/shared/src/stores/`
- **Styling**: CSS Modules with design tokens from `packages/shared/src/theme/`
- **Architecture**: Clean architecture with immutable domain entities (readonly properties)
- **Focus Management**: Independent contexts for sidebar vs main content areas
- **Browser Integration**: Uses WebContentsView (Electron 30+), not deprecated BrowserView
- **Testing**: Vitest for unit tests, React Testing Library for components