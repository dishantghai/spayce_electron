# Codebase Structure

## Project Type
Electron-based desktop application with a monorepo structure using pnpm workspaces. Implements a space management system with multi-tab browser functionality following clean architecture principles.

## Key Directories
- `packages/core/` - Domain layer with entities, repositories, validators, and events
- `packages/desktop/` - Electron application (main, renderer, preload processes)
- `packages/shared/` - Shared React components, stores, and UI utilities
- `packages/infrastructure/` - Database and service implementations
- `resources/db/` - SQLite database files
- `.windsurf/workflows/` - Development workflow documentation

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `packages/core/src/domain/entities/Space.ts` - Core space domain entity
- `packages/desktop/src/main/index.ts` - Electron main process entry
- `packages/desktop/src/renderer/App.tsx` - React UI entry point
- `packages/shared/src/stores/spaces.ts` - Zustand state management for spaces
- `packages/shared/src/components/Sidebar.tsx` - Main navigation component
- `vitest.config.ts` - Testing configuration

## Patterns Observed
- **Clean Architecture**: Strict separation between domain (`core`), UI (`shared`), application (`desktop`), and infrastructure layers
- **CSS Modules**: Component-scoped styling with `.module.css` files alongside React components
- **Barrel Exports**: Consistent use of `index.ts` files for clean imports
- **Test Co-location**: `__tests__/` directories within each package
- **Domain-Driven Design**: Rich domain entities with readonly interfaces and typed events
- **Repository Pattern**: Interface-based data access with Promise-based async operations

## Notes for AI Assistants
- **Tech Stack**: Electron + React + TypeScript + SQLite (better-sqlite3) + Zustand + CSS Modules + Vite + pnpm workspaces
- **Architecture**: Follow clean architecture with immutable domain entities (readonly properties)
- **State Management**: Use Zustand stores in `packages/shared/src/stores/` for global state
- **Styling**: Use CSS Modules with design tokens from `theme/` directory - never hardcode values
- **Database**: SQLite via better-sqlite3 in main process, accessed through repository interfaces
- **Focus Management**: Independent focus contexts for sidebar vs main content areas
- **Testing**: Vitest for unit tests, React Testing Library for components
- **Key Anti-patterns**: No direct DOM manipulation, no hardcoded styles, no mutable domain entities, no cross-process state sharing