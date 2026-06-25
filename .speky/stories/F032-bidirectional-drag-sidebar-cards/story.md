---
id: F032
title: Bidirectional Drag Between Sidebar and Space Cards
type: feature
priority: P1
status: pending
related_specs: []
dependencies:
  - F011
  - F030
affected_files:
  - packages/react-ui/src/components/drag-drop/DroppableSpaceCard.tsx
  - packages/react-ui/src/components/drag-drop/DroppableTreeItem.tsx
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
estimated_hours: 4
---

# F032: Bidirectional Drag Between Sidebar and Space Cards

## User Story

> As a user, I want to drag items from the sidebar to space cards and from space cards to the sidebar, so I can move items between any visible space regardless of which view I'm using.

## Context

This feature enables seamless drag-and-drop between the sidebar tree view and space cards on the Spaces Screen. Users can:
1. Drag from sidebar → drop on a different space card
2. Drag from space card → drop in sidebar (if showing a different space)

The key constraint is that you cannot drop an item into its own space (same space ID). This prevents confusing "move to same location" operations.

## Flutter Reference

The Flutter implementation accepts drops from any source as long as the space ID differs:

```dart
// DroppableSpaceCard accepts any source (droppable_space_card.dart:20-35)
onWillAcceptWithDetails: (details) {
  // Accept if from different space, regardless of source
  return details.data.spaceId != widget.space.id;
}
```

The sidebar's DroppableTreeItem similarly accepts drops from space cards:
```dart
// draggable_tree_item.dart - accepts drops from any source
// Uses DragData.source to track origin but accepts regardless
```

**Key Flutter Files:**
- `droppable_space_card.dart:20-35` - Accept logic
- `draggable_tree_item.dart:127-457` - Sidebar drop handling

## Acceptance Criteria

- [ ] Drag item from sidebar → drop in different space card → item moves to that space
- [ ] Drag item from space card → drop in sidebar tree (different space) → item moves
- [ ] Cannot drop from sidebar to its own space card (same space ID)
- [ ] Cannot drop from space card to sidebar showing same space
- [ ] Drop indicators show correctly in both directions
- [ ] Works with multi-selection (all selected items move)
- [ ] Both source and target views update after drop
- [ ] Drag preview shows correctly regardless of source

## Technical Implementation

### Update DragData Source Tracking

```typescript
// In dragDropUiStore.ts
interface DragData {
  item: SpaceItem;
  items: SpaceItem[];
  spaceId: string;
  parentId: string | null;
  sourceIndex: number;
  source: 'sidebar' | 'spaceCard';  // Track origin
  ancestorIds: string[];
}

// When starting drag from sidebar
startDrag({
  items: selectedItems,
  spaceId: activeSpaceId,
  parentId: parentFolderId,
  source: 'sidebar',
  ancestorIds: getAncestorIds(item),
});

// When starting drag from space card
startDrag({
  items: selectedItems,
  spaceId: cardSpaceId,
  parentId: parentFolderId,
  source: 'spaceCard',
  ancestorIds: getAncestorIds(item),
});
```

### Update DroppableSpaceCard

```typescript
// Accept drops from sidebar or other cards, but not same space
const canAccept = useMemo(() => {
  if (!dragData) return false;
  
  // Cannot drop into same space
  if (dragData.spaceId === space.id) return false;
  
  return true;
}, [dragData, space.id]);

const handleDragOver = (e: React.DragEvent) => {
  if (!canAccept) {
    e.dataTransfer.dropEffect = 'none';
    return;
  }
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  setIsHovering(true);
};
```

### Update Sidebar DroppableTreeItem

```typescript
// Accept drops from space cards to sidebar
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  
  if (!dragData) return;
  
  // Check if this is a cross-space drop
  const isCrossSpaceDrop = dragData.spaceId !== activeSpaceId;
  
  // For cross-space drops, accept at any valid position
  // For same-space drops, use existing validation
  if (isCrossSpaceDrop) {
    // Accept the drop - will move to this space
    e.dataTransfer.dropEffect = 'move';
  } else {
    // Same space - use existing reorder validation
    if (!isValidDrop(dragData, item, ancestorIds, index, position)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
  }
  
  const position = calculateDropPosition(e, item);
  setDropIndicator({ targetId: item.id, position, spaceId: activeSpaceId });
};
```

### Handle Cross-Source Drops

```typescript
// In useMoveItem hook or similar
const handleDrop = async (dragData: DragData, target: DropTarget) => {
  const isCrossSpace = dragData.spaceId !== target.spaceId;
  
  for (const item of dragData.items) {
    await moveItem({
      itemId: item.id,
      newSpaceId: target.spaceId,
      newParentId: target.parentId,
      newIndex: target.index,
    });
  }
  
  // Invalidate affected spaces
  invalidate(`space-items:${dragData.spaceId}`);
  if (isCrossSpace) {
    invalidate(`space-items:${target.spaceId}`);
  }
};
```

### Visual Feedback

Both sidebar and space cards should show appropriate visual feedback:

```typescript
// Sidebar shows drop indicators when receiving card drags
// Space cards show border highlight when receiving sidebar drags

// In sidebar TreeItem
const showDropIndicator = dropIndicator?.targetId === item.id && 
  dropIndicator?.spaceId === activeSpaceId;

// In SpaceCard
const showCardHighlight = isHovering && canAccept;
```

### Design System Tokens

```typescript
// Same tokens as existing drag-drop
dropIndicatorColor: 'var(--accent-color)'
dropIndicatorHeight: '2px'
cardDropBorder: '2px solid var(--accent-color)'
cardDropShadow: '0 0 12px 2px rgba(accent, 0.3)'
```

## Testing Checklist

### Unit Tests

- [ ] DragData includes source field
- [ ] DroppableSpaceCard rejects same-space drops
- [ ] DroppableSpaceCard accepts different-space drops
- [ ] DroppableTreeItem accepts cross-space drops
- [ ] canAccept logic correct for all scenarios

### Integration Tests

- [ ] Sidebar → different space card: item moves
- [ ] Space card → sidebar (different space): item moves
- [ ] Sidebar → same space card: rejected (no highlight)
- [ ] Space card → same space sidebar: rejected
- [ ] Multi-select works in both directions
- [ ] Both views update after drop

### Manual Testing

- [ ] Drag from sidebar → hover different space card → highlight shows
- [ ] Drop on card → item moves to that space
- [ ] Drag from card → hover sidebar (different space) → indicators show
- [ ] Drop in sidebar → item moves to sidebar's space
- [ ] Drag from sidebar → hover same space card → NO highlight
- [ ] Drag from card → hover same space sidebar → NO indicators
- [ ] Multi-select drag works both directions
- [ ] Source view updates (item removed)
- [ ] Target view updates (item added)
- [ ] Drag preview consistent regardless of source
