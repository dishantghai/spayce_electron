# Spec 013: Multi-Selection State Management

## Overview
Implement multi-selection state management for Ctrl+Click and Shift+Click operations, enabling users to select multiple items for batch operations like copy, delete, and drag.

## Requirements

### R1: Multi-Selection Store (Zustand)
- Track selected item IDs per space
- Store last selected ID (anchor for shift-click range)
- Clear selection on space switch
- Support Ctrl+Click toggle selection
- Support Shift+Click range selection

### R2: Selection State Interface
```typescript
interface SelectionState {
  spaceId: string | null;
  selectedIds: Set<string>;
  lastSelectedId: string | null;  // Anchor for shift-click
  
  selectSingle: (spaceId: string, itemId: string) => void;
  toggleSelection: (spaceId: string, itemId: string) => void;  // Ctrl+Click
  selectRange: (spaceId: string, itemId: string, allVisibleIds: string[]) => void;  // Shift+Click
  clearSelection: () => void;
  isSelected: (itemId: string) => boolean;
  getSelectedItems: () => string[];
}
```

### R3: Ctrl+Click Behavior
- If item is selected, deselect it
- If item is not selected, add to selection
- Update lastSelectedId to clicked item
- If space changes, start fresh selection
- Allow empty selection (all deselected)

### R4: Shift+Click Behavior
- Select range from lastSelectedId to clicked item
- Use visible items order (respecting tree structure)
- Keep anchor (lastSelectedId) unchanged
- If no anchor, behave like single click
- If space changes, start fresh selection

### R5: Selection Lifecycle
- Clear selection when switching spaces
- Preserve selection during item operations
- Clear selection after successful cut/paste
- Maintain selection during copy operations

### R6: Helper Methods
- isSelected(itemId) - Check if item is selected
- getSelectedItems() - Get array of selected IDs
- clearSelection() - Reset all selection state

## Acceptance Criteria
- [ ] SelectionStore created at `packages/react-ui/src/stores/selectionStore.ts`
- [ ] spaceId tracks current selection space
- [ ] selectedIds Set stores selected item IDs
- [ ] lastSelectedId stores anchor for shift-click
- [ ] selectSingle clears previous and selects one item
- [ ] toggleSelection adds/removes items (Ctrl+Click)
- [ ] selectRange selects between anchor and target (Shift+Click)
- [ ] clearSelection resets all state
- [ ] Selection clears on space switch
- [ ] isSelected helper works correctly
- [ ] getSelectedItems returns array of IDs
- [ ] Unit tests for all selection methods
- [ ] Edge cases tested (empty selection, no anchor, space switch)

## Dependencies
- SPEC-010: React UI Integration (Zustand stores)

## Estimated Duration
3 hours

## Reference Files

### Flutter Source
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:75-95` - MultiSelectionState class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:95-97` - multiSelectionProvider
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1817-1843` - Ctrl+Click handler
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:1845-1874` - Shift+Click handler

### Electron Target
- `packages/react-ui/src/stores/selectionStore.ts` - Create this file
- `packages/react-ui/src/types/index.ts` - Add selection-related types if needed

## Implementation Notes
- Use Set<string> for O(1) selection checks
- Shift+Click requires visible items list (tree-order aware)
- Range selection is inclusive (includes both anchor and target)
- Empty selection is valid (no items selected)
- Consider visual feedback in UI layer (checked state, background color)
- Selection should work with drag-drop (drag selected items)
- Selection should work with clipboard (copy/cut selected items)
