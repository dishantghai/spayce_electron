# Implementation Plan: 003-spaces-feature

## Step 1: SurrealDB Schema & Migrations
1. Create `migrations/001_spaces.surql` with space table
2. Create `migrations/002_space_items.surql` with space_item table
3. Create `migrations/003_relations.surql` with graph relations
4. Create indexes for performance

## Step 2: Data Layer
1. Create `src/stores/spacesStore.ts` (Zustand)
2. Create `src/hooks/useSpaces.ts` with TanStack Query
3. Create `src/hooks/useSpaceItems.ts` for items
4. Implement CRUD operations via IPC

## Step 3: Pinned Links Grid
1. Create `PinnedLinksGrid.tsx` component
2. Create `PinnedCard.tsx` with 48×48 size
3. Implement drop zones and preview
4. Add context menu (Open, Copy, Unpin, Delete)
5. Add empty state

## Step 4: Space Creation Form
1. Create `SpaceCreationForm.tsx`
2. Create `ColorPicker.tsx` with 24 theme colors
3. Create `IconPicker.tsx` with keyword suggestions
4. Implement form validation

## Step 5: Tree View Components
1. Create `TreeView.tsx` container
2. Create `TreeItem.tsx` with 16px indent
3. Create `FolderNode.tsx` with expand animation
4. Create `LinkNode.tsx` with visit count badge
5. Add hover action buttons

## Step 6: Drag & Drop System
1. Create `useDragDrop.ts` hook
2. Create `DraggableTreeItem.tsx` wrapper
3. Create `DropZone.tsx` with position detection
4. Implement auto-expand on hover (500ms)
5. Add flash animation (700ms)
6. Support multi-select drag

## TDD Approach
- Test CRUD operations with mock SurrealDB
- Test drag & drop state transitions
- Test pinned grid layout calculations
- Test icon suggestion algorithm
