---
id: F020
title: Multi-Select Drag
type: feature
priority: P1
status: pending
related_specs:
  - "013"
affected_files:
  - packages/react-ui/src/components/drag-drop/DraggableTreeItem.tsx
  - packages/react-ui/src/components/drag-drop/DragPreview.tsx
  - packages/react-ui/src/components/drag-drop/DragPreview.module.css
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/TreeView.tsx
  - packages/react-ui/src/stores/selectionStore.ts
  - packages/react-ui/src/stores/dragDropUiStore.ts
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/desktop/src/renderer/App.tsx
estimated_hours: 4
---

# F020: Multi-Select Drag

## User Story

> As a user, I want to drag all selected items when I drag one of them, so I can move multiple items efficiently.

## Context

This feature extends the existing drag-drop functionality (F011-F016) to support dragging multiple selected items at once. When the user has multiple items selected (via Ctrl+Click or Shift+Click) and drags one of them, ALL selected items should move together.

The drag preview shows a stacked card effect with a count badge indicating how many items are being dragged. On drop, all items are moved to the target position while maintaining their relative order.

## Acceptance Criteria

- [ ] Drag selected item → all selected items move together
- [ ] Drag preview shows stacked cards effect for multiple items
- [ ] Drag preview shows count badge with number of items
- [ ] Drop moves all items to target position
- [ ] Maintains relative order of items (sorted by original sortOrder)
- [ ] Selection cleared after successful drop
- [ ] Dragging unselected item clears selection and drags only that item
- [ ] Flash animation on first dropped item
- [ ] Works with both Ctrl+Click and Shift+Click selections

## Technical Implementation

### Files to Update

1. **DraggableTreeItem.tsx** - Pass selected items to drag data
2. **DragPreview.tsx** - Already supports multi-item preview (verify)
3. **TreeItem.tsx** - Collect selected items for drag
4. **TreeView.tsx** - Pass selection state to TreeItem
5. **Sidebar.tsx** - Handle multi-item drop in move handler
6. **selectionStore.ts** - Add helper methods for drag integration
7. **dragDropUiStore.ts** - Ensure DragData supports multiple items

### Selection Store Integration

```typescript
// In selectionStore.ts - add/verify these methods

// Get drag payload based on what's being dragged
getDragPayload: (draggedItemId: string) => {
    const state = get();
    const isSelected = state.selectedIds.has(draggedItemId);
    
    if (isSelected && state.selectedIds.size > 1) {
        // Dragging a selected item with multi-selection active
        return {
            items: Array.from(state.selectedIds),
            isMultiSelection: true,
            selectionCount: state.selectedIds.size,
        };
    }
    
    // Dragging unselected item or single selection
    return {
        items: [draggedItemId],
        isMultiSelection: false,
        selectionCount: 1,
    };
},

// Called when drag starts
onDragInitiated: (draggedItemId: string) => {
    const state = get();
    const isSelected = state.selectedIds.has(draggedItemId);
    
    if (!isSelected) {
        // Dragging unselected item - clear selection
        set({
            spaceId: null,
            selectedIds: new Set(),
            lastSelectedId: null,
        });
    }
},

// Called when drag completes
onDragCompleted: (success: boolean, wasMultiSelection: boolean) => {
    if (success && wasMultiSelection) {
        // Clear selection after successful multi-drag
        set({
            spaceId: null,
            selectedIds: new Set(),
            lastSelectedId: null,
        });
    }
},
```

### TreeItem Updates

```typescript
// In TreeItem.tsx
import { useSelectionStore } from '../stores/selectionStore';

// Get selected items for drag
const { selectedIds, spaceId: selectionSpaceId } = useSelectionStore();
const isMultiSelected = selectionSpaceId === spaceId && selectedIds.has(item.id);

// Collect selected items if this item is selected
const selectedItems = useMemo(() => {
    if (!isMultiSelected || selectedIds.size <= 1) {
        return undefined;
    }
    // Get actual SpaceItem objects for selected IDs
    // This requires access to all items - pass from TreeView
    return getItemsByIds(allItems, Array.from(selectedIds));
}, [isMultiSelected, selectedIds, allItems]);

// Pass to DraggableTreeItem
<DraggableTreeItem
    item={item}
    spaceId={spaceId}
    parentId={parentId}
    index={index}
    level={depth}
    accentColor={accentColor}
    ancestorIds={ancestorIds}
    selectedItems={selectedItems}
    dragSource={dragDropContext}
>
```

### DraggableTreeItem Updates

```typescript
// In DraggableTreeItem.tsx
const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Check if this is a multi-selection drag
    const selectionStore = useSelectionStore.getState();
    selectionStore.onDragInitiated(item.id);
    
    // Get items to drag (multi-select or single)
    const itemsToDrag = selectedItems && selectedItems.length > 0 
        ? selectedItems 
        : [item];
    
    const dragDataPayload: DragData = {
        item,
        items: itemsToDrag,
        spaceId,
        parentId,
        sourceIndex: index,
        source: dragSource,
        ancestorIds,
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragDataPayload));
    e.dataTransfer.effectAllowed = 'move';
    
    // Create drag image
    if (dragPreviewRef.current) {
        e.dataTransfer.setDragImage(dragPreviewRef.current, -16, -8);
    }
    
    setIsThisDragging(true);
    startDrag(dragDataPayload);
}, [item, selectedItems, spaceId, parentId, index, dragSource, ancestorIds, startDrag]);
```

### Drop Handler (Sidebar.tsx)

```typescript
// In Sidebar.tsx - handleTreeItemDrop
const handleTreeItemDrop = async (
    dragData: DragData,
    targetId: string,
    position: DropPosition
) => {
    const targetItem = findItemById(items, targetId);
    if (!targetItem) return;
    
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
    
    // Sort items by original sortOrder to maintain relative order
    const sortedItems = [...dragData.items].sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Move all items
    for (let i = 0; i < sortedItems.length; i++) {
        await window.itemsApi.move(sortedItems[i].id, {
            newParentId,
            newSpaceId: activeSpaceId,
            newIndex: baseIndex + i,
        });
    }
    
    // Clear multi-selection after successful drop
    const wasMultiSelection = dragData.items.length > 1;
    useSelectionStore.getState().onDragCompleted(true, wasMultiSelection);
    
    // Flash first item
    useDragDropUiStore.getState().flashItem(sortedItems[0].id);
    
    // Refresh data
    invalidate(`space-items:${activeSpaceId}`);
};
```

### Utility Function

```typescript
// In utils/spaceItems.ts or treeUtils.ts
export function getItemsByIds(
    items: SpaceItem[],
    ids: string[]
): SpaceItem[] {
    const result: SpaceItem[] = [];
    const idSet = new Set(ids);
    
    function collect(nodes: SpaceItem[]) {
        for (const item of nodes) {
            if (idSet.has(item.id)) {
                result.push(item);
            }
            if (item.children && item.children.length > 0) {
                collect(item.children);
            }
        }
    }
    
    collect(items);
    return result;
}
```

## Flutter Reference

```dart
// draggable_tree_item.dart:42-68
@override
Widget build(BuildContext context) {
    // Get items to drag (multi-select or single)
    final itemsToDrag = widget.selectedItems ?? [widget.item];
    final isMultiDrag = itemsToDrag.length > 1;
    
    final dragData = DragData(
        item: widget.item,
        items: itemsToDrag,
        spaceId: widget.spaceId,
        parentId: widget.parentId,
        sourceIndex: widget.index,
    );
    
    final feedback = Transform.translate(
        offset: const Offset(16, 8),
        child: isMultiDrag
            ? MultiItemDragPreview(
                items: itemsToDrag,
                accentColor: widget.accentColor,
              )
            : SmartDragPreview(
                item: widget.item,
                accentColor: widget.accentColor,
              ),
    );
    
    // ...
}

// drag_preview_widget.dart:212-266 - MultiItemDragPreview
class MultiItemDragPreview extends StatelessWidget {
    final List<SpaceItem> items;
    final Color accentColor;
    
    @override
    Widget build(BuildContext context) {
        return SizedBox(
            width: 280,
            height: 60,
            child: Stack(
                children: [
                    // Background cards for stacked effect
                    if (items.length > 2)
                        Positioned(left: 8, top: 8, child: _buildStackedCard(opacity: 0.3)),
                    if (items.length > 1)
                        Positioned(left: 4, top: 4, child: _buildStackedCard(opacity: 0.5)),
                    // Main item with count badge
                    Positioned(
                        left: 0,
                        top: 0,
                        child: DragPreviewWidget(
                            item: items.first,
                            accentColor: accentColor,
                            itemCount: items.length,
                        ),
                    ),
                ],
            ),
        );
    }
}
```

## Design System Tokens

```typescript
// Multi-item drag preview tokens
const MULTI_DRAG_TOKENS = {
    // Stacked cards
    stackOffset: 4,           // px offset for each stacked card
    maxVisibleStacks: 2,      // Show max 2 background cards
    stackOpacity1: 0.5,       // First background card
    stackOpacity2: 0.3,       // Second background card
    
    // Count badge
    badgePadding: '2px 6px',
    badgeFontSize: 11,
    badgeFontWeight: 600,
    badgeBorderRadius: 10,
    badgeColor: 'white',
    badgeBackground: accentColor,
    
    // Container
    containerWidth: 280,
    containerHeight: 60,
};
```

## Testing Checklist

### Unit Tests

- [ ] `getDragPayload` returns multi-selection when item is selected
- [ ] `getDragPayload` returns single item when not selected
- [ ] `onDragInitiated` clears selection when dragging unselected item
- [ ] `onDragCompleted` clears selection after successful multi-drag
- [ ] `getItemsByIds` finds items at any nesting level
- [ ] `getItemsByIds` returns items in correct order

### Integration Tests

- [ ] Multi-select → drag one → all items in drag data
- [ ] Drag unselected item → selection cleared, single item dragged
- [ ] Drop multi-selection → all items moved
- [ ] Items maintain relative order after drop
- [ ] Selection cleared after successful drop
- [ ] Flash animation on first dropped item

### Manual Testing

- [ ] Ctrl+Click multiple items → drag one → all move together
- [ ] Shift+Click range → drag → all in range move
- [ ] Drag preview shows stacked cards
- [ ] Drag preview shows count badge
- [ ] Drop inside folder → all items moved into folder
- [ ] Drop between items → all items inserted at position
- [ ] Relative order preserved after drop
- [ ] Selection cleared after drop
- [ ] Drag unselected item → only that item moves

## Dependencies

- F011 (Drag Tree Items) - Base drag functionality
- F017 (Ctrl+Click Toggle Selection) - Selection logic
- F018 (Shift+Click Range Selection) - Range selection
- F019 (Multi-Selection Visual Feedback) - Visual feedback

## Notes

- The existing DragPreview.tsx already has MultiItemPreview component
- The existing selectionStore.ts already has getDragPayload and related methods
- Main work is wiring up TreeItem to pass selected items to DraggableTreeItem
- Drop handler needs to iterate and move all items while maintaining order
- Consider transaction/batch API for moving multiple items (future optimization)
