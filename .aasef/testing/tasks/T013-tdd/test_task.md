# TDD Test Task: Spec 013 - 013

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# Spec 013: Multi-Selection State Management

## Overview
Implement multi-selection state management for Ctrl+Click and Shift+Click operations, enabling users to select multiple items for batch operations like copy, delete, and drag.

## Dependencies (Required Before Implementation)
- SPEC-010: React UI Integration (Zustand stores)
- SPEC-006: Keyboard Navigation - for focus context management and keyboard event handling

## Consumers (Specs That Will Use SelectionStore)
> The following specs will consume SelectionStore after it's implemented. Integration interfaces are defined in this spec to establish contracts.

- **SPEC-014**: Enhanced Drag Drop State - will use `getSelectedItemsForDrag()` for multi-item drag
- **SPEC-016**: Clipboard State - will use `getSelectedItemsForClipboard()` for multi-item clipboard

## Types Reference
```typescript
// SpaceItem defined in core package
import { SpaceItem } from '@core/types'
```

## Shared Types (SpaceItem Usage)
> This section documents which specs use the shared `SpaceItem` type. This is NOT a dependency list - it's for reference only.

- SPEC-012: Uses SpaceItem for inline input operations
- SPEC-014: Uses SpaceItem for drag/drop operations  
- SPEC-015: Uses SpaceItem for rename operations
- SPEC-016: Uses SpaceItem for clipboard operations

**Note**: SpaceItem type must be consistently defined across all clipboard, drag-drop, and inline editing features.

## Component Dependencies
Visual implementation details are handled by component-level specifications:
- [Component Spec]: Selection visual state indicators (selected, hover, focus states)
- [Component Spec]: Multi-selection UI feedback (count badges, selection highlights)
- [Component Spec]: Keyboard navigation styling and focus management
- [Component Spec]: Drag/drop visual feedback for multi-item operations
- [Component Spec]: Animation and transition effects for selection changes

## Out of Scope

This specification does NOT include:

### Related Features (handled by other specs)
- Inline input creation and management → See SPEC-012 (Inline Input State Management)
- Inline rename functionality → See SPEC-015 (Inline Rename State Management)  
- Clipboard operations → See SPEC-016 (Clipboard State Management)
- Drag & drop operations → See SPEC-014 (Enhanced Drag Drop State Management)
- Keyboard navigation → See SPEC-006 (Keyboard Navigation)

### Technical Limitations
- Visual feedback implementation (UI layer responsibility)
- Context menu integration for batch operations
- Performance optimization for large datasets (>10,000 items)
- Undo/redo functionality for selection operations

### Future Considerations
- Advanced selection patterns (regex, filters)
- Selection persistence across app sessions
- Integration with external clipboard managers
- Accessibility enhancements for screen readers

## Persistence Strategy

### Selection State Lifecycle
- **Session Persistence**: Selection state persists during app runtime but resets on app restart
- **No Cross-Session Persistence**: Selection state does not survive app closure/reopening
- **Rationale**: Maintains user context during active sessions while providing clean slate on fresh launches

### Implementation
- Store selection state in memory-only structures
- Clear all selection state on app initialization
- No localStorage/file system persistence for selection data

### Lifecycle Management
- Initialize with empty selection state on app start
- Maintain state throughout app session
- Clear state on app termination (automatic with memory-only storage)

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
  selectAll: (spaceId: string, allVisibleIds: string[]) => void;  // Ctrl+A
  clearSelection: () => void;
  isSelected: (itemId: string) => boolean;
  getSelectedItems: () => string[];
}
```

### R2.1: Integration Interfaces
```typescript
// Consumer Integration Types
interface SelectionConsumer {
  id: string;
  onSelectionChange: (state: SelectionState) => void;
  getSelectionContext?: () => SelectionContext;
}

interface SelectionContext {
  containerId: string;
  containerType: 'sidebar' | 'space-card' | 'pins-grid';
  allowedTypes: SpaceItemType[];
}

// Hook Integration
interface UseSelectionReturn {
  selection: SelectionState;
  selectItem: (item: SpaceItem) => void;
  toggleSelection: (item: SpaceItem) => void;
  clearSelection: () => void;
  isSelected: (itemId: string) => boolean;
}
```

### R2.2: Parameter Validation & Error Boundaries
All methods that accept `spaceId` and `itemId` parameters must implement comprehensive validation with error boundaries:

```typescript
interface ValidationRules {
  spaceId: {
    required: boolean;
    format: 'uuid' | 'string';
    minLength: number;
    maxLength: number;
    errorMessage: string;
  };
  itemId: {
    required: boolean;
    format: 'uuid' | 'string';
    minLength: number;
    maxLength: number;
    errorMessage: string;
  };
}

interface ParameterValidationError extends Error {
  parameter: 'spaceId' | 'itemId';
  value: unknown;
  expectedFormat: string;
}

interface SelectionStateValidation {
  validateSpaceId: (spaceId: string | null) => ValidationResult;
  validateItemId: (itemId: string | null) => ValidationResult;
  validateParameters: (spaceId?: string, itemId?: string) => ValidationResult;
  handleValidationError: (error: ParameterValidationError) => void;
}

interface ValidationResult {
  isValid: boolean;
  error?: ParameterValidationError;
  sanitizedValue?: string;
}
```

#### Validation Requirements
- **spaceId validation**: Must be non-empty string, length 1-255 characters, alphanumeric with hyphens/underscores
- **itemId validation**: Must be non-empty string, length 1-255 characters, alphanumeric with hyphens/underscores
- **Error handling**: Graceful fallback behavior with user-facing error messages
- **Sanitization**: Trim whitespace and normalize format where possible
- **Logging**: Log validation errors for debugging without exposing to UI
- **Consistency**: Use same validation patterns as SPEC-012, SPEC-015, and SPEC-016

### R3: Ctrl+Click Behavior
- If item is selected, deselect it
- If item is not selected, add to selection
- Update lastSelectedId to clicked item
- If space changes, start fresh selection
- Allow empty selection (all deselected)
- **Validation**: Validate spaceId and itemId parameters before processing

### R4: Shift+Click Behavior
- Select range from lastSelectedId to clicked item
- Use visible items order (respecting tree structure)
- Keep anchor (lastSelectedId) unchanged
- If no anchor, behave like single click
- If space changes, start fresh selection
- **Validation**: Validate spaceId and itemId parameters before processing

### R5: Selection Lifecycle
- Clear selection when switching spaces
- Preserve selection during item operations
- Clear selection after successful cut/paste
- Maintain selection during copy operations
- **Error Recovery**: Handle invalid state transitions gracefully

### R6: Space Context Management
- **Trigger**: spaceId updates are triggered by navigation events from the main application
- **Timing**: State clearing occurs immediately before spaceId update
- **Integration**: Listen for space navigation events through application navigation system
- **Context Isolation**: Maintain independent selection state per space context
- **State Reset**: Clear selectedIds and lastSelectedId when spaceId changes
- **Initialization**: Initialize empty selection state when entering new space
- **Validation**: Validate spaceId during context switches with fallback to previous valid state

### R7: Helper Methods
- isSelected(itemId) - Check if item is selected
- getSelectedItems() - Get array of selected IDs
- clearSelection() - Reset all selection state
- **Parameter Validation**: All helper methods must validate input parameters

### R8: Cross-Store Integration
- Expose selected items to dragDropUiStore for multi-item drag operations
- Maintain selection state during drag operations
- Provide getSelectedItemsForDrag() method for drag payload
- Subscribe to drag completion events to clear selection if needed

```typescript
interface SelectionStoreIntegration {
  // Provide selected items to drag operations
  getSelectedItemsForDrag: () => SpaceItem[];
  
  // Maintain selection during drag operations
  onDragStart: () => void;
  
  // Handle drag completion
  onDragComplete: (success: boolean) => void;
}
```

### R9: Keyboard Shortcuts Integration
- Support Ctrl+A (select all) in current focus context
- Support Escape (clear selection) from any selection state
- Integrate with SPEC-006's focus context system for keyboard event handling
- Respect independent navigation contexts (sidebar vs spaces)

### R10: Selection-Drag Interaction
Define coordinated behavior between selection state and drag operations:

#### Multi-Selection Drag Behavior
- **When dragging a selected item**: Move all selected items together as a group
- **When dragging an unselected item**: Clear current selection and drag only the single item
- **Visual feedback**: Show count badge (e.g., "3 items") during multi-item drag operations
- **Drag payload**: Include all selected items in drag data when dragging from selection

#### State Coordination
- Selection state persists during drag preview generation
- Selection clears only after successful multi-item drop completion
- Failed drag operations preserve original selection state
- Single-item drags from multi-selection context clear selection before drag start

#### Integration Points
```typescript
interface SelectionDragIntegration {
  // Called by drag system to determine drag payload
  getDragPayload: (draggedItemId: string) => {
    items: SpaceItem[];
    isMultiSelection: boolean;
    selectionCount: number;
  };
  
  // Handle selection state during drag lifecycle
  onDragInitiated: (draggedItemId: string) => void;
  onDragCompleted: (success: boolean, wasMultiSelection: boolean) => void;
}
```

This coordination ensures seamless interaction between SPEC-013 (Multi-Selection) and SPEC-014 (Enhanced Drag Drop) without overlapping responsibilities.

### R11: Clipboard Integration
Define coordinated behavior between selection state and clipboard operations:

#### Multi-Selection Clipboard Behavior
- **Copy operation**: Copy all selected items to clipboard as structured data
- **Cut operation**: Copy selected items and mark them for deletion/move
- **Paste operation**: Handle clipboard data integration with current selection context
- **Selection state**: Clear selection after successful cut operations, maintain during copy

#### Data Format & Structure
```typescript
interface ClipboardSelectionData {
  items: SpaceItem[];
  operation: 'copy' | 'cut';
  sourceSpaceId: string;
  timestamp: number;
  selectionCount: number;
}

interface SelectionClipboardIntegration {
  // Provide selected items for clipboard operations
  getSelectedItemsForClipboard: () => SpaceItem[];
  
  // Handle clipboard operation initiation
  onClipboardCopy: () => ClipboardSelectionData;
  onClipboardCut: () => ClipboardSelectionData;
  
  // Handle clipboard operation completion
  onClipboardPasteComplete: (success: boolean, operation: 'copy' | 'cut') => void;
  
  // Validate clipboard data compatibility
  canPasteClipboardData: (data: ClipboardSelectionData, targetSpaceId: string) => boolean;
}
```

#### State Coordination
- Selection state persists during copy operations
- Selection clears after successful cut operations
- Paste operations respect current space context
- Failed clipboard operations preserve original selection state
- Single-item clipboard operations work independently of selection state

This coordination ensures seamless interaction between SPEC-013 (Multi-Selection) and SPEC-016 (Clipboard State Management) without overlapping responsibilities.

## MVP Scope

### In Scope (Core MVP Features)
- **Basic Multi-Selection**: Ctrl+Click and Shift+Click selection functionality
- **Selection State Management**: Track selected items per space with proper state isolation
- **Keyboard Shortcuts**: Ctrl+A (select all) and Escape (clear selection) support
- **Cross-Store Integration**: Essential coordination with drag-drop and clipboard operations
- **Space Context Management**: Selection clearing on space navigation
- **Core Helper Methods**: isSelected, getSelectedItems, clearSelection functionality
- **Parameter Validation**: Comprehensive error boundaries for spaceId and itemId validation

### Out of Scope (Post-MVP)
- **Advanced Selection Patterns**: Regex-based or filter-based selection
- **Performance Optimization**: Large dataset handling (>10,000 items) optimizations
- **Visual Feedback**: Complex UI animations and transitions (handled by UI layer)
- **Context Menu Integration**: Right-click batch operations menu
- **Selection Persistence**: Cross-session selection state storage
- **Accessibility Enhancements**: Advanced screen reader support
- **Undo/Redo**: Selection operation history management

### Success Criteria
- **Functional**: Users can select multiple items using Ctrl+Click and Shift+Click
- **Performance**: Selection operations complete within 100ms for datasets up to 1,000 items
- **Integration**: Seamless coordination with drag-drop and clipboard operations
- **Reliability**: Selection state properly isolated per space with no cross-contamination
- **Usability**: Keyboard shortcuts work consistently across all selection contexts
- **Robustness**: Parameter validation prevents errors and provides graceful fallbacks

### Prioritization Rationale
The MVP focuses on core selection mechanics that enable essential batch operations (copy, cut, drag). Advanced features like persistence and performance optimization are deferred to allow rapid delivery of fundamental multi-selection capabilities that users expect in a modern file management interface.

## Keyboard Shortcuts

### Selection State Coordination
When navigating with arrow keys:
- **Single selection**: Move focus and update selection to focused item
- **Multi-selection**: Shift+Arrow extends selection, Arrow alone moves focus only
- **Always validate selection state before focus changes**
- **Focus changes must respect current selection context**
- **Navigation events trigger selection state updates when appropriate**

### Shortcut Table
| Shortcut | Action | Context |
|----------|--------|---------|
| Ctrl+A | Select all items | Current focus context (sidebar/spaces) |
| Escape | Clear selection | Any selection state |
| Shift+Arrow | Extend selection range | Multi-selection mode |
| Arrow | Move focus only | Multi-selection mode |

*Note: Keyboard event handling integrated with SPEC-006's focus context system*

## Acceptance Criteria
- [ ] SelectionStore created at `packages/react-ui/src/stores/selectionStore.ts`
- [ ] spaceId tracks current selection space
- [ ] selectedIds Set stores selected item IDs
- [ ] lastSelectedId stores anchor for shift-click
- [ ] selectSingle clears previous and selects one item
- [ ] toggleSelection adds/removes items (Ctrl+Click)
- [ ] selectRange selects between anchor and target (Shift+Click)
- [ ] selectAll selects all visible items (Ctrl+A)
- [ ] clearSelection resets all state
- [ ] Selection clears on space switch
- [ ] Space context management handles spaceId updates from navigation events
- [ ] State clearing occurs before spaceId updates
- [ ] isSelected helper works correctly
- [ ] getSelectedItems returns array of IDs
- [ ] getSelectedItemsForDrag provides items for drag operations
- [ ] Integration hooks for dragDropUiStore communication
- [ ] Keyboard shortcuts integrate with SPEC-006 focus context
- [ ] Ctrl+A selects all items in current context
- [ ] Escape clears current selection
- [ ] getDragPayload method returns appropriate drag data based on selection state
- [ ] onDragInitiated handles selection state during drag start
- [ ] onDragCompleted manages selection clearing after drag completion
- [ ] Multi-selection drag moves all selected items together
- [ ] Single-item drag from multi-selection clears selection first
- [ ] getSelectedItemsForClipboard provides items for clipboard operations
- [ ] onClipboardCopy returns structured clipboard data for selected items
- [ ] onClipboardCut returns clipboard data and marks items for deletion
- [ ] onClipboardPasteComplete handles selection state after paste operations
- [ ] canPasteClipboardData validates clipboard compatibility with target space
- [ ] Selection clears after successful cut operations
- [ ] Selection persists during copy operations
- [ ] Keyboard navigation respects selection state during focus changes
- [ ] Shift+Arrow extends selection range in multi-selection mode
- [ ] Arrow keys move focus only without changing selection in multi-selection mode
- [ ] Selection state validation occurs before all focus changes
- [ ] Parameter validation implemented for all spaceId and itemId inputs
- [ ] Error boundaries handle invalid parameters gracefully
- [ ] Validation errors logged appropriately without exposing to UI
- [ ] Sanitization normalizes parameter formats where possible
- [ ] Consistent validation patterns used across all selection methods
- [ ] Unit tests for all selection methods
- [ ] Edge cases tested (empty selection, no anchor, space switch)
- [ ] Selection-drag interaction tests verify coordinated behavior
- [ ] Selection-clipboard integration tests verify data flow and state management
- [ ] Keyboard navigation coordination tests verify proper selection state handling
- [ ] Parameter validation tests cover all error scenarios and edge cases

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
- Selection should work with drag-drop (drag selected items)
- Selection should work with clipboard (copy/cut selected items)
- Follow established store communication pattern from other specs (012, 015, 016) where stores expose specific methods for cross-store integration rather than direct state sharing
- Multi-item drag support extends SPEC-014's functionality by providing selection data needed for multi-item operations
- Multi-item clipboard support extends SPEC-016's functionality by providing selection data needed for batch clipboard operations
- Note that SPEC-014's drag operations will consume SelectionState for multi-item dragging
- Note that SPEC-016's clipboard operations will consume SelectionState for multi-item clipboard operations
- SPEC-006's focus management should respect current selection state
- SPEC-012's inline inputs should clear selection when activated
- Implement comprehensive parameter validation following patterns established in SPEC-012, SPEC-015, and SPEC-016
- Use consistent error handling and logging across all validation scenarios
- Ensure validation performance doesn't impact selection operation responsiveness

## Resolved Questions (Pre-Planning)
- **What specific validation rules should be applied to spaceId and itemId parameters (format, length limits, character restrictions)?** → Define specific rules - suggest UUID format for both, 36 character length for UUIDs, or fallback to alphanumeric+hyphens/underscores with 1-255 character range as mentioned.
- **How should the selection store listen for space navigation events to trigger spaceId updates and selection clearing?** → Define specific event subscription pattern - either through a navigation store, event emitter, or callback registration system.
- **What constitutes "visible items" for shift-click range selection and how is tree structure ordering determined?** → Clarify if visible means currently rendered DOM elements, expanded tree nodes, or filtered results. Define tree traversal order (depth-first, breadth-first).
- **Should failed drag operations clear selection state or preserve it, and how is drag failure determined?** → Define drag failure criteria (dropped outside valid targets, cancelled by user, network errors) and specify which component reports success/failure.
- **How should parameter validation errors be exposed to users vs logged internally?** → Clarify error handling strategy - suggest graceful fallbacks with internal logging, and user-facing messages only for recoverable errors.


## Acceptance Criteria to Cover

1. [ ] [ ] SelectionStore created at `packages/react-ui/src/stores/selectionStore.ts`
2. [ ] [ ] spaceId tracks current selection space
3. [ ] [ ] selectedIds Set stores selected item IDs
4. [ ] [ ] lastSelectedId stores anchor for shift-click
5. [ ] [ ] selectSingle clears previous and selects one item
6. [ ] [ ] toggleSelection adds/removes items (Ctrl+Click)
7. [ ] [ ] selectRange selects between anchor and target (Shift+Click)
8. [ ] [ ] selectAll selects all visible items (Ctrl+A)
9. [ ] [ ] clearSelection resets all state
10. [ ] [ ] Selection clears on space switch
11. [ ] [ ] Space context management handles spaceId updates from navigation events
12. [ ] [ ] State clearing occurs before spaceId updates
13. [ ] [ ] isSelected helper works correctly
14. [ ] [ ] getSelectedItems returns array of IDs
15. [ ] [ ] getSelectedItemsForDrag provides items for drag operations
16. [ ] [ ] Integration hooks for dragDropUiStore communication
17. [ ] [ ] Keyboard shortcuts integrate with SPEC-006 focus context
18. [ ] [ ] Ctrl+A selects all items in current context
19. [ ] [ ] Escape clears current selection
20. [ ] [ ] getDragPayload method returns appropriate drag data based on selection state
21. [ ] [ ] onDragInitiated handles selection state during drag start
22. [ ] [ ] onDragCompleted manages selection clearing after drag completion
23. [ ] [ ] Multi-selection drag moves all selected items together
24. [ ] [ ] Single-item drag from multi-selection clears selection first
25. [ ] [ ] getSelectedItemsForClipboard provides items for clipboard operations
26. [ ] [ ] onClipboardCopy returns structured clipboard data for selected items
27. [ ] [ ] onClipboardCut returns clipboard data and marks items for deletion
28. [ ] [ ] onClipboardPasteComplete handles selection state after paste operations
29. [ ] [ ] canPasteClipboardData validates clipboard compatibility with target space
30. [ ] [ ] Selection clears after successful cut operations
31. [ ] [ ] Selection persists during copy operations
32. [ ] [ ] Keyboard navigation respects selection state during focus changes
33. [ ] [ ] Shift+Arrow extends selection range in multi-selection mode
34. [ ] [ ] Arrow keys move focus only without changing selection in multi-selection mode
35. [ ] [ ] Selection state validation occurs before all focus changes
36. [ ] [ ] Parameter validation implemented for all spaceId and itemId inputs
37. [ ] [ ] Error boundaries handle invalid parameters gracefully
38. [ ] [ ] Validation errors logged appropriately without exposing to UI
39. [ ] [ ] Sanitization normalizes parameter formats where possible
40. [ ] [ ] Consistent validation patterns used across all selection methods
41. [ ] [ ] Unit tests for all selection methods
42. [ ] [ ] Edge cases tested (empty selection, no anchor, space switch)
43. [ ] [ ] Selection-drag interaction tests verify coordinated behavior
44. [ ] [ ] Selection-clipboard integration tests verify data flow and state management
45. [ ] [ ] Keyboard navigation coordination tests verify proper selection state handling
46. [ ] [ ] Parameter validation tests cover all error scenarios and edge cases

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
describe('Feature: 013')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec 013`
2. **Run RED phase**: `aasef test tdd-red 013`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
