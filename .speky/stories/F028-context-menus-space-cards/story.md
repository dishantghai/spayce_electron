---
id: F028
title: Context Menus in Space Cards
type: feature
priority: P1
status: pending
related_specs: []
dependencies:
  - F005
  - F006
affected_files:
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
  - packages/react-ui/src/components/spaces/SpaceCardTreeItem.tsx
  - packages/react-ui/src/components/ContextMenu.tsx
estimated_hours: 3
---

# F028: Context Menus in Space Cards

## User Story

> As a user, I want the same context menu options in space cards as in the sidebar, so I can perform all item operations consistently regardless of where I'm working.

## Context

This feature brings full context menu support to Space Cards, reusing the same menu structure and actions from the sidebar (F005, F006). The key difference is that actions like "New Folder" and "Rename" use the card-specific state (`cardInput`, `cardRenameItemId`) instead of sidebar state.

## Flutter Reference

The Flutter implementation shows context menus with:
- Folder menus: New Nested Folder, Add Link, Import Local Folder, Import Local File, Rename, Copy Folder, Copy All Links, Paste (if clipboard), Open in Workspace (if applicable), Delete
- Link menus: Rename, Copy Link, Remove
- Context menu tracks which item is open via `contextMenuItemIdProvider` for persistent highlight

**Key Flutter Files:**
- `space_card_hifi_v2.dart:240-342` - `_showContextMenu` method
- `space_card_hifi_v2.dart:344-370` - `_buildMenuItem` helper
- `space_card_hifi_v2.dart:372-414` - `_handleMenuAction` switch
- `space_card_hifi_v2.dart:470-565` - Paste handler with clipboard check

## Acceptance Criteria

- [ ] Right-click item in card → full context menu appears at cursor position
- [ ] Folder context menu shows: New Nested Folder, Add Link, divider, Import Local Folder, Import Local File, divider, Rename, Copy Folder, Copy All Links, Paste (conditional), divider, Delete
- [ ] Link context menu shows: Rename, Copy Link, divider, Remove
- [ ] "Paste" only shows if clipboard has items (internal or system)
- [ ] All actions work correctly:
  - New Nested Folder → triggers card inline input
  - Add Link → triggers card inline link input
  - Rename → triggers card inline rename
  - Copy Folder/Link → copies to clipboard store
  - Copy All Links → copies all nested links to system clipboard
  - Paste → pastes from clipboard to folder
  - Delete/Remove → shows confirmation dialog, then deletes
- [ ] Item stays highlighted while context menu is open
- [ ] Context menu closes on action selection or click outside
- [ ] Menu styling matches sidebar context menus

## Technical Implementation

### Reuse Existing Context Menu Infrastructure

The `ContextMenu` component and `getContextMenuItems` function from sidebar can be reused. The difference is in the action handlers.

### Context Menu Items

```typescript
// For folders
const folderMenuItems: ContextMenuItem[] = [
  { id: 'new_folder', label: 'New Nested Folder', icon: FolderPlus },
  { id: 'new_link', label: 'Add Link', icon: Link },
  { type: 'divider' },
  { id: 'import_folder', label: 'Import Local Folder', icon: FolderInput },
  { id: 'import_file', label: 'Import Local File', icon: FileInput },
  { type: 'divider' },
  { id: 'rename', label: 'Rename', icon: Pencil },
  { id: 'copy_folder', label: 'Copy Folder', icon: Copy },
  { id: 'copy_links', label: 'Copy All Links', icon: Link2 },
  // Conditional: only if clipboard has items
  ...(hasClipboard ? [{ id: 'paste', label: 'Paste', icon: ClipboardPaste }] : []),
  { type: 'divider' },
  { id: 'delete', label: 'Delete', icon: Trash2, destructive: true },
];

// For links
const linkMenuItems: ContextMenuItem[] = [
  { id: 'rename', label: 'Rename', icon: Pencil },
  { id: 'copy_link', label: 'Copy Link', icon: Copy },
  { type: 'divider' },
  { id: 'remove', label: 'Remove', icon: Trash2, destructive: true },
];
```

### Action Handler

```typescript
const handleCardContextAction = async (actionId: string, item: SpaceItem) => {
  switch (actionId) {
    case 'new_folder':
      // Expand folder first
      expandCardFolder(item.id);
      setCardInput({ spaceId: space.id, parentId: item.id, type: 'folder' });
      break;
      
    case 'new_link':
      expandCardFolder(item.id);
      setCardInput({ spaceId: space.id, parentId: item.id, type: 'link' });
      break;
      
    case 'rename':
      setCardRenameItemId(item.id);
      break;
      
    case 'copy_link':
      await navigator.clipboard.writeText(item.path);
      clipboardStore.copy([item], space.id);
      break;
      
    case 'copy_folder':
      clipboardStore.copy([item], space.id);
      break;
      
    case 'copy_links':
      const links = collectAllLinks(item);
      const urls = links.map(l => l.path).join('\n');
      await navigator.clipboard.writeText(urls);
      clipboardStore.copy(links, space.id);
      break;
      
    case 'paste':
      await handlePaste(item.id, space.id);
      expandCardFolder(item.id);
      break;
      
    case 'delete':
    case 'remove':
      const confirmed = await showDeleteConfirmation(item);
      if (confirmed) {
        await deleteItem(item.id);
      }
      break;
      
    case 'import_folder':
      // Future: file picker for local folder
      break;
      
    case 'import_file':
      // Future: file picker for local file
      break;
  }
};
```

### Context Menu Highlight State

Track which item has context menu open for persistent highlight:

```typescript
// In inlineInputStore or separate contextMenuStore
contextMenuItemId: string | null;
setContextMenuItemId: (id: string | null) => void;
```

### SpaceCardTreeItem Integration

```typescript
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Set highlight state
  setContextMenuItemId(item.id);
  
  // If folder, set as paste target
  if (isFolder) {
    setSelectedSpaceItem({ spaceId, item });
  }
  
  // Show context menu
  showContextMenu({
    items: isFolder ? folderMenuItems : linkMenuItems,
    position: { x: e.clientX, y: e.clientY },
    onAction: (actionId) => handleCardContextAction(actionId, item),
    onClose: () => setContextMenuItemId(null),
  });
};
```

### Design System Tokens

```typescript
// Context menu styling (from existing ContextMenu component)
menuBackground: '#1A1628'      // surfaceDark
menuBorderRadius: '8px'
menuItemHeight: '32px'
menuIconSize: '16px'
menuMinWidth: '180px'
menuShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'

// Destructive items
destructiveColor: '#EF4444'    // error color
```

## Testing Checklist

### Unit Tests

- [ ] getContextMenuItems returns correct items for folder
- [ ] getContextMenuItems returns correct items for link
- [ ] Paste item only included when clipboard has items
- [ ] handleCardContextAction dispatches correct actions
- [ ] collectAllLinks recursively collects links from folder

### Integration Tests

- [ ] Right-click folder → shows folder menu
- [ ] Right-click link → shows link menu
- [ ] "New Nested Folder" triggers card inline input
- [ ] "Rename" triggers card inline rename
- [ ] "Copy Link" copies URL to system clipboard
- [ ] "Delete" shows confirmation, then deletes
- [ ] Item highlight persists while menu open

### Manual Testing

- [ ] Right-click folder in card → full menu appears
- [ ] Right-click link in card → link menu appears
- [ ] Menu appears at cursor position
- [ ] Item stays highlighted while menu open
- [ ] Click "New Nested Folder" → inline input inside folder
- [ ] Click "Rename" → inline rename input
- [ ] Click "Copy Link" → URL copied to clipboard
- [ ] Click "Copy All Links" → all nested URLs copied
- [ ] Click "Paste" → items pasted into folder
- [ ] Click "Delete" → confirmation dialog → item deleted
- [ ] Click outside menu → menu closes, highlight removed
- [ ] Menu styling matches sidebar menus
