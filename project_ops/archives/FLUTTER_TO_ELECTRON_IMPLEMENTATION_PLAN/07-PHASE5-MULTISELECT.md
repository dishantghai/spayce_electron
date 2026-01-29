# Phase 5: Multi-Selection

**Priority:** P1 - High  
**Dependencies:** 013, Phase 4  
**Total Estimated Effort:** 13 hours

This phase implements multi-selection for batch operations.

---

## F017: Ctrl+Click Toggle Selection

**Priority:** P1 - High  
**Dependencies:** 013  
**Estimated Effort:** 3 hours  
**User Value:** Users can select multiple items individually

### User Story

> As a user, I want to Ctrl+Click items to add/remove them from my selection, so I can select non-contiguous items.

### Acceptance Criteria

- [ ] Ctrl+Click (Cmd+Click on Mac) adds item to selection
- [ ] Ctrl+Click on selected item removes it from selection
- [ ] Regular click clears multi-selection and selects single item
- [ ] Selection clears when switching spaces

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Ctrl+Click Handler | `main_layout_final.dart` | 1817-1843 |
| MultiSelectionState | `main_layout_final.dart` | 75-95 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// MultiSelectionState (main_layout_final.dart:75-95)
class MultiSelectionState {
  final String spaceId;
  final Set<String> selectedIds;
  final String lastSelectedId;

  const MultiSelectionState({
    required this.spaceId,
    required this.selectedIds,
    required this.lastSelectedId,
  });
}

// Ctrl+Click handler (main_layout_final.dart:1817-1843)
void _handleClick(PointerDownEvent event) {
  final isCtrlPressed = HardwareKeyboard.instance.isControlPressed ||
      HardwareKeyboard.instance.isMetaPressed;
  
  if (isCtrlPressed) {
    // Toggle selection
    final current = ref.read(multiSelectionProvider);
    final newSelectedIds = Set<String>.from(current?.selectedIds ?? {});
    
    if (newSelectedIds.contains(widget.item.id)) {
      newSelectedIds.remove(widget.item.id);
    } else {
      newSelectedIds.add(widget.item.id);
    }
    
    ref.read(multiSelectionProvider.notifier).state = MultiSelectionState(
      spaceId: widget.spaceId,
      selectedIds: newSelectedIds,
      lastSelectedId: widget.item.id,
    );
  } else {
    // Regular click - clear multi-selection
    ref.read(multiSelectionProvider.notifier).state = null;
    // Set single selection
    ref.read(selectedSpaceItemProvider.notifier).state = SelectedSpaceItem(...);
  }
}
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/stores/selectionStore.ts (from SPEC-013)
packages/react-ui/src/components/TreeItem.tsx
packages/react-ui/src/components/Sidebar.tsx
```

### Implementation Steps

1. **Implement Toggle Selection in Store** (from SPEC-013)

2. **Update TreeItem Click Handler**
   ```typescript
   const handleClick = (e: React.MouseEvent) => {
     const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
     const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
     
     if (isCtrlOrCmd) {
       // Toggle selection
       selectionStore.toggleSelection(spaceId, item.id);
     } else if (e.shiftKey) {
       // Range selection (US-018)
       selectionStore.selectRange(spaceId, item.id, allVisibleIds);
     } else {
       // Regular click - clear multi and select single
       selectionStore.clearSelection();
       onItemSelect(item);
     }
   };
   ```

3. **Clear Selection on Space Switch**
   ```typescript
   // In Sidebar or App
   useEffect(() => {
     selectionStore.clearSelection();
   }, [activeSpaceId]);
   ```

### Manual Testing Checklist

- [ ] Click item → single selection
- [ ] Cmd+Click (Mac) / Ctrl+Click → adds to selection
- [ ] Cmd+Click selected item → removes from selection
- [ ] Regular click → clears multi-selection
- [ ] Switch space → clears selection

---

## F018: Shift+Click Range Selection

**Priority:** P1 - High  
**Dependencies:** F017  
**Estimated Effort:** 4 hours  
**User Value:** Users can select a range of items quickly

### User Story

> As a user, I want to Shift+Click to select all items between my last selection and the clicked item.

### Acceptance Criteria

- [ ] Shift+Click selects range from anchor to clicked item
- [ ] Anchor is last selected item (from Ctrl+Click or regular click)
- [ ] Range includes items in tree order (visible items only)
- [ ] Range respects expanded state (collapsed children not included)

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Shift+Click Handler | `main_layout_final.dart` | 1845-1874 |
| Get Range | `main_layout_final.dart` | 1876-1892 |
| Flatten Items | `main_layout_final.dart` | 1894-1902 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Shift+Click handler (main_layout_final.dart:1845-1874)
void _handleShiftClick() {
  final current = ref.read(multiSelectionProvider);
  final anchorId = current?.lastSelectedId;
  
  if (anchorId == null) {
    // No anchor, just select clicked item
    ref.read(multiSelectionProvider.notifier).state = MultiSelectionState(
      spaceId: widget.spaceId,
      selectedIds: {widget.item.id},
      lastSelectedId: widget.item.id,
    );
    return;
  }
  
  // Get all visible items in order
  final visibleItems = _flattenVisibleItems(widget.space.items);
  final visibleIds = visibleItems.map((i) => i.id).toList();
  
  // Find range
  final anchorIndex = visibleIds.indexOf(anchorId);
  final clickedIndex = visibleIds.indexOf(widget.item.id);
  
  if (anchorIndex == -1 || clickedIndex == -1) return;
  
  final start = math.min(anchorIndex, clickedIndex);
  final end = math.max(anchorIndex, clickedIndex);
  final rangeIds = visibleIds.sublist(start, end + 1).toSet();
  
  ref.read(multiSelectionProvider.notifier).state = MultiSelectionState(
    spaceId: widget.spaceId,
    selectedIds: rangeIds,
    lastSelectedId: anchorId, // Keep anchor for subsequent shift-clicks
  );
}

// Flatten visible items (main_layout_final.dart:1894-1902)
List<SpaceItem> _flattenVisibleItems(List<SpaceItem> items) {
  final result = <SpaceItem>[];
  for (final item in items) {
    result.add(item);
    if (item.isExpanded && item.children.isNotEmpty) {
      result.addAll(_flattenVisibleItems(item.children));
    }
  }
  return result;
}
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/utils/treeUtils.ts
```

**Files to Update:**
```
packages/react-ui/src/stores/selectionStore.ts
packages/react-ui/src/components/TreeItem.tsx
packages/react-ui/src/components/TreeView.tsx
```

### Implementation Steps

1. **Create Tree Utility for Flattening**
   ```typescript
   // treeUtils.ts
   export function flattenVisibleItems(
     items: SpaceItem[],
     expandedFolderIds: Set<string>
   ): SpaceItem[] {
     const result: SpaceItem[] = [];
     
     function flatten(nodes: SpaceItem[]) {
       for (const item of nodes) {
         result.push(item);
         
         const isExpanded = expandedFolderIds.has(item.id);
         if (isExpanded && item.children?.length) {
           flatten(item.children);
         }
       }
     }
     
     flatten(items);
     return result;
   }
   
   export function getVisibleItemIds(
     items: SpaceItem[],
     expandedFolderIds: Set<string>
   ): string[] {
     return flattenVisibleItems(items, expandedFolderIds).map(i => i.id);
   }
   ```

2. **Update Selection Store**
   ```typescript
   selectRange: (spaceId, itemId, allVisibleIds) => {
     const state = get();
     const anchor = state.lastSelectedId;
     
     if (!anchor || state.spaceId !== spaceId) {
       set({
         spaceId,
         selectedIds: new Set([itemId]),
         lastSelectedId: itemId,
       });
       return;
     }
     
     const anchorIndex = allVisibleIds.indexOf(anchor);
     const clickedIndex = allVisibleIds.indexOf(itemId);
     
     if (anchorIndex === -1 || clickedIndex === -1) {
       set({
         spaceId,
         selectedIds: new Set([itemId]),
         lastSelectedId: itemId,
       });
       return;
     }
     
     const start = Math.min(anchorIndex, clickedIndex);
     const end = Math.max(anchorIndex, clickedIndex);
     const rangeIds = allVisibleIds.slice(start, end + 1);
     
     set({
       spaceId,
       selectedIds: new Set(rangeIds),
       // Keep anchor the same
     });
   };
   ```

3. **Update TreeView to Pass Visible IDs**
   ```typescript
   // In TreeView
   const visibleIds = useMemo(
     () => getVisibleItemIds(items, expandedFolderIds),
     [items, expandedFolderIds]
   );
   
   // Pass to TreeItem
   <TreeItem
     ...
     allVisibleIds={visibleIds}
   />
   ```

### Manual Testing Checklist

- [ ] Click item A → anchor set
- [ ] Shift+Click item C → A, B, C selected
- [ ] Shift+Click item above anchor → range reverses
- [ ] Collapsed folder children not in range
- [ ] Shift+Click after Ctrl+Click → uses last Ctrl+Click as anchor

---

## F019: Multi-Selection Visual Feedback

**Priority:** P1 - High  
**Dependencies:** F017  
**Estimated Effort:** 2 hours  
**User Value:** Users can see which items are selected

### User Story

> As a user, I want selected items to be visually highlighted, so I can see my selection clearly.

### Acceptance Criteria

- [ ] Selected items have tinted background (accent color at 10% opacity)
- [ ] Selected items have left border indicator
- [ ] Selection count shown in tooltip or status (optional)

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Selection Styling | `main_layout_final.dart` | 2424-2458 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/TreeItem.tsx
packages/react-ui/src/components/TreeView.module.css
```

### Implementation Steps

1. **Update TreeView.module.css**
   ```css
   .treeItem.multiSelected {
     background-color: var(--accent-color-10);
     border-left: 2px solid var(--accent-color);
   }
   
   .treeItem.multiSelected:hover {
     background-color: var(--accent-color-15);
   }
   ```

2. **Update TreeItem to Apply Selection Class**
   ```typescript
   const { selectedIds, spaceId: selectionSpaceId } = useSelectionStore();
   const isMultiSelected = 
     selectionSpaceId === spaceId && selectedIds.has(item.id);
   
   return (
     <div
       className={cn(
         styles.treeItem,
         isMultiSelected && styles.multiSelected
       )}
       style={{
         '--accent-color': accentColor,
         '--accent-color-10': `${accentColor}1a`, // 10% opacity
         '--accent-color-15': `${accentColor}26`, // 15% opacity
       }}
     >
       ...
     </div>
   );
   ```

### Manual Testing Checklist

- [ ] Multi-selected items have tinted background
- [ ] Background uses accent color
- [ ] Left border visible
- [ ] Hover state slightly darker
- [ ] Selection visually distinct from focus

---

## F020: Multi-Select Drag

**Priority:** P1 - High  
**Dependencies:** F011, F018  
**Estimated Effort:** 4 hours  
**User Value:** Users can move multiple items at once

### User Story

> As a user, I want to drag all selected items when I drag one of them, so I can move multiple items efficiently.

### Acceptance Criteria

- [ ] Drag selected item → all selected items move together
- [ ] Drag preview shows count badge
- [ ] Drop moves all items to target position
- [ ] Maintains relative order of items

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Multi-drag Start | `draggable_tree_item.dart` | 45-68 |
| Multi-item Preview | `drag_preview_widget.dart` | 180-267 |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/drag_preview_widget.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/drag-drop/DraggableTreeItem.tsx
packages/react-ui/src/components/drag-drop/DragPreview.tsx
packages/react-ui/src/components/TreeItem.tsx
packages/desktop/src/renderer/App.tsx
```

### Implementation Steps

1. **Update DraggableTreeItem to Include Selection**
   ```typescript
   // In TreeItem
   const { selectedIds } = useSelectionStore();
   const isSelected = selectedIds.has(item.id);
   
   // Get all selected items if this item is selected
   const selectedItems = isSelected 
     ? getItemsByIds(spaceItems, Array.from(selectedIds))
     : undefined;
   
   <DraggableTreeItem
     item={item}
     selectedItems={selectedItems}
     ...
   />
   ```

2. **Update DragPreview for Multi-Items**
   ```typescript
   function MultiItemPreview({ items, accentColor, isSquare }) {
     const firstItem = items[0];
     
     return (
       <div className={styles.multiPreviewContainer}>
         {/* Stack effect - show 2-3 cards */}
         <div className={styles.stackCard2} />
         <div className={styles.stackCard1} />
         
         {/* Main preview */}
         <div className={styles.mainPreview}>
           {isSquare ? (
             <img src={firstItem.faviconUrl} className={styles.favicon} />
           ) : (
             <>
               <Icon icon={getIconForType(firstItem.type)} size={14} />
               <span>{firstItem.name}</span>
             </>
           )}
         </div>
         
         {/* Count badge */}
         <div className={styles.countBadge}>{items.length}</div>
       </div>
     );
   }
   ```

3. **Update Drop Handler for Multi-Items**
   ```typescript
   const handleTreeItemDrop = async (dragData: DragData, position: DropPosition) => {
     const targetItem = /* ... */;
     
     // Calculate new parent and base index
     let newParentId: string | null;
     let baseIndex: number;
     
     if (position === 'inside') {
       newParentId = targetItem.id;
       baseIndex = 0;
     } else if (position === 'before') {
       newParentId = targetItem.parentId;
       baseIndex = targetItem.sortOrder;
     } else {
       newParentId = targetItem.parentId;
       baseIndex = targetItem.sortOrder + 1;
     }
     
     // Move all items, maintaining relative order
     const sortedItems = [...dragData.items].sort((a, b) => a.sortOrder - b.sortOrder);
     
     for (let i = 0; i < sortedItems.length; i++) {
       await window.itemsApi.move(sortedItems[i].id, {
         newParentId,
         newSpaceId: targetItem.spaceId,
         newIndex: baseIndex + i,
       });
     }
     
     // Clear multi-selection after drop
     selectionStore.clearSelection();
     
     // Flash first item
     setFlashItem(sortedItems[0].id);
     
     invalidate(`space-items:${activeSpaceId}`);
   };
   ```

### Manual Testing Checklist

- [ ] Select multiple items → drag one → all move
- [ ] Preview shows count badge
- [ ] Items drop in correct position
- [ ] Relative order maintained
- [ ] Selection cleared after drop
