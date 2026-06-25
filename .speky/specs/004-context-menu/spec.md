# Spec 004: Context Menu

## Overview
Implement a reusable context menu component for tree items and space items with support for icons, dividers, and destructive actions.

## Requirements

### R1: ContextMenu Component
- Positioned at click location (x, y coordinates)
- Closes on outside click or Escape key
- Supports menu items with icons
- Supports divider items
- Supports destructive action styling (red text)
- Smooth appear/disappear animation

### R2: Menu Item Types
- Regular items with icon and label
- Divider items for visual separation
- Destructive items with red styling

### R3: Item Type Variations
- Folder context menu: New Nested Folder, Add Link, Rename, Copy, Paste, Delete
- Link context menu: Open in New Tab, Copy URL, Rename, Delete
- Local Folder context menu: Open in Workspace, Refresh, Import File, Import Folder, Remove

## Implemented Components

| Component | File | Status |
|-----------|------|--------|
| ContextMenu | `components/ContextMenu.tsx` | ✅ Complete |
| ContextMenu.module.css | `components/ContextMenu.module.css` | ✅ Complete |
| ContextMenuItem type | `components/ContextMenu.tsx` | ✅ Complete |

## Type Definition

```typescript
interface ContextMenuItem {
    id: string;
    label: string;
    icon?: LucideIcon;
    isDivider?: boolean;
    isDestructive?: boolean;
    disabled?: boolean;
}
```

## Acceptance Criteria
- [x] Context menu appears at specified position
- [x] Menu items display with icons
- [x] Dividers render as horizontal lines
- [x] Destructive items show in red
- [x] Clicking outside closes menu
- [x] Escape key closes menu
- [x] Menu integrates with TreeItem and SpaceCard

## Dependencies
- 001-project-foundation

## Reference Files
- `project_ops/spayce_migration/component-specs/F006-context-menu.md`
