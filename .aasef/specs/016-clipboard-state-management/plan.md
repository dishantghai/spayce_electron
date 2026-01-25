# Implementation Plan

## Approach
Implement a Zustand store for internal clipboard operations with basic copy/cut/paste functionality, add IPC handlers for system clipboard integration, and provide validation logic for paste target compatibility. Focus on core clipboard mechanics with multi-selection integration while keeping system clipboard interaction minimal (URLs only).

## Tasks

- [ ] **Create Clipboard Store Foundation** (estimate: 3h)
  - Implement `clipboardStore.ts` with state interface and basic copy/cut/clear methods
  - Add URL detection regex and clipboard action tracking
  - Unit tests for store state management
  - Dependencies: None

- [ ] **Add IPC Clipboard Handlers** (estimate: 2h)
  - Create `clipboardHandlers.ts` with readText/writeText handlers
  - Expose clipboard API in preload script
  - Error handling for IPC failures with fallback to internal-only mode
  - Dependencies: Task 1

- [ ] **Implement Paste Validation Logic** (estimate: 4h)
  - Add `canPaste` method with target type compatibility matrix
  - Implement circular reference prevention for folder operations
  - Add position support validation (before/after/inside)
  - Unit tests for all validation scenarios
  - Dependencies: Task 1, SPEC-007 (SpaceItem entity)

- [ ] **Complete Paste Operations** (estimate: 3h)
  - Implement `pasteItems` method with position handling
  - Add integration with space repository for item creation/movement
  - Handle copy vs cut operations (duplicate vs move)
  - Dependencies: Task 3, space repository from SPEC-010

- [ ] **Multi-selection Integration** (estimate: 2h)
  - Integrate with SPEC-013 selection store for multi-item operations
  - Add state coordination (clear selection after paste)
  - Handle fallback to focused item when no selection
  - Dependencies: Task 4, SPEC-013 (Multi-selection)

## Architecture Decisions Needed
- **Space Repository Interface**: Need to confirm the exact method signatures for creating/moving items across spaces from SPEC-010's repository pattern
- **Error Toast Integration**: Need to identify which toast/notification system to use for clipboard error messages (not specified in tech stack)

## Testing Approach
Unit tests for clipboard store operations (copy/cut/paste/validation), mock IPC handlers for system clipboard integration testing, and integration tests with multi-selection store to verify state coordination works correctly.

## Risks & Mitigations
- **Cross-space paste complexity**: Repository operations across different spaces may be more complex than anticipated - mitigate by implementing same-space operations first, then extend to cross-space
- **IPC reliability**: System clipboard integration could fail silently - mitigate with comprehensive error handling and clear fallback to internal-only mode
- **Circular reference detection**: Complex folder hierarchies might make validation expensive - mitigate by implementing simple parent-chain traversal with depth limits