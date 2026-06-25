# TDD Test Task: Spec F003 - Inline Rename Items

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F003
title: Inline Rename Items
type: feature
priority: P0
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/InlineRenameInput.tsx
  - packages/react-ui/src/components/InlineRenameInput.module.css
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/ContextMenu.tsx
  - packages/react-ui/src/stores/inlineInputStore.ts
estimated_hours: 4
---

# F003: Inline Rename Items

## User Story

> As a user, I want to rename a folder or link by selecting "Rename" from the context menu and editing inline, so I can quickly fix names without interruption.

## Context

This feature enables inline renaming of folders and links. When "Rename" is selected from the context menu, the item's name is replaced with an editable text input pre-filled with the current name.

**Important**: When renaming a link, only the display name changes. The actual URL (path) is preserved for all functional purposes.

## Screenshots Reference

Based on Flutter app screenshots:
- Image 3: Shows inline rename input with "Spayce" text selected
- Image 6: Shows context menu with "Rename" option (pencil icon)

## Acceptance Criteria

- [ ] Context menu "Rename" → replaces item name with text input
- [ ] Input pre-filled with current name, all text selected
- [ ] Press Enter → saves new name
- [ ] Press Escape → cancels, reverts to original
- [ ] Click outside with changes → saves
- [ ] Click outside without changes → cancels
- [ ] Empty name not allowed (validation)
- [ ] For links: only name changes, path (URL) preserved
- [ ] Works in both Sidebar and SpaceCard contexts

## Technical Implementation

### Components to Create

1. **InlineRenameInput.tsx** - Inline rename input component
   ```typescript
   interface InlineRenameInputProps {
     item: SpaceItem;
     spaceId: string;
     context: 'sidebar' | 'card';
     onComplete: () => void;
   }
   ```
   - Pre-fill with item.name
   - Auto-focus and select all on mount
   - Handle Enter (save), Escape (cancel)
   - Handle blur (save if changed, cancel if not)
   - Validate non-empty

2. **InlineRenameInput.module.css** - Styles
   - Match tree item row height
   - Accent color border on focus
   - Seamless integration with tree row

### Components to Update

1. **TreeItem.tsx**
   - Check if `inlineInputStore.isRenaming(item.id, context)`
   - If true, render InlineRenameInput instead of item name
   - Pass onComplete callback to clear rename state

2. **ContextMenu.tsx** (or context menu handler)
   - "Rename" action calls `setSidebarRenameItemId(item.id)` or `setCardRenameItemId(item.id)`

3. **inlineInputStore.ts** (already exists)
   - Already has `sidebarRenameItemId` and `cardRenameItemId`
   - Already has `isRenaming(itemId, context)` helper

### Rename Logic

```typescript
const handleSave = async () => {
  const newName = inputValue.trim();
  
  // Validation: non-empty
  if (!newName) {
    onComplete(); // Cancel if empty
    return;
  }
  
  // Only save if changed
  if (newName !== item.name) {
    await renameItem(item.id, newName);
  }
  
  onComplete();
};

const handleCancel = () => {
  onComplete();
};

// On blur
const handleBlur = () => {
  const newName = inputValue.trim();
  if (newName && newName !== item.name) {
    handleSave();
  } else {
    handleCancel();
  }
};
```

### Context Menu Integration

```typescript
// In context menu handler
case 'rename':
  if (context === 'sidebar') {
    setSidebarRenameItemId(item.id);
  } else {
    setCardRenameItemId(item.id);
  }
  break;
```

## Flutter Reference

```dart
// InlineRenameInput (main_layout_final.dart:3300-3393)
class _InlineRenameInputState extends ConsumerState<_InlineRenameInput> {
  late TextEditingController _controller;
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.item.name);
    // Select all text on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
      _controller.selection = TextSelection(
        baseOffset: 0,
        extentOffset: _controller.text.length,
      );
    });
  }

  void _saveRename() {
    final newName = _controller.text.trim();
    if (newName.isNotEmpty && newName != widget.item.name) {
      ref.read(spacesListProvider.notifier).renameItem(widget.item.id, newName);
    }
    widget.onComplete();
  }
}
```

## Design System Tokens

```typescript
// Input styling
fillColor: SpayceColors.surfaceDark,      // #1A1628
borderColor: SpayceColors.primary,         // #6D5AE6
focusBorderColor: SpayceColors.primary,
textColor: SpayceColors.textPrimary,       // #E5E7EB
fontSize: 13px
borderRadius: 4px
padding: 4px horizontal, 4px vertical
borderWidth: 1px (normal), 2px (focused)
```

## Testing Checklist

### Unit Tests
- [ ] InlineRenameInput renders with item name pre-filled
- [ ] Text is selected on mount
- [ ] Enter key triggers save with new name
- [ ] Escape key triggers cancel without saving
- [ ] Empty name validation prevents save
- [ ] Blur with changes triggers save
- [ ] Blur without changes triggers cancel

### Integration Tests
- [ ] Context menu "Rename" shows inline input
- [ ] Rename persists to database
- [ ] Tree item updates with new name
- [ ] Link URL preserved after rename

### Manual Testing
- [ ] Right-click → Rename → input appears with name
- [ ] Name is pre-selected
- [ ] Type new name, Enter → saved
- [ ] Press Escape → reverted to original
- [ ] Click outside with changes → saved
- [ ] Empty name blocked
- [ ] Rename persists after refresh
- [ ] Link still opens correct URL after rename


## Acceptance Criteria to Cover

1. [ ] [ ] Context menu "Rename" → replaces item name with text input
2. [ ] [ ] Input pre-filled with current name, all text selected
3. [ ] [ ] Press Enter → saves new name
4. [ ] [ ] Press Escape → cancels, reverts to original
5. [ ] [ ] Click outside with changes → saves
6. [ ] [ ] Click outside without changes → cancels
7. [ ] [ ] Empty name not allowed (validation)
8. [ ] [ ] For links: only name changes, path (URL) preserved
9. [ ] [ ] Works in both Sidebar and SpaceCard contexts

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
describe('Feature: Inline Rename Items')
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

1. **Link tests to spec**: `speky test link <test-file> --spec F003`
2. **Run RED phase**: `speky test tdd-red F003`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
