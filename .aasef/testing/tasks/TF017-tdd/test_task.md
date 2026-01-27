# TDD Test Task: Spec F017 - Ctrl+Click Toggle Selection

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F017
title: Ctrl+Click Toggle Selection
type: feature
priority: P1
status: pending
related_specs:
  - "013"
affected_files:
  - packages/react-ui/src/stores/selectionStore.ts
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/TreeView.tsx
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/desktop/src/renderer/App.tsx
estimated_hours: 3
---

# F017: Ctrl+Click Toggle Selection

## User Story

> As a user, I want to Ctrl+Click items to add/remove them from my selection, so I can select non-contiguous items.

## Context

This feature enables multi-selection in the sidebar tree view. Users can Ctrl+Click (Cmd+Click on Mac) to toggle individual items in/out of a selection set. This is the foundation for batch operations like multi-drag (F020), multi-delete, and multi-copy.

The existing `selectionStore.ts` already has the core selection logic (`toggleSelection`, `selectSingle`, `clearSelection`). This story wires up the click handlers in TreeItem to use these store methods based on modifier keys.

## Acceptance Criteria

- [ ] Ctrl+Click (Cmd+Click on Mac) adds item to selection if not selected
- [ ] Ctrl+Click on already selected item removes it from selection
- [ ] Regular click clears multi-selection and selects single item
- [ ] Selection clears when switching spaces (activeSpaceId changes)
- [ ] Selection state persists across tree re-renders
- [ ] Works for both folders and links
- [ ] Works at any nesting level

## Technical Implementation

### Files to Update

1. **TreeItem.tsx** - Add modifier key detection to click handler
2. **TreeView.tsx** - Pass selection state and handlers to TreeItem
3. **Sidebar.tsx** - Clear selection on space switch, integrate with TreeView
4. **App.tsx** - Add useEffect to clear selection on activeSpaceId change

### Click Handler Logic

```typescript
// In TreeItem.tsx - handleClick
const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isRenaming) return;
    
    // Detect platform for Cmd vs Ctrl
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
    const isShift = e.shiftKey;
    
    if (isCtrlOrCmd) {
        // Toggle selection (add/remove from multi-selection)
        selectionStore.toggleSelection(spaceId, item.id);
    } else if (isShift) {
        // Range selection (F018)
        // Will be implemented in F018
    } else {
        // Regular click - clear multi-selection and select single
        selectionStore.clearSelection();
        onItemClick?.(item);
    }
    
    // Toggle expand/collapse for folders
    if (isFolder) {
        onItemExpand?.(item, !isExpanded);
    }
}, [item, spaceId, isFolder, isExpanded, isRenaming, onItemClick, onItemExpand]);
```

### Selection Store Integration

The existing `selectionStore.ts` already has:
- `toggleSelection(spaceId, itemId)` - Adds/removes item from selection
- `selectSingle(spaceId, itemId)` - Clears and selects one item
- `clearSelection()` - Clears all selection state
- `isSelected(itemId)` - Checks if item is selected

### Space Switch Handling

```typescript
// In App.tsx or Sidebar.tsx
useEffect(() => {
    // Clear multi-selection when switching spaces
    useSelectionStore.getState().clearSelection();
}, [activeSpaceId]);
```

### Props to Add to TreeItem

```typescript
interface TreeItemProps {
    // ... existing props
    /** Space ID for selection context */
    spaceId: string;
    /** Whether this item is multi-selected */
    isMultiSelected?: boolean;
    /** Callback for multi-selection toggle */
    onToggleSelection?: (item: SpaceItem) => void;
}
```

## Flutter Reference

```dart
// main_layout_final.dart:1817-1843
void _handleCtrlClick() {
    final currentSelection = ref.read(multiSelectionProvider);
    
    if (currentSelection == null || currentSelection.spaceId != widget.spaceId) {
        // Start new multi-selection
        ref.read(multiSelectionProvider.notifier).state = MultiSelectionState(
            spaceId: widget.spaceId,
            selectedIds: {widget.item.id},
            lastSelectedId: widget.item.id,
        );
    } else {
        // Toggle this item in selection
        final newSelection = Set<String>.from(currentSelection.selectedIds);
        if (newSelection.contains(widget.item.id)) {
            newSelection.remove(widget.item.id);
        } else {
            newSelection.add(widget.item.id);
        }
        ref.read(multiSelectionProvider.notifier).state = MultiSelectionState(
            spaceId: widget.spaceId,
            selectedIds: newSelection,
            lastSelectedId: widget.item.id,
        );
    }
}

// MultiSelectionState (main_layout_final.dart:172-195)
class MultiSelectionState {
    final String spaceId;
    final Set<String> selectedIds;
    final String? lastSelectedId;  // For shift+click range selection
}
```

## Design System Tokens

No new visual tokens needed for this story. Visual feedback (F019) is a separate story.

## Testing Checklist

### Unit Tests

- [ ] `toggleSelection` adds item when not selected
- [ ] `toggleSelection` removes item when already selected
- [ ] `toggleSelection` starts new selection when spaceId differs
- [ ] `clearSelection` resets all selection state
- [ ] `isSelected` returns correct boolean
- [ ] `lastSelectedId` is updated on toggle

### Integration Tests

- [ ] Ctrl+Click on unselected item adds to selection
- [ ] Ctrl+Click on selected item removes from selection
- [ ] Regular click clears multi-selection
- [ ] Selection clears on space switch
- [ ] Multiple Ctrl+Clicks accumulate selection

### Manual Testing

- [ ] Cmd+Click (Mac) / Ctrl+Click (Windows/Linux) toggles selection
- [ ] Click without modifier clears selection
- [ ] Selection persists while navigating tree
- [ ] Switch space → selection cleared
- [ ] Works on folders and links
- [ ] Works at nested levels

## Dependencies

- Spec 013 (Selection Store) - Already implemented
- F011 (Drag Tree Items) - Completed

## Notes

- The selection store already validates spaceId and itemId formats
- Selection is scoped to a single space (cross-space selection not supported)
- This story focuses on click handling; visual feedback is F019


## Acceptance Criteria to Cover

1. [ ] [ ] Ctrl+Click (Cmd+Click on Mac) adds item to selection if not selected
2. [ ] [ ] Ctrl+Click on already selected item removes it from selection
3. [ ] [ ] Regular click clears multi-selection and selects single item
4. [ ] [ ] Selection clears when switching spaces (activeSpaceId changes)
5. [ ] [ ] Selection state persists across tree re-renders
6. [ ] [ ] Works for both folders and links
7. [ ] [ ] Works at any nesting level

## Tech Stack

```json
Not specified
```

## Required Test Files

- Create in appropriate test directory

## Test Requirements

### For Each Acceptance Criterion

Create tests that:
1. **Test the happy path** - Normal expected behavior
2. **Test edge cases** - Boundary conditions, empty inputs
3. **Test error handling** - Invalid inputs, network failures
4. **Use appropriate mocking** - Don't hit real APIs/databases

### Test Structure

```
describe('Feature: Ctrl+Click Toggle Selection')
  describe('AC1: [Acceptance Criterion 1]')
    test('should [expected behavior]')
    test('should handle [edge case]')
    test('should throw error when [error condition]')
  
  describe('AC2: [Acceptance Criterion 2]')
    ...
```

## Guidelines

1. **Tests MUST FAIL initially** - We haven't implemented yet!
2. Follow existing test patterns in the codebase
3. Use the project's testing frameworks
4. Ensure tests are deterministic (no flaky tests)
5. Add appropriate setup/teardown
6. Use descriptive test names
7. Group related tests logically

## After Creating Tests

1. **Link tests to spec**: `aasef test link <test-file> --spec F017`
2. **Run RED phase**: `aasef test tdd-red F017`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
