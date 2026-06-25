# Implementation Plan

## Approach
Create a Zustand store for multi-selection state management with Ctrl+Click and Shift+Click support. Focus on core selection mechanics with proper space context isolation and basic integration points for drag-drop and clipboard operations.

## Tasks

- [ ] **Create SelectionStore with Core State Management** (estimate: 4h)
  - Implement Zustand store at `packages/react-ui/src/stores/selectionStore.ts`
  - Add spaceId, selectedIds Set, and lastSelectedId state
  - Implement selectSingle, toggleSelection, selectRange, selectAll, clearSelection methods
  - Add helper methods: isSelected, getSelectedItems
  - **Acceptance**: Store maintains selection state per space, methods work correctly
  - **Dependencies**: None

- [ ] **Implement Parameter Validation & Error Boundaries** (estimate: 3h)
  - Add comprehensive validation for spaceId and itemId parameters
  - Implement error boundaries with graceful fallbacks
  - Add sanitization and consistent error handling patterns
  - **Acceptance**: All methods validate inputs, handle errors gracefully, log appropriately
  - **Dependencies**: Task 1 complete

- [ ] **Add Space Context Management** (estimate: 2h)
  - Implement automatic selection clearing on space navigation
  - Add spaceId update handling with state reset
  - Ensure proper context isolation between spaces
  - **Acceptance**: Selection clears when switching spaces, no cross-contamination
  - **Dependencies**: Task 1 complete

- [ ] **Implement Keyboard Shortcuts Integration** (estimate: 3h)
  - Add Ctrl+A (select all) and Escape (clear selection) support
  - Integrate with existing focus context system from SPEC-006
  - Handle Shift+Arrow for range extension
  - **Acceptance**: Keyboard shortcuts work in proper contexts, respect focus management
  - **Dependencies**: Task 1 complete, SPEC-006 focus system available

- [ ] **Add Cross-Store Integration Methods** (estimate: 2h)
  - Implement getSelectedItemsForDrag for drag-drop coordination
  - Add getSelectedItemsForClipboard for clipboard operations
  - Create integration interfaces for consumer specs
  - **Acceptance**: Integration methods return proper data structures for consuming stores
  - **Dependencies**: Task 1 complete

- [ ] **Create Unit Tests** (estimate: 2h)
  - Test all selection methods with various scenarios
  - Test parameter validation and error handling
  - Test space context switching and state isolation
  - **Acceptance**: All core functionality tested, edge cases covered
  - **Dependencies**: Tasks 1-2 complete

## Architecture Decisions Needed

- **Space Navigation Event Source**: How does SelectionStore listen for space navigation events - through a navigation store subscription, event emitter, or callback registration?
- **Visible Items Definition**: For shift-click range selection, what constitutes "visible items" - DOM rendered elements, expanded tree nodes, or filtered results?
- **Tree Structure Ordering**: How should range selection traverse tree structure - depth-first, breadth-first, or DOM order?

## Testing Approach
Unit tests for each selection method covering normal operation, edge cases (empty selection, no anchor), and error scenarios. Integration tests for space switching and keyboard shortcuts. Mock space navigation events and focus context for isolated testing.

## Risks & Mitigations

- **SPEC-006 Dependency Unavailable**: Focus context system may not be fully implemented
  - *Mitigation*: Implement basic keyboard handling with TODO comments for full integration
- **Space Navigation Integration Complexity**: Unclear how to hook into space switching events
  - *Mitigation*: Start with manual spaceId updates, add automatic clearing later
- **Performance with Large Selections**: Set operations may be slow with thousands of items
  - *Mitigation*: Implement basic functionality first, optimize if needed (out of MVP scope)