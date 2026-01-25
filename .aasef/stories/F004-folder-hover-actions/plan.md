# Implementation Plan

## Tasks

### Task 1: Add Hover Actions to TreeItem
- **Estimate**: 1 hour
- **Description**: Implement hover state detection and action buttons (FolderPlus, Link, MoreVertical) that appear on hover with smooth fade transitions. Include proper event handling and tooltips.
- **Files**: 
  - `packages/react-ui/src/components/TreeItem.tsx`
  - `packages/react-ui/src/components/TreeView.module.css`

### Task 2: Create Context Menu Component
- **Estimate**: 1.5 hours
- **Description**: Build reusable ContextMenu component with support for icons, dividers, disabled states, and destructive actions. Include proper positioning and keyboard navigation.
- **Files**: 
  - `packages/react-ui/src/components/ContextMenu.tsx`
  - `packages/react-ui/src/components/ContextMenu.module.css`

### Task 3: Implement Context Menu Logic
- **Estimate**: 1 hour
- **Description**: Add context menu handlers to TreeItem and Sidebar components. Implement different menu items for folders vs links, and wire up all actions (rename, copy, delete, pin/unpin).
- **Files**: 
  - `packages/react-ui/src/components/TreeItem.tsx`
  - `packages/react-ui/src/components/Sidebar.tsx`
  - `packages/react-ui/src/components/spaces/SpaceCard.tsx`

## Implementation Notes
- Use `onMouseEnter/onMouseLeave` for hover detection, not CSS `:hover` for JavaScript control
- Context menu should close on outside click, escape key, and item selection
- Auto-expand parent folders when adding subfolders/links via hover actions
- Disable hover actions during rename mode to prevent UI conflicts
- Use `stopPropagation()` on hover action clicks to prevent tree item selection

## Testing Checklist
- [ ] Hover shows correct number of icons (3 for folders, 1 for links)
- [ ] Icons fade in/out smoothly with 150ms transition
- [ ] No hover actions visible during rename mode
- [ ] Context menu opens at correct position
- [ ] All context menu actions execute properly
- [ ] Auto-expand works when adding nested items