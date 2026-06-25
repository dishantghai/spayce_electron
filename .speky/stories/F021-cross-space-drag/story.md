---
id: F021
title: Cross-Space Drag via Bottom Bar
type: feature
priority: P1
status: completed
related_specs: []
affected_files:
  - packages/react-ui/src/components/BottomBar.tsx
  - packages/react-ui/src/components/drag-drop/DroppableSpaceIcon.tsx
  - packages/desktop/src/renderer/App.tsx
  - packages/react-ui/src/stores/dragDropUiStore.ts
estimated_hours: 6
actual_hours: 6
completed_date: 2026-01-29
---

# F021: Cross-Space Drag via Bottom Bar

## User Story

> As a user, I want to drag items to a different space icon in the bottom bar, so I can reorganize content across spaces.

## Context

Users can drag items from the sidebar tree and drop them onto space icons in the bottom bar to move items between spaces. When hovering over a space icon for 500ms, the app automatically switches to that space to show the destination. This provides a quick way to reorganize content across different spaces.

## Acceptance Criteria

- ✅ Drag over space icon in bottom bar → icon highlights
- ✅ Hover 500ms → switches to that space (shows destination)
- ✅ Drop → moves item to target space root
- ✅ Cannot drop to same space (no effect)
- ✅ Works with multi-selection

## Implementation Details

### Components Created
- **DroppableSpaceIcon**: Wrapper component for space icons in bottom bar
  - Handles drag enter/leave/drop events
  - Auto-switch timer (500ms hover)
  - Visual feedback (highlight on hover)
  - Prevents drops to same space

### Integration Points
- **BottomBar**: Updated to use DroppableSpaceIcon for each space
- **App.tsx**: handleItemDrop detects cross-space drops and handles move
- **dragDropUiStore**: Provides drag state for validation

### Key Features
1. **Auto-Switch on Hover**: After 500ms hover, switches to target space
2. **Visual Feedback**: Space icon highlights when valid drop target
3. **Same-Space Prevention**: No highlight or drop allowed for source space
4. **Multi-Select Support**: All selected items move together

## Technical Implementation

### Cross-Space Move Logic
```typescript
// In App.tsx handleItemDrop
const isCrossSpaceDrop = dragData.spaceId !== spaceId;
if (isCrossSpaceDrop) {
  // Move items from source space to target space
  for (const item of itemsToMove) {
    await itemsApi.move(item.id, targetSpaceId, targetParentId, position);
  }
}
```

### Auto-Switch Timer
```typescript
// In DroppableSpaceIcon
const [activateTimer, setActivateTimer] = useState<NodeJS.Timeout | null>(null);

const handleDragEnter = () => {
  if (dragData?.spaceId === space.id) return; // Same space
  
  setIsHovering(true);
  
  // Auto-switch after 500ms
  const timer = setTimeout(() => {
    onSelect(); // Switch to this space
  }, 500);
  
  setActivateTimer(timer);
};
```

## Testing

### Manual Testing Completed
- ✅ Drag item over different space icon → icon highlights
- ✅ Hover 500ms → switches to that space
- ✅ Drop → item moves to target space root
- ✅ Same space → no highlight, no drop
- ✅ Multi-select drag works across spaces

### Integration Tests
- Cross-space move updates both source and target space
- Item removed from source space tree
- Item appears in target space root
- Multi-selection moves all items together

## Dependencies

- F011: Drag Tree Items (provides drag infrastructure)
- F013: Tree View (provides tree structure)
- F030: Cross-Space Drops (backend support)

## Related Stories

- F030: Cross-Space Drops (backend implementation)
- F032: Bidirectional Drops (sidebar ↔ space cards)

## Notes

This feature was implemented as part of the Phase 5 drag-drop work. The DroppableSpaceIcon component provides a clean abstraction for handling drops on space icons, with built-in auto-switch functionality and visual feedback.
