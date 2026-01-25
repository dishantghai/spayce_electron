# Phase 6: Advanced Drag Operations

**Priority:** P1 - High  
**Dependencies:** Phase 4, Phase 5  
**Total Estimated Effort:** 20 hours

This phase implements cross-space drag and pinning via drag.

---

## F021: Cross-Space Drag via Bottom Bar

**Priority:** P1 - High  
**Dependencies:** F011, F013  
**Estimated Effort:** 6 hours  
**User Value:** Users can move items between spaces easily

### User Story

> As a user, I want to drag items to a different space icon in the bottom bar, so I can reorganize content across spaces.

### Acceptance Criteria

- [ ] Drag over space icon in bottom bar → icon highlights
- [ ] Hover 500ms → switches to that space (shows destination)
- [ ] Drop → moves item to target space root
- [ ] Cannot drop to same space (no effect)
- [ ] Works with multi-selection

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| DroppableSpaceIcon | `droppable_space_icon.dart` | 1-92 |
| Auto-switch Timer | `droppable_space_icon.dart` | 45-58 |
| Drop Handler | `droppable_space_icon.dart` | 70-85 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/droppable_space_icon.dart`

### Flutter Code Reference

```dart
// DroppableSpaceIcon (droppable_space_icon.dart:1-92)
class DroppableSpaceIcon extends ConsumerStatefulWidget {
  final Space space;
  final bool isActive;
  final VoidCallback onTap;
}

class _DroppableSpaceIconState extends ConsumerState<DroppableSpaceIcon> {
  Timer? _activateTimer;
  bool _isHovering = false;

  void _onDragEnter() {
    // Don't allow drop to same space
    final dragData = ref.read(dragDropStateProvider);
    if (dragData?.spaceId == widget.space.id) return;
    
    setState(() => _isHovering = true);
    
    // Auto-switch to this space after 500ms
    _activateTimer?.cancel();
    _activateTimer = Timer(const Duration(milliseconds: 500), () {
      widget.onTap(); // Switch to this space
    });
  }

  void _onDrop(DragData data) {
    // Move items to this space's root
    for (final item in data.items) {
      ref.read(spacesListProvider.notifier).moveItem(
        item.id,
        targetSpaceId: widget.space.id,
        targetParentId: null, // Root level
      );
    }
  }
}
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/components/drag-drop/DroppableSpaceIcon.tsx
```

**Files to Update:**
```
packages/react-ui/src/components/BottomBar.tsx
```

### Implementation Steps

1. **Create DroppableSpaceIcon Component**
   ```typescript
   interface DroppableSpaceIconProps {
     space: Space;
     isActive: boolean;
     onSelect: () => void;
   }
   
   export function DroppableSpaceIcon({ space, isActive, onSelect }: DroppableSpaceIconProps) {
     const { dragData } = useDragDropUiStore();
     const [isHovering, setIsHovering] = useState(false);
     const activateTimerRef = useRef<NodeJS.Timeout>();
     
     const isSameSpace = dragData?.spaceId === space.id;
     
     const handleDragEnter = (e: React.DragEvent) => {
       if (isSameSpace || !dragData) return;
       
       e.preventDefault();
       setIsHovering(true);
       
       // Auto-switch after 500ms
       activateTimerRef.current = setTimeout(() => {
         onSelect();
       }, 500);
     };
     
     const handleDragLeave = () => {
       setIsHovering(false);
       if (activateTimerRef.current) {
         clearTimeout(activateTimerRef.current);
       }
     };
     
     const handleDrop = async (e: React.DragEvent) => {
       e.preventDefault();
       setIsHovering(false);
       
       const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
       
       // Move all items to target space root
       for (const item of data.items) {
         await window.itemsApi.move(item.id, {
           newSpaceId: space.id,
           newParentId: null,
         });
       }
       
       invalidate(`space-items:${data.spaceId}`);
       invalidate(`space-items:${space.id}`);
     };
     
     return (
       <div
         className={cn(
           styles.spaceIcon,
           isActive && styles.active,
           isHovering && styles.dropTarget
         )}
         onDragEnter={handleDragEnter}
         onDragOver={(e) => !isSameSpace && e.preventDefault()}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}
         onClick={onSelect}
       >
         <SpaceIconContent space={space} />
       </div>
     );
   }
   ```

2. **Update BottomBar to Use DroppableSpaceIcon**
   ```typescript
   // In BottomBar
   {spaces.map(space => (
     <DroppableSpaceIcon
       key={space.id}
       space={space}
       isActive={activeSpaceId === space.id}
       onSelect={() => onSpaceSelect(space.id)}
     />
   ))}
   ```

### Manual Testing Checklist

- [ ] Drag item over different space icon → icon highlights
- [ ] Hover 500ms → switches to that space
- [ ] Drop → item moves to target space root
- [ ] Same space → no highlight, no drop
- [ ] Multi-select drag works

---

## F022: Drag to Pins Grid

**Priority:** P1 - High  
**Dependencies:** F011  
**Estimated Effort:** 6 hours  
**User Value:** Users can pin links by dragging to the pins area

### User Story

> As a user, I want to drag a link to the pins grid to pin it, so I can quickly access my favorite links.

### Acceptance Criteria

- [ ] Only links can be dragged to pins grid
- [ ] Folders rejected (cursor shows not-allowed)
- [ ] Drop position shows between existing pins
- [ ] Max 15 pins (5x3 grid) - reject if full
- [ ] Already pinned links can be reordered

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| PinnedLinksGrid DragTarget | `pinned_links_grid.dart` | 180-280 |
| Drop Accept Logic | `pinned_links_grid.dart` | 220-260 |
| Max Pins Check | `pinned_links_grid.dart` | 195-200 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart`

### Flutter Code Reference

```dart
// PinnedLinksGrid drag handling (pinned_links_grid.dart:180-280)
DragTarget<DragData>(
  onWillAcceptWithDetails: (details) {
    final item = details.data.item;
    
    // Only accept links
    if (item.type != SpaceItemType.link) return false;
    
    // Check max pins (unless reordering existing pin)
    if (!item.isPinned && pinnedItems.length >= _maxPins) return false;
    
    return true;
  },
  onMove: (details) {
    // Calculate drop index based on position
    final dropIndex = _calculateDropIndex(details.offset);
    setState(() {
      _dropTargetIndex = dropIndex;
      _isExternalDrag = !details.data.item.isPinned;
    });
    
    // Notify drag preview to show square shape
    ref.read(pinsGridDropActiveProvider.notifier).state = true;
  },
  onLeave: (_) {
    // Delay cleanup for smooth transitions
    Future.delayed(const Duration(milliseconds: 100), () {
      if (!mounted) return;
      setState(() {
        _dropTargetIndex = null;
        _isExternalDrag = false;
      });
      ref.read(pinsGridDropActiveProvider.notifier).state = false;
    });
  },
  onAcceptWithDetails: (details) async {
    final item = details.data.item;
    final targetIndex = _dropTargetIndex ?? pinnedItems.length;
    
    if (item.isPinned) {
      // Reorder existing pin
      await ref.read(spacesListProvider.notifier).reorderPins(
        widget.spaceId,
        item.id,
        targetIndex,
      );
    } else {
      // Pin new item
      await ref.read(spacesListProvider.notifier).pinItem(
        widget.spaceId,
        item.id,
      );
      // Then reorder if not at end
      if (targetIndex < pinnedItems.length) {
        await ref.read(spacesListProvider.notifier).reorderPins(
          widget.spaceId,
          item.id,
          targetIndex,
        );
      }
    }
    
    _clearDragState();
  },
)
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/PinnedLinksGrid.tsx
packages/react-ui/src/components/PinnedLinksGrid.module.css
packages/react-ui/src/stores/dragDropUiStore.ts
```

### Implementation Steps

1. **Update dragDropUiStore for Pins Grid**
   ```typescript
   // Add to store
   isOverPinsGrid: boolean;
   pinsDropIndex: number | null;
   setOverPinsGrid: (isOver: boolean, dropIndex?: number | null) => void;
   ```

2. **Update PinnedLinksGrid as Drop Target**
   ```typescript
   const MAX_PINS = 15;
   
   export function PinnedLinksGrid({ spaceId, accentColor }) {
     const { dragData, setOverPinsGrid } = useDragDropUiStore();
     const [dropIndex, setDropIndex] = useState<number | null>(null);
     const gridRef = useRef<HTMLDivElement>(null);
     
     const { data: pinnedItems } = usePinnedItems(spaceId);
     
     const canAcceptDrop = (data: DragData | null): boolean => {
       if (!data) return false;
       if (data.item.type !== 'link') return false;
       if (!data.item.isPinned && pinnedItems.length >= MAX_PINS) return false;
       return true;
     };
     
     const calculateDropIndex = (clientX: number, clientY: number): number => {
       if (!gridRef.current) return pinnedItems.length;
       
       const rect = gridRef.current.getBoundingClientRect();
       const gridCols = 5;
       const cellWidth = rect.width / gridCols;
       const cellHeight = 80; // Approximate pin height
       
       const col = Math.floor((clientX - rect.left) / cellWidth);
       const row = Math.floor((clientY - rect.top) / cellHeight);
       
       return Math.min(row * gridCols + col, pinnedItems.length);
     };
     
     const handleDragOver = (e: React.DragEvent) => {
       if (!canAcceptDrop(dragData)) {
         e.dataTransfer.dropEffect = 'none';
         return;
       }
       
       e.preventDefault();
       e.dataTransfer.dropEffect = 'move';
       
       const index = calculateDropIndex(e.clientX, e.clientY);
       setDropIndex(index);
       setOverPinsGrid(true, index);
     };
     
     const handleDragLeave = () => {
       setTimeout(() => {
         setDropIndex(null);
         setOverPinsGrid(false);
       }, 100);
     };
     
     const handleDrop = async (e: React.DragEvent) => {
       e.preventDefault();
       
       const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
       const targetIndex = dropIndex ?? pinnedItems.length;
       
       if (data.item.isPinned) {
         // Reorder
         await window.itemsApi.reorderPins(spaceId, data.item.id, targetIndex);
       } else {
         // Pin then reorder
         await window.itemsApi.pin(data.item.id);
         if (targetIndex < pinnedItems.length) {
           await window.itemsApi.reorderPins(spaceId, data.item.id, targetIndex);
         }
       }
       
       setDropIndex(null);
       setOverPinsGrid(false);
       invalidate('pins');
     };
     
     return (
       <div
         ref={gridRef}
         className={styles.pinsGrid}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}
       >
         {pinnedItems.map((pin, i) => (
           <React.Fragment key={pin.id}>
             {dropIndex === i && <DropPlaceholder />}
             <PinnedLinkItem item={pin} />
           </React.Fragment>
         ))}
         {dropIndex === pinnedItems.length && <DropPlaceholder />}
       </div>
     );
   }
   ```

### Manual Testing Checklist

- [ ] Drag link to pins → accepted, shows drop position
- [ ] Drag folder to pins → rejected (not-allowed cursor)
- [ ] Drop → link pinned at position
- [ ] Full grid (15 pins) → new pins rejected
- [ ] Existing pin can still be reordered in full grid

---

## F023: Reorder Pins in Grid

**Priority:** P1 - High  
**Dependencies:** F022  
**Estimated Effort:** 3 hours  
**User Value:** Users can organize their pinned links

### User Story

> As a user, I want to drag pins within the grid to reorder them, so I can prioritize my favorite links.

### Acceptance Criteria

- [ ] Pins are draggable within grid
- [ ] Drop indicator shows between pins
- [ ] Smooth animation on reorder
- [ ] Order persists after refresh

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Pin Draggable | `pinned_links_grid.dart` | 350-420 |
| Reorder Logic | `pinned_links_grid.dart` | 250-260 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/PinnedLinksGrid.tsx
```

### Implementation Steps

1. **Make Pins Draggable**
   ```typescript
   function PinnedLinkItem({ item, spaceId, index }) {
     const handleDragStart = (e: React.DragEvent) => {
       const dragData: DragData = {
         item,
         items: [item],
         spaceId,
         parentId: null,
         sourceIndex: index,
         source: 'sidebar',
         ancestorIds: [],
       };
       
       e.dataTransfer.setData('application/json', JSON.stringify(dragData));
       e.dataTransfer.effectAllowed = 'move';
     };
     
     return (
       <div
         className={styles.pinnedLink}
         draggable
         onDragStart={handleDragStart}
       >
         <img src={item.faviconUrl} alt="" />
         <span>{item.name}</span>
       </div>
     );
   }
   ```

2. **Reorder Already Handled in US-022**
   - Existing pin detection in drop handler
   - Calls `reorderPins` for pinned items

### Manual Testing Checklist

- [ ] Drag pin within grid → shows drop position
- [ ] Drop → pin moves to new position
- [ ] Order persists after refresh
- [ ] Animation smooth

---

## F024: Pinned Link Context Menu

**Priority:** P1 - High  
**Dependencies:** F022  
**Estimated Effort:** 2 hours  
**User Value:** Users can manage pins via right-click

### User Story

> As a user, I want to right-click a pinned link for options like unpin and delete.

### Acceptance Criteria

- [ ] Right-click pin → shows context menu
- [ ] Menu items: Rename, Copy Link, Unpin, Delete
- [ ] Unpin removes from grid but keeps in tree
- [ ] Delete removes entirely

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Pin Context Menu | `pinned_links_grid.dart` | 480-520 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/pinned_links_grid.dart`

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/PinnedLinksGrid.tsx
packages/desktop/src/renderer/App.tsx
```

### Implementation Steps

1. **Add Context Menu to Pinned Links**
   ```typescript
   const getPinContextMenuItems = (item: SpaceItem): ContextMenuItem[] => [
     { id: 'rename', label: 'Rename', icon: 'Edit' },
     { id: 'copy_link', label: 'Copy Link', icon: 'Copy' },
     { id: 'divider', isDivider: true },
     { id: 'unpin', label: 'Unpin', icon: 'PinOff' },
     { id: 'divider2', isDivider: true },
     { id: 'delete', label: 'Delete', icon: 'Trash2', isDestructive: true },
   ];
   
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
         await window.itemsApi.unpin(item.id);
         invalidate('pins');
         break;
       case 'copy_link':
         await window.electronApi.clipboard.writeText(item.path);
         break;
       case 'delete':
         await window.itemsApi.delete(item.id);
         invalidate('pins');
         invalidate(`space-items:${activeSpaceId}`);
         break;
       // ... other actions
     }
   };
   ```

### Manual Testing Checklist

- [ ] Right-click pin → menu appears
- [ ] Unpin → removes from grid, stays in tree
- [ ] Copy Link → URL in clipboard
- [ ] Delete → removes from grid and tree

---

## F025: Smart Drag Preview (Square for Pins)

**Priority:** P2 - Medium  
**Dependencies:** F022  
**Estimated Effort:** 3 hours  
**User Value:** Visual feedback adapts to drop target

### User Story

> As a user, I want the drag preview to change shape when hovering over the pins grid, so I can see how it will appear.

### Acceptance Criteria

- [ ] Normal drag → rectangle preview with name
- [ ] Hover over pins grid → square preview with favicon only
- [ ] Smooth transition between shapes (150ms)

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| SmartDragPreview | `drag_preview_widget.dart` | 10-80 |
| Shape Switch | `drag_preview_widget.dart` | 35-55 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/drag_drop/drag_preview_widget.dart`

### Flutter Code Reference

```dart
// SmartDragPreview (drag_preview_widget.dart:10-80)
class SmartDragPreview extends ConsumerWidget {
  final SpaceItem item;
  final Color accentColor;

  Widget build(BuildContext context, WidgetRef ref) {
    final isOverPins = ref.watch(pinsGridDropActiveProvider);
    
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 150),
      child: isOverPins
          ? _buildSquarePreview()
          : _buildRectanglePreview(),
    );
  }
  
  Widget _buildSquarePreview() {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: accentColor, width: 2),
      ),
      child: Center(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(item.faviconUrl ?? '', width: 32, height: 32),
        ),
      ),
    );
  }
  
  Widget _buildRectanglePreview() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: accentColor, width: 2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(item.type.icon, size: 14),
          const SizedBox(width: 8),
          Text(item.name),
        ],
      ),
    );
  }
}
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/drag-drop/DragPreview.tsx
packages/react-ui/src/components/drag-drop/DragPreview.module.css
```

### Implementation Steps

1. **Update DragPreview to Watch Pins Grid State**
   ```typescript
   export function DragPreview({ items, accentColor }) {
     const { isOverPinsGrid } = useDragDropUiStore();
     
     return (
       <div className={cn(
         styles.dragPreview,
         isOverPinsGrid ? styles.square : styles.rectangle
       )}>
         {isOverPinsGrid ? (
           <SquarePreview item={items[0]} />
         ) : (
           <RectanglePreview items={items} />
         )}
         {items.length > 1 && <CountBadge count={items.length} />}
       </div>
     );
   }
   ```

2. **Add CSS Transitions**
   ```css
   .dragPreview {
     transition: all 150ms ease;
   }
   
   .square {
     width: 56px;
     height: 56px;
     border-radius: 12px;
   }
   
   .rectangle {
     padding: 8px 12px;
     border-radius: 8px;
   }
   ```

### Manual Testing Checklist

- [ ] Drag link → rectangle preview
- [ ] Hover over pins grid → morphs to square
- [ ] Leave pins grid → morphs back to rectangle
- [ ] Transition is smooth (150ms)
