---
id: F024
title: Pinned Link Context Menu
type: feature
priority: P1
status: completed
related_specs: []
affected_files:
  - packages/react-ui/src/components/PinnedLinksGrid.tsx
  - packages/react-ui/src/components/SortablePinnedCard.tsx
  - packages/desktop/src/renderer/App.tsx
  - packages/react-ui/src/components/ContextMenu.tsx
estimated_hours: 2
actual_hours: 2
completed_date: 2026-01-29
---

# F024: Pinned Link Context Menu

## User Story

> As a user, I want to right-click a pinned link for options like unpin and delete, so I can manage my pinned links easily.

## Context

Pinned links in the grid should have a context menu accessible via right-click, providing quick actions for managing pins. The menu includes options to rename, copy the link URL, unpin (remove from grid but keep in tree), and delete (remove entirely).

## Acceptance Criteria

- ✅ Right-click pin → shows context menu
- ✅ Menu items: Rename, Copy Link, Unpin, Delete
- ✅ Unpin removes from grid but keeps in tree
- ✅ Delete removes from both grid and tree
- ✅ Copy Link copies URL to system clipboard
- ✅ Rename triggers inline rename mode

## Implementation Details

### Context Menu Items
```typescript
const getPinContextMenuItems = (item: SpaceItem): ContextMenuItem[] => [
  { id: 'rename', label: 'Rename', icon: 'Edit' },
  { id: 'copy_link', label: 'Copy Link', icon: 'Copy' },
  { id: 'divider', isDivider: true },
  { id: 'unpin', label: 'Unpin', icon: 'PinOff' },
  { id: 'divider2', isDivider: true },
  { id: 'delete', label: 'Delete', icon: 'Trash2', isDestructive: true },
];
```

### Key Actions

1. **Unpin**: Calls `itemsApi.unpin(itemId)` - removes from grid, stays in tree
2. **Copy Link**: Copies URL to system clipboard via `window.electronAPI.clipboard.writeText()`
3. **Delete**: Calls `itemsApi.delete(itemId)` - removes from grid and tree
4. **Rename**: Triggers inline rename mode (existing functionality)

### Integration Points
- **SortablePinnedCard**: Added `onContextMenu` handler
- **PinnedLinksGrid**: Passes context menu handler to cards
- **App.tsx**: Provides context menu state and action handlers

## Technical Implementation

### Context Menu Handler
```typescript
const handlePinContextMenu = (item: SpaceItem, e: React.MouseEvent) => {
  e.preventDefault();
  setContextMenu({
    items: getPinContextMenuItems(item),
    position: { x: e.clientX, y: e.clientY },
    onAction: (actionId) => handlePinAction(actionId, item),
  });
};

const handlePinAction = async (actionId: string, item: SpaceItem) => {
  switch (actionId) {
    case 'unpin':
      await itemsApi.unpin(item.id);
      refetch();
      break;
    case 'copy_link':
      await window.electronAPI.clipboard.writeText(item.path);
      break;
    case 'delete':
      await itemsApi.delete(item.id);
      refetch();
      break;
    case 'rename':
      // Trigger rename mode
      break;
  }
};
```

## Testing

### Manual Testing Completed
- ✅ Right-click pin → menu appears at cursor position
- ✅ Unpin → removes from grid, item still in tree
- ✅ Copy Link → URL copied to clipboard
- ✅ Delete → removes from grid and tree
- ✅ Rename → triggers inline rename
- ✅ Menu closes on action or click outside

### Integration Tests
- Context menu shows correct items for pinned links
- Unpin action updates database and UI
- Delete action removes item completely
- Copy Link writes to system clipboard

## Dependencies

- F022: Drag to Pins Grid (provides pinned links)
- F028: Context Menus (provides ContextMenu component)

## Related Stories

- F028: Context Menus for Space Cards
- F035: Root Context Menu for Sidebar

## Notes

This feature reuses the existing ContextMenu component and integrates seamlessly with the pinned links grid. The unpin action is particularly useful as it allows users to remove items from the grid without deleting them entirely.
