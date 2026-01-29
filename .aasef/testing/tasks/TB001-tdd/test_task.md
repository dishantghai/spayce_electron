# TDD Test Task: Spec B001 - Remove 'Rename' from Pinned Items Context Menu

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# [BUG] Remove 'Rename' from Pinned Items Context Menu

## Description
The context menu for pinned items in the sidebar incorrectly shows a "Rename" option. Pinned items are references to existing spaces/files and should not be renameable from the pinned context - renaming should only be available from the original item's context menu. This creates confusion and potential data inconsistency.

## Acceptance Criteria
- [ ] "Rename" option is removed from pinned items context menu
- [ ] Other context menu options (unpin, open, etc.) remain functional
- [ ] Renaming is still available from the original item's context menu in spaces/files list
- [ ] No visual artifacts or layout issues in the updated context menu
- [ ] Context menu behavior is consistent across all pinned item types

## Context
- Pinned items are stored references, not the actual items themselves
- The sidebar uses independent focus management from the main spaces screen
- Context menus are likely implemented in `packages/react-ui/` or `packages/shared/`
- May involve updating context menu component props or conditional rendering logic

## Tasks
- [ ] Locate pinned items context menu component
- [ ] Remove "Rename" option from pinned items context menu
- [ ] Verify other context menu options still work correctly
- [ ] Test with different pinned item types (spaces, files, etc.)
- [ ] Update any related tests

## Notes
- Ensure the change only affects pinned items context menu, not the original items' context menus
- Consider if this change requires updating any user documentation or tooltips
- Verify the fix works consistently across different sidebar modes (fixed/floating)

## Acceptance Criteria to Cover

1. [ ] [ ] "Rename" option is removed from pinned items context menu
2. [ ] [ ] Other context menu options (unpin, open, etc.) remain functional
3. [ ] [ ] Renaming is still available from the original item's context menu in spaces/files list
4. [ ] [ ] No visual artifacts or layout issues in the updated context menu
5. [ ] [ ] Context menu behavior is consistent across all pinned item types

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
describe('Feature: Remove 'Rename' from Pinned Items Context Menu')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec B001`
2. **Run RED phase**: `aasef test tdd-red B001`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
