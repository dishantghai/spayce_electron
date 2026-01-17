# Spec 001: Project Foundation

## Overview
Initialize the Electron + React Native Web monorepo with all required tooling, design system tokens, and SurrealDB embedded database.

## Requirements

### R1: Monorepo Setup
- Initialize pnpm workspaces with `packages/shared` and `packages/desktop`
- Configure Vite for React Native Web bundling
- Set up TypeScript with strict mode and path aliases
- Configure ESLint and Prettier

### R2: Design System Tokens
- Implement `SpayceColors` with all 24 space theme colors
- Implement `SpayceSpacing` with layout constants (sidebarWidth: 320, etc.)
- Implement `SpayceRadius` with component-specific values
- Implement `SpayceAnimations` with durations and curves
- Implement `SpayceShadows` for card and sidebar effects
- Implement `SpayceTypography` with Inter and JetBrains Mono fonts

### R3: SurrealDB Embedded Setup
- Install and configure surrealdb.node for embedded mode
- Create database initialization in Electron main process
- Set up connection at `surrealkv://{userData}/spayce.db`
- Create initial schema migrations for spaces and space_items

### R4: Electron Main Process
- Configure Electron 30+ with WebContentsView support
- Set up IPC handlers for database operations
- Configure preload scripts with context isolation
- Set up window management with proper bounds

### R5: Testing Infrastructure
- Configure Vitest for unit tests
- Set up React Testing Library for component tests
- Create test utilities and mocks

## Acceptance Criteria
- [ ] `pnpm install` succeeds with no errors
- [ ] `pnpm dev` starts Electron app with React Native Web renderer
- [ ] Design system tokens are importable from `@spayce/shared/theme`
- [ ] SurrealDB connects and creates database file
- [ ] Basic IPC communication works between main and renderer
- [ ] `pnpm test` runs with passing placeholder tests

## Dependencies
None (first spec)

## Estimated Duration
2-3 days

## Reference Files
- Implementation Plan: Phase 1
- Old Theme: `spayce/frontend/lib/core/theme/`
