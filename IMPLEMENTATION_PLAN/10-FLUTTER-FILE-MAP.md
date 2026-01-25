# Flutter Source File Reference Map

This document provides a complete mapping of all Flutter source files referenced in this implementation plan.

---

## Base Path

**Flutter Project Root:**
```
/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/
```

**Electron Project Root:**
```
/Users/Shared/ALL WORKSPACE/projects/spayce_electron/
```

---

## Core Feature Files

### 1. Main Layout (Sidebar)

**File:** `features/navigation/presentation/main_layout_final.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 75-97 | MultiSelectionState class | F017, F018 |
| 108-123 | InlineInputState, inlineInputProvider | 012, F001, F002 |
| 125-142 | SpaceClipboardState, ClipboardAction | 016, F007-F010 |
| 144-145 | inlineRenameItemIdProvider | 015, F003 |
| 633-649 | Trigger root folder/link creation | F001, F002 |
| 800-908 | Keyboard event handler (Cmd+C/V) | F010 |
| 910-969 | Paste handler (internal + system clipboard) | F008, F009 |
| 1770-1783 | Small action icon builder | F004 |
| 1785-1815 | Trigger subfolder/link creation | F001, F002 |
| 1817-1843 | Ctrl+Click handler | F017 |
| 1845-1902 | Shift+Click handler, flatten items | F018 |
| 1904-2002 | Show context menu | F005, F006 |
| 2032-2079 | Handle menu actions | F005, F006 |
| 2162-2200 | Copy link/folder/all links | F007 |
| 2218-2242 | Paste item recursively | F008 |
| 2424-2458 | Selection styling | F019 |
| 2468-2525 | TreeItem with inline rename, hover actions | F003, F004 |
| 3300-3393 | InlineRenameInput widget | F003 |
| 3395-3604 | InlineInputRow widget | F001, F002 |
| 3452-3479 | Clipboard auto-paste for links | F002 |
| 3500-3526 | Folder/link submit logic | F001, F002 |

---

### 2. Space Models

**File:** `features/spaces/models/space_models.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-50 | SpaceItemType enum | All stories |
| 51-150 | SpaceItem class | All stories |
| 151-250 | Space class | All stories |
| 251-300 | JSON serialization | Data layer |
| 301-393 | Helper methods (addChild, removeChild, findChild) | F008 |

---

### 3. Drag-Drop Provider

**File:** `features/spaces/providers/drag_drop_provider.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 6-10 | DragSource, DropPosition enums | 014 |
| 12-43 | DragOperation class | 014 |
| 45-75 | DropIndicatorState class | 014, F012 |
| 77-98 | DragData class | 014, F011 |
| 100-155 | DragDropState provider | F011-F016 |
| 157-172 | FlashItemId provider | F016 |
| 195-217 | DragExpandedFolder provider | F015 |

---

### 4. Spaces Provider

**File:** `features/spaces/providers/spaces_provider.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-100 | SpacesList notifier | All stories |
| 101-150 | addItemToSpace | F001, F002 |
| 151-200 | renameItem | F003 |
| 201-250 | moveItem, reorderItem | F013, F020 |
| 251-300 | pinItem, unpinItem | F006, F022 |
| 301-350 | reorderPins | F023 |
| 351-385 | generateId helper | F001, F002, F008 |

---

### 5. Draggable Tree Item

**File:** `features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 12-125 | DraggableTreeItem widget | F011 |
| 45-68 | Multi-drag support | F020 |
| 70-95 | Drag start/end handlers | F011 |
| 127-195 | DroppableTreeItem widget | F013 |
| 198-216 | Hit zone calculation (20/60/20, 50/50) | F013 |
| 220-295 | Drag over handler | F012, F013 |
| 300-336 | Drag leave with collapse debounce | F015 |
| 340-375 | Drop accept handler | F013 |
| 376-378 | Flash animation trigger | F016 |
| 396-409 | Auto-expand timer | F015 |
| 411-456 | Valid drop check | F014 |

---

### 6. Drag Preview Widget

**File:** `features/spaces/presentation/widgets/drag_drop/drag_preview_widget.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 10-80 | SmartDragPreview | F011, F025 |
| 35-55 | Shape switch (rectangle/square) | F025 |
| 82-120 | DragPreviewWidget (rectangle) | F011 |
| 122-178 | Square preview for pins | F025 |
| 180-267 | MultiItemDragPreview | F020 |

---

### 7. Pinned Links Grid

**File:** `features/spaces/presentation/widgets/pinned_links_grid.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-80 | PinnedLinksGrid widget | F022, F023 |
| 82-150 | Grid layout calculation | F022 |
| 152-178 | Drop index calculation | F022 |
| 180-280 | DragTarget implementation | F022 |
| 195-200 | Max pins check (15) | F022 |
| 220-260 | Drop accept logic (pin vs reorder) | F022, F023 |
| 280-348 | Pin item rendering | F023 |
| 350-420 | Pin draggable | F023 |
| 480-520 | Pin context menu | F024 |
| 522-600 | pinsGridDropActiveProvider | F022, F025 |

---

### 8. Space Card

**File:** `features/spaces/presentation/widgets/space_card_hifi_v2.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 38-39 | cardInlineRenameItemIdProvider | F027 |
| 42-58 | CardInlineInputState | F026 |
| 150-180 | Card header with action buttons | F026 |
| 240-342 | Card context menu | F028 |
| 380-395 | Cross-card move handler | F030 |
| 400-450 | Card tree with drag | F029 |
| 470-565 | Card paste handler | F028 |
| 620-720 | Card inline input row | F026 |

---

### 9. Droppable Space Card

**File:** `features/spaces/presentation/widgets/drag_drop/droppable_space_card.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-74 | DroppableSpaceCard widget | F030 |
| 20-35 | onWillAccept (different space check) | F030 |
| 40-55 | Hover state management | F030 |
| 60-74 | onAccept handler | F030 |

---

### 10. Droppable Space Icon

**File:** `features/spaces/presentation/widgets/drag_drop/droppable_space_icon.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-92 | DroppableSpaceIcon widget | F021 |
| 25-40 | Same space check | F021 |
| 45-58 | Auto-switch timer (500ms) | F021 |
| 60-75 | Hover state | F021 |
| 70-85 | Drop handler | F021 |

---

### 11. Spaces Repository

**File:** `features/spaces/data/spaces_repository.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-100 | SpacesRepository class | All data operations |
| 101-200 | CRUD operations | F001, F002, etc. |
| 201-300 | moveItem with transaction | F013, F021 |
| 301-400 | reorderItem | F013 |
| 401-500 | pinItem, unpinItem | F006, F022 |
| 501-600 | reorderPins | F023 |
| 601-700 | importLocalFolder, importLocalFile | F005 |
| 701-840 | Helper methods | Various |

---

### 12. Space Context Menu

**File:** `features/spaces/presentation/widgets/space_context_menu.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-136 | SpaceContextMenu widget | F005, F006 |
| 20-80 | Menu item definitions | F005, F006 |
| 82-120 | Action handlers | F005, F006 |

---

## File Summary by Story

| Story | Primary Flutter Files |
|-------|----------------------|
| F001 | main_layout_final.dart (633-640, 1785-1799, 3395-3604) |
| F002 | main_layout_final.dart (642-649, 3452-3479, 3511-3526) |
| F003 | main_layout_final.dart (2049-2051, 3300-3393, 2468-2493) |
| F004 | main_layout_final.dart (2496-2525, 1770-1783) |
| F005 | main_layout_final.dart (1904-2002, 1927-1972, 2032-2079) |
| F006 | main_layout_final.dart (1973-1988, 2081-2095) |
| F007 | main_layout_final.dart (2162-2200) |
| F008 | main_layout_final.dart (910-969, 2218-2242) |
| F009 | main_layout_final.dart (940-969) |
| F010 | main_layout_final.dart (800-908) |
| F011 | draggable_tree_item.dart (12-125), drag_preview_widget.dart |
| F012 | drag_drop_provider.dart (45-75) |
| F013 | draggable_tree_item.dart (127-457, 198-216) |
| F014 | draggable_tree_item.dart (411-456) |
| F015 | draggable_tree_item.dart (396-409, 300-336), drag_drop_provider.dart (195-217) |
| F016 | drag_drop_provider.dart (157-172) |
| F017 | main_layout_final.dart (1817-1843, 75-95) |
| F018 | main_layout_final.dart (1845-1902) |
| F019 | main_layout_final.dart (2424-2458) |
| F020 | draggable_tree_item.dart (45-68), drag_preview_widget.dart (180-267) |
| F021 | droppable_space_icon.dart (1-92) |
| F022 | pinned_links_grid.dart (180-280) |
| F023 | pinned_links_grid.dart (350-420, 220-260) |
| F024 | pinned_links_grid.dart (480-520) |
| F025 | drag_preview_widget.dart (10-80) |
| F026 | space_card_hifi_v2.dart (42-58, 150-180, 620-720) |
| F027 | space_card_hifi_v2.dart (38-39, 280-285) |
| F028 | space_card_hifi_v2.dart (240-342, 470-565) |
| F029 | space_card_hifi_v2.dart (400-450) |
| F030 | droppable_space_card.dart (1-74), space_card_hifi_v2.dart (380-395) |
