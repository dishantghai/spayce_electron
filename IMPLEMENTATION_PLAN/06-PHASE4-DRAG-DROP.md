# Phase 4: Drag and Drop (Within Space)

**Priority:** P0 - Critical  
**Dependencies:** SPEC-014, Phase 1-3  
**Total Estimated Effort:** 27 hours

This phase implements drag-and-drop reordering within a single space.

---

## US-011: Drag Tree Items

**Priority:** P0 - Critical  
**Dependencies:** SPEC-014  
**Estimated Effort:** 8 hours  
**User Value:** Users can reorder items by dragging

### User Story

> As a user, I want to drag items in the sidebar tree to reorder them, so I can organize my content visually.

### Acceptance Criteria

- [ ] Items are draggable
- [ ] Drag preview shows item name and icon
- [ ] Ghost opacity on dragged item (0.4)
- [ ] Drag feedback follows cursor
- [ ] Can drag multiple selected items (shows count badge)

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| DraggableTreeItem | `draggable_tree_item.dart` | 12-125 |
| Multi-drag Support | `draggable_tree_item.dart` | 45-68 |
| Drag Preview | `drag_preview_widget.dart` | 1-267 |
| DragData Class | `drag_drop_provider.dart` | 77-98 |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/drag_preview_widget.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart`

### Flutter Code Reference

```dart
// DraggableTreeItem (draggable_tree_item.dart:12-125)
class DraggableTreeItem extends ConsumerStatefulWidget {
  final SpaceItem item;
  final String spaceId;
  final String? parentId;
  final int index;
  final int level;
  final Color accentColor;
  final Widget child;
  final List<SpaceItem>? selectedItems;
}

Widget build(BuildContext context) {
  final itemsToDrag = widget.selectedItems ?? [widget.item];
  
  final dragData = DragData(
    item: widget.item,
    items: itemsToDrag,
    spaceId: widget.spaceId,
    parentId: widget.parentId,
    sourceIndex: widget.index,
  );
  
  final feedback = Transform.translate(
    offset: const Offset(16, 8),
    child: itemsToDrag.length > 1
        ? MultiItemDragPreview(items: itemsToDrag, accentColor: widget.accentColor)
        : SmartDragPreview(item: widget.item, accentColor: widget.accentColor),
  );
  
  return Draggable<DragData>(
    data: dragData,
    feedback: feedback,
    childWhenDragging: Opacity(opacity: 0.4, child: widget.child),
    onDragStarted: _onDragStarted,
    onDragEnd: _onDragEnd,
    onDraggableCanceled: _onDragCanceled,
    child: widget.child,
  );
}

// DragPreviewWidget (drag_preview_widget.dart)
class SmartDragPreview extends ConsumerWidget {
  final SpaceItem item;
  final Color accentColor;
  
  Widget build(BuildContext context, WidgetRef ref) {
    final isOverPins = ref.watch(pinsGridDropActiveProvider);
    
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 150),
      child: isOverPins
          ? _buildSquarePreview()  // Square for pins grid
          : _buildRectanglePreview(),  // Rectangle for tree
    );
  }
}

class MultiItemDragPreview extends StatelessWidget {
  final List<SpaceItem> items;
  final Color accentColor;
  
  // Shows stacked cards with count badge
}
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/components/drag-drop/DraggableTreeItem.tsx
packages/react-ui/src/components/drag-drop/DragPreview.tsx
packages/react-ui/src/components/drag-drop/DragPreview.module.css
packages/react-ui/src/components/drag-drop/index.ts
```

**Files to Update:**
```
packages/react-ui/src/components/TreeItem.tsx
packages/react-ui/src/stores/dragDropUiStore.ts
```

### Implementation Steps

1. **Create DragPreview Component**
   ```typescript
   // DragPreview.tsx
   interface DragPreviewProps {
     items: SpaceItem[];
     accentColor: string;
     isSquare?: boolean;  // For pins grid
   }
   
   export function DragPreview({ items, accentColor, isSquare }: DragPreviewProps) {
     if (items.length === 1) {
       return <SingleItemPreview item={items[0]} accentColor={accentColor} isSquare={isSquare} />;
     }
     return <MultiItemPreview items={items} accentColor={accentColor} isSquare={isSquare} />;
   }
   
   function SingleItemPreview({ item, accentColor, isSquare }) {
     const Icon = getIconForItem(item);
     
     if (isSquare) {
       return (
         <div className={styles.squarePreview} style={{ borderColor: accentColor }}>
           <img src={item.faviconUrl} className={styles.favicon} />
         </div>
       );
     }
     
     return (
       <div className={styles.rectanglePreview} style={{ borderColor: accentColor }}>
         <Icon size={14} />
         <span className={styles.name}>{item.name}</span>
       </div>
     );
   }
   
   function MultiItemPreview({ items, accentColor, isSquare }) {
     return (
       <div className={styles.multiPreview}>
         <SingleItemPreview item={items[0]} accentColor={accentColor} isSquare={isSquare} />
         <div className={styles.countBadge}>{items.length}</div>
       </div>
     );
   }
   ```

2. **Create DraggableTreeItem Wrapper**
   ```typescript
   // DraggableTreeItem.tsx
   interface DraggableTreeItemProps {
     item: SpaceItem;
     spaceId: string;
     parentId: string | null;
     index: number;
     level: number;
     accentColor: string;
     selectedItems?: SpaceItem[];
     ancestorIds: string[];
     children: React.ReactNode;
   }
   
   export function DraggableTreeItem({
     item,
     spaceId,
     parentId,
     index,
     accentColor,
     selectedItems,
     ancestorIds,
     children,
   }: DraggableTreeItemProps) {
     const { startDrag, endDrag } = useDragDropUiStore();
     const [isDragging, setIsDragging] = useState(false);
     
     const itemsToDrag = selectedItems?.length ? selectedItems : [item];
     
     const handleDragStart = (e: React.DragEvent) => {
       const dragData: DragData = {
         item,
         items: itemsToDrag,
         spaceId,
         parentId,
         sourceIndex: index,
         source: 'sidebar',
         ancestorIds,
       };
       
       e.dataTransfer.setData('application/json', JSON.stringify(dragData));
       e.dataTransfer.effectAllowed = 'move';
       
       // Create custom drag image
       const preview = document.createElement('div');
       // ... render preview
       document.body.appendChild(preview);
       e.dataTransfer.setDragImage(preview, 0, 0);
       setTimeout(() => document.body.removeChild(preview), 0);
       
       setIsDragging(true);
       startDrag(dragData);
     };
     
     const handleDragEnd = () => {
       setIsDragging(false);
       endDrag();
     };
     
     return (
       <div
         draggable
         onDragStart={handleDragStart}
         onDragEnd={handleDragEnd}
         style={{ opacity: isDragging ? 0.4 : 1 }}
       >
         {children}
       </div>
     );
   }
   ```

3. **Update TreeItem to Use DraggableTreeItem**
   ```typescript
   // TreeItem.tsx
   return (
     <DraggableTreeItem
       item={item}
       spaceId={spaceId}
       parentId={parentId}
       index={index}
       accentColor={accentColor}
       selectedItems={isSelected ? getSelectedItems() : undefined}
       ancestorIds={ancestorIds}
     >
       {/* existing TreeItem content */}
     </DraggableTreeItem>
   );
   ```

### Manual Testing Checklist

- [ ] Drag item → preview appears
- [ ] Preview shows icon and name
- [ ] Source item fades (0.4 opacity)
- [ ] Preview follows cursor
- [ ] Multi-select → preview shows count badge
- [ ] Release outside → item returns to original position

---

## US-012: Drop Indicators

**Priority:** P0 - Critical  
**Dependencies:** US-011  
**Estimated Effort:** 4 hours  
**User Value:** Users see where item will be dropped

### User Story

> As a user, I want to see a visual indicator showing where my dragged item will land, so I can drop it precisely.

### Acceptance Criteria

- [ ] Horizontal line shows drop position
- [ ] Line matches tree indentation level
- [ ] Line color matches space accent color
- [ ] Smooth fade in/out animation (150ms)

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| DropIndicatorLine | Custom implementation | N/A |
| DropIndicatorState | `drag_drop_provider.dart` | 45-75 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart`

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/components/drag-drop/DropIndicatorLine.tsx
packages/react-ui/src/components/drag-drop/DropIndicatorLine.module.css
```

### Implementation Steps

1. **Create DropIndicatorLine Component**
   ```typescript
   // DropIndicatorLine.tsx
   interface DropIndicatorLineProps {
     level: number;
     accentColor: string;
     visible: boolean;
   }
   
   export function DropIndicatorLine({ level, accentColor, visible }: DropIndicatorLineProps) {
     const indent = level * 16; // Match tree indentation
     
     return (
       <div
         className={cn(styles.dropIndicator, visible && styles.visible)}
         style={{
           marginLeft: indent,
           backgroundColor: accentColor,
         }}
       />
     );
   }
   ```

2. **CSS for Drop Indicator**
   ```css
   /* DropIndicatorLine.module.css */
   .dropIndicator {
     height: 2px;
     border-radius: 1px;
     opacity: 0;
     transition: opacity 150ms ease;
     pointer-events: none;
   }
   
   .dropIndicator.visible {
     opacity: 1;
   }
   ```

3. **Integrate in TreeView**
   ```typescript
   // In TreeView, render drop indicator between items
   {dropIndicator?.targetId === item.id && dropIndicator?.position === 'before' && (
     <DropIndicatorLine level={level} accentColor={accentColor} visible />
   )}
   <TreeItem ... />
   {dropIndicator?.targetId === item.id && dropIndicator?.position === 'after' && (
     <DropIndicatorLine level={level} accentColor={accentColor} visible />
   )}
   ```

### Manual Testing Checklist

- [ ] Drag over item → line appears
- [ ] Line at correct indentation
- [ ] Line color matches space color
- [ ] Smooth fade animation
- [ ] Line disappears when drag leaves

---

## US-013: Drop Target Hit Zones

**Priority:** P0 - Critical  
**Dependencies:** US-012  
**Estimated Effort:** 6 hours  
**User Value:** Users can drop before, after, or inside folders

### User Story

> As a user, I want to drop items before, after, or inside folders, so I can organize with precision.

### Acceptance Criteria

- [ ] **Folders**: 20% top = before, 60% middle = inside, 20% bottom = after
- [ ] **Links/Files**: 50% top = before, 50% bottom = after
- [ ] Visual feedback changes based on hit zone
- [ ] Drop executes at indicated position

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| DroppableTreeItem | `draggable_tree_item.dart` | 127-457 |
| Hit Zone Logic | `draggable_tree_item.dart` | 198-216 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`

### Flutter Code Reference

```dart
// Hit zone calculation (draggable_tree_item.dart:198-216)
DropPosition _calculateDropPosition(Offset localPosition, Size size) {
  final yFraction = localPosition.dy / size.height;
  
  if (widget.item.type == SpaceItemType.folder ||
      widget.item.type == SpaceItemType.localFolder) {
    // Folders: 20% top, 60% middle (inside), 20% bottom
    if (yFraction < 0.2) return DropPosition.before;
    if (yFraction > 0.8) return DropPosition.after;
    return DropPosition.inside;
  } else {
    // Links/files: 50% top, 50% bottom
    return yFraction < 0.5 ? DropPosition.before : DropPosition.after;
  }
}
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/components/drag-drop/DroppableTreeItem.tsx
```

**Files to Update:**
```
packages/react-ui/src/components/TreeItem.tsx
packages/react-ui/src/stores/dragDropUiStore.ts
```

### Implementation Steps

1. **Create DroppableTreeItem Component**
   ```typescript
   // DroppableTreeItem.tsx
   interface DroppableTreeItemProps {
     item: SpaceItem;
     spaceId: string;
     parentId: string | null;
     index: number;
     level: number;
     accentColor: string;
     ancestorIds: string[];
     onDrop: (dragData: DragData, position: DropPosition) => void;
     children: React.ReactNode;
   }
   
   export function DroppableTreeItem({
     item,
     spaceId,
     parentId,
     index,
     level,
     ancestorIds,
     onDrop,
     children,
   }: DroppableTreeItemProps) {
     const { setDropIndicator, dragData } = useDragDropUiStore();
     const ref = useRef<HTMLDivElement>(null);
     
     const calculateDropPosition = (e: React.DragEvent): DropPosition => {
       if (!ref.current) return 'after';
       
       const rect = ref.current.getBoundingClientRect();
       const yFraction = (e.clientY - rect.top) / rect.height;
       
       const isFolder = item.type === 'folder' || item.type === 'localFolder';
       
       if (isFolder) {
         // Folders: 20% top, 60% middle, 20% bottom
         if (yFraction < 0.2) return 'before';
         if (yFraction > 0.8) return 'after';
         return 'inside';
       } else {
         // Links/files: 50/50
         return yFraction < 0.5 ? 'before' : 'after';
       }
     };
     
     const handleDragOver = (e: React.DragEvent) => {
       e.preventDefault();
       e.stopPropagation();
       
       if (!isValidDrop(dragData, item, ancestorIds)) {
         e.dataTransfer.dropEffect = 'none';
         return;
       }
       
       e.dataTransfer.dropEffect = 'move';
       
       const position = calculateDropPosition(e);
       setDropIndicator({
         targetId: item.id,
         position,
         spaceId,
         targetIndex: index,
         targetParentId: parentId,
       });
     };
     
     const handleDrop = (e: React.DragEvent) => {
       e.preventDefault();
       e.stopPropagation();
       
       const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
       const position = calculateDropPosition(e);
       
       onDrop(data, position);
     };
     
     const handleDragLeave = (e: React.DragEvent) => {
       // Only clear if leaving this element entirely
       if (!ref.current?.contains(e.relatedTarget as Node)) {
         setDropIndicator(null);
       }
     };
     
     return (
       <div
         ref={ref}
         onDragOver={handleDragOver}
         onDrop={handleDrop}
         onDragLeave={handleDragLeave}
       >
         {children}
       </div>
     );
   }
   ```

2. **Implement Drop Handler**
   ```typescript
   const handleTreeItemDrop = async (dragData: DragData, position: DropPosition) => {
     const targetItem = /* item being dropped on */;
     
     let newParentId: string | null;
     let newIndex: number;
     
     if (position === 'inside') {
       // Drop inside folder
       newParentId = targetItem.id;
       newIndex = 0; // First position inside
     } else if (position === 'before') {
       newParentId = targetItem.parentId;
       newIndex = targetItem.sortOrder;
     } else {
       // after
       newParentId = targetItem.parentId;
       newIndex = targetItem.sortOrder + 1;
     }
     
     // Move each dragged item
     for (const item of dragData.items) {
       await window.itemsApi.move(item.id, {
         newParentId,
         newSpaceId: targetItem.spaceId,
         newIndex,
       });
     }
     
     invalidate(`space-items:${activeSpaceId}`);
   };
   ```

### Manual Testing Checklist

- [ ] Drag over folder top 20% → "before" indicator
- [ ] Drag over folder middle 60% → "inside" indicator (folder highlights)
- [ ] Drag over folder bottom 20% → "after" indicator
- [ ] Drag over link top 50% → "before" indicator
- [ ] Drag over link bottom 50% → "after" indicator
- [ ] Drop executes at indicated position

---

## US-014: Drop Validation

**Priority:** P0 - Critical  
**Dependencies:** US-013  
**Estimated Effort:** 3 hours  
**User Value:** Invalid drops are prevented

### User Story

> As a user, I want to be prevented from dropping a folder into itself or its children, so I don't accidentally break my structure.

### Acceptance Criteria

- [ ] Cannot drop on itself
- [ ] Cannot drop folder into its own descendants
- [ ] Cannot drop to same position (no-op)
- [ ] Invalid drop shows no indicator (cursor changes to "not-allowed")

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Valid Drop Check | `draggable_tree_item.dart` | 411-456 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`

### Flutter Code Reference

```dart
// Valid drop check (draggable_tree_item.dart:411-456)
bool _isValidDrop(DragData dragData, DropPosition position) {
  // Cannot drop on itself
  if (dragData.item.id == widget.item.id) return false;
  
  // Cannot drop into same position (no-op)
  if (dragData.parentId == widget.parentId &&
      dragData.spaceId == widget.spaceId) {
    if (position == DropPosition.before && dragData.sourceIndex == widget.index - 1) {
      return false;
    }
    if (position == DropPosition.after && dragData.sourceIndex == widget.index + 1) {
      return false;
    }
  }
  
  // Cannot drop folder into its own descendants
  if (position == DropPosition.inside) {
    for (final draggedItem in dragData.items) {
      if (widget.ancestorIds.contains(draggedItem.id)) {
        return false;
      }
    }
  }
  
  return true;
}
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/utils/dragDropValidation.ts
```

### Implementation Steps

1. **Create Validation Utility**
   ```typescript
   // dragDropValidation.ts
   export function isValidDrop(
     dragData: DragData | null,
     targetItem: SpaceItem,
     targetAncestorIds: string[],
     targetIndex: number,
     position: DropPosition
   ): boolean {
     if (!dragData) return false;
     
     // Cannot drop on itself
     if (dragData.item.id === targetItem.id) return false;
     
     // Cannot drop folder into its own descendants
     if (position === 'inside') {
       for (const item of dragData.items) {
         if (targetAncestorIds.includes(item.id)) {
           return false;
         }
       }
     }
     
     // Cannot drop multi-selection containing target
     if (dragData.items.some(item => item.id === targetItem.id)) {
       return false;
     }
     
     // Cannot drop to same position (no-op)
     if (dragData.parentId === targetItem.parentId &&
         dragData.spaceId === targetItem.spaceId) {
       if (position === 'before' && dragData.sourceIndex === targetIndex - 1) {
         return false;
       }
       if (position === 'after' && dragData.sourceIndex === targetIndex + 1) {
         return false;
       }
     }
     
     return true;
   }
   ```

2. **Update DroppableTreeItem**
   ```typescript
   const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault();
     
     const position = calculateDropPosition(e);
     
     if (!isValidDrop(dragData, item, ancestorIds, index, position)) {
       e.dataTransfer.dropEffect = 'none';
       setDropIndicator(null);
       return;
     }
     
     e.dataTransfer.dropEffect = 'move';
     setDropIndicator({ ... });
   };
   ```

### Manual Testing Checklist

- [ ] Drag folder over itself → no indicator, cursor "not-allowed"
- [ ] Drag folder into its child → no indicator
- [ ] Drag to same position → no indicator
- [ ] Valid drops → indicator shows

---

## US-015: Auto-Expand Folders on Drag Hover

**Priority:** P1 - High  
**Dependencies:** US-013  
**Estimated Effort:** 4 hours  
**User Value:** Users can drop into collapsed folders without manual expand

### User Story

> As a user, I want folders to auto-expand when I hover over them while dragging, so I can drop into nested folders without manual expansion.

### Acceptance Criteria

- [ ] Hover over closed folder for 500ms → folder expands
- [ ] Only one folder drag-expanded at a time
- [ ] Leave folder subtree → folder collapses (150ms debounce)
- [ ] Drop inside → folder stays expanded

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Auto-expand Timer | `draggable_tree_item.dart` | 396-409 |
| DragExpandedFolder Provider | `drag_drop_provider.dart` | 195-217 |
| Collapse Logic | `draggable_tree_item.dart` | 300-336 |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart`

### Flutter Code Reference

```dart
// Auto-expand timer (draggable_tree_item.dart:396-409)
Timer? _expandTimer;

void _startExpandTimer() {
  if (!widget.item.isExpanded &&
      (widget.item.type == SpaceItemType.folder ||
       widget.item.type == SpaceItemType.localFolder)) {
    _expandTimer?.cancel();
    _expandTimer = Timer(const Duration(milliseconds: 500), () {
      // Store current drag-expanded folder
      ref.read(dragExpandedFolderProvider.notifier).state = widget.item.id;
      // Expand the folder
      ref.read(expandedFoldersProvider.notifier).update((state) {
        return Set<String>.from(state)..add(widget.item.id);
      });
    });
  }
}

// Collapse on leave with debounce (draggable_tree_item.dart:300-336)
Timer? _collapseTimer;

void _onDragLeave() {
  _expandTimer?.cancel();
  
  final dragExpandedId = ref.read(dragExpandedFolderProvider);
  if (dragExpandedId == widget.item.id) {
    _collapseTimer?.cancel();
    _collapseTimer = Timer(const Duration(milliseconds: 150), () {
      // Collapse folder
      ref.read(expandedFoldersProvider.notifier).update((state) {
        return Set<String>.from(state)..remove(widget.item.id);
      });
      ref.read(dragExpandedFolderProvider.notifier).state = null;
    });
  }
}
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/drag-drop/DroppableTreeItem.tsx
packages/react-ui/src/stores/dragDropUiStore.ts
```

### Implementation Steps

1. **Update dragDropUiStore**
   ```typescript
   // Add to store
   dragExpandedFolderId: string | null;
   setDragExpandedFolder: (id: string | null) => void;
   ```

2. **Add Timer Logic to DroppableTreeItem**
   ```typescript
   const expandTimerRef = useRef<NodeJS.Timeout>();
   const collapseTimerRef = useRef<NodeJS.Timeout>();
   
   const handleDragEnter = (e: React.DragEvent) => {
     const isFolder = item.type === 'folder' || item.type === 'localFolder';
     
     if (isFolder && !item.isExpanded) {
       // Start expand timer
       expandTimerRef.current = setTimeout(() => {
         setDragExpandedFolder(item.id);
         onExpandFolder(item.id);
       }, 500);
     }
     
     // Cancel collapse if re-entering
     if (collapseTimerRef.current) {
       clearTimeout(collapseTimerRef.current);
     }
   };
   
   const handleDragLeave = (e: React.DragEvent) => {
     // Cancel expand timer
     if (expandTimerRef.current) {
       clearTimeout(expandTimerRef.current);
     }
     
     // Start collapse timer if this was drag-expanded
     if (dragExpandedFolderId === item.id) {
       collapseTimerRef.current = setTimeout(() => {
         onCollapseFolder(item.id);
         setDragExpandedFolder(null);
       }, 150);
     }
   };
   
   // Cleanup on unmount
   useEffect(() => {
     return () => {
       if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
       if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
     };
   }, []);
   ```

### Manual Testing Checklist

- [ ] Drag over collapsed folder → waits 500ms → expands
- [ ] Leave before 500ms → doesn't expand
- [ ] Leave expanded folder → collapses after 150ms
- [ ] Re-enter quickly → cancels collapse
- [ ] Only one folder auto-expanded at a time
- [ ] Drop inside → folder stays expanded

---

## US-016: Flash Animation on Drop

**Priority:** P2 - Medium  
**Dependencies:** US-013  
**Estimated Effort:** 2 hours  
**User Value:** Users can easily locate dropped item

### User Story

> As a user, I want the dropped item to briefly flash, so I can see where it landed.

### Acceptance Criteria

- [ ] Dropped item background flashes with accent color
- [ ] Animation duration: 700ms
- [ ] Auto-clears after animation

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| FlashItemId Provider | `drag_drop_provider.dart` | 157-172 |
| Visual Effect | `draggable_tree_item.dart` | 376-378 |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/draggable_tree_item.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/stores/dragDropUiStore.ts
packages/react-ui/src/components/TreeItem.tsx
packages/react-ui/src/components/TreeView.module.css
```

### Implementation Steps

1. **Update dragDropUiStore**
   ```typescript
   flashItemId: string | null;
   setFlashItem: (id: string | null) => void;
   ```

2. **Trigger Flash on Drop**
   ```typescript
   const handleTreeItemDrop = async (dragData, position) => {
     // ... move item logic ...
     
     // Flash the moved item
     setFlashItem(dragData.item.id);
     setTimeout(() => setFlashItem(null), 700);
   };
   ```

3. **Add Flash Style to TreeItem**
   ```css
   /* TreeView.module.css */
   @keyframes flash {
     0% { background-color: transparent; }
     30% { background-color: var(--accent-color-20); }
     100% { background-color: transparent; }
   }
   
   .treeItem.flash {
     animation: flash 700ms ease-out;
   }
   ```

4. **Apply Flash Class in TreeItem**
   ```typescript
   const isFlashing = flashItemId === item.id;
   
   return (
     <div className={cn(styles.treeItem, isFlashing && styles.flash)}>
       ...
     </div>
   );
   ```

### Manual Testing Checklist

- [ ] Drop item → brief highlight flash
- [ ] Flash lasts ~700ms
- [ ] Flash uses accent color
- [ ] Flash auto-clears
