---
id: F022
title: Drag to Pins Grid
type: feature
priority: P1
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/PinnedLinksGrid.tsx
  - packages/react-ui/src/components/PinnedLinksGrid.module.css
  - packages/react-ui/src/stores/dragDropUiStore.ts
  - packages/react-ui/src/hooks/usePinnedItems.ts
  - packages/react-ui/src/hooks/mutations/usePinItem.ts
  - packages/react-ui/src/hooks/mutations/useReorderPins.ts
  - packages/core/src/application/use-cases/pins/PinItemUseCase.ts
  - packages/core/src/application/use-cases/pins/ReorderPinsUseCase.ts
  - packages/infrastructure/src/persistence/sqlite/SqliteSpaceItemsRepository.ts
estimated_hours: 6
---

# F022: Drag to Pins Grid

## User Story

> As a user, I want to drag a link to the pins grid to pin it, so I can quickly access my favorite links.

## Context

The pins grid is a 5x3 grid (max 15 pins) at the top of the sidebar that displays pinned favorite links. Users should be able to drag links from the sidebar tree to this grid to pin them. When dragging over the grid, the drop position should be visualized between existing pins.

This feature builds upon the existing drag infrastructure (F011-F016) and adds drop target functionality to the PinnedLinksGrid component.

## Acceptance Criteria

- [ ] Only links can be dragged to pins grid
- [ ] Folders rejected with not-allowed cursor
- [ ] Drop position indicator shows between existing pins
- [ ] Max 15 pins enforced (5x3 grid) - reject if full
- [ ] Empty grid shows "Drop links here to pin" hint that highlights on drag over
- [ ] Already pinned links can be reordered within the grid (handled in F023)
- [ ] Grid border highlights with space accent color when valid drop target
- [ ] Drop creates pin and optionally reorders to drop position
- [ ] Invalidates pins cache after successful pin

## Technical Implementation

### Drop Target Behavior

The PinnedLinksGrid becomes a unified drop target (like Flutter implementation) that:
1. Validates incoming drag data (only links, respects max pins)
2. Calculates drop index based on mouse position in grid
3. Shows visual preview of where the pin will appear
4. On drop: pins the item, then reorders if not at end

### Components to Update

1. **PinnedLinksGrid.tsx** - Add drop target functionality
   - Implement drag event handlers (onDragEnter, onDragOver, onDragLeave, onDrop)
   - Calculate drop index from mouse position in 5-column grid
   - Show drop preview card at calculated position
   - Validate drag data (links only, max pins check)
   - Update `dragDropUiStore.setOverPinsGrid()` for smart preview

2. **PinnedLinksGrid.module.css** - Add drop target styles
   - Highlight state with accent color border
   - Drop preview card styling
   - Transition animations

3. **dragDropUiStore.ts** - Already has `isOverPinsGrid` and `pinsDropIndex` state

### Hooks to Create/Update

1. **usePinItem.ts** - Mutation hook for pinning items
   ```typescript
   export function usePinItem() {
     const invalidate = useInvalidation();
     
     const pinItem = useCallback(async (itemId: string) => {
       const result = await window.spacesApi.pinItem(itemId);
       if (result.ok) {
         invalidate('pins');
         invalidate('space-items');
       }
       return result;
     }, [invalidate]);
     
     return { pinItem };
   }
   ```

2. **useReorderPins.ts** - Mutation hook for reordering pins
   ```typescript
   export function useReorderPins() {
     const invalidate = useInvalidation();
     
     const reorderPins = useCallback(async (
       spaceId: string,
       itemId: string,
       newIndex: number
     ) => {
       const result = await window.spacesApi.reorderPins(spaceId, itemId, newIndex);
       if (result.ok) {
         invalidate('pins');
       }
       return result;
     }, [invalidate]);
     
     return { reorderPins };
   }
   ```

### Domain/Application Layer

1. **PinItemUseCase.ts**
   - Validates item exists and is a link
   - Sets `isPinned = true` and assigns `pinnedIndex`
   - Emits `ItemPinned` domain event

2. **ReorderPinsUseCase.ts**
   - Validates item is pinned
   - Updates `pinnedIndex` for affected items (shift others)
   - Uses transaction for atomic reorder

### Repository Updates

**SqliteSpaceItemsRepository.ts** - Add methods:
- `pinItem(itemId: string): Promise<void>`
- `unpinItem(itemId: string): Promise<void>`
- `reorderPins(spaceId: string, itemId: string, newIndex: number): Promise<void>`
- `getPinnedItems(spaceId: string): Promise<SpaceItemEntity[]>`

### Drop Index Calculation

```typescript
const calculateDropIndex = (
  clientX: number, 
  clientY: number, 
  gridRect: DOMRect,
  pinnedCount: number
): number => {
  const CARD_SIZE = 48;
  const SPACING = 8;
  const COLUMNS = 5;
  const PADDING = 6;
  
  const cellWidth = CARD_SIZE + SPACING;
  const cellHeight = CARD_SIZE + SPACING;
  
  // Adjust for padding
  const adjustedX = clientX - gridRect.left - PADDING;
  const adjustedY = clientY - gridRect.top - PADDING;
  
  // Calculate column and row (snap to nearest position)
  const col = Math.floor((adjustedX + cellWidth / 2) / cellWidth);
  const row = Math.floor((adjustedY + cellHeight / 2) / cellHeight);
  
  // Clamp to valid range
  const clampedCol = Math.max(0, Math.min(col, COLUMNS - 1));
  const clampedRow = Math.max(0, Math.min(row, 2)); // max 3 rows
  
  return Math.min(clampedRow * COLUMNS + clampedCol, pinnedCount);
};
```

### Design System Tokens

```typescript
// Grid dimensions
const PINNED_GRID = {
  cardSize: 48,        // SpayceSpacing-derived
  spacing: 8,          // SpayceSpacing.sm
  columns: 5,
  maxPins: 15,         // 5×3
  padding: 6,
  borderRadius: 8,     // SpayceRadius.md
};

// Drop target highlight
dropTargetBorder: `2px solid ${spaceColor}`,     // space accent
dropTargetBackground: `${spaceColor}08`,          // 5% opacity
dropTargetTransition: '200ms ease',

// Drop preview card (matches pin card)
previewBorder: `2px solid ${spaceColor}`,
previewBackground: `${spaceColor}33`,             // 20% opacity
```

## Flutter Reference

```dart
// PinnedLinksGrid drop handling (pinned_links_grid.dart:87-225)
// Key behaviors:
// - onWillAcceptWithDetails: validates link type, max pins check
// - onMove: calculates drop index, sets pinsGridDropActiveProvider
// - onLeave: clears drag state with 200ms debounce
// - onAcceptWithDetails: pins item, reorders if needed, invalidates providers

// Drop index calculation (pinned_links_grid.dart:282-301)
// - Uses card size + spacing for cell dimensions
// - Rounds to nearest cell position for better UX
// - Clamps to valid range (0 to itemCount)

// Preview card (pinned_links_grid.dart:362-386)
// - 48x48 with accent color border
// - Shows favicon preview at drop position
// - Animated with 150ms duration
```

## Testing Checklist

### Unit Tests
- [ ] calculateDropIndex returns correct index for various positions
- [ ] canAcceptDrop returns true for links, false for folders
- [ ] canAcceptDrop returns false when at max pins (15)
- [ ] canAcceptDrop returns true for reordering even at max pins
- [ ] Drop handler calls pinItem use case
- [ ] Drop handler calls reorderPins when not at end position

### Integration Tests
- [ ] Drag link over grid → store updates isOverPinsGrid
- [ ] Drag folder over grid → not-allowed cursor, no highlight
- [ ] Drop link → item appears in pins
- [ ] Drop at specific position → item at correct index
- [ ] Full grid → new link rejected, existing pins can reorder

### Manual Testing
- [ ] Drag link from sidebar → grid highlights with accent border
- [ ] Drop position indicator appears between pins
- [ ] Drag folder → cursor shows not-allowed
- [ ] Drop link → appears as pinned, reflected in grid
- [ ] Empty grid → shows hint, highlights on drag over
- [ ] 15 pins → new links rejected with visual feedback
- [ ] Order persists after page refresh

## Dependencies

- F011: Drag Tree Items (provides DragData and drag infrastructure)
- F013: Drop Target Hit Zones (provides drop position calculation patterns)

## IPC Bridge Requirements

Add to preload/bridge:
```typescript
spacesApi: {
  pinItem: (itemId: string) => ipcRenderer.invoke('spaces:pinItem', itemId),
  unpinItem: (itemId: string) => ipcRenderer.invoke('spaces:unpinItem', itemId),
  reorderPins: (spaceId: string, itemId: string, newIndex: number) => 
    ipcRenderer.invoke('spaces:reorderPins', spaceId, itemId, newIndex),
  getPinnedItems: (spaceId: string) => 
    ipcRenderer.invoke('spaces:getPinnedItems', spaceId),
}
```
