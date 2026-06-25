---
id: F005
title: Enhanced Folder Context Menu
type: feature
priority: P0
status: pending
related_specs: []
dependencies: [F001, F002, F003]
affected_files:
  - packages/desktop/src/renderer/App.tsx
  - packages/react-ui/src/components/ContextMenu.tsx
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/stores/clipboardStore.ts
  - packages/react-ui/src/stores/inlineInputStore.ts
  - packages/desktop/src/main/ipc/handlers.ts
  - packages/core/src/services/itemsService.ts
estimated_hours: 4
---

# F005: Enhanced Folder Context Menu

## User Story

> As a user, I want a comprehensive context menu for folders with all management options, so I can perform any action quickly via right-click.

## Context

This feature implements a complete context menu for folder items (both regular folders and local folders) with proper item ordering, conditional visibility, and full action handling. The menu provides quick access to folder management operations including creation, import, clipboard operations, and deletion.

**Key Behaviors:**
- Context menu appears on right-click with proper positioning
- Menu items conditionally shown based on folder type and clipboard state
- All actions integrate with existing inline input and clipboard systems
- Keyboard navigation (arrow keys, Enter, Escape) fully supported
- Menu closes on action completion or Escape key

## Screenshots Reference

Based on Flutter app screenshots (from Phase 2 plan):
- Shows full context menu with proper item ordering
- Dividers separate logical groups of actions
- "Paste" only visible when clipboard has items
- "Refresh" only visible for local folders
- Delete shown in destructive red color

## Acceptance Criteria

### Menu Display
- [ ] Right-click folder → shows full context menu at cursor position
- [ ] Menu positioned correctly, adjusts if near viewport edge
- [ ] All items in correct order (see Menu Structure below)
- [ ] Dividers separate logical action groups
- [ ] Menu closes on action selection or Escape key
- [ ] Click outside menu → closes menu

### Menu Items - Conditional Visibility
- [ ] "New Folder" - Always visible for folders
- [ ] "Add Link" - Always visible for folders
- [ ] "Import Local Folder" - Always visible (disabled for now)
- [ ] "Import Local File" - Always visible (disabled for now)
- [ ] "Rename" - Always visible
- [ ] "Copy Folder" - Always visible
- [ ] "Copy All Links" - Only visible if folder has nested links
- [ ] "Paste" - Only visible when clipboard has items
- [ ] "Refresh" - Only visible for localFolder type
- [ ] "Open in Workspace" - Always visible (disabled for now)
- [ ] "Delete" - Always visible with destructive styling

### Action Behaviors
- [ ] "New Folder" → triggers inline folder input inside folder, auto-expands folder
- [ ] "Add Link" → triggers inline link input inside folder, auto-expands folder
- [ ] "Rename" → triggers inline rename for folder
- [ ] "Copy Folder" → copies folder structure to internal clipboard
- [ ] "Copy All Links" → recursively collects all nested links, copies URLs to system clipboard
- [ ] "Paste" → pastes clipboard items inside folder, auto-expands folder
- [ ] "Delete" → shows confirmation dialog, deletes folder and all contents

### Keyboard Navigation
- [ ] Arrow Down → moves focus to next item (skips dividers)
- [ ] Arrow Up → moves focus to previous item (skips dividers)
- [ ] Enter → executes focused action
- [ ] Escape → closes menu
- [ ] Mouse hover → updates focus

## Menu Structure

Complete menu item order with icons and conditions:

| Order | Item | Icon | Condition | Action |
|-------|------|------|-----------|--------|
| 1 | New Folder | FolderPlus | Always | Trigger inline folder input |
| 2 | Add Link | Link | Always | Trigger inline link input |
| 3 | --- | divider | | |
| 4 | Import Local Folder | FolderOpen | Always | Open folder picker (disabled) |
| 5 | Import Local File | File | Always | Open file picker (disabled) |
| 6 | --- | divider | | |
| 7 | Rename | Edit (Pencil) | Always | Trigger inline rename |
| 8 | Copy Folder | Copy | Always | Copy to internal clipboard |
| 9 | Copy All Links | Link2 | Has nested links | Copy all nested link URLs |
| 10 | Paste | ClipboardPaste | Has clipboard items | Paste inside folder |
| 11 | --- | divider | | |
| 12 | Refresh | RefreshCw | localFolder only | Refresh local folder |
| 13 | Open in Workspace | ExternalLink (PanelLeft) | folder/localFolder | Open in workspace (disabled) |
| 14 | Delete | Trash2 | Always | Delete with confirmation |

## Technical Implementation

### Files to Update

#### 1. **App.tsx** - Update `getContextMenuItems` function

**Current Implementation:**
The function exists but needs enhancement for conditional items and proper ordering.

**Required Changes:**
```typescript
function getContextMenuItems(item: SpaceItem, hasClipboard: boolean): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];
    const isFolder = item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder;
    const isLocalFolder = item.type === SpaceItemType.localFolder;
    
    if (isFolder) {
        // Group 1: Creation actions
        items.push(
            { id: 'new_folder', label: 'New Folder', icon: LucideIcons.FolderPlus },
            { id: 'new_link', label: 'Add Link', icon: LucideIcons.Link },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true },
        );
        
        // Group 2: Import actions (disabled for now)
        items.push(
            { id: 'import_folder', label: 'Import Local Folder', icon: LucideIcons.FolderOpen, isDisabled: true },
            { id: 'import_file', label: 'Import Local File', icon: LucideIcons.File, isDisabled: true },
            { id: 'divider2', label: '', icon: LucideIcons.Minus, isDivider: true },
        );
        
        // Group 3: Edit and clipboard actions
        items.push(
            { id: 'rename', label: 'Rename', icon: LucideIcons.Pencil },
            { id: 'copy_folder', label: 'Copy Folder', icon: LucideIcons.Copy },
        );
        
        // Conditionally add "Copy All Links" if folder has nested links
        if (hasNestedLinks(item)) {
            items.push({ id: 'copy_links', label: 'Copy All Links', icon: LucideIcons.Link2 });
        }
        
        // Conditionally add "Paste" if clipboard has items
        if (hasClipboard) {
            items.push({ id: 'paste', label: 'Paste', icon: LucideIcons.ClipboardPaste });
        }
        
        items.push({ id: 'divider3', label: '', icon: LucideIcons.Minus, isDivider: true });
        
        // Group 4: Advanced actions
        // Refresh only for local folders
        if (isLocalFolder) {
            items.push({ id: 'refresh', label: 'Refresh', icon: LucideIcons.RefreshCw });
        }
        
        items.push(
            { id: 'open_workspace', label: 'Open in Workspace', icon: LucideIcons.PanelLeft, isDisabled: true },
            { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true },
        );
    }
    
    return items;
}

// Helper function to check if folder has nested links
function hasNestedLinks(item: SpaceItem): boolean {
    if (item.type === SpaceItemType.link) {
        return true;
    }
    if (item.children && item.children.length > 0) {
        return item.children.some(child => hasNestedLinks(child));
    }
    return false;
}

// Helper function to recursively collect all links
function collectAllLinks(item: SpaceItem): SpaceItem[] {
    const links: SpaceItem[] = [];
    
    if (item.type === SpaceItemType.link) {
        links.push(item);
    }
    
    if (item.children && item.children.length > 0) {
        for (const child of item.children) {
            links.push(...collectAllLinks(child));
        }
    }
    
    return links;
}
```

#### 2. **App.tsx** - Update `handleContextMenuItemClick` function

**Add/Update Cases:**
```typescript
case 'new_folder': {
    const { item, spaceId, context } = contextMenu;
    
    // Trigger inline input for subfolder
    if (context === 'sidebar') {
        useInlineInputStore.getState().setSidebarInput({
            spaceId,
            parentId: item.id,
            type: 'folder',
        });
    } else {
        useInlineInputStore.getState().setCardInput({
            spaceId,
            parentId: item.id,
            type: 'folder',
        });
    }
    
    // Auto-expand folder to show inline input
    // This would need integration with tree expansion state
    break;
}

case 'new_link': {
    const { item, spaceId, context } = contextMenu;
    
    // Trigger inline input for link (same as new_folder but type 'link')
    if (context === 'sidebar') {
        useInlineInputStore.getState().setSidebarInput({
            spaceId,
            parentId: item.id,
            type: 'link',
        });
    } else {
        useInlineInputStore.getState().setCardInput({
            spaceId,
            parentId: item.id,
            type: 'link',
        });
    }
    break;
}

case 'copy_folder': {
    const { item, spaceId } = contextMenu;
    
    // Copy folder to internal clipboard
    useClipboardStore.getState().copyItems([item], spaceId);
    console.log('Folder copied to clipboard');
    break;
}

case 'copy_links': {
    const { item, spaceId } = contextMenu;
    
    // Recursively collect all links
    const links = collectAllLinks(item);
    
    if (links.length > 0) {
        // Copy URLs to system clipboard (newline separated)
        const urls = links.map(link => link.path).join('\n');
        await navigator.clipboard.writeText(urls);
        
        // Also copy to internal clipboard
        useClipboardStore.getState().copyItems(links, spaceId);
        
        console.log(`Copied ${links.length} link(s) to clipboard`);
    }
    break;
}

case 'paste': {
    const { item, spaceId } = contextMenu;
    const clipboardState = useClipboardStore.getState();
    
    if (clipboardState.hasItems()) {
        // Paste items inside folder
        await clipboardState.pasteItems(item.id, 'inside');
        await refetch(); // Refresh data
        
        // Auto-expand folder to show pasted items
        // This would need integration with tree expansion state
    }
    break;
}

case 'refresh': {
    const { item } = contextMenu;
    
    // For local folders, refresh the folder contents
    // This would trigger re-reading the local file system
    if (item.type === SpaceItemType.localFolder) {
        // Call IPC handler to refresh local folder
        await (window as any).electronAPI?.items?.refreshLocalFolder(item.id);
        await refetch();
        console.log('Local folder refreshed');
    }
    break;
}
```

#### 3. **clipboardStore.ts** - Enhance Paste Implementation

**Current State:**
Basic paste structure exists but needs full implementation.

**Required Enhancement:**
```typescript
pasteItems: async (targetId, position = 'inside') => {
    const state = get();
    
    if (state.items.length === 0) {
        throw new Error('No items in clipboard');
    }
    
    if (!get().canPaste(targetId)) {
        throw new Error('Cannot paste to this target');
    }
    
    // Call IPC handler to perform actual paste
    for (const item of state.items) {
        await (window as any).electronAPI?.items?.pasteItem({
            sourceItem: item,
            targetId,
            position,
            action: state.action, // 'copy' or 'cut'
        });
    }
    
    // If cut operation, remove from source after paste
    if (state.action === 'cut') {
        for (const item of state.items) {
            await (window as any).electronAPI?.items?.delete(item.id);
        }
    }
    
    // Clear clipboard
    set({
        items: [],
        sourceSpaceId: null,
        action: null,
    });
},
```

#### 4. **IPC Handlers** - Add Missing Handlers

**File:** `packages/desktop/src/main/ipc/handlers.ts`

**New Handlers Needed:**
```typescript
// Paste item handler
ipcMain.handle('items:paste', async (event, { sourceItem, targetId, position, action }) => {
    try {
        // Deep copy the item (including all children)
        const newItem = await itemsService.duplicateItem(sourceItem, targetId, position);
        return { success: true, item: newItem };
    } catch (error) {
        console.error('Failed to paste item:', error);
        return { success: false, error: error.message };
    }
});

// Refresh local folder handler
ipcMain.handle('items:refreshLocalFolder', async (event, itemId) => {
    try {
        await itemsService.refreshLocalFolder(itemId);
        return { success: true };
    } catch (error) {
        console.error('Failed to refresh local folder:', error);
        return { success: false, error: error.message };
    }
});
```

#### 5. **itemsService.ts** - Add Helper Methods

**File:** `packages/core/src/services/itemsService.ts`

**New Methods:**
```typescript
// Duplicate item recursively (for paste operation)
async duplicateItem(sourceItem: SpaceItem, targetId: string, position: string): Promise<SpaceItem> {
    const newId = generateId();
    
    const newItem = {
        ...sourceItem,
        id: newId,
        parentId: targetId,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    
    // Insert into database
    await db.items.create(newItem);
    
    // Recursively duplicate children
    if (sourceItem.children && sourceItem.children.length > 0) {
        for (const child of sourceItem.children) {
            await this.duplicateItem(child, newId, 'inside');
        }
    }
    
    return newItem;
}

// Refresh local folder contents
async refreshLocalFolder(itemId: string): Promise<void> {
    const item = await db.items.findById(itemId);
    
    if (!item || item.type !== 'localFolder') {
        throw new Error('Item is not a local folder');
    }
    
    // Re-scan the local folder and update children
    // This would involve reading the file system and syncing
    // Implementation depends on local folder handling architecture
}
```

## Flutter Reference

### Context Menu Display
```dart
// main_layout_final.dart:1904-2002
void _showContextMenu(BuildContext context, Offset position) {
  final isFolder = widget.item.type == SpaceItemType.folder ||
      widget.item.type == SpaceItemType.localFolder;
  final clipboard = ref.read(spaceClipboardProvider);
  final hasClipboardItems = clipboard != null && clipboard.items.isNotEmpty;

  showMenu<String>(
    context: context,
    position: RelativeRect.fromLTRB(position.dx, position.dy, position.dx, position.dy),
    color: SpayceColors.surfaceDark,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    items: isFolder ? [
      _buildMenuItem('new_folder', 'New Nested Folder', LucideIcons.folderPlus),
      _buildMenuItem('new_link', 'Add Link', LucideIcons.link),
      const PopupMenuDivider(),
      // ... additional items
    ] : [
      // Link items
    ],
  );
}
```

### Action Handlers
```dart
// main_layout_final.dart:2032-2079
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
      _copyFolder();
      break;
    case 'copy_links':
      _copyAllLinks();
      break;
    case 'paste':
      _pasteItems();
      break;
    case 'delete':
      _deleteItem();
      break;
  }
}
```

### Copy Folder Implementation
```dart
// main_layout_final.dart:2171-2177
void _copyFolder() {
  ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
    items: [widget.item],
    sourceSpaceId: widget.spaceId,
    action: ClipboardAction.copy,
  );
}
```

### Copy All Links Implementation
```dart
// main_layout_final.dart:2179-2189
void _copyAllLinks() {
  final links = _collectLinks(widget.item);
  if (links.isEmpty) return;
  final urls = links.map((l) => l.path).join('\n');
  Clipboard.setData(ClipboardData(text: urls));
  ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
    items: links,
    sourceSpaceId: widget.spaceId,
    action: ClipboardAction.copy,
  );
}

List<SpaceItem> _collectLinks(SpaceItem item) {
  final links = <SpaceItem>[];
  if (item.type == SpaceItemType.link) {
    links.add(item);
  }
  for (final child in item.children) {
    links.addAll(_collectLinks(child));
  }
  return links;
}
```

### Paste Implementation
```dart
// main_layout_final.dart:2202-2242
Future<void> _pasteItems() async {
  final clipboard = ref.read(spaceClipboardProvider);
  if (clipboard == null || clipboard.items.isEmpty) return;

  for (final item in clipboard.items) {
    await _pasteItemRecursively(widget.spaceId, widget.item.id, item);
  }

  // Auto-expand folder
  final expandedFolders = ref.read(expandedFoldersProvider);
  if (!expandedFolders.contains(widget.item.id)) {
    final newSet = Set<String>.from(expandedFolders);
    newSet.add(widget.item.id);
    ref.read(expandedFoldersProvider.notifier).state = newSet;
  }
}

Future<void> _pasteItemRecursively(
  String spaceId,
  String? parentId,
  SpaceItem item,
) async {
  final newItem = SpaceItem(
    id: ref.read(spacesListProvider.notifier).generateId(),
    name: item.name,
    path: item.path,
    type: item.type,
    faviconUrl: item.type == SpaceItemType.link
        ? (item.faviconUrl ?? FaviconService.getFaviconUrl(item.path))
        : item.faviconUrl,
    description: item.description,
  );

  await ref.read(spacesListProvider.notifier).addItemToSpace(spaceId, newItem, parentId: parentId);

  for (final child in item.children) {
    await _pasteItemRecursively(spaceId, newItem.id, child);
  }
}
```

## Design System Tokens

```typescript
// Context Menu Styling (from ContextMenu.module.css)
menuBackground: SpayceColors.surfaceDark,        // #1A1628
menuBorder: SpayceColors.borderSubtle,           // rgba(255, 255, 255, 0.1)
menuShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
borderRadius: 8px
menuPadding: 4px

// Menu Item
itemHeight: 32px
itemPadding: 8px 12px
itemFontSize: 13px
itemTextColor: SpayceColors.textPrimary,         // #E5E7EB
itemIconColor: SpayceColors.textSecondary,       // #9CA3AF
itemHoverBackground: SpayceColors.accentDark,    // rgba(255, 255, 255, 0.05)

// Destructive Item
destructiveTextColor: SpayceColors.error,        // #EF4444
destructiveIconColor: SpayceColors.error,

// Divider
dividerColor: SpayceColors.borderSubtle,
dividerHeight: 1px
dividerMargin: 4px 0
```

## Testing Checklist

### Unit Tests
- [ ] `getContextMenuItems` returns correct items for folder type
- [ ] `getContextMenuItems` includes "Copy All Links" only if folder has nested links
- [ ] `getContextMenuItems` includes "Paste" only if hasClipboard is true
- [ ] `getContextMenuItems` includes "Refresh" only for localFolder type
- [ ] `hasNestedLinks` correctly detects links in nested structure
- [ ] `collectAllLinks` recursively collects all links from folder tree
- [ ] Dividers placed in correct positions

### Integration Tests
- [ ] Right-click folder → context menu appears at cursor
- [ ] Menu positioned correctly, adjusts if near viewport edge
- [ ] "New Folder" action triggers inline input with correct parentId
- [ ] "Add Link" action triggers inline input with correct parentId
- [ ] "Rename" action triggers inline rename
- [ ] "Copy Folder" updates clipboard store
- [ ] "Copy All Links" copies URLs to system clipboard
- [ ] "Paste" creates duplicate items in target folder
- [ ] "Delete" shows confirmation and removes folder
- [ ] Keyboard navigation works (arrows, Enter, Escape)

### Manual Testing
- [ ] Right-click folder → full menu appears
- [ ] All items in correct order with proper dividers
- [ ] "New Folder" → inline input appears inside folder, folder expands
- [ ] "Add Link" → inline input appears inside folder, folder expands
- [ ] "Rename" → inline rename active on folder
- [ ] "Copy Folder" → clipboard updated, can paste elsewhere
- [ ] "Copy All Links" on folder with 3 nested links → 3 URLs copied (verify by pasting in text editor)
- [ ] "Paste" with clipboard items → items duplicated inside folder
- [ ] "Paste" not shown when clipboard empty
- [ ] Right-click localFolder → "Refresh" option appears
- [ ] Right-click regular folder → "Refresh" option NOT shown
- [ ] "Delete" → confirmation dialog → folder removed
- [ ] Arrow keys navigate menu, skip dividers and disabled items
- [ ] Enter executes focused action
- [ ] Escape closes menu
- [ ] Click outside closes menu
- [ ] Destructive actions shown in red

### Edge Cases
- [ ] Empty folder → "Copy All Links" not shown
- [ ] Folder with only folders (no links) → "Copy All Links" not shown
- [ ] Deeply nested links → all collected by "Copy All Links"
- [ ] Menu near right edge → positions left to stay in viewport
- [ ] Menu near bottom edge → positions up to stay in viewport
- [ ] Disabled items (Import) cannot be clicked or keyboard-selected

## Implementation Notes

1. **Clipboard Integration**: The internal clipboard store should hold the actual SpaceItem objects with full children, not just IDs
2. **Auto-Expand**: When triggering inline input or pasting, the parent folder should auto-expand to show the new content
3. **Recursive Operations**: Both "Copy All Links" and "Paste" need recursive handling for nested structures
4. **System Clipboard**: "Copy All Links" writes to system clipboard for easy sharing outside the app
5. **Confirmation Dialogs**: Delete should show confirmation, especially for non-empty folders
6. **Performance**: For folders with many nested links, "Copy All Links" should be optimized
7. **Future Features**: Import Local Folder/File and Open in Workspace are disabled but included in menu structure for future implementation
