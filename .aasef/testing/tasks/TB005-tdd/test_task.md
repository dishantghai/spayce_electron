# TDD Test Task: Spec B005 - Browser content goes blank when context menu opens in fixed sidebar mode

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# [BUG] Browser content goes blank when context menu opens in fixed sidebar mode

## Description
When the sidebar is in fixed mode and a context menu is opened (right-click on browser content, bookmarks, or other elements), the browser content area becomes blank/white until the context menu is dismissed. This only occurs in fixed sidebar mode - floating sidebar mode works correctly.

## Acceptance Criteria
- [ ] Browser content remains visible when context menus open in fixed sidebar mode
- [ ] Context menus function normally without affecting browser content visibility
- [ ] Fixed sidebar mode behaves consistently with floating sidebar mode for context menu interactions
- [ ] No visual artifacts or flashing when context menus appear/disappear
- [ ] Browser content maintains proper focus state after context menu dismissal

## Context
This appears to be a WebContentsView rendering issue specific to fixed sidebar layout. The problem likely stems from:
- Z-index conflicts between context menu overlay and WebContentsView
- Focus management issues when context menu captures input
- Potential Electron renderer process coordination problems between sidebar and browser content

Key areas to investigate:
- `packages/desktop/` - Electron main process WebContentsView management
- Sidebar layout CSS in fixed mode vs floating mode
- Context menu implementation and overlay handling
- Focus management between sidebar and browser content contexts

## Tasks
- [ ] Reproduce the bug consistently in fixed sidebar mode
- [ ] Compare WebContentsView handling between fixed and floating modes
- [ ] Investigate z-index and overlay conflicts with context menus
- [ ] Check focus management during context menu interactions
- [ ] Test context menu behavior across different browser content types
- [ ] Implement fix ensuring WebContentsView remains visible
- [ ] Add regression tests for context menu interactions in both sidebar modes

## Notes
- This is likely an Electron-specific rendering issue rather than a React component problem
- May need to adjust WebContentsView positioning or z-index handling in fixed mode
- Consider if this affects other overlay elements (tooltips, dropdowns) in fixed mode
- Ensure fix doesn't break existing context menu functionality

## Acceptance Criteria to Cover

1. [ ] [ ] Browser content remains visible when context menus open in fixed sidebar mode
2. [ ] [ ] Context menus function normally without affecting browser content visibility
3. [ ] [ ] Fixed sidebar mode behaves consistently with floating sidebar mode for context menu interactions
4. [ ] [ ] No visual artifacts or flashing when context menus appear/disappear
5. [ ] [ ] Browser content maintains proper focus state after context menu dismissal

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
describe('Feature: Browser content goes blank when context menu opens in fixed sidebar mode')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec B005`
2. **Run RED phase**: `aasef test tdd-red B005`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
