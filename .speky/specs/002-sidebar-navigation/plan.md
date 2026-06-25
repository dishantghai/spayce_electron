# Implementation Plan: 002-sidebar-navigation

## Step 1: TreeView Core Components
1. Create `TreeItemIcon.tsx` - Icon resolver for SpaceItemType
2. Create `TreeItem.tsx` - Individual tree row with indentation
3. Create `TreeView.tsx` - Container managing expand state
4. Create `TreeView.module.css` - Styles with design tokens

## Step 2: TreeView Features
1. Implement depth-based indentation (16px per level)
2. Add expand/collapse with animated folder icons
3. Add vertical nesting lines with accent color
4. Implement hover action buttons (FolderPlus, Link, MoreVertical)
5. Add selection and focus states

## Step 3: Sidebar Container
1. Create `Sidebar.tsx` - Main sidebar component
2. Create `Sidebar.module.css` - Layout and styling
3. Implement fixed/floating mode switching
4. Add space selection and navigation
5. Add view mode (normal, createSpace, editSpace)

## Step 4: Supporting Components
1. Create `SpaceHeader.tsx` - Space title and actions
2. Create `SpaceHeader.module.css`
3. Create `PinnedLinksGrid.tsx` - Quick access grid
4. Create `PinnedLinksGrid.module.css`

## Step 5: Bottom Bar
1. Create `BottomBar.tsx` - Tab bar and controls
2. Create `BottomBar.module.css`
3. Implement mode toggle button
4. Add settings button
5. Add user avatar

## Step 6: Sidebar Tabs
1. Create `SidebarTabs.tsx` - Tab switcher
2. Create `SidebarTabs.module.css`
3. Implement active tab indicator

## Step 7: Integration
1. Export all components from `@spayce/shared`
2. Integrate Sidebar into App.tsx
3. Connect to demo data for visualization

## Completed
All steps completed. Components are functional with demo data in App.tsx.
