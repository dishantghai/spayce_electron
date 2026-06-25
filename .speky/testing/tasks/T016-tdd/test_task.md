# TDD Test Task: Spec 016 - 016

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

# Spec 016: Clipboard State Management

## Overview
Implement internal clipboard state management for copy/paste operations of SpaceItems, supporting both internal clipboard and system clipboard integration.

## Dependencies
- SPEC-007: Core Domain Layer (SpaceItem entity)
- SPEC-010: React UI Integration (Zustand stores)
- SPEC-012: Inline Input Store (validation patterns)
- SPEC-013: Multi-selection (for multi-item clipboard operations)
- SPEC-014: Drag-drop (for shared position validation logic)

## MVP Scope

### In Scope
- Internal clipboard store with copy/cut/paste actions
- System clipboard integration for URLs (IPC handlers)
- Multi-selection integration with SPEC-013
- Paste position support (before/after/inside)
- Basic paste validation (target compatibility, circular reference prevention)

### Out of Scope (Deferred)
- Clipboard history/multiple entries
- Rich media clipboard (images, files)
- Clipboard encryption or persistence
- Cross-application sharing beyond URLs
- Advanced memory/size optimization

## Requirements

### R1: Clipboard Store (Zustand)
- Store copied items with source space ID
- Track clipboard action (copy/cut)
- Clear clipboard on paste
- Support multiple items for multi-selection

### R2: System Clipboard Integration
- IPC handlers for system clipboard read/write
- Detect URL pattern in system clipboard
- URL detection regex: `/^https?:\/\/|^[^\s]+\.[^\s]+$/`

**Error Handling:**
- On IPC failure: fallback to internal clipboard only
- Invalid URL: treat as plain text
- Show toast notification for clipboard errors

### R3: Paste Operations
- **pasteItems**: Execute paste to target location
- **canPaste**: Validate paste target compatibility
- **Position support**: 'before', 'after', 'inside'
- **Operation handling**: Move for cut, duplicate for copy
- **Clear after paste**: Reset clipboard state

### R3.1: Paste Validation Rules

| Target Type | Can Accept |
|-------------|-----------|
| Folder | Any item (inside/before/after) |
| Space Root | Folders, links (inside only) |
| Link/Note | N/A (before/after only, not inside) |
| Pins Grid | Links only |

**Validation Checks:**
- Target can accept item type
- No circular references (folder into its subtree)
- No duplicate names in target container

### R3.2: Position Support Matrix

| Item Type | 'before' | 'after' | 'inside' |
|-----------|----------|---------|----------|
| Folder | ✓ | ✓ | ✓ |
| Note | ✓ | ✓ | ✗ |
| Link | ✓ | ✓ | ✗ |

### R4: Clipboard State Interface

```typescript
type ClipboardAction = 'copy' | 'cut';

interface ClipboardState {
  items: SpaceItem[];
  sourceSpaceId: string | null;
  action: ClipboardAction | null;
  
  copyItems: (items: SpaceItem[], spaceId: string) => void;
  cutItems: (items: SpaceItem[], spaceId: string) => void;
  pasteItems: (targetId: string, position?: 'before' | 'after' | 'inside') => Promise<void>;
  canPaste: (targetId: string) => boolean;
  clear: () => void;
  hasItems: () => boolean;
}
```

### R5: IPC Clipboard Handlers

```typescript
// packages/desktop/src/main/ipc/handlers/clipboardHandlers.ts
ipcMain.handle('clipboard:readText', () => clipboard.readText());
ipcMain.handle('clipboard:writeText', (_, text: string) => clipboard.writeText(text));
```

### R6: Multi-selection Integration
- Use SPEC-013's `getSelectedItems()` for multi-item operations
- Use SPEC-013's `clearSelection()` after paste
- When no selection, use focused item as fallback
- Disable clipboard UI when no valid target available

### R7: State Coordination
After successful paste:
1. Clear clipboard state
2. Clear selection state (SPEC-013)
3. Update UI indicators

## Technical Implementation

### File Structure
```
packages/
├── desktop/src/main/ipc/handlers/clipboardHandlers.ts
├── desktop/src/preload/index.ts (expose clipboard API)
└── react-ui/src/stores/clipboardStore.ts
```

### Keyboard Shortcuts
- **Ctrl+C**: Copy selected items
- **Ctrl+X**: Cut selected items  
- **Ctrl+V**: Paste at current target

## Acceptance Criteria
- [ ] ClipboardStore created at `packages/react-ui/src/stores/clipboardStore.ts`
- [ ] copyItems/cutItems methods work correctly
- [ ] pasteItems executes with position support
- [ ] canPaste validates target compatibility
- [ ] Circular reference prevention implemented
- [ ] IPC handlers for clipboard:readText and clipboard:writeText
- [ ] URL detection from system clipboard works
- [ ] Integration with SPEC-013 selection state
- [ ] Keyboard shortcuts Ctrl+C/X/V work
- [ ] Clear clipboard after successful paste
- [ ] Fallback to internal clipboard on IPC error
- [ ] Unit tests for clipboard operations

## Estimated Duration
4 hours

## Reference Files

### Flutter Source
- `main_layout_final.dart:125-142` - ClipboardAction enum and SpaceClipboardState class
- `main_layout_final.dart:127-128` - ClipboardAction enum definition

### Electron Target
- `packages/react-ui/src/stores/clipboardStore.ts` - Create this file
- `packages/desktop/src/main/ipc/handlers/clipboardHandlers.ts` - Create this file
- `packages/desktop/src/preload/index.ts` - Expose clipboard API

## Resolved Questions (Pre-Planning)
- **What should happen when pasting items from a different space than the current one?** → the cross space pasting as it shoudl be pasting something is a independent of where its copied from and should be kept that way. Source REmains as-is paste adds new item to where its pasted.
- **Should the clipboard persist across application restarts or be memory-only?** → Make it memory-only for MVP, clearing on app restart for simplicity.
- **How should the URL detection regex handle edge cases like localhost URLs, IP addresses, or URLs with ports?** → Expand regex to include `localhost`, IP addresses, and port numbers, or use a more robust URL validation library.
- **What should be the default paste position when position parameter is not provided?** → Default to 'inside' for containers (folders, space root) and 'after' for non-containers.
- **Should cut items be visually indicated (dimmed/grayed out) in the UI until pasted or operation is cancelled?** → Add a `getCutItems()` method to the store so UI components can query and style cut items appropriately.
- **What happens if a cut item is deleted or modified before the paste operation completes?** → Validate cut items still exist and are unchanged before paste, clear clipboard if validation fails.
- **Should there be a maximum limit on the number of items that can be copied to prevent memory issues?** → Start without limits for MVP, add reasonable limit (e.g., 100 items) if performance issues arise.


## Acceptance Criteria to Cover

1. [ ] [ ] ClipboardStore created at `packages/react-ui/src/stores/clipboardStore.ts`
2. [ ] [ ] copyItems/cutItems methods work correctly
3. [ ] [ ] pasteItems executes with position support
4. [ ] [ ] canPaste validates target compatibility
5. [ ] [ ] Circular reference prevention implemented
6. [ ] [ ] IPC handlers for clipboard:readText and clipboard:writeText
7. [ ] [ ] URL detection from system clipboard works
8. [ ] [ ] Integration with SPEC-013 selection state
9. [ ] [ ] Keyboard shortcuts Ctrl+C/X/V work
10. [ ] [ ] Clear clipboard after successful paste
11. [ ] [ ] Fallback to internal clipboard on IPC error
12. [ ] [ ] Unit tests for clipboard operations

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
describe('Feature: 016')
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

1. **Link tests to spec**: `speky test link <test-file> --spec 016`
2. **Run RED phase**: `speky test tdd-red 016`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
