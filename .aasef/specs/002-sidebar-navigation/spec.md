# Spec 002: Sidebar Navigation

## Overview
Implement the complete sidebar navigation system including the TreeView for space items, sidebar tabs, bottom bar with mode toggle, and space header.

## Requirements

### R1: TreeView Components
- `TreeView` container with recursive rendering of `TreeItem` components
- `TreeItem` with depth-based indentation (16px per level)
- `TreeItemIcon` resolving icons based on `SpaceItemType` and file extension
- Expand/collapse folders with animated vertical lines in accent color
- Hover actions: Add Subfolder, Add Link, More options
- Selection and focus states with `#2D2645` background

### R2: Sidebar Component
- Fixed width of 320px with rounded corners (16px)
- Shadow: `10px 0 30px -5px rgba(0, 0, 0, 0.5)`
- Support for fixed and floating modes
- Multi-space navigation with active space highlighting
- Space header with expand/collapse and edit button
- Pinned links grid (5 columns, 48px cards)

### R3: Bottom Bar
- Height: 60px
- Tab navigation (Spaces, Browser, Workspace, Settings)
- Mode toggle button (fixed/floating sidebar)
- Settings button
- User avatar display

### R4: Sidebar Tabs
- Tab bar for switching views
- Active tab indicator with accent color

## Implemented Components

| Component | File | Status |
|-----------|------|--------|
| TreeView | `components/TreeView.tsx` | ✅ Complete |
| TreeItem | `components/TreeItem.tsx` | ✅ Complete |
| TreeItemIcon | `components/TreeItemIcon.tsx` | ✅ Complete |
| TreeView.module.css | `components/TreeView.module.css` | ✅ Complete |
| Sidebar | `components/Sidebar.tsx` | ✅ Complete |
| Sidebar.module.css | `components/Sidebar.module.css` | ✅ Complete |
| SidebarTabs | `components/SidebarTabs.tsx` | ✅ Complete |
| BottomBar | `components/BottomBar.tsx` | ✅ Complete |
| SpaceHeader | `components/SpaceHeader.tsx` | ✅ Complete |
| PinnedLinksGrid | `components/PinnedLinksGrid.tsx` | ✅ Complete |

## Acceptance Criteria
- [x] TreeView renders hierarchical space items with correct indentation
- [x] Folders expand/collapse with smooth animation
- [x] Hover shows action buttons (Add Subfolder, Add Link, More)
- [x] Vertical lines appear for nested folders in accent color
- [x] Sidebar switches between fixed and floating modes
- [x] Bottom bar shows tabs and mode toggle
- [x] Pinned links appear in grid above tree

## Dependencies
- 001-project-foundation

## Reference Files
- `project_ops/spayce_migration/component-specs/F001-sidebar-nav-tree.md`
- `project_ops/spayce_migration/component-specs/F002-sidebar-bottom-bar.md`
- `project_ops/spayce_migration/component-specs/F008-folder-tree-structure.md`
