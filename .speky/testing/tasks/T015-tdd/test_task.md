# TDD Test Task: Spec 015 - 015

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# Spec 015: Inline Rename State Management

## Overview
Implement inline rename state management, integrated with SPEC-012's InlineInputStore for context-separated rename tracking.

## Out of Scope

This specification does not include:

- General inline input functionality (text editing, validation, keyboard handling)
- Clipboard state management for cut/copy/paste operations
- Keyboard navigation patterns and shortcuts
- Sidebar component implementation or layout
- Space card component implementation or styling
- Project setup, build configuration, or tooling
- File system operations for actual renaming
- Undo/redo functionality for rename operations
- Drag and drop interactions during rename
- Multi-select rename operations

### Handled by Other Specifications:
- General inline input state management - See Spec 012 (Inline Input State Management)
- Clipboard operations - See Spec 016 (Clipboard State Management) 
- Keyboard navigation - See Spec 006 (Keyboard Navigation)
- Basic project setup - See Spec 001 (Project Setup)
- Sidebar functionality - See Spec 002 (Sidebar Implementation)

## Requirements

### R1: Rename State Integration
- Leverage SPEC-012's InlineInputStore for rename state
- Track active rename item ID for sidebar
- Track active rename item ID for space cards
- Clear rename state on submit/cancel
- Prevent multiple simultaneous renames

### R2: Rename State Interface Reference
The rename state interface is defined in SPEC-012's InlineInputStore specification. This spec implements the rename-specific behavior on top of that foundation:

```typescript
// From SPEC-012 - InlineInputStore interface includes:
// sidebarRenameItemId: string | null;
// setSidebarRenameItemId: (id: string | null) => void;
// cardRenameItemId: string | null;
// setCardRenameItemId: (id: string | null) => void;
```

### R3: Context Separation
- Sidebar rename should not affect space card rename
- Each context maintains independent rename state
- Switching spaces should preserve appropriate rename states
- Only one item can be in rename mode per context

### R4: Rename Lifecycle
- setSidebarRenameItemId(itemId) - Activate rename mode
- setSidebarRenameItemId(null) - Cancel/complete rename
- setCardRenameItemId(itemId) - Activate rename in card
- setCardRenameItemId(null) - Cancel/complete rename in card

### R5: Auto-clearing Behavior
- Auto-clear rename state when user switches between spaces
- Preserve rename state when navigating within the same space context
- Clear rename state on explicit cancel actions (Escape key, click outside)

#### Deletion During Rename
- **Trigger**: Item deleted while in rename mode (via keyboard shortcut, context menu, or external action)
- **Behavior**: 
  - Immediately cancel rename operation
  - Discard any pending changes
  - Proceed with standard deletion flow
  - Clear any rename-related state
- **State cleanup**: Reset focus to appropriate fallback item

## State Clearing Logic

### Clearing Triggers
- **Navigation Events**: Clear rename state on space change or route transition (coordinate with Spec 002)
- **Focus Context Changes**: Clear when focus moves to different context (coordinate with Spec 006) 
- **User Actions**: ESC key, outside clicks, successful form submission
- **Component Lifecycle**: Clear on component unmount
- **Timeout Conditions**: Clear after 5 minutes of inactivity to prevent stale state
- **Item Deletion**: Clear if the item being renamed is deleted by external action

### Trigger Priority Order
1. **Explicit user cancellation** (ESC key, outside click) - Immediate clearing
2. **Item deletion** - Immediate clearing with focus management
3. **Navigation events** (space switches, route changes) - Clear before navigation
4. **Focus context changes** - Clear when focus moves to incompatible context
5. **Component unmount** - Cleanup during component lifecycle
6. **Timeout conditions** - Background cleanup for stale state

### Coordination Points with Other Specs
- **Spec 002 (Sidebar Navigation)**: Subscribe to navigation state changes for space transitions
- **Spec 006 (Keyboard Navigation)**: Listen to focus context changes and manage focus fallback
- **Spec 012 (Inline Input Store)**: Ensure clearing doesn't conflict with pending save operations

### State Clearing Implementation
```typescript
interface StateClearingConfig {
  // Navigation coordination
  onSpaceChange: () => void;
  onRouteTransition: () => void;
  
  // Focus coordination  
  onFocusContextChange: (newContext: string) => void;
  
  // User action handlers
  onEscapeKey: () => void;
  onOutsideClick: () => void;
  
  // Lifecycle handlers
  onComponentUnmount: () => void;
  onInactivityTimeout: () => void;
}
```

### Clearing Behavior Rules
- **Same-space navigation**: Preserve rename state when scrolling, expanding/collapsing within same space
- **Cross-space navigation**: Clear all rename states when switching between spaces
- **Context isolation**: Sidebar rename clearing should not affect card rename state and vice versa
- **Graceful degradation**: If coordination fails, default to clearing state to prevent inconsistencies

## Validation Requirements

### Input Validation
- **Original filename**: Must be valid existing item identifier
- **New filename**: Must comply with naming rules and constraints
- **Context validation**: Ensure rename operation occurs in correct context (sidebar vs card)
- **Permission check**: Verify user has rename permissions for target item
- **Uniqueness check**: Validate new name doesn't conflict with existing items

### Validation Rules
```typescript
interface RenameValidation {
  isValidName: (name: string) => boolean;
  hasRenamePermission: (itemId: string) => boolean;
  isNameUnique: (name: string, parentId: string) => boolean;
  getValidationErrors: (name: string) => string[];
}
```

### Validation Implementation Requirements
- **Performance**: Validation must complete within 100ms for responsive UX
- **Debouncing**: Implement 300ms debounce for real-time validation during typing
- **Caching**: Cache validation results for frequently accessed items
- **Error priority**: Display most critical error first (permissions > uniqueness > format)

### Validation Outputs
- **Success**: `{ success: true, newName: string }`
- **Failure**: `{ success: false, error: ValidationError, originalName: string }`
- **Error codes**: `INVALID_CHARS`, `DUPLICATE_NAME`, `PERMISSION_DENIED`, `ITEM_NOT_FOUND`

### Validation Failure Modes
- **Invalid characters**: Return specific invalid character list
- **Name conflicts**: Return conflicting item information
- **Permission issues**: Return required permission level
- **System errors**: Return generic error with retry capability

## Error Handling

### Rename Operation Errors
- **Non-existent item**: Display "Item not found" message, revert to original name
- **Permission denied**: Show "Cannot rename - insufficient permissions" 
- **Invalid characters**: Highlight invalid chars, show format requirements
- **Duplicate names**: Prompt for alternative name or auto-append suffix
- **System errors**: Display generic "Rename failed" with retry option

### Error Recovery Scenarios
- **Network timeout**: Retry mechanism with exponential backoff (1s, 2s, 4s intervals)
- **Concurrent modifications**: Detect conflicts and prompt user for resolution
- **Partial failures**: Handle cases where UI state updates but backend fails
- **State corruption**: Automatic state reset with user notification

### Error Recovery
- All failed renames must revert input to original value
- Error messages should appear inline near the renamed item
- Users can retry immediately or cancel operation
- State management must handle error scenarios gracefully

## Implementation Details

### InlineInputStore Extension
Extend the existing InlineInputStore (from SPEC-012's state management foundation) with the following methods:

**Location**: `packages/react-ui/src/stores/inlineInputStore.ts`

**New methods to add**:
- `setSidebarRenameItemId(id: string | null)` - Set/clear sidebar rename state
- `setCardRenameItemId(id: string | null)` - Set/clear card rename state
- `getRenameState(context: 'sidebar' | 'card')` - Get current rename state for context
- `isRenaming(itemId: string, context: 'sidebar' | 'card')` - Check if specific item is being renamed

**Integration points**:
- Hook into existing InlineInputStore from SPEC-012
- Coordinate with SPEC-006 (keyboard navigation) focus management
- Maintain separation between sidebar and card contexts
- Auto-clear rename state when switching spaces (if appropriate)

**State structure within InlineInputStore**:
```typescript
// Rename state properties
sidebarRenameItemId: string | null;
cardRenameItemId: string | null;
```

### Performance Requirements
- **State updates**: Must complete within 16ms (60fps) for smooth UI
- **Memory usage**: Rename state should not exceed 1KB per active rename
- **Cleanup**: Automatic cleanup of stale rename states after 5 minutes of inactivity
- **Batch operations**: Support batching multiple state updates in single render cycle

## Acceptance Criteria
- [ ] Rename state integrated into InlineInputStore (SPEC-012)
- [ ] sidebarRenameItemId state working
- [ ] cardRenameItemId state working
- [ ] setSidebarRenameItemId sets/clears state correctly
- [ ] setCardRenameItemId sets/clears state correctly
- [ ] Only one item can be renamed per context at a time
- [ ] Rename state is context-separated (sidebar vs card)
- [ ] Unit tests for rename state methods
- [ ] GIVEN an item is in rename mode WHEN the item is deleted THEN rename mode is cancelled and deletion proceeds normally AND focus moves to appropriate fallback item
- [ ] GIVEN user is renaming an item in Space A WHEN user switches to Space B THEN the rename input is cleared and item reverts to display mode
- [ ] GIVEN user is renaming an item WHEN user navigates within the same space (scroll, expand/collapse) THEN the rename state is preserved
- [ ] GIVEN user is renaming an item WHEN user presses Escape or clicks outside the input THEN the rename input is cleared immediately
- [ ] GIVEN validation fails WHEN user attempts rename THEN appropriate error message displays within 100ms
- [ ] GIVEN network error occurs WHEN rename submitted THEN retry mechanism activates with exponential backoff
- [ ] GIVEN concurrent rename attempts WHEN state conflict detected THEN user receives clear conflict resolution options

**Integration with SPEC-012 State Management:**
- [ ] Inline input state is properly isolated from other component states
- [ ] State transitions trigger correctly when switching between sidebar and space card contexts
- [ ] State cleanup occurs when inline input is cancelled or completed
- [ ] No state conflicts occur when multiple inline inputs are active simultaneously
- [ ] Integration maintains the separate state tracking as defined in SPEC-012

## Integration Testing with SPEC-012
1. Verify state isolation by creating inline inputs in both contexts simultaneously
2. Test state persistence during context switches
3. Validate cleanup when inputs are dismissed
4. Confirm no memory leaks in state management
5. Performance testing for state update latency under load
6. Error recovery testing for network failures and state corruption

## Dependencies
- SPEC-012: Inline Input State Management (combined store)
- SPEC-002: Sidebar Implementation (for error display in TreeView context and navigation state coordination)
- SPEC-006: Keyboard Navigation (for focus context management after deletion and space switching)

## Estimated Duration
1 hour

## Reference Files

### Flutter Source
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:144-145` - Rename provider (sidebar)
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:38-39` - Rename provider (card)

### Electron Target
- `packages/react-ui/src/stores/inlineInputStore.ts` - Already includes rename state (SPEC-012)

## Implementation Notes
- This spec is a logical separation of rename functionality
- Actual implementation is part of SPEC-012's InlineInputStore
- No new files needed - just validation that SPEC-012 includes rename state
- Tests should verify rename state works independently per context
- Auto-clearing behavior coordinates with state management patterns established in SPEC-012 to ensure consistent input clearing behavior across the application

## Resolved Questions (Pre-Planning)
- **How should rename state clearing coordinate with SPEC-002 (Sidebar Navigation) for space transitions - should it hook into existing navigation events or create new coordination points?** → Review SPEC-002's navigation event system and hook into existing space change events rather than creating duplicate coordination logic.
- **What should happen if SPEC-012's InlineInputStore doesn't already include the required rename state properties (sidebarRenameItemId, cardRenameItemId)?** → Verify SPEC-012 implementation first. If missing, either update SPEC-012 or modify this spec to include the required state additions.
- **What specific focus management should occur when an item is deleted during rename - which item should receive focus as the "appropriate fallback"?** → Define fallback priority: next sibling → previous sibling → parent → first item in list.
- **How should validation debouncing (300ms) interact with the performance requirement of completing validation within 100ms?** → 300ms debounce for triggering validation, but once triggered, validation must complete within 100ms.


## Acceptance Criteria to Cover

1. [ ] [ ] Rename state integrated into InlineInputStore (SPEC-012)
2. [ ] [ ] sidebarRenameItemId state working
3. [ ] [ ] cardRenameItemId state working
4. [ ] [ ] setSidebarRenameItemId sets/clears state correctly
5. [ ] [ ] setCardRenameItemId sets/clears state correctly
6. [ ] [ ] Only one item can be renamed per context at a time
7. [ ] [ ] Rename state is context-separated (sidebar vs card)
8. [ ] [ ] Unit tests for rename state methods
9. [ ] [ ] GIVEN an item is in rename mode WHEN the item is deleted THEN rename mode is cancelled and deletion proceeds normally AND focus moves to appropriate fallback item
10. [ ] [ ] GIVEN user is renaming an item in Space A WHEN user switches to Space B THEN the rename input is cleared and item reverts to display mode
11. [ ] [ ] GIVEN user is renaming an item WHEN user navigates within the same space (scroll, expand/collapse) THEN the rename state is preserved
12. [ ] [ ] GIVEN user is renaming an item WHEN user presses Escape or clicks outside the input THEN the rename input is cleared immediately
13. [ ] [ ] GIVEN validation fails WHEN user attempts rename THEN appropriate error message displays within 100ms
14. [ ] [ ] GIVEN network error occurs WHEN rename submitted THEN retry mechanism activates with exponential backoff
15. [ ] [ ] GIVEN concurrent rename attempts WHEN state conflict detected THEN user receives clear conflict resolution options
16. [ ] [ ] Inline input state is properly isolated from other component states
17. [ ] [ ] State transitions trigger correctly when switching between sidebar and space card contexts
18. [ ] [ ] State cleanup occurs when inline input is cancelled or completed
19. [ ] [ ] No state conflicts occur when multiple inline inputs are active simultaneously
20. [ ] [ ] Integration maintains the separate state tracking as defined in SPEC-012

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
describe('Feature: 015')
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

1. **Link tests to spec**: `speky test link <test-file> --spec 015`
2. **Run RED phase**: `speky test tdd-red 015`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
