# Spayce Electron - Spaces Feature Migration Plan

## Executive Summary

This document provides a comprehensive, story-by-story migration plan to port all Spaces-related features from the Flutter codebase (`/Users/Shared/ALL WORKSPACE/projects/spayce/frontend`) to the Electron app (`/Users/Shared/ALL WORKSPACE/projects/spayce_electron`).

**Scope**: All features related to Spaces, Folders, Links, Local Folders/Files - excluding Browser and Workspace features.

---

## Current State Analysis

### Flutter Codebase (Source)
- **Architecture**: Feature-based structure with Riverpod state management
- **Key Directories**:
  - `lib/features/spaces/` - Core spaces functionality
  - `lib/features/navigation/presentation/main_layout_final.dart` - Sidebar with all interactions
  - `lib/core/services/` - Storage and services

### Electron Codebase (Target)
- **Architecture**: Monorepo with React + TypeScript + Zustand
- **Current State**: Basic sidebar, tree view, context menu, and create space view implemented
- **Missing**: Inline creation, drag-drop, copy-paste, inline rename, pinning drag-drop

---

## Migration Stories

Each story is designed to be implemented incrementally, with clear dependencies on previous stories.

---

# EPIC 1: Data Layer Foundation

## Story 1.1: Space Item Repository & CRUD Operations

**Priority**: P0 (Foundation)  
**Dependencies**: None  
**Estimated Effort**: Large

### Description
Implement the complete repository pattern for SpaceItem CRUD operations including move, reorder, and hierarchical management.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Domain Models | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/models/space_models.dart:5-136` | SpaceItem class definition |
| Repository Pattern | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:23-400` | SpacesRepository class |
| Move Item Logic | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:436-560` | Transaction-safe move with sort order |
| Reorder Logic | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:562-584` | Sibling reordering |
| Provider Pattern | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/spaces_provider.dart:26-335` | State management |

### Electron Target Files
- `packages/core/src/domain/entities/SpaceItem.ts` (exists, needs expansion)
- `packages/core/src/domain/repositories/SpaceItemRepository.ts` (create)
- `packages/infrastructure/src/repositories/` (create SQLite implementation)

### Requirements
1. **Add Item** - Insert at top of parent (sortOrder = 0, shift siblings)
2. **Delete Item** - Cascade delete children, reindex siblings
3. **Move Item** - Cross-space and cross-parent with transaction safety
4. **Reorder Item** - Within same parent, update sortOrder
5. **Rename Item** - Update name only, preserve path/URL

### Key Implementation Details from Flutter
```dart
// From spaces_repository.dart:436-560
// Move operation must:
// 1. Validate item exists
// 2. Validate target parent exists (if specified)
// 3. Get target siblings BEFORE modification
// 4. Adjust target index if moving within same parent
// 5. Shift items at/after target to make room
// 6. Update item's spaceId, parentId, sortOrder
// 7. Reindex source siblings if different parent
// 8. Verify data integrity
```

---

## Story 1.2: Pin Operations Repository

**Priority**: P0 (Foundation)  
**Dependencies**: Story 1.1  
**Estimated Effort**: Medium

### Description
Implement pin/unpin functionality with position management.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Pin Item | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:615-631` | Pin at end logic |
| Unpin Item | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:633-636` | Clear pin position |
| Reorder Pins | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:638-645` | Position management |
| Provider Methods | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/spaces_provider.dart:267-296` | State management |

### Requirements
1. **Pin Item** - Add to pins at next available position (max 15)
2. **Unpin Item** - Clear isPinned flag and pinPosition
3. **Reorder Pins** - Update pinPosition values
4. **Get Pinned Items** - Query by spaceId, ordered by pinPosition

### Key Constraints
- Maximum 15 pins per space (5 columns × 3 rows)
- Pins are excluded from rootItems in tree view

---

## Story 1.3: Local Folder/File Import

**Priority**: P1  
**Dependencies**: Story 1.1  
**Estimated Effort**: Medium

### Description
Implement native file picker integration for importing local folders and files.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Import Local Folder | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:656-688` | Directory picker |
| Import Local File | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:690-720` | File picker |
| Pick Directory | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:731-765` | Path normalization |
| Security Bookmark | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/data/spaces_repository.dart:815-827` | macOS sandbox |
| Local Children Provider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/local_folder_children_provider.dart:1-120` | Dynamic loading |

### Electron Implementation Notes
- Use Electron's `dialog.showOpenDialog` for file/folder picking
- Store `localPath` and optionally security bookmark
- Children loaded dynamically from filesystem (not stored in DB)

---

# EPIC 2: Inline Creation Features

## Story 2.1: Inline Input State Management

**Priority**: P0  
**Dependencies**: Story 1.1  
**Estimated Effort**: Small

### Description
Implement state management for inline folder/link creation in both Sidebar and Space Cards.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| State Definition | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:108-123` | InlineInputState class |
| Provider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:123` | inlineInputProvider |
| Card Input State | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:42-58` | CardInlineInputState |

### Zustand Store Design
```typescript
interface InlineInputState {
  spaceId: string;
  parentId: string | null;  // null for root level
  type: 'folder' | 'link';
}

interface InlineInputStore {
  // Sidebar inline input
  sidebarInput: InlineInputState | null;
  setSidebarInput: (state: InlineInputState | null) => void;
  
  // Space card inline input
  cardInput: InlineInputState | null;
  setCardInput: (state: InlineInputState | null) => void;
}
```

---

## Story 2.2: Inline Folder Creation - Sidebar

**Priority**: P0  
**Dependencies**: Story 2.1  
**Estimated Effort**: Medium

### Description
Implement inline folder creation at Space root level and inside folders in the Sidebar.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Trigger Root Creation | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:633-640` | _addFolderToSpace() |
| Trigger Subfolder | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1785-1799` | _addSubfolder() |
| InlineInputRow Widget | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:3395-3604` | Full implementation |
| Focus Management | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:3423-3450` | Auto-focus, blur handling |
| Folder Submit | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:3500-3510` | Create SpaceItem |

### UI/UX Requirements
1. **Trigger**: Click "+" button on space header OR folder hover actions
2. **Placement**: Appears at top of parent's children list
3. **Auto-expand**: Parent folder auto-expands when adding subfolder
4. **Focus**: Input auto-focuses on mount
5. **Submit**: Enter key or blur (if has content)
6. **Cancel**: Escape key or blur (if empty)
7. **Icon**: Folder icon (LucideIcons.folder) to the left
8. **Styling**: Space accent color border

### Visual Reference (from Flutter)
```
[FolderIcon] [__Folder name______________] [X]
             └── Input with accent border
```

---

## Story 2.3: Inline Link Creation - Sidebar

**Priority**: P0  
**Dependencies**: Story 2.2  
**Estimated Effort**: Medium

### Description
Implement inline link creation with clipboard auto-paste feature.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Trigger Root Link | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:642-649` | _addLinkToSpace() |
| Trigger Folder Link | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1801-1815` | _addLinkToFolder() |
| Clipboard Auto-paste | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:3452-3479` | _loadClipboard() |
| Link Submit | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:3511-3526` | URL normalization, favicon |

### Special Behaviors
1. **Auto-paste from clipboard**: On mount, check system clipboard for URL and pre-fill
2. **URL Normalization**: Add `https://` if missing
3. **Name Extraction**: Use domain as default name
4. **Favicon**: Generate favicon URL on creation

### Favicon Service (from Flutter)
```dart
// From favicon_icon.dart - FaviconService.getFaviconUrl()
'https://www.google.com/s2/favicons?domain=${uri.host}&sz=64'
```

---

## Story 2.4: Inline Creation - Space Cards

**Priority**: P1  
**Dependencies**: Story 2.2, Story 2.3  
**Estimated Effort**: Medium

### Description
Port inline creation to Space Cards view with identical behavior.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Card Inline State | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:35-58` | State providers |
| Add Subfolder | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:208-222` | _addSubfolder() |
| Add Link | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:224-238` | _addLinkToFolder() |
| CardInlineInputRow | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:1600-1870` | Widget (similar to sidebar) |

### Notes
- Uses separate state provider (`cardInlineInputProvider`)
- Identical visual behavior to sidebar
- Integrates with SpaceCard tree view

---

# EPIC 3: Inline Rename Feature

## Story 3.1: Inline Rename - Sidebar

**Priority**: P0  
**Dependencies**: Story 1.1  
**Estimated Effort**: Medium

### Description
Implement inline rename for folders and links in the Sidebar.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Rename Provider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:144-145` | inlineRenameItemIdProvider |
| Trigger Rename | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2049-2051` | Context menu handler |
| InlineRenameInput | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:3300-3393` | Full widget |
| TreeItem Integration | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2468-2493` | Conditional render |

### UI/UX Requirements
1. **Trigger**: Context menu "Rename" or keyboard shortcut
2. **Visual**: Replace item name with TextField, same styling
3. **Pre-select**: All text selected on focus
4. **Submit**: Enter or blur (if changed)
5. **Cancel**: Escape or blur (if unchanged)
6. **Validation**: Non-empty, trim whitespace

### Implementation Pattern
```typescript
// State: Which item is being renamed
const [renameItemId, setRenameItemId] = useState<string | null>(null);

// In TreeItem render:
{renameItemId === item.id ? (
  <InlineRenameInput item={item} onComplete={() => setRenameItemId(null)} />
) : (
  <span>{item.name}</span>
)}
```

---

## Story 3.2: Inline Rename - Space Cards

**Priority**: P1  
**Dependencies**: Story 3.1  
**Estimated Effort**: Small

### Description
Port inline rename to Space Cards view.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Card Rename Provider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:38-39` | cardInlineRenameItemIdProvider |
| Card Rename Widget | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:1500-1600` | Similar to sidebar |

---

# EPIC 4: Context Menus

## Story 4.1: Enhanced Folder Context Menu

**Priority**: P0  
**Dependencies**: Story 1.1, Story 2.2, Story 3.1  
**Estimated Effort**: Medium

### Description
Complete folder context menu with all actions.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Show Context Menu | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1904-2002` | _showContextMenu() |
| Menu Items (Folder) | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1927-1972` | Full folder menu |
| Handle Actions | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2032-2079` | _handleMenuAction() |

### Folder Menu Items
1. **New Nested Folder** → Trigger inline folder creation
2. **Add Link** → Trigger inline link creation
3. ---
4. **Import Local Folder** → Native folder picker
5. **Import Local File** → Native file picker
6. ---
7. **Rename** → Trigger inline rename
8. **Copy Folder** → Copy to internal clipboard
9. **Copy All Links** → Copy all nested links to system clipboard
10. **Paste** (if clipboard has items)
11. ---
12. **Refresh** (for localFolder type only)
13. **Open in Workspace** (for folder/localFolder)
14. **Delete** (destructive, red)

---

## Story 4.2: Enhanced Link Context Menu

**Priority**: P0  
**Dependencies**: Story 3.1  
**Estimated Effort**: Small

### Description
Complete link context menu with all actions.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Menu Items (Link) | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1973-1988` | Full link menu |

### Link Menu Items
1. **Rename** → Trigger inline rename
2. **Copy Link** → Copy URL to system clipboard
3. ---
4. **Pin to Top** (if not pinned)
5. **Unpin** (if pinned)
6. ---
7. **Remove** (destructive, red)

---

## Story 4.3: Pinned Link Context Menu

**Priority**: P1  
**Dependencies**: Story 1.2  
**Estimated Effort**: Small

### Description
Context menu for pinned links in the grid.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Pin Context Menu | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart:426-489` | _showContextMenu() |
| Menu Actions | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart:491-537` | _handleMenuAction() |

### Pinned Link Menu Items
1. **Open in Browser**
2. **Copy Link**
3. ---
4. **Unpin**
5. ---
6. **Delete** (destructive)

---

## Story 4.4: Context Menu - Space Cards

**Priority**: P1  
**Dependencies**: Story 4.1, Story 4.2  
**Estimated Effort**: Small

### Description
Identical context menus in Space Cards view.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Card Context Menu | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:240-342` | _showContextMenu() |

---

# EPIC 5: Copy/Paste Functionality

## Story 5.1: Internal Clipboard State

**Priority**: P0  
**Dependencies**: Story 1.1  
**Estimated Effort**: Small

### Description
Implement internal clipboard for copy/cut/paste of SpaceItems.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Clipboard State | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:125-142` | SpaceClipboardState |
| Provider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:140-142` | spaceClipboardProvider |

### Zustand Store Design
```typescript
interface SpaceClipboardState {
  items: SpaceItem[];
  sourceSpaceId: string;
  action: 'copy' | 'cut';
}

interface ClipboardStore {
  clipboard: SpaceClipboardState | null;
  setClipboard: (state: SpaceClipboardState | null) => void;
}
```

---

## Story 5.2: Copy Operations

**Priority**: P0  
**Dependencies**: Story 5.1  
**Estimated Effort**: Medium

### Description
Implement copy for single item, multiple items, and copy all links from folder.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Copy Link | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2162-2169` | _copyLink() |
| Copy Folder | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2171-2177` | _copyFolder() |
| Copy All Links | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2179-2189` | _copyAllLinks() |
| Collect Links | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2191-2200` | _collectLinks() recursive |
| Multi-select Copy | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1046-1080` | _copySelectedItems() |

### Operations
1. **Copy Single Link** → Internal clipboard + URL to system clipboard
2. **Copy Single Folder** → Internal clipboard (with children)
3. **Copy All Links** → All nested links to internal + URLs to system clipboard
4. **Copy Multi-selected** → All selected items to internal clipboard

---

## Story 5.3: Paste Operations

**Priority**: P0  
**Dependencies**: Story 5.2  
**Estimated Effort**: Medium

### Description
Implement paste from internal clipboard and system clipboard (URLs).

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Paste Handler | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:910-969` | _handlePaste() |
| Paste Recursive | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2218-2242` | _pasteItemRecursively() |
| System Clipboard URL | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:940-965` | External URL paste |

### Paste Logic
1. **Check internal clipboard first** - If has items, paste recursively
2. **Fallback to system clipboard** - Check for URL pattern, create link
3. **Target determination** - If folder selected, paste into it; else paste at root
4. **Auto-expand** - Expand target folder to show pasted items

### URL Detection Pattern (from Flutter)
```dart
if (text.startsWith('http://') ||
    text.startsWith('https://') ||
    (text.contains('.') && !text.contains(' ') && text.length > 3))
```

---

## Story 5.4: Keyboard Shortcuts (Copy/Paste)

**Priority**: P0  
**Dependencies**: Story 5.2, Story 5.3  
**Estimated Effort**: Small

### Description
Wire up Cmd+C, Cmd+V keyboard shortcuts.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Keyboard Handler | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:800-908` | KeyboardListener |

### Shortcuts
- **Cmd/Ctrl+C** → Copy selected items
- **Cmd/Ctrl+V** → Paste

---

# EPIC 6: Multi-Selection

## Story 6.1: Multi-Selection State

**Priority**: P1  
**Dependencies**: Story 1.1  
**Estimated Effort**: Small

### Description
Implement multi-selection state for Ctrl+Click and Shift+Click.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| State Class | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:75-95` | MultiSelectionState |
| Provider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:95-97` | multiSelectionProvider |

### State Design
```typescript
interface MultiSelectionState {
  spaceId: string;
  selectedIds: Set<string>;
  lastSelectedId: string;  // Anchor for shift-click
}
```

---

## Story 6.2: Ctrl+Click Toggle Selection

**Priority**: P1  
**Dependencies**: Story 6.1  
**Estimated Effort**: Small

### Description
Toggle individual item selection with Ctrl/Cmd+Click.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Handler | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1817-1843` | _handleCtrlClick() |

---

## Story 6.3: Shift+Click Range Selection

**Priority**: P1  
**Dependencies**: Story 6.2  
**Estimated Effort**: Medium

### Description
Select range of items from anchor to clicked item.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Handler | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1845-1874` | _handleShiftClick() |
| Get Range | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1876-1892` | _getItemRange() |
| Flatten Items | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1894-1902` | _getFlattenedItems() |

---

## Story 6.4: Multi-Selection Visual Feedback

**Priority**: P1  
**Dependencies**: Story 6.1  
**Estimated Effort**: Small

### Description
Visual styling for multi-selected items.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Selection Styling | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2424-2458` | Container decoration |

### Visual Requirements
- Background: `spaceColor.withOpacity(0.2)`
- Border: `spaceColor.withOpacity(0.5)`, 1px

---

# EPIC 7: Drag and Drop - Tree Items

## Story 7.1: Drag State Management

**Priority**: P0  
**Dependencies**: Story 1.1  
**Estimated Effort**: Small

### Description
Enhanced drag state management for complex drag operations.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| DragOperation | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:12-43` | Full class |
| DropIndicatorState | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:45-75` | With ancestor chain |
| DragData | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:77-98` | For multi-drag |
| Providers | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:100-217` | All state providers |

### Enhanced Zustand Store (update existing)
```typescript
interface DragDropState {
  // From existing store, plus:
  sourceParentId: string | null;
  dragSource: 'sidebar' | 'spaceCard';
  ancestorIds: string[];  // For nested folder collapse detection
  flashItemId: string | null;  // For flash animation after drop
}
```

---

## Story 7.2: Draggable Tree Item

**Priority**: P0  
**Dependencies**: Story 7.1  
**Estimated Effort**: Large

### Description
Make tree items draggable with proper feedback.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| DraggableTreeItem | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart:12-125` | Full implementation |
| Multi-drag Support | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart:45-68` | Feedback with count |
| Drag Preview | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/drag_preview_widget.dart:1-267` | Smart preview |

### React Implementation Notes
- Use `react-dnd` or native HTML5 drag API
- Custom drag preview with item name + icon
- Multi-item preview shows stacked cards with count badge

---

## Story 7.3: Droppable Tree Item

**Priority**: P0  
**Dependencies**: Story 7.2  
**Estimated Effort**: Large

### Description
Make tree items drop targets with Arc Browser-style hit zones.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| DroppableTreeItem | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart:127-457` | Full implementation |
| Hit Zone Logic | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart:198-216` | 20%/60%/20% zones |
| Valid Drop Check | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart:411-456` | _isValidDrop() |

### Hit Zone Rules (Arc Browser Style)
- **Folders**: 20% top = before, 60% middle = inside, 20% bottom = after
- **Links**: 50% top = before, 50% bottom = after

### Drop Validation Rules
1. Cannot drop on itself
2. Cannot drop folder into its own descendants
3. Cannot drop to same position (no-op)

---

## Story 7.4: Drop Indicator Line

**Priority**: P0  
**Dependencies**: Story 7.3  
**Estimated Effort**: Small

### Description
Visual indicator showing where item will be dropped.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| DropIndicatorLine | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/drop_indicator_line.dart:1-80` | Full component |

### Visual Requirements
- Horizontal line with accent color
- Animated appearance (fade in)
- Matches tree indentation level
- 2px height

---

## Story 7.5: Auto-Expand Folders on Hover

**Priority**: P0  
**Dependencies**: Story 7.3  
**Estimated Effort**: Medium

### Description
Automatically expand folders when hovering during drag.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Auto-expand Timer | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart:396-409` | 500ms delay |
| DragExpandedFolder | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:195-216` | Single source of truth |
| Collapse Logic | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart:300-336` | With debounce |

### Behavior
1. Hover over closed folder for 500ms → expand
2. Only one folder drag-expanded at a time
3. Collapse when drag leaves folder's subtree (150ms debounce)
4. Persist expansion if dropped inside (add to user-expanded set)

---

## Story 7.6: Flash Animation on Drop

**Priority**: P1  
**Dependencies**: Story 7.3  
**Estimated Effort**: Small

### Description
Flash the moved item to help user locate it.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| FlashItemId Provider | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:157-172` | Auto-clear timer |
| Visual Effect | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart:376-378` | Background flash |

### Animation
- Background: `accentColor.withOpacity(0.3)`
- Duration: 700ms
- Auto-clear after animation

---

## Story 7.7: Cross-Space Drag via Bottom Bar

**Priority**: P1  
**Dependencies**: Story 7.3  
**Estimated Effort**: Medium

### Description
Enable dragging items to other spaces via the bottom bar icons.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| DroppableSpaceIcon | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/droppable_space_icon.dart:1-92` | Full component |
| Auto-activate | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/droppable_space_icon.dart:44-48` | 800ms hover |

### Behavior
1. Drag item over space icon in bottom bar
2. After 800ms, switch to that space (show its tree)
3. Continue dragging to drop position
4. Drop executes cross-space move

---

# EPIC 8: Drag and Drop - Pinned Links Grid

## Story 8.1: Drag to Pin (From Sidebar)

**Priority**: P0  
**Dependencies**: Story 7.2, Story 1.2  
**Estimated Effort**: Large

### Description
Drag links from sidebar tree to pins grid to pin them.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| PinnedLinksGrid Drop | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart:86-225` | Unified drop target |
| Drop Index Calculation | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart:282-301` | Grid position calc |
| Preview Card | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart:362-386` | Visual feedback |
| Smart Preview | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/drag_preview_widget.dart:24-60` | Square when over pins |

### Visual Feedback
- Grid highlights with accent border when link hovers
- Preview card shows at calculated drop position
- Drag preview changes from rectangle to square icon when over pins grid

---

## Story 8.2: Reorder Pins (Within Grid)

**Priority**: P1  
**Dependencies**: Story 8.1  
**Estimated Effort**: Medium

### Description
Drag to reorder pinned links within the grid.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Internal Reorder | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart:163-183` | Detect & handle |
| SimplePinnedCard | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart:389-619` | Draggable card |

---

# EPIC 9: Drag and Drop - Space Cards

## Story 9.1: Drag Within Space Card

**Priority**: P1  
**Dependencies**: Story 7.2  
**Estimated Effort**: Medium

### Description
Drag items within a single space card's tree view.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| CardTreeItem Drag | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:700-900` | Tree item with drag |

---

## Story 9.2: Drag Across Space Cards

**Priority**: P1  
**Dependencies**: Story 9.1  
**Estimated Effort**: Medium

### Description
Drag items from one space card to another.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| DroppableSpaceCard | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/droppable_space_card.dart:1-74` | Card as drop target |

---

## Story 9.3: Drag Between Sidebar and Space Cards

**Priority**: P1  
**Dependencies**: Story 9.1  
**Estimated Effort**: Medium

### Description
Drag items from sidebar to space cards and vice versa.

### Notes
- Need shared drag data format
- Cross-component communication via global drag state

---

# EPIC 10: Keyboard Navigation Enhancements

## Story 10.1: Arrow Key Navigation

**Priority**: P1  
**Dependencies**: None (existing partial implementation)  
**Estimated Effort**: Small

### Description
Complete arrow key navigation in tree view.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Arrow Up/Down | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:860-908` | Navigation |
| Arrow Right | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:971-996` | Expand or enter |
| Arrow Left | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:998-1044` | Collapse or parent |

### Electron Status
- Partial implementation exists in `@/Users/Shared/ALL WORKSPACE/projects/spayce_electron/packages/react-ui/src/components/Sidebar.tsx:164-262`
- Needs verification and completion

---

## Story 10.2: Delete Key

**Priority**: P1  
**Dependencies**: Story 1.1  
**Estimated Effort**: Small

### Description
Delete selected item with Backspace/Delete key.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Delete Handler | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2244-2296` | With confirmation |

---

# EPIC 11: Tree Item Hover Actions

## Story 11.1: Folder Hover Actions

**Priority**: P0  
**Dependencies**: Story 2.2, Story 2.3  
**Estimated Effort**: Small

### Description
Show action buttons on folder hover.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Hover Actions | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2496-2525` | Action buttons |
| Action Icon | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1770-1783` | _buildSmallActionIcon |

### Folder Hover Actions
1. **FolderPlus** icon → Add subfolder (inline)
2. **Link** icon → Add link (inline)  
3. **MoreVertical** icon → Show context menu

### Electron Status
- Partial implementation exists in `@/Users/Shared/ALL WORKSPACE/projects/spayce_electron/packages/react-ui/src/components/TreeItem.tsx:109-146`
- Handlers are TODO stubs

---

## Story 11.2: Link Hover Actions

**Priority**: P0  
**Dependencies**: None  
**Estimated Effort**: Small

### Description
Show action button on link hover.

### Link Hover Action
1. **MoreVertical** icon → Show context menu

---

# EPIC 12: Space Header Actions

## Story 12.1: Add Folder/Link Buttons

**Priority**: P0  
**Dependencies**: Story 2.2, Story 2.3  
**Estimated Effort**: Small

### Description
Add folder and link buttons in space header.

### Flutter Source References
| Feature | File | Lines |
|---------|------|-------|
| Space Header Actions | `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:540-650` | Header with buttons |

### Actions
1. **FolderPlus** button → Add folder at space root (inline)
2. **Link** button → Add link at space root (inline)

---

# Implementation Order

## Phase 1: Data Layer (Stories 1.1-1.3)
Complete repository pattern and CRUD operations.

## Phase 2: Inline Creation (Stories 2.1-2.4, 12.1)
All inline folder/link creation features.

## Phase 3: Inline Rename (Stories 3.1-3.2)
Rename functionality.

## Phase 4: Context Menus (Stories 4.1-4.4, 11.1-11.2)
Complete context menus and hover actions.

## Phase 5: Copy/Paste (Stories 5.1-5.4)
Clipboard operations.

## Phase 6: Multi-Selection (Stories 6.1-6.4)
Ctrl+Click and Shift+Click selection.

## Phase 7: Drag/Drop - Tree (Stories 7.1-7.7)
Core drag-drop in sidebar.

## Phase 8: Drag/Drop - Pins (Stories 8.1-8.2)
Pinning via drag.

## Phase 9: Drag/Drop - Cards (Stories 9.1-9.3)
Space cards drag-drop.

## Phase 10: Keyboard & Polish (Stories 10.1-10.2)
Final keyboard shortcuts and polish.

---

# Appendix: Key File Reference Map

## Flutter Source Files
| File | Purpose |
|------|---------|
| `lib/features/spaces/models/space_models.dart` | Domain models |
| `lib/features/spaces/data/spaces_repository.dart` | Data operations |
| `lib/features/spaces/providers/spaces_provider.dart` | State management |
| `lib/features/spaces/providers/drag_drop_provider.dart` | Drag state |
| `lib/features/navigation/presentation/main_layout_final.dart` | Main sidebar UI |
| `lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart` | Space card UI |
| `lib/features/spaces/presentation/widgets/pinned_links_grid.dart` | Pins grid |
| `lib/features/spaces/presentation/widgets/drag_drop/*.dart` | Drag components |

## Electron Target Files
| File | Purpose |
|------|---------|
| `packages/core/src/domain/entities/` | Domain models |
| `packages/core/src/domain/repositories/` | Repository interfaces |
| `packages/infrastructure/src/repositories/` | SQLite implementations |
| `packages/react-ui/src/stores/` | Zustand stores |
| `packages/react-ui/src/components/Sidebar.tsx` | Sidebar component |
| `packages/react-ui/src/components/TreeItem.tsx` | Tree item component |
| `packages/react-ui/src/components/SpaceCard.tsx` | Space card (create) |
| `packages/react-ui/src/components/PinnedLinksGrid.tsx` | Pins grid (exists) |
