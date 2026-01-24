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
| 75-97 | MultiSelectionState class | US-017, US-018 |
| 108-123 | InlineInputState, inlineInputProvider | SPEC-012, US-001, US-002 |
| 125-142 | SpaceClipboardState, ClipboardAction | SPEC-016, US-007-010 |
| 144-145 | inlineRenameItemIdProvider | SPEC-015, US-003 |
| 633-649 | Trigger root folder/link creation | US-001, US-002 |
| 800-908 | Keyboard event handler (Cmd+C/V) | US-010 |
| 910-969 | Paste handler (internal + system clipboard) | US-008, US-009 |
| 1770-1783 | Small action icon builder | US-004 |
| 1785-1815 | Trigger subfolder/link creation | US-001, US-002 |
| 1817-1843 | Ctrl+Click handler | US-017 |
| 1845-1902 | Shift+Click handler, flatten items | US-018 |
| 1904-2002 | Show context menu | US-005, US-006 |
| 2032-2079 | Handle menu actions | US-005, US-006 |
| 2162-2200 | Copy link/folder/all links | US-007 |
| 2218-2242 | Paste item recursively | US-008 |
| 2424-2458 | Selection styling | US-019 |
| 2468-2525 | TreeItem with inline rename, hover actions | US-003, US-004 |
| 3300-3393 | InlineRenameInput widget | US-003 |
| 3395-3604 | InlineInputRow widget | US-001, US-002 |
| 3452-3479 | Clipboard auto-paste for links | US-002 |
| 3500-3526 | Folder/link submit logic | US-001, US-002 |

---

### 2. Space Models

**File:** `features/spaces/models/space_models.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-50 | SpaceItemType enum | All stories |
| 51-150 | SpaceItem class | All stories |
| 151-250 | Space class | All stories |
| 251-300 | JSON serialization | Data layer |
| 301-393 | Helper methods (addChild, removeChild, findChild) | US-008 |

---

### 3. Drag-Drop Provider

**File:** `features/spaces/providers/drag_drop_provider.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 6-10 | DragSource, DropPosition enums | SPEC-014 |
| 12-43 | DragOperation class | SPEC-014 |
| 45-75 | DropIndicatorState class | SPEC-014, US-012 |
| 77-98 | DragData class | SPEC-014, US-011 |
| 100-155 | DragDropState provider | US-011-016 |
| 157-172 | FlashItemId provider | US-016 |
| 195-217 | DragExpandedFolder provider | US-015 |

---

### 4. Spaces Provider

**File:** `features/spaces/providers/spaces_provider.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-100 | SpacesList notifier | All stories |
| 101-150 | addItemToSpace | US-001, US-002 |
| 151-200 | renameItem | US-003 |
| 201-250 | moveItem, reorderItem | US-013, US-020 |
| 251-300 | pinItem, unpinItem | US-006, US-022 |
| 301-350 | reorderPins | US-023 |
| 351-385 | generateId helper | US-001, US-002, US-008 |

---

### 5. Draggable Tree Item

**File:** `features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 12-125 | DraggableTreeItem widget | US-011 |
| 45-68 | Multi-drag support | US-020 |
| 70-95 | Drag start/end handlers | US-011 |
| 127-195 | DroppableTreeItem widget | US-013 |
| 198-216 | Hit zone calculation (20/60/20, 50/50) | US-013 |
| 220-295 | Drag over handler | US-012, US-013 |
| 300-336 | Drag leave with collapse debounce | US-015 |
| 340-375 | Drop accept handler | US-013 |
| 376-378 | Flash animation trigger | US-016 |
| 396-409 | Auto-expand timer | US-015 |
| 411-456 | Valid drop check | US-014 |

---

### 6. Drag Preview Widget

**File:** `features/spaces/presentation/widgets/drag_drop/drag_preview_widget.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 10-80 | SmartDragPreview | US-011, US-025 |
| 35-55 | Shape switch (rectangle/square) | US-025 |
| 82-120 | DragPreviewWidget (rectangle) | US-011 |
| 122-178 | Square preview for pins | US-025 |
| 180-267 | MultiItemDragPreview | US-020 |

---

### 7. Pinned Links Grid

**File:** `features/spaces/presentation/widgets/pinned_links_grid.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-80 | PinnedLinksGrid widget | US-022, US-023 |
| 82-150 | Grid layout calculation | US-022 |
| 152-178 | Drop index calculation | US-022 |
| 180-280 | DragTarget implementation | US-022 |
| 195-200 | Max pins check (15) | US-022 |
| 220-260 | Drop accept logic (pin vs reorder) | US-022, US-023 |
| 280-348 | Pin item rendering | US-023 |
| 350-420 | Pin draggable | US-023 |
| 480-520 | Pin context menu | US-024 |
| 522-600 | pinsGridDropActiveProvider | US-022, US-025 |

---

### 8. Space Card

**File:** `features/spaces/presentation/widgets/space_card_hifi_v2.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 38-39 | cardInlineRenameItemIdProvider | US-027 |
| 42-58 | CardInlineInputState | US-026 |
| 150-180 | Card header with action buttons | US-026 |
| 240-342 | Card context menu | US-028 |
| 380-395 | Cross-card move handler | US-030 |
| 400-450 | Card tree with drag | US-029 |
| 470-565 | Card paste handler | US-028 |
| 620-720 | Card inline input row | US-026 |

---

### 9. Droppable Space Card

**File:** `features/spaces/presentation/widgets/drag_drop/droppable_space_card.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-74 | DroppableSpaceCard widget | US-030 |
| 20-35 | onWillAccept (different space check) | US-030 |
| 40-55 | Hover state management | US-030 |
| 60-74 | onAccept handler | US-030 |

---

### 10. Droppable Space Icon

**File:** `features/spaces/presentation/widgets/drag_drop/droppable_space_icon.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-92 | DroppableSpaceIcon widget | US-021 |
| 25-40 | Same space check | US-021 |
| 45-58 | Auto-switch timer (500ms) | US-021 |
| 60-75 | Hover state | US-021 |
| 70-85 | Drop handler | US-021 |

---

### 11. Spaces Repository

**File:** `features/spaces/data/spaces_repository.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-100 | SpacesRepository class | All data operations |
| 101-200 | CRUD operations | US-001, US-002, etc. |
| 201-300 | moveItem with transaction | US-013, US-021 |
| 301-400 | reorderItem | US-013 |
| 401-500 | pinItem, unpinItem | US-006, US-022 |
| 501-600 | reorderPins | US-023 |
| 601-700 | importLocalFolder, importLocalFile | US-005 |
| 701-840 | Helper methods | Various |

---

### 12. Space Context Menu

**File:** `features/spaces/presentation/widgets/space_context_menu.dart`

| Lines | Feature | Used In |
|-------|---------|---------|
| 1-136 | SpaceContextMenu widget | US-005, US-006 |
| 20-80 | Menu item definitions | US-005, US-006 |
| 82-120 | Action handlers | US-005, US-006 |

---

## File Summary by Story

| Story | Primary Flutter Files |
|-------|----------------------|
| US-001 | main_layout_final.dart (633-640, 1785-1799, 3395-3604) |
| US-002 | main_layout_final.dart (642-649, 3452-3479, 3511-3526) |
| US-003 | main_layout_final.dart (2049-2051, 3300-3393, 2468-2493) |
| US-004 | main_layout_final.dart (2496-2525, 1770-1783) |
| US-005 | main_layout_final.dart (1904-2002, 1927-1972, 2032-2079) |
| US-006 | main_layout_final.dart (1973-1988, 2081-2095) |
| US-007 | main_layout_final.dart (2162-2200) |
| US-008 | main_layout_final.dart (910-969, 2218-2242) |
| US-009 | main_layout_final.dart (940-969) |
| US-010 | main_layout_final.dart (800-908) |
| US-011 | draggable_tree_item.dart (12-125), drag_preview_widget.dart |
| US-012 | drag_drop_provider.dart (45-75) |
| US-013 | draggable_tree_item.dart (127-457, 198-216) |
| US-014 | draggable_tree_item.dart (411-456) |
| US-015 | draggable_tree_item.dart (396-409, 300-336), drag_drop_provider.dart (195-217) |
| US-016 | drag_drop_provider.dart (157-172) |
| US-017 | main_layout_final.dart (1817-1843, 75-95) |
| US-018 | main_layout_final.dart (1845-1902) |
| US-019 | main_layout_final.dart (2424-2458) |
| US-020 | draggable_tree_item.dart (45-68), drag_preview_widget.dart (180-267) |
| US-021 | droppable_space_icon.dart (1-92) |
| US-022 | pinned_links_grid.dart (180-280) |
| US-023 | pinned_links_grid.dart (350-420, 220-260) |
| US-024 | pinned_links_grid.dart (480-520) |
| US-025 | drag_preview_widget.dart (10-80) |
| US-026 | space_card_hifi_v2.dart (42-58, 150-180, 620-720) |
| US-027 | space_card_hifi_v2.dart (38-39, 280-285) |
| US-028 | space_card_hifi_v2.dart (240-342, 470-565) |
| US-029 | space_card_hifi_v2.dart (400-450) |
| US-030 | droppable_space_card.dart (1-74), space_card_hifi_v2.dart (380-395) |
