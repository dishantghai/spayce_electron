# TDD Test Task: Spec B002 - Page Title Extraction Failing for Paste Link Trajectories

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# [BUG] Page Title Extraction Failing for Paste Link Trajectories

## Description
When users paste URLs to create trajectory links, the page title extraction is failing, resulting in trajectories with generic or missing titles instead of the actual page titles. This degrades the user experience as trajectory links become difficult to identify and organize.

## Acceptance Criteria
- [ ] Pasted URLs automatically extract and display the correct page title
- [ ] Title extraction works for common website types (news, blogs, documentation, etc.)
- [ ] Fallback to URL domain when title extraction fails
- [ ] Loading state shows while title is being fetched
- [ ] Error handling for inaccessible URLs or network failures
- [ ] Title extraction respects CORS policies and doesn't cause security issues

## Context
This affects the trajectory creation workflow in the spaces screen. Users expect pasted links to show meaningful titles rather than raw URLs or generic placeholders. The issue likely involves the web scraping/metadata extraction logic in the trajectory creation process.

**Architecture considerations:**
- Title extraction should happen in main process (Node.js context) to avoid CORS issues
- Use IPC bridge pattern for renderer → main → renderer communication
- Follow clean architecture with repository pattern for external data fetching
- Implement proper error boundaries and loading states in React components

## Tasks
- [ ] Investigate current title extraction implementation in trajectory creation
- [ ] Identify failure points (network, parsing, CORS, etc.)
- [ ] Implement robust HTML title tag extraction with fallbacks
- [ ] Add proper error handling and user feedback
- [ ] Create loading states for async title fetching
- [ ] Add tests for various URL types and edge cases
- [ ] Update trajectory creation UI to handle async title updates

## Notes
- Consider using libraries like `cheerio` for HTML parsing in main process
- Implement timeout mechanisms for slow-loading pages
- May need to handle single-page applications differently (wait for JS execution)
- Ensure compliance with robots.txt and rate limiting for scraping

## Acceptance Criteria to Cover

1. [ ] [ ] Pasted URLs automatically extract and display the correct page title
2. [ ] [ ] Title extraction works for common website types (news, blogs, documentation, etc.)
3. [ ] [ ] Fallback to URL domain when title extraction fails
4. [ ] [ ] Loading state shows while title is being fetched
5. [ ] [ ] Error handling for inaccessible URLs or network failures
6. [ ] [ ] Title extraction respects CORS policies and doesn't cause security issues

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
describe('Feature: Page Title Extraction Failing for Paste Link Trajectories')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec B002`
2. **Run RED phase**: `aasef test tdd-red B002`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
