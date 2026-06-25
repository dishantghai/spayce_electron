# Implementation Plan

## Approach
Enhance the existing `dragDropUiStore` with comprehensive drag operation tracking, validation logic, and performance optimizations. Build on existing Zustand patterns while adding multi-selection integration, circular reference validation, and timer-based auto-expand functionality.

## Tasks

- [ ] **Enhance DragDropUiStore Interface** (estimate: 6h)
  - Extend existing store with new state properties (dragExpandedFolderId, flashItemId, validationError, etc.)
  - Add enhanced DragData interface supporting multi-selection and ancestor chains
  - Implement DropIndicatorState with position tracking and validation
  - **Acceptance**: All new state properties accessible, type definitions exported
  - **Dependencies**: None

- [ ] **Implement Circular Reference Validation** (estimate: 8h)
  - Create validateCircularReference function with ancestor chain checking
  - Build validation cache system (DragValidationCache class)
  - Integrate validation into setDropIndicator method
  - Add error handling interface and propagation patterns
  - **Acceptance**: Prevents folder moves into descendants, cache improves performance, validation errors propagate to UI
  - **Dependencies**: Task 1

- [ ] **Add Multi-Selection Integration** (estimate: 4h)
  - Import and integrate with SPEC-013's SelectionStore
  - Modify drag handlers to support multiple items
  - Update DragData to include items array from selection
  - **Acceptance**: Dragging selected items works, falls back to single item when no selection
  - **Dependencies**: SPEC-013 SelectionStore implementation

- [ ] **Implement Timer Management System** (estimate: 6h)
  - Add auto-expand timer logic for dragExpandedFolderId
  - Implement flash animation auto-clear (500ms timeout)
  - Create timer cleanup patterns for component lifecycle
  - Add cleanup triggers for navigation changes and unmount
  - **Acceptance**: Auto-expand works on 800ms hover, flash animations auto-clear, no memory leaks
  - **Dependencies**: Task 1

- [ ] **Add Performance Optimizations** (estimate: 4h)
  - Implement 60fps throttling for drag updates
  - Add resource management bounds (100 item limit)
  - Create large selection handling (>10 items show count)
  - **Acceptance**: Smooth drag performance, memory usage controlled, large selections handled gracefully
  - **Dependencies**: Tasks 1, 3

- [ ] **Integrate Animation Coordination** (estimate: 6h)
  - Create animation coordinator interface
  - Implement conflict detection with related specs
  - Add flash animation deferral system
  - **Acceptance**: Flash animations don't conflict with inline editing/rename operations
  - **Dependencies**: Tasks 1, 4, SPEC-012/015 inline input stores

- [ ] **Add Comprehensive Testing** (estimate: 6h)
  - Unit tests for all store methods and validation logic
  - Test circular reference prevention scenarios
  - Test timer cleanup and memory management
  - Test multi-selection integration
  - **Acceptance**: >90% test coverage, all validation scenarios tested, no memory leaks in tests
  - **Dependencies**: All previous tasks

## Architecture Decisions Needed
- **Timer storage location**: Should auto-expand timers be stored in global store or component state? (Spec suggests component state for UI-specific behavior)
- **Cache persistence scope**: Should validation cache persist across drag sessions or clear on each endDrag()? (Spec suggests clear on endDrag for memory management)
- **Error propagation mechanism**: Should validation errors use toast notifications, inline indicators, or both? (Need UI team input on error display patterns)

## Testing Approach
Focus on critical validation logic and state management. Test circular reference prevention with nested folder scenarios, timer cleanup on component unmount, multi-selection drag operations, and cache invalidation on structure changes. Use Vitest for unit tests with mocked timer functions.

## Risks & Mitigations
- **Timer memory leaks**: Complex timer lifecycle with multiple cleanup triggers could cause leaks
  - *Mitigation*: Implement comprehensive timer registry pattern and add memory leak detection in tests
- **Performance degradation with large selections**: 100-item drag operations may still cause UI freezing
  - *Mitigation*: Implement progressive loading for drag previews and add performance monitoring
- **Integration complexity with SPEC-013**: Multi-selection store may not be ready or have different interface than expected
  - *Mitigation*: Create adapter pattern and fallback to single-item drag if SelectionStore unavailable