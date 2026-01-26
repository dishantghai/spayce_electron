---
id: F013
title: Drop Target Hit Zones
type: feature
priority: P0
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/drag-drop/DroppableTreeItem.tsx
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/TreeView.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
estimated_hours: 6
---

# F013: Drop Target Hit Zones

## User Story

> As a user, I want to drop items before, after, or inside folders, so I can organize with precision.

## Context

This feature implements the drop target functionality for tree items. When dragging over an item, the cursor position within the item's bounds determines where the dropped item will go:
- **Folders**: Top 20% = before, middle 60% = inside, bottom 20% = after
- **Links/Files**: Top 50% = before, bottom 50% = after

The visual indicator (from F012) updates in real-time as the cursor moves within the hit zones. For "inside" drops on folders, the folder gets a highlight border instead of a line indicator.

## Acceptance Criteria

- [ ] **Folders**: 20% top = before, 60% middle = inside, 20% bottom = after
- [ ] **Links/Files**: 50% top = before, 50% bottom = after
- [ ] Visual feedback changes based on hit zone
- [ ] "Inside" shows folder highlight border (accent color, 2px)
- [ ] "Inside" shows subtle background tint (accent color, 10% opacity)
- [ ] Drop executes at indicated position
- [ ] Cursor shows appropriate effect (move for valid, not-allowed for invalid)

## Technical Implementation

### Components to Create

1. **DroppableTreeItem.tsx** - Wrapper that makes tree items drop targets
   - Props: `item`, `spaceId`, `parentId`, `index`, `level`, `accentColor`, `ancestorIds`, `onDrop`, `children`
   - Calculates hit zone based on cursor Y position
   - Updates dropIndicator state on drag over
   - Handles drop event and calls onDrop callback
   - Shows folder highlight for "inside" position

### Components to Update

1. **TreeItem.tsx**
   - Wrap with DroppableTreeItem
   - Pass onDrop handler
   - Apply folder highlight styles when position is "inside"

2. **TreeView.tsx**
   - Implement handleDrop function to execute move operation
   - Calculate new parent and index based on drop position
   - Call items API to move items

3. **dragDropUiStore.ts**
   - Already has setDropIndicator with position
   - Ensure "inside" position is tracked correctly

### Hit Zone Calculation

```typescript
const calculateDropPosition = (e: React.DragEvent, itemRef: HTMLElement): DropPosition => {
    const rect = itemRef.getBoundingClientRect();
    const yFraction = (e.clientY - rect.top) / rect.height;
    
    const isFolder = item.type === 'folder' || item.type === 'localFolder';
    
    if (isFolder) {
        // Folders: 20% top, 60% middle, 20% bottom
        if (yFraction < 0.2) return 'before';
        if (yFraction > 0.8) return 'after';
        return 'inside';
    } else {
        // Links/files: 50/50 split
        return yFraction < 0.5 ? 'before' : 'after';
    }
};
```

### Drop Handler

```typescript
const handleDrop = async (dragData: DragData, position: DropPosition, targetItem: SpaceItem) => {
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
            newSpaceId: activeSpaceId,
            newIndex,
        });
    }
    
    invalidate(`space-items:${activeSpaceId}`);
};
```

### Design System Tokens

```typescript
// Folder highlight (inside position)
insideBorderWidth: 2px
insideBorderColor: accentColor
insideBackgroundOpacity: 0.1
insideBorderRadius: 8px

// Animation
highlightTransition: 200ms ease-in-out
```

## Flutter Reference

```dart
// DroppableTreeItem.build (draggable_tree_item.dart:176-393)
// Key behaviors:
// - DragTarget<DragData> with onWillAcceptWithDetails, onMove, onLeave, onAcceptWithDetails
// - Hit zone calculation in onWillAcceptWithDetails (lines 191-216)
// - Folder: 20% before, 60% inside, 20% after
// - Links: 50/50 split

// Hit zone calculation (draggable_tree_item.dart:198-216)
DropPosition position;
if (widget.item.type == SpaceItemType.folder) {
    if (localPosition.dy < height * 0.20) {
        position = DropPosition.before;
    } else if (localPosition.dy > height * 0.80) {
        position = DropPosition.after;
    } else {
        position = DropPosition.inside;
    }
} else {
    position = localPosition.dy < height * 0.5
        ? DropPosition.before
        : DropPosition.after;
}

// Visual feedback for inside (draggable_tree_item.dart:368-383)
// - Border: 2px accent color
// - Background: accent color at 10% opacity
// - BorderRadius: 8px
```

## Testing Checklist

### Unit Tests
- [ ] calculateDropPosition returns 'before' for top 20% on folder
- [ ] calculateDropPosition returns 'inside' for middle 60% on folder
- [ ] calculateDropPosition returns 'after' for bottom 20% on folder
- [ ] calculateDropPosition returns 'before' for top 50% on link
- [ ] calculateDropPosition returns 'after' for bottom 50% on link
- [ ] DroppableTreeItem calls onDrop with correct position

### Integration Tests
- [ ] Drag over folder top → indicator shows before
- [ ] Drag over folder middle → folder highlights
- [ ] Drag over folder bottom → indicator shows after
- [ ] Drop inside folder → item moves into folder
- [ ] Drop before item → item moves to position before
- [ ] Drop after item → item moves to position after

### Manual Testing
- [ ] Drag over folder top 20% → "before" indicator
- [ ] Drag over folder middle 60% → folder highlight border
- [ ] Drag over folder bottom 20% → "after" indicator
- [ ] Drag over link top 50% → "before" indicator
- [ ] Drag over link bottom 50% → "after" indicator
- [ ] Drop executes at indicated position
- [ ] Item appears at correct tree position after drop
- [ ] Database updated correctly (persists after refresh)
