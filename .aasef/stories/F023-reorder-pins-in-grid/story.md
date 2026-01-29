---
id: F023
title: Reorder Pins in Grid
type: feature
priority: P1
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/PinnedLinksGrid.tsx
  - packages/react-ui/src/components/PinnedLinksGrid.module.css
  - packages/react-ui/src/stores/dragDropUiStore.ts
  - packages/react-ui/src/hooks/mutations/useReorderPins.ts
estimated_hours: 3
---

# F023: Reorder Pins in Grid

## User Story

> As a user, I want to drag pins within the grid to reorder them, so I can prioritize my favorite links.

## Context

This feature enables users to reorder their pinned links within the pins grid by dragging them to new positions. The UX should follow the Arc Browser pattern where items visually shift in real-time to make space for the dragged item, creating an intuitive and smooth reordering experience.

This builds directly on F022 (Drag to Pins Grid) which establishes the drop target infrastructure.

## Key UX Pattern: Arc Browser Real-time Reorder

When dragging a pin within the grid:
1. The dragged item becomes semi-transparent (ghost) at its original position
2. A visual preview appears at the drop position
3. **Critically**: Other pins animate/shift in real-time to make space for the drop position
4. The grid layout dynamically adjusts as the user moves the drag cursor
5. On drop, the item animates to its new position
6. On failure/cancel, all items return to their original positions

See Image 2 in the implementation plan for visual reference - the frosted glass preview with items shifting around it.

## Acceptance Criteria

- [ ] Pins are draggable within the grid
- [ ] Dragged pin shows ghost (0.3 opacity) at original position
- [ ] Drop preview card appears at calculated drop position
- [ ] Other pins visually shift/reorder in real-time as drag moves
- [ ] Smooth 150ms animation on reorder transitions
- [ ] Drop updates backend transactionally
- [ ] On failure, all pins return to original positions
- [ ] Order persists after page refresh
- [ ] Works seamlessly with F022 (external drops)

## Technical Implementation

### Making Pins Draggable

Each pin card becomes a draggable element that:
1. Creates DragData on drag start (with `isPinned: true` flag)
2. Shows ghost opacity at original position
3. Updates store: `setOverPinsGrid(true)`
4. Notifies grid of internal drag for different handling

### Real-time Visual Reordering

The key UX feature is that pins shift in real-time. This requires:

1. **Optimistic UI State**: Track `visualOrder` separately from `actualOrder`
2. **On drag move**: Recalculate visual positions based on drop index
3. **Animate transitions**: Use CSS transitions for smooth movement
4. **On drop**: Commit to backend, then update actual order
5. **On failure**: Reset visual order to actual order

```typescript
interface PinsGridState {
  actualOrder: SpaceItem[];      // Backend truth
  visualOrder: SpaceItem[];      // UI display order
  draggingId: string | null;     // Item being dragged
  dropIndex: number | null;      // Current drop position
}

// When drag moves, recalculate visual order
const recalculateVisualOrder = (
  actualOrder: SpaceItem[],
  draggingId: string,
  dropIndex: number
): SpaceItem[] => {
  const items = actualOrder.filter(item => item.id !== draggingId);
  const draggingItem = actualOrder.find(item => item.id === draggingId)!;
  
  // Insert at new position
  const result = [...items];
  result.splice(dropIndex, 0, draggingItem);
  return result;
};
```

### Components to Update

1. **PinnedLinksGrid.tsx**
   - Add internal drag state tracking
   - Make each pin card draggable
   - Track visual order vs actual order
   - Animate transitions on visual order change

2. **PinnedLinkCard (internal component)**
   ```typescript
   interface PinnedLinkCardProps {
     item: SpaceItem;
     spaceId: string;
     index: number;
     spaceColor: string;
     isBeingDragged: boolean;
     onDragStart: (item: SpaceItem, index: number) => void;
     onDragEnd: () => void;
   }
   
   function PinnedLinkCard({
     item,
     spaceId,
     index,
     spaceColor,
     isBeingDragged,
     onDragStart,
     onDragEnd,
   }: PinnedLinkCardProps) {
     const handleDragStart = (e: React.DragEvent) => {
       const dragData: DragData = {
         item: { ...item, isPinned: true },
         items: [item],
         spaceId,
         parentId: null,
         sourceIndex: index,
         source: 'sidebar',
         ancestorIds: [],
       };
       
       e.dataTransfer.setData('application/json', JSON.stringify(dragData));
       e.dataTransfer.effectAllowed = 'move';
       
       onDragStart(item, index);
     };
     
     return (
       <div
         draggable
         className={cn(
           styles.card,
           isBeingDragged && styles.dragging
         )}
         onDragStart={handleDragStart}
         onDragEnd={onDragEnd}
         style={{
           opacity: isBeingDragged ? 0.3 : 1,
           transition: 'all 150ms ease',
         }}
       >
         {/* card content */}
       </div>
     );
   }
   ```

### CSS for Smooth Transitions

```css
.card {
  /* existing styles */
  transition: transform 150ms ease, opacity 150ms ease;
}

.card.dragging {
  opacity: 0.3;
}

.grid {
  /* Grid needs to allow items to animate positions */
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Visual reorder animation happens via order changes or transforms */
.card[data-animating="true"] {
  transition: transform 150ms ease;
}
```

### Drop Preview Integration

The drop preview card (from F022) shows at the drop position:
- During internal reorder: preview shows the dragged pin's favicon
- Grid layout shifts to make room for preview
- Preview uses accent color border like in Image 2

### Backend Integration

Reorder is handled by the same `reorderPins` mutation from F022:

```typescript
const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  
  const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
  const targetIndex = dropIndex ?? visualOrder.length;
  
  // Only reorder if position changed
  if (data.sourceIndex !== targetIndex) {
    try {
      await reorderPins(spaceId, data.item.id, targetIndex);
      // Success: invalidate to get fresh order from backend
      invalidate('pins');
    } catch (error) {
      // Failure: reset visual order to actual order
      setVisualOrder(actualOrder);
      console.error('Failed to reorder pins:', error);
    }
  }
  
  clearDragState();
};
```

### Design System Tokens

```typescript
// Reorder animations
const REORDER_TIMING = {
  transition: '150ms ease',   // SpayceAnimations.hover
  ghostOpacity: 0.3,          // Lower than tree drag (0.4)
};

// Preview card (matches pin card + accent highlight)
const PREVIEW_CARD = {
  size: 48,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: spaceColor,
  backgroundColor: `${spaceColor}33`,  // 20% opacity
};
```

## Flutter Reference

```dart
// Pin card draggable (pinned_links_grid.dart:574-619)
// - Uses Draggable<DragData> 
// - feedback: Transform.scale(1.1) of card
// - childWhenDragging: Opacity(0.3)
// - onDragStarted: HapticFeedback.mediumImpact(), notify parent
// - onDragEnd/Canceled: clear state

// Grid reorder logic (pinned_links_grid.dart:304-360)
// - _buildCleanGrid builds visual order with preview inserted
// - Items shift based on _dropTargetIndex
// - Uses Wrap widget for automatic flow layout
// - Preview card inserted at drop position

// Real-time visual feedback
// - gridItems list is rebuilt on each _dropTargetIndex change
// - AnimatedContainer provides smooth transitions
// - Preview card shows what item will look like at that position
```

## Testing Checklist

### Unit Tests
- [ ] recalculateVisualOrder correctly reorders items
- [ ] Drag start sets isBeingDragged state
- [ ] Drag end clears all drag state
- [ ] Drop calls reorderPins with correct index
- [ ] Failed reorder resets visual order

### Integration Tests
- [ ] Drag pin within grid → visual order updates in real-time
- [ ] Drop pin → backend updated, order persists
- [ ] Drag cancel → items return to original positions
- [ ] External drop (F022) still works alongside internal reorder

### Manual Testing
- [ ] Drag pin → ghost at original position
- [ ] Move over grid → other pins shift smoothly
- [ ] Drop → pin settles at new position
- [ ] Refresh page → order persisted
- [ ] Multiple rapid reorders → all animate smoothly
- [ ] Combined with F022: drag from sidebar then reorder

## Dependencies

- F022: Drag to Pins Grid (provides drop target infrastructure)
- F011: Drag Tree Items (provides DragData structure)
