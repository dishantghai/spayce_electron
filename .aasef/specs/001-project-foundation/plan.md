# Implementation Plan: 001-project-foundation

## Step 1: Initialize Monorepo Structure
1. Create root `package.json` with pnpm workspaces
2. Create `pnpm-workspace.yaml`
3. Create `packages/shared/package.json`
4. Create `packages/desktop/package.json`
5. Initialize TypeScript configs with path aliases

## Step 2: Set Up packages/shared
1. Create `src/theme/colors.ts` with SpayceColors and SpaceThemes
2. Create `src/theme/spacing.ts` with SpayceSpacing
3. Create `src/theme/radius.ts` with SpayceRadius
4. Create `src/theme/animations.ts` with SpayceAnimations
5. Create `src/theme/shadows.ts` with SpayceShadows
6. Create `src/theme/typography.ts` with SpayceTypography
7. Create `src/theme/index.ts` barrel export
8. Create `src/types/index.ts` for shared TypeScript interfaces

## Step 3: Set Up packages/desktop Electron
1. Create `src/main/index.ts` - Electron entry point
2. Create `src/main/window.ts` - BrowserWindow management
3. Create `src/main/database/surrealdb.ts` - SurrealDB setup
4. Create `src/main/database/migrations/` - Schema migrations
5. Create `src/main/ipc/handlers.ts` - IPC handlers
6. Create `src/preload/index.ts` - Preload script
7. Create `src/renderer/index.tsx` - React entry point
8. Create `src/renderer/App.tsx` - Root component

## Step 4: Configure Build Tools
1. Create `vite.config.ts` for renderer bundling
2. Create `electron-builder.json` for packaging
3. Configure dev scripts in package.json

## Step 5: Set Up Testing
1. Create `vitest.config.ts`
2. Create `packages/shared/__tests__/theme.test.ts`
3. Create test utilities and mocks

## TDD Approach
For each component:
1. Write failing test first
2. Implement minimum code to pass
3. Refactor while keeping tests green
