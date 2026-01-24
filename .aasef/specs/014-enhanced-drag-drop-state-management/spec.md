# Spec 014: Enhanced Drag-Drop State Management

## Overview
Enhance existing dragDropUiStore with full drag operation tracking, drop indicators, auto-expand functionality, and pins grid integration.

## Requirements

### R1: Enhanced DragData Interface
- Support multiple items for multi-selection drag
- Track source context (sidebar/spaceCard)
- Include ancestor chain for folder validation
- Store source index and parent ID
- Track drag start time

### R2: Drop Indicator State
- Track target item ID for drop indicator
- Support drop positions (before/after/inside)
- Store target index for ordering
- Track target parent ID for nested drops
- Include ancestor IDs for validation

### R3: Auto-Expand Tracking
- Track currently drag-expanded folder ID
- Timer management for expand on hover
- Auto-collapse on drag end
- 800ms hover delay before expand

### R4: Pins Grid Integration
- Track hover state over pins grid
- Track drop index in pins grid
- Support reordering within pins grid
- Visual feedback for valid drop targets

### R5: Flash Animation State
- Track recently dropped item ID
- 500ms flash duration
- Auto-clear after animation

### R6: Enhanced State Interface
```typescript
type DragSource = 'sidebar' | 'spaceCard';
type DropPosition = 'before' | 'after' | 'inside';

interface DragData {
  item: SpaceItem;
  items: SpaceItem[];        // For multi-select
  spaceId: string;
  parentId: string | null;
  sourceIndex: number;
  source: DragSource;
  ancestorIds: string[];     // For validation
}

interface DropIndicatorState {
  targetId: string;
  position: DropPosition;
  spaceId: string;
  targetIndex: number;
  targetParentId: string | null;
}

interface DragDropUiState {
  isDragging: boolean;
  dragData: DragData | null;
  dropIndicator: DropIndicatorState | null;
  dragExpandedFolderId: string | null;
  flashItemId: string | null;
  isOverPinsGrid: boolean;
  pinsDropIndex: number | null;
  
  startDrag: (data: DragData) => void;
  setDropIndicator: (indicator: DropIndicatorState | null) => void;
  endDrag: () => void;
  setDragExpandedFolder: (id: string | null) => void;
  setFlashItem: (id: string | null) => void;
  setOverPinsGrid: (isOver: boolean, dropIndex?: number | null) => void;
}
```

## Acceptance Criteria
- [ ] Enhanced dragDropUiStore at `packages/react-ui/src/stores/dragDropUiStore.ts`
- [ ] DragData supports multiple items array
- [ ] DragData tracks source (sidebar/spaceCard)
- [ ] DragData includes ancestorIds for circular reference validation
- [ ] DropIndicatorState tracks position (before/after/inside)
- [ ] DropIndicatorState includes targetIndex and targetParentId
- [ ] dragExpandedFolderId state for auto-expand folders
- [ ] flashItemId state for drop animation
- [ ] isOverPinsGrid and pinsDropIndex for pins grid drops
- [ ] startDrag method sets all drag state
- [ ] setDropIndicator updates drop indicator
- [ ] endDrag clears all drag-related state
- [ ] setDragExpandedFolder manages auto-expand state
- [ ] setFlashItem triggers and auto-clears flash animation
- [ ] Unit tests for all store methods
- [ ] Type definitions exported from types/index.ts

## Dependencies
- SPEC-010: React UI Integration (Zustand stores)
- SPEC-007: Core Domain Layer (SpaceItem entity)

## Estimated Duration
4 hours

## Reference Files

### Flutter Source
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:6-7` - DragSource enum
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:9-10` - DropPosition enum
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:12-43` - DragOperation class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:45-75` - DropIndicatorState class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:77-98` - DragData class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/providers/drag_drop_provider.dart:195-217` - Auto-expand provider

### Electron Target
- `packages/react-ui/src/stores/dragDropUiStore.ts` - Enhance existing file
- `packages/react-ui/src/types/index.ts` - Add DragSource, DropPosition, DragData, DropIndicatorState types

## Implementation Notes
- Build on existing dragDropUiStore (don't replace entirely)
- ancestorIds prevents dragging folder into itself or descendants
- Auto-expand requires setTimeout tracking (clear on drag end)
- Flash animation should auto-clear after 500ms using setTimeout
- Drop position calculation uses 20%/60%/20% split (before/inside/after)
- Pins grid drops have special square preview (handled in UI layer)
