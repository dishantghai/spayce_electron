# TDD Test Task: Spec 012 - 012

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# Spec 012: Inline Input State Management

> **Foundation Spec**: This is the base state management spec for the 012-016 sequence. It has no dependencies on other specs in this range.

## Overview
Implement state management for inline folder/link creation inputs, supporting both sidebar and space card contexts with separate state tracking.

## Requirements

### R1: Inline Input Store (Zustand)
- Track active inline input (spaceId, parentId, type)
- Separate state for sidebar vs space cards
- Clear state on submit/cancel
- Support folder and link creation types
- Track parent ID for nested creation

### R2: Inline Input State Interface
```typescript
type InlineInputType = 'folder' | 'link';

interface InlineInputState {
  spaceId: string;
  parentId: string | null;
  type: InlineInputType;
}

interface InlineInputStore {
  // Sidebar inline input
  sidebarInput: InlineInputState | null;
  setSidebarInput: (state: InlineInputState | null) => void;
  clearSidebarInput: () => void;
  
  // Space card inline input
  cardInput: InlineInputState | null;
  setCardInput: (state: InlineInputState | null) => void;
  clearCardInput: () => void;
  
  // Rename state (combined)
  sidebarRenameItemId: string | null;
  setSidebarRenameItemId: (id: string | null) => void;
  
  cardRenameItemId: string | null;
  setCardRenameItemId: (id: string | null) => void;
}
```

### R3: Context Separation
- Sidebar inline input should not affect space card inline input
- Each context maintains independent state
- Switching spaces should preserve appropriate inline states
- Rename state is also context-separated

### R4: Type Safety
- InlineInputType restricted to 'folder' | 'link'
- parentId is nullable (null for root level items)
- spaceId is always required
- Type guards for state validation

## Acceptance Criteria
- [ ] InlineInputStore created at `packages/react-ui/src/stores/inlineInputStore.ts`
- [ ] Sidebar input state (spaceId, parentId, type) working
- [ ] Card input state (spaceId, parentId, type) working
- [ ] Rename item ID state for sidebar working
- [ ] Rename item ID state for cards working
- [ ] setSidebarInput sets state correctly
- [ ] setCardInput sets state correctly
- [ ] clearSidebarInput resets sidebar state only
- [ ] clearCardInput resets card state only
- [ ] Unit tests for all store methods
- [ ] Type safety enforced with TypeScript

## Dependencies
- SPEC-010: React UI Integration (Zustand stores)

## Estimated Duration
2 hours

## Reference Files

### Flutter Source
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:108-109` - InlineInputType enum
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:111-121` - InlineInputState class
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:123` - inlineInputProvider
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/spaces/presentation/widgets/space_card_hifi_v2.dart:42-58` - Card inline input usage

### Electron Target
- `packages/react-ui/src/stores/inlineInputStore.ts` - Create this file
- `packages/react-ui/src/types/index.ts` - Add InlineInputType and InlineInputState types

## Implementation Notes
- Store should be simple and synchronous (no async operations)
- Consider auto-clearing inline input when switching spaces
- Rename state is combined with input state for simplicity
- Use null to represent "no active input" or "no rename in progress"


## Resolved Questions (Pre-Planning)
- **Should inline input state be automatically cleared when switching spaces?** → Auto-clear inline input when switching spaces to avoid confusion and ensure inputs are always contextually relevant to the current space.
- **What should happen to rename state when switching spaces?** → Clear rename state when switching spaces since renamed items are space-specific and maintaining rename state across spaces could lead to invalid operations.


## Acceptance Criteria to Cover

1. [ ] [ ] InlineInputStore created at `packages/react-ui/src/stores/inlineInputStore.ts`
2. [ ] [ ] Sidebar input state (spaceId, parentId, type) working
3. [ ] [ ] Card input state (spaceId, parentId, type) working
4. [ ] [ ] Rename item ID state for sidebar working
5. [ ] [ ] Rename item ID state for cards working
6. [ ] [ ] setSidebarInput sets state correctly
7. [ ] [ ] setCardInput sets state correctly
8. [ ] [ ] clearSidebarInput resets sidebar state only
9. [ ] [ ] clearCardInput resets card state only
10. [ ] [ ] Unit tests for all store methods
11. [ ] [ ] Type safety enforced with TypeScript

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
describe('Feature: 012')
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

1. **Link tests to spec**: `speky test link <test-file> --spec 012`
2. **Run RED phase**: `speky test tdd-red 012`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
