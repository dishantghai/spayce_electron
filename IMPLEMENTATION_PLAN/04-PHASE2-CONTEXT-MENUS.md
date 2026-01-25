# Phase 2: Context Menu Enhancement

**Priority:** P0 - Critical  
**Dependencies:** Phase 1 (F001 to F004)  
**Total Estimated Effort:** 6 hours

This phase implements comprehensive context menus for all item types.

---

## F005: Enhanced Folder Context Menu

**Priority:** P0 - Critical  
**Dependencies:** F001, F002, F003  
**Estimated Effort:** 4 hours  
**User Value:** Users have full control over folders via context menu

### User Story

> As a user, I want a comprehensive context menu for folders with all management options, so I can perform any action quickly.

### Acceptance Criteria

- [ ] Right-click folder → shows full context menu
- [ ] Menu items in correct order (see below)
- [ ] All actions trigger correctly
- [ ] Paste shown only when clipboard has items
- [ ] Keyboard navigation works in menu (arrow keys, Enter)
- [ ] Menu closes on action or Escape

### Context Menu Items (Folder)

| Order | Item | Icon | Condition | Action |
|-------|------|------|-----------|--------|
| 1 | New Folder | FolderPlus | Always | Trigger inline folder input |
| 2 | Add Link | Link | Always | Trigger inline link input |
| 3 | --- | divider | | |
| 4 | Import Local Folder | FolderOpen | Always | Open folder picker |
| 5 | Import Local File | File | Always | Open file picker |
| 6 | --- | divider | | |
| 7 | Rename | Edit | Always | Trigger inline rename |
| 8 | Copy Folder | Copy | Always | Copy to clipboard |
| 9 | Copy All Links | Link2 | Has links | Copy all nested links |
| 10 | Paste | ClipboardPaste | Has clipboard | Paste inside folder |
| 11 | --- | divider | | |
| 12 | Refresh | RefreshCw | localFolder only | Refresh local folder |
| 13 | Open in Workspace | ExternalLink | folder/localFolder | Future feature |
| 14 | Delete | Trash2 | Always | Delete with confirmation |

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Show Context Menu | `main_layout_final.dart` | 1904-2002 |
| Menu Items (Folder) | `main_layout_final.dart` | 1927-1972 |
| Handle Actions | `main_layout_final.dart` | 2032-2079 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Show context menu (main_layout_final.dart:1904-2002)
void _showContextMenu(BuildContext context, Offset position) async {
  final isFolder = widget.item.type == SpaceItemType.folder ||
      widget.item.type == SpaceItemType.localFolder;
  final isLink = widget.item.type == SpaceItemType.link;
  final clipboard = ref.read(spaceClipboardProvider);
  final hasClipboard = clipboard != null && clipboard.items.isNotEmpty;

  final items = <PopupMenuEntry<String>>[
    if (isFolder) ...[
      _buildMenuItem('new_folder', 'New Folder', LucideIcons.folderPlus),
      _buildMenuItem('new_link', 'Add Link', LucideIcons.link),
      const PopupMenuDivider(),
      _buildMenuItem('import_folder', 'Import Local Folder', LucideIcons.folderOpen),
      _buildMenuItem('import_file', 'Import Local File', LucideIcons.file),
      const PopupMenuDivider(),
    ],
    _buildMenuItem('rename', 'Rename', LucideIcons.edit),
    if (isFolder)
      _buildMenuItem('copy_folder', 'Copy Folder', LucideIcons.copy),
    if (isLink)
      _buildMenuItem('copy_link', 'Copy Link', LucideIcons.copy),
    if (isFolder && _hasNestedLinks(widget.item))
      _buildMenuItem('copy_links', 'Copy All Links', LucideIcons.link2),
    if (isFolder && hasClipboard)
      _buildMenuItem('paste', 'Paste', LucideIcons.clipboardPaste),
    const PopupMenuDivider(),
    if (widget.item.type == SpaceItemType.localFolder)
      _buildMenuItem('refresh', 'Refresh', LucideIcons.refreshCw),
    if (isFolder)
      _buildMenuItem('workspace', 'Open in Workspace', LucideIcons.externalLink),
    _buildMenuItem('delete', 'Delete', LucideIcons.trash2, isDestructive: true),
  ];

  // Show menu and handle selection...
}

// Handle menu action (main_layout_final.dart:2032-2079)
void _handleMenuAction(String action) {
  switch (action) {
    case 'new_folder':
      _addSubfolder();
      break;
    case 'new_link':
      _addLinkToFolder();
      break;
    case 'rename':
      ref.read(inlineRenameItemIdProvider.notifier).state = widget.item.id;
      break;
    case 'copy_folder':
      _copyFolder(widget.item);
      break;
    case 'copy_link':
      _copyLink(widget.item);
      break;
    case 'copy_links':
      _copyAllLinks(widget.item);
      break;
    case 'paste':
      _handlePasteIntoFolder();
      break;
    case 'delete':
      _confirmDelete();
      break;
    // ... other cases
  }
}
```

### Electron Implementation

**Files to Update:**
```
packages/desktop/src/renderer/App.tsx (getContextMenuItems function)
packages/react-ui/src/components/ContextMenu.tsx (if needed)
```

### Implementation Steps

1. **Update getContextMenuItems in App.tsx**
   ```typescript
   const getContextMenuItems = (item: SpaceItem): ContextMenuItem[] => {
     const isFolder = item.type === 'folder' || item.type === 'localFolder';
     const isLink = item.type === 'link';
     const hasClipboard = clipboardStore.hasItems();
     const hasNestedLinks = isFolder && hasLinksRecursive(item);
     
     const items: ContextMenuItem[] = [];
     
     if (isFolder) {
       items.push(
         { id: 'new_folder', label: 'New Folder', icon: 'FolderPlus' },
         { id: 'new_link', label: 'Add Link', icon: 'Link' },
         { id: 'divider1', isDivider: true },
         { id: 'import_folder', label: 'Import Local Folder', icon: 'FolderOpen' },
         { id: 'import_file', label: 'Import Local File', icon: 'File' },
         { id: 'divider2', isDivider: true },
       );
     }
     
     items.push({ id: 'rename', label: 'Rename', icon: 'Edit' });
     
     if (isFolder) {
       items.push({ id: 'copy_folder', label: 'Copy Folder', icon: 'Copy' });
     }
     if (isLink) {
       items.push({ id: 'copy_link', label: 'Copy Link', icon: 'Copy' });
     }
     if (hasNestedLinks) {
       items.push({ id: 'copy_links', label: 'Copy All Links', icon: 'Link2' });
     }
     if (isFolder && hasClipboard) {
       items.push({ id: 'paste', label: 'Paste', icon: 'ClipboardPaste' });
     }
     
     items.push({ id: 'divider3', isDivider: true });
     
     if (item.type === 'localFolder') {
       items.push({ id: 'refresh', label: 'Refresh', icon: 'RefreshCw' });
     }
     if (isFolder) {
       items.push({ id: 'workspace', label: 'Open in Workspace', icon: 'ExternalLink', isDisabled: true });
     }
     
     items.push({ id: 'delete', label: 'Delete', icon: 'Trash2', isDestructive: true });
     
     return items;
   };
   ```

2. **Update handleContextMenuAction**
   ```typescript
   const handleContextMenuAction = (actionId: string, item: SpaceItem) => {
     switch (actionId) {
       case 'new_folder':
         inlineInputStore.setSidebarInput({ 
           spaceId: activeSpaceId, 
           parentId: item.id, 
           type: 'folder' 
         });
         break;
       case 'new_link':
         inlineInputStore.setSidebarInput({ 
           spaceId: activeSpaceId, 
           parentId: item.id, 
           type: 'link' 
         });
         break;
       case 'rename':
         inlineInputStore.setSidebarRenameItemId(item.id);
         break;
       case 'copy_folder':
         clipboardStore.copyItems([item], activeSpaceId);
         break;
       case 'copy_link':
         clipboardStore.copyItems([item], activeSpaceId);
         window.electronApi.clipboard.writeText(item.path);
         break;
       case 'paste':
         handlePaste(item.id);
         break;
       case 'delete':
         handleDeleteItem(item);
         break;
       // ... other cases
     }
   };
   ```

### Manual Testing Checklist

- [ ] Right-click folder → menu appears
- [ ] All items in correct order
- [ ] New Folder → inline input inside folder
- [ ] Add Link → inline input inside folder
- [ ] Rename → inline rename active
- [ ] Copy Folder → internal clipboard updated
- [ ] Paste visible only when clipboard has items
- [ ] Delete → confirmation then deletion
- [ ] Arrow keys navigate menu
- [ ] Enter selects item
- [ ] Escape closes menu

---

## F006: Enhanced Link Context Menu

**Priority:** P0 - Critical  
**Dependencies:** F003  
**Estimated Effort:** 2 hours  
**User Value:** Users have full control over links via context menu

### User Story

> As a user, I want a comprehensive context menu for links with all management options.

### Acceptance Criteria

- [ ] Right-click link → shows context menu
- [ ] All items in correct order
- [ ] Copy Link copies URL to system clipboard
- [ ] Pin/Unpin toggles correctly
- [ ] Delete removes link

### Context Menu Items (Link)

| Order | Item | Icon | Condition | Action |
|-------|------|------|-----------|--------|
| 1 | Rename | Edit | Always | Trigger inline rename |
| 2 | Copy Link | Copy | Always | Copy URL to clipboard |
| 3 | --- | divider | | |
| 4 | Pin to Top | Pin | Not pinned | Pin link |
| 5 | Unpin | PinOff | Is pinned | Unpin link |
| 6 | --- | divider | | |
| 7 | Delete | Trash2 | Always | Delete link |

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Menu Items (Link) | `main_layout_final.dart` | 1973-1988 |
| Pin/Unpin Logic | `main_layout_final.dart` | 2081-2095 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Link menu items (main_layout_final.dart:1973-1988)
if (isLink) ...[
  _buildMenuItem('rename', 'Rename', LucideIcons.edit),
  _buildMenuItem('copy_link', 'Copy Link', LucideIcons.copy),
  const PopupMenuDivider(),
  if (!widget.item.isPinned)
    _buildMenuItem('pin', 'Pin to Top', LucideIcons.pin),
  if (widget.item.isPinned)
    _buildMenuItem('unpin', 'Unpin', LucideIcons.pinOff),
  const PopupMenuDivider(),
  _buildMenuItem('delete', 'Delete', LucideIcons.trash2, isDestructive: true),
],

// Pin/Unpin handlers (main_layout_final.dart:2081-2095)
case 'pin':
  await ref.read(spacesListProvider.notifier).pinItem(
    widget.spaceId,
    widget.item.id,
  );
  break;
case 'unpin':
  await ref.read(spacesListProvider.notifier).unpinItem(
    widget.spaceId,
    widget.item.id,
  );
  break;
```

### Electron Implementation

**Files to Update:**
```
packages/desktop/src/renderer/App.tsx (getContextMenuItems, handleContextMenuAction)
```

### Implementation Steps

1. **Update getContextMenuItems for Links**
   ```typescript
   if (isLink) {
     items.push(
       { id: 'rename', label: 'Rename', icon: 'Edit' },
       { id: 'copy_link', label: 'Copy Link', icon: 'Copy' },
       { id: 'divider1', isDivider: true },
     );
     
     if (!item.isPinned) {
       items.push({ id: 'pin', label: 'Pin to Top', icon: 'Pin' });
     } else {
       items.push({ id: 'unpin', label: 'Unpin', icon: 'PinOff' });
     }
     
     items.push(
       { id: 'divider2', isDivider: true },
       { id: 'delete', label: 'Delete', icon: 'Trash2', isDestructive: true },
     );
   }
   ```

2. **Handle Pin/Unpin Actions**
   ```typescript
   case 'pin':
     await window.itemsApi.pin(item.id);
     invalidate('pins');
     invalidate(`space-items:${activeSpaceId}`);
     break;
   case 'unpin':
     await window.itemsApi.unpin(item.id);
     invalidate('pins');
     invalidate(`space-items:${activeSpaceId}`);
     break;
   case 'copy_link':
     await window.electronApi.clipboard.writeText(item.path);
     break;
   ```

### Manual Testing Checklist

- [ ] Right-click link → menu appears
- [ ] Rename → inline rename active
- [ ] Copy Link → URL in system clipboard (can paste in browser)
- [ ] Pin to Top → link appears in pins grid
- [ ] Unpin → link removed from pins grid
- [ ] Delete → link removed from tree
- [ ] Menu shows Pin/Unpin based on current state
