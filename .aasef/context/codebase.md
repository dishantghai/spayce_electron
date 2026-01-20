# Codebase Structure

## Project Type
Electron-based desktop application with a monorepo structure using pnpm workspaces. Appears to be a space/workspace management tool called "Spayce" with file organization and browser integration capabilities.

## Key Directories
- `packages/desktop/` - Electron main process, renderer, and preload scripts
- `packages/shared/` - Shared UI components, stores, models, and theme system
- `project_ops/HIFI_UI_DESIGN_SCREENS/` - UI design mockups and screenshots
- `packages/shared/src/components/` - React components organized by feature (spaces, navigation, icons)
- `packages/shared/src/stores/` - State management (navigation, spaces)
- `packages/shared/src/theme/` - Design system (colors, typography, spacing, etc.)

## Key Files
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `packages/desktop/src/main/index.ts` - Electron main process entry
- `packages/desktop/src/main/database/surrealdb.ts` - Database integration
- `packages/shared/src/stores/spaces.ts` - Core spaces state management
- `packages/shared/src/models/spaces.ts` - Space data models
- `vitest.config.ts` - Test configuration with comprehensive test coverage

## Patterns Observed
- **Monorepo structure** with shared and desktop packages
- **CSS Modules** for component styling (`.module.css` files)
- **Feature-based organization** in components (spaces/, navigation/, icons/)
- **Comprehensive theming system** with separate files for design tokens
- **Test coverage** for major components and functionality
- **TypeScript throughout** with proper configuration

## Notes for AI Assistants
- This is a workspace/file management desktop app built with Electron + React
- Uses SurrealDB for data persistence
- Heavy focus on UI/UX with detailed design mockups available
- Shared package contains reusable components that could be used across platforms
- State management appears to use custom stores rather than Redux/Zustand
- CSS Modules pattern suggests component-scoped styling approach