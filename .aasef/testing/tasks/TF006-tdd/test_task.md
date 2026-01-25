# TDD Test Task: Spec F006 - Enhanced Link Context Menu

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F006
title: Enhanced Link Context Menu
type: feature
priority: P0
status: pending
related_specs: []
dependencies: [F003]
affected_files:
  - packages/desktop/src/renderer/App.tsx
  - packages/react-ui/src/components/ContextMenu.tsx
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/desktop/src/main/ipc/handlers.ts
  - packages/core/src/services/itemsService.ts
estimated_hours: 2
---

# F006: Enhanced Link Context Menu

## User Story

> As a user, I want a comprehensive context menu for links with all management options, so I can quickly rename, copy, pin/unpin, or delete links via right-click.

## Context

This feature implements a complete context menu specifically for link items with proper item ordering and conditional pin/unpin functionality. The menu provides quick access to link management operations including renaming, copying the URL, pinning to top, and deletion.

**Key Behaviors:**
- Context menu appears on right-click with proper positioning
- Pin/Unpin shown conditionally based on current pin status
- Copy Link copies URL to system clipboard for easy pasting in browser
- All actions integrate with existing systems (inline rename, pins, deletion)
- Keyboard navigation (arrow keys, Enter, Escape) fully supported

## Screenshots Reference

Based on Flutter app screenshots (from Phase 2 plan):
- Shows link context menu with rename, copy, pin/unpin, and delete options
- Pin/Unpin toggles based on current state
- Delete shown in destructive red color
- Simpler menu structure than folders (no nested creation options)

## Acceptance Criteria

### Menu Display
- [ ] Right-click link → shows context menu at cursor position
- [ ] Menu positioned correctly, adjusts if near viewport edge
- [ ] All items in correct order (see Menu Structure below)
- [ ] Menu closes on action selection or Escape key
- [ ] Click outside menu → closes menu

### Menu Items - Conditional Visibility
- [ ] "Rename" - Always visible
- [ ] "Copy Link" - Always visible
- [ ] "Pin to Top" - Visible only when link is NOT pinned
- [ ] "Unpin" - Visible only when link IS pinned
- [ ] "Delete" - Always visible with destructive styling

### Action Behaviors
- [ ] "Rename" → triggers inline rename for link (name only, URL preserved)
- [ ] "Copy Link" → copies URL to system clipboard
- [ ] "Pin to Top" → pins link, appears in pins grid at top of space
- [ ] "Unpin" → unpins link, removes from pins grid
- [ ] "Delete" → removes link from space (no confirmation needed for single link)

### Pin/Unpin Integration
- [ ] After pin → link appears in pins grid
- [ ] After unpin → link removed from pins grid
- [ ] Pin state persists across app restarts
- [ ] Multiple links can be pinned simultaneously
- [ ] Pinned links sorted by pin order/creation time

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
| 1 | Rename | Edit (Pencil) | Always | Trigger inline rename |
| 2 | Copy Link | Copy | Always | Copy URL to clipboard |
| 3 | --- | divider | | |
| 4 | Pin to Top | Pin | NOT pinned | Pin link to top |
| 5 | Unpin | PinOff | IS pinned | Unpin link |
| 6 | --- | divider | | |
| 7 | Delete | Trash2 | Always | Delete link |

**Note:** Menu shows either "Pin to Top" OR "Unpin", never both at the same time.

## Technical Implementation

### Files to Update

#### 1. **App.tsx** - Update `getContextMenuItems` function

**Current Implementation:**
The function exists with basic link menu structure.

**Required Changes:**
```typescript
function getContextMenuItems(item: SpaceItem, hasClipboard: boolean): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];
    
    if (item.type === SpaceItemType.folder || item.type === SpaceItemType.localFolder) {
        // ... folder items (F005)
    } else if (item.type === SpaceItemType.link) {
        // Link context menu
        items.push(
            { id: 'rename', label: 'Rename', icon: LucideIcons.Pencil },
            { id: 'copy_link', label: 'Copy Link', icon: LucideIcons.Copy },
            { id: 'divider1', label: '', icon: LucideIcons.Minus, isDivider: true },
        );
        
        // Conditionally show Pin OR Unpin based on current state
        if (item.isPinned) {
            items.push({ id: 'unpin', label: 'Unpin', icon: LucideIcons.PinOff });
        } else {
            items.push({ id: 'pin', label: 'Pin to Top', icon: LucideIcons.Pin });
        }
        
        items.push(
            { id: 'divider2', label: '', icon: LucideIcons.Minus, isDivider: true },
            { id: 'delete', label: 'Delete', icon: LucideIcons.Trash2, isDestructive: true },
        );
    }
    
    return items;
}
```

**Key Points:**
- Check `item.isPinned` to determine which menu item to show
- Use `LucideIcons.Pin` for pin action
- Use `LucideIcons.PinOff` for unpin action
- Only one of pin/unpin shown at a time

#### 2. **App.tsx** - Update `handleContextMenuItemClick` function

**Current Implementation:**
Basic pin/unpin cases exist but may need enhancement.

**Required Changes/Verification:**
```typescript
case 'rename': {
    const { item, context } = contextMenu;
    
    // Trigger inline rename
    if (context === 'sidebar') {
        setSidebarRenameItemId(item.id);
    } else {
        setCardRenameItemId(item.id);
    }
    break;
}

case 'copy_link': {
    const { item } = contextMenu;
    
    // Copy URL to system clipboard
    try {
        await navigator.clipboard.writeText(item.path);
        console.log('Link URL copied to clipboard:', item.path);
        
        // Optional: Show toast notification
        // showToast('Link copied to clipboard');
    } catch (err) {
        console.error('Failed to copy link:', err);
        // Optional: Show error toast
        // showToast('Failed to copy link', 'error');
    }
    break;
}

case 'pin': {
    const { item } = contextMenu;
    
    try {
        // Call IPC handler to pin item
        const result = await (window as any).electronAPI?.items?.pin(item.id);
        
        if (result?.success) {
            // Refresh data to update UI
            await refetch();
            console.log('Link pinned:', item.name);
            
            // Optional: Show toast notification
            // showToast('Link pinned to top');
        }
    } catch (err) {
        console.error('Failed to pin link:', err);
    }
    break;
}

case 'unpin': {
    const { item } = contextMenu;
    
    try {
        // Call IPC handler to unpin item
        const result = await (window as any).electronAPI?.items?.unpin(item.id);
        
        if (result?.success) {
            // Refresh data to update UI
            await refetch();
            console.log('Link unpinned:', item.name);
            
            // Optional: Show toast notification
            // showToast('Link unpinned');
        }
    } catch (err) {
        console.error('Failed to unpin link:', err);
    }
    break;
}

case 'delete':
case 'remove': {
    const { item } = contextMenu;
    
    // For single links, delete without confirmation
    // (Confirmation only needed for folders with content)
    try {
        const result = await (window as any).electronAPI?.items?.delete(item.id);
        
        if (result?.success) {
            await refetch();
            console.log('Link deleted:', item.name);
        }
    } catch (err) {
        console.error('Failed to delete link:', err);
    }
    break;
}
```

**Implementation Notes:**
- **Rename**: Uses existing inline rename system from F003
- **Copy Link**: Writes URL to system clipboard (not internal clipboard)
- **Pin/Unpin**: Calls IPC handlers and refreshes data
- **Delete**: No confirmation dialog needed for single links (unlike folders)

#### 3. **IPC Handlers** - Verify Pin/Unpin Handlers

**File:** `packages/desktop/src/main/ipc/handlers.ts`

**Required Handlers:**
```typescript
// Pin item handler
ipcMain.handle('items:pin', async (event, itemId: string) => {
    try {
        const item = await itemsService.pinItem(itemId);
        return { success: true, item };
    } catch (error) {
        console.error('Failed to pin item:', error);
        return { success: false, error: error.message };
    }
});

// Unpin item handler
ipcMain.handle('items:unpin', async (event, itemId: string) => {
    try {
        const item = await itemsService.unpinItem(itemId);
        return { success: true, item };
    } catch (error) {
        console.error('Failed to unpin item:', error);
        return { success: false, error: error.message };
    }
});
```

#### 4. **itemsService.ts** - Pin/Unpin Methods

**File:** `packages/core/src/services/itemsService.ts`

**Required Methods:**
```typescript
// Pin item to top of space
async pinItem(itemId: string): Promise<SpaceItem> {
    const item = await db.items.findById(itemId);
    
    if (!item) {
        throw new Error('Item not found');
    }
    
    if (item.type !== SpaceItemType.link) {
        throw new Error('Only links can be pinned');
    }
    
    // Update item with pin timestamp
    const updatedItem = {
        ...item,
        isPinned: true,
        pinnedAt: new Date(),
        updatedAt: new Date(),
    };
    
    await db.items.update(itemId, updatedItem);
    
    return updatedItem;
}

// Unpin item
async unpinItem(itemId: string): Promise<SpaceItem> {
    const item = await db.items.findById(itemId);
    
    if (!item) {
        throw new Error('Item not found');
    }
    
    // Update item to remove pin
    const updatedItem = {
        ...item,
        isPinned: false,
        pinnedAt: null,
        updatedAt: new Date(),
    };
    
    await db.items.update(itemId, updatedItem);
    
    return updatedItem;
}
```

**Database Schema Requirement:**
The `items` table should have:
- `isPinned: boolean` (default: false)
- `pinnedAt: timestamp` (nullable) - used for sorting pinned items

#### 5. **Type Definitions** - Verify SpaceItem Interface

**File:** `packages/react-ui/src/types/index.ts` (or similar)

**Required Fields:**
```typescript
export interface SpaceItem {
    id: string;
    name: string;
    path: string;
    type: SpaceItemType;
    parentId?: string | null;
    spaceId?: string;
    isPinned?: boolean;          // Required for F006
    pinnedAt?: Date | null;      // Required for sorting pinned items
    faviconUrl?: string | null;
    description?: string | null;
    children: SpaceItem[];
    createdAt?: Date;
    updatedAt?: Date;
    // ... other fields
}
```

## Flutter Reference

### Link Context Menu Items
```dart
// main_layout_final.dart:1973-1988
if (isLink) ...[
  _buildMenuItem('rename', 'Rename', LucideIcons.pencil),
  _buildMenuItem('copy_link', 'Copy Link', LucideIcons.copy),
  const PopupMenuDivider(),
  if (!widget.item.isPinned)
    _buildMenuItem('pin', 'Pin to Top', LucideIcons.pin),
  if (widget.item.isPinned)
    _buildMenuItem('unpin', 'Unpin', LucideIcons.pinOff),
  const PopupMenuDivider(),
  _buildMenuItem('delete', 'Delete', LucideIcons.trash2, isDestructive: true),
],
```

### Pin Handler
```dart
// main_layout_final.dart:2069-2074
case 'pin':
  await ref.read(spacesListProvider.notifier).pinItem(
    widget.spaceId,
    widget.item.id,
  );
  break;
```

### Unpin Handler
```dart
// main_layout_final.dart:2069-2074 (continued)
case 'unpin':
  await ref.read(spacesListProvider.notifier).unpinItem(
    widget.spaceId,
    widget.item.id,
  );
  break;
```

### Copy Link Handler
```dart
// main_layout_final.dart:2162-2169
void _copyLink() {
  Clipboard.setData(ClipboardData(text: widget.item.path));
  ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
    items: [widget.item],
    sourceSpaceId: widget.spaceId,
    action: ClipboardAction.copy,
  );
}
```

**Note:** Flutter implementation copies to both system clipboard AND internal clipboard. For Electron, we'll copy to system clipboard only (since it's a URL meant for external use).

### Pin/Unpin Service Methods
```dart
// In spacesListProvider (Riverpod state management)
Future<void> pinItem(String spaceId, String itemId) async {
  final item = await db.items.findById(itemId);
  if (item == null) return;
  
  final updatedItem = item.copyWith(
    isPinned: true,
    pinnedAt: DateTime.now(),
  );
  
  await db.items.update(updatedItem);
  
  // Invalidate pins provider to refresh UI
  ref.invalidate(pinnedItemsProvider(spaceId));
}

Future<void> unpinItem(String itemId) async {
  final item = await db.items.findById(itemId);
  if (item == null) return;
  
  final updatedItem = item.copyWith(
    isPinned: false,
    pinnedAt: null,
  );
  
  await db.items.update(updatedItem);
}
```

## Design System Tokens

```typescript
// Context Menu Styling (same as F005)
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

// Pin Icon (when link is pinned in tree)
pinIconColor: SpayceColors.primary,              // #6D5AE6
pinIconSize: 12px
```

## Testing Checklist

### Unit Tests
- [ ] `getContextMenuItems` returns correct items for link type
- [ ] Link menu includes "Pin to Top" when isPinned is false
- [ ] Link menu includes "Unpin" when isPinned is true
- [ ] Link menu never includes both "Pin to Top" AND "Unpin"
- [ ] Dividers placed in correct positions
- [ ] Delete item has isDestructive flag set to true

### Integration Tests
- [ ] Right-click link → context menu appears at cursor
- [ ] Menu positioned correctly, adjusts if near viewport edge
- [ ] "Rename" action triggers inline rename
- [ ] "Copy Link" copies URL to system clipboard
- [ ] "Pin to Top" updates database and UI
- [ ] "Unpin" updates database and UI
- [ ] "Delete" removes link from space
- [ ] Keyboard navigation works (arrows, Enter, Escape)

### Manual Testing - Basic Actions
- [ ] Right-click link → menu appears with 5 items (rename, copy, divider, pin/unpin, divider, delete)
- [ ] "Rename" → inline rename active, can edit name
- [ ] After rename, URL still works (path preserved)
- [ ] "Copy Link" → URL in system clipboard (verify by pasting in browser address bar)
- [ ] Click outside menu → menu closes

### Manual Testing - Pin/Unpin Flow
- [ ] Right-click unpinned link → "Pin to Top" shown
- [ ] Click "Pin to Top" → link appears in pins grid
- [ ] Pins grid shows link with favicon and name
- [ ] Right-click same link again → "Unpin" shown (not "Pin to Top")
- [ ] Click "Unpin" → link removed from pins grid
- [ ] Link still visible in tree structure
- [ ] Right-click link → "Pin to Top" shown again

### Manual Testing - Multiple Pins
- [ ] Pin 3 different links → all 3 appear in pins grid
- [ ] Pins grid shows all pinned links
- [ ] Click pinned link in grid → opens in browser
- [ ] Unpin 2nd link → only that link removed from grid
- [ ] Other 2 pins remain in grid
- [ ] Restart app → pinned links persist

### Manual Testing - Edge Cases
- [ ] Pin link, delete it → link removed from pins and tree
- [ ] Copy link URL with special characters → URL copied correctly
- [ ] Link with very long URL → menu item doesn't overflow
- [ ] Right-click link at screen edge → menu positioned to stay in viewport
- [ ] Menu near bottom → menu flips up if needed
- [ ] Keyboard: Arrow down through all items → dividers skipped
- [ ] Keyboard: Enter on "Delete" → link deleted
- [ ] Keyboard: Escape → menu closes without action

### Visual Testing
- [ ] Rename, Copy Link have normal text color
- [ ] Delete has red text color (destructive)
- [ ] Pin/Unpin have correct icons (Pin vs PinOff)
- [ ] Hovered item has subtle background highlight
- [ ] Dividers have subtle color, proper spacing
- [ ] Menu shadow visible on all backgrounds
- [ ] Menu doesn't flicker or jump when opening

## Implementation Notes

1. **Pin State Management**: 
   - `isPinned` is a boolean field on the item
   - `pinnedAt` timestamp used for sorting pinned items (most recent first)
   - Pin state persists in database

2. **System Clipboard Only**: 
   - Unlike folder copy, link copy goes directly to system clipboard
   - Internal clipboard not needed since it's a simple URL string
   - Users can paste URL directly in browser or other apps

3. **No Confirmation for Delete**: 
   - Single links don't need confirmation dialog
   - Unlike folders (which may have children), deleting a link is simple
   - User can easily re-add if deleted accidentally

4. **Rename Preserves URL**: 
   - Inline rename only changes the `name` field
   - `path` (URL) remains unchanged
   - This allows user-friendly names while keeping functional URLs

5. **Pin/Unpin UI Updates**: 
   - After pin/unpin, call `refetch()` to update UI
   - Pins grid should automatically reflect changes
   - Tree view should show pin indicator icon for pinned links

6. **Keyboard Accessibility**: 
   - Arrow keys skip dividers automatically
   - Enter executes the focused action
   - Escape always closes without action

7. **Future Enhancements**:
   - Toast notifications for actions (optional)
   - Undo functionality for delete
   - Drag-and-drop reordering of pinned links
   - Pin limit or organization options

8. **Integration with Pins Grid**:
   - Pinned links appear in separate "Pins" section at top of space
   - Clicking pinned link opens in browser
   - Pinned links also remain in tree structure
   - Pins grid should query `isPinned: true` items for current space


## Acceptance Criteria to Cover



## Tech Stack

```json
Not specified
```

## Required Test Files

- Create in appropriate test directory

## Test Requirements

### For Each Acceptance Criterion

Create tests that:
1. **Test the happy path** - Normal expected behavior
2. **Test edge cases** - Boundary conditions, empty inputs
3. **Test error handling** - Invalid inputs, network failures
4. **Use appropriate mocking** - Don't hit real APIs/databases

### Test Structure

```
describe('Feature: Enhanced Link Context Menu')
  describe('AC1: [Acceptance Criterion 1]')
    test('should [expected behavior]')
    test('should handle [edge case]')
    test('should throw error when [error condition]')
  
  describe('AC2: [Acceptance Criterion 2]')
    ...
```

## Guidelines

1. **Tests MUST FAIL initially** - We haven't implemented yet!
2. Follow existing test patterns in the codebase
3. Use the project's testing frameworks
4. Ensure tests are deterministic (no flaky tests)
5. Add appropriate setup/teardown
6. Use descriptive test names
7. Group related tests logically

## After Creating Tests

1. **Link tests to spec**: `aasef test link <test-file> --spec F006`
2. **Run RED phase**: `aasef test tdd-red F006`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
