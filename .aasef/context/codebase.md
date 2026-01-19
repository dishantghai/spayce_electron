# Codebase Structure

## Project Type
Electron-based desktop application with TypeScript, using a monorepo structure with pnpm workspaces. Features a space/workspace management system with file organization capabilities.

## Key Directories
- `packages/desktop/` - Electron main process, renderer, and preload scripts
- `packages/shared/` - Shared UI components, stores, models, and theme system
- `packages/desktop/src/main/` - Electron main process (window management, database, IPC)
- `packages/shared/src/components/` - React components organized by feature (spaces, navigation, icons)
- `packages/shared/src/stores/` - State management (navigation, spaces)
- `packages/shared/src/theme/` - Design system (colors, typography, spacing, etc.)
- `project_ops/HIFI_UI_DESIGN_SCREENS/` - UI design mockups and screenshots

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `packages/desktop/src/main/index.ts` - Electron main process entry
- `packages/desktop/src/renderer/App.tsx` - Main React application
- `packages/desktop/src/main/database/surrealdb.ts` - Database integration
- `packages/shared/src/stores/spaces.ts` - Spaces/workspace state management
- `packages/shared/src/components/spaces/SpacesScreen.tsx` - Main spaces interface

## Patterns Observed
- Monorepo with shared UI library pattern
- Feature-based component organization (spaces, navigation, icons)
- CSS Modules for styling with TypeScript
- Comprehensive test coverage with Vitest
- Design system with modular theme tokens
- IPC handlers for Electron communication

## Notes for AI Assistants
- This is a workspace/file management application called "Spayce"
- Uses SurrealDB for data persistence
- Heavy focus on UI/UX with detailed design mockups available
- Shared components are designed for reusability across desktop app
- State management uses custom stores (likely Zustand or similar)
- All styling uses CSS Modules with TypeScript definitions