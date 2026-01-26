# TDD Test Task: Spec F010 - Keyboard Shortcuts (Copy/Paste)

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F010
title: Keyboard Shortcuts (Copy/Paste)
type: feature
priority: P0
status: pending
related_specs: ["016"]
affected_files:
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
  - packages/desktop/src/renderer/App.tsx
estimated_hours: 2
---

# F010: Keyboard Shortcuts (Copy/Paste)

## User Story

> As a user, I want to use Cmd+C and Cmd+V to copy and paste items, so I can work efficiently with keyboard shortcuts.

## Context

This feature adds keyboard shortcuts for copy and paste operations, enabling power users to work more efficiently. Shortcuts only activate when the sidebar/tree view has focus to avoid conflicts with other inputs. Multi-selection is supported for copying multiple items at once.

## Dependencies

- **F007**: Copy Single Item (provides copy functionality)
- **F008**: Paste Items (provides paste functionality)

## Screenshots Reference

Based on Flutter app implementation:
- Cmd+C (Mac) / Ctrl+C (Win) copies selected item(s)
- Cmd+V (Mac) / Ctrl+V (Win) pastes items
- Shortcuts respect focus state (only work when sidebar active)
- Multi-selection supported (Cmd+C on multiple items)

## Acceptance Criteria

- [ ] Cmd+C (Mac) / Ctrl+C (Win) → copies selected item(s)
- [ ] Cmd+V (Mac) / Ctrl+V (Win) → pastes clipboard contents
- [ ] Shortcuts only work when sidebar/tree has focus
- [ ] Multiple selected items all copied together
- [ ] Single link copy → also copies URL to system clipboard
- [ ] Paste into selected folder if folder is selected
- [ ] Paste at root if no folder selected
- [ ] Shortcuts don't interfere with text inputs or other UI elements
- [ ] Works in both Sidebar and SpaceCard contexts

## Technical Implementation

### Components to Update

1. **Sidebar.tsx** - Keyboard event handler
   ```typescript
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       // Only handle if sidebar has focus (not in text input)
       if (!sidebarRef.current?.contains(document.activeElement)) {
         return;
       }
       
       // Skip if actively editing (inline input, rename, etc.)
       if (document.activeElement?.tagName === 'INPUT' || 
           document.activeElement?.tagName === 'TEXTAREA') {
         return;
       }
       
       const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
       const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
       
       // Cmd+C / Ctrl+C - Copy
       if (isCmdOrCtrl && e.key === 'c') {
         e.preventDefault();
         handleCopySelected();
       }
       
       // Cmd+V / Ctrl+V - Paste
       if (isCmdOrCtrl && e.key === 'v') {
         e.preventDefault();
         handlePasteToSelected();
       }
     };
     
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [handleCopySelected, handlePasteToSelected]);
   ```

2. **App.tsx** - Copy/Paste handlers for keyboard
   ```typescript
   const handleCopySelected = () => {
     const selection = selectionStore.getState();
     const selectedItem = getSelectedItem();
     
     if (selection && selection.selectedIds.size > 0) {
       // Multi-select copy
       const items = getItemsByIds(activeSpace, Array.from(selection.selectedIds));
       clipboardStore.copyItems(items, activeSpaceId);
       
       // If single link, also copy URL to system clipboard
       if (items.length === 1 && items[0].type === 'link') {
         window.electronApi.clipboard.writeText(items[0].path);
       }
     } else if (selectedItem) {
       // Single item copy
       clipboardStore.copyItems([selectedItem], activeSpaceId);
       
       if (selectedItem.type === 'link') {
         window.electronApi.clipboard.writeText(selectedItem.path);
       }
     }
   };
   
   const handlePasteToSelected = () => {
     const selectedItem = getSelectedItem();
     
     // If folder selected, paste into it; otherwise paste at root
     const targetParentId = selectedItem?.type === 'folder' ? selectedItem.id : undefined;
     handlePaste(targetParentId);
   };
   
   // Helper to get items by IDs from tree
   const getItemsByIds = (space: Space, ids: string[]): SpaceItem[] => {
     const items: SpaceItem[] = [];
     
     function findItems(node: SpaceItem) {
       if (ids.includes(node.id)) {
         items.push(node);
       }
       if (node.children) {
         node.children.forEach(findItems);
       }
     }
     
     space.rootItems.forEach(findItems);
     return items;
   };
   ```

3. **SpaceCard.tsx** - Same keyboard handling for card context
   - Duplicate keyboard event handler logic
   - Use card-specific selection state
   - Wire to same copy/paste handlers

### Focus Management

Ensure shortcuts only fire when:
1. Sidebar/card has focus (container contains `document.activeElement`)
2. NOT actively editing text (no INPUT or TEXTAREA focused)
3. NOT in inline input mode
4. NOT in rename mode

### Multi-Selection Support

When multiple items selected:
- Copy all selected items to clipboard
- Do NOT copy to system clipboard (only for single link)
- Paste creates copies of all items

## Flutter Reference

```dart
// Keyboard handler (main_layout_final.dart:800-908)
KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
  if (event is! KeyDownEvent) return KeyEventResult.ignored;
  
  final isMetaPressed = HardwareKeyboard.instance.isMetaPressed;
  final isControlPressed = HardwareKeyboard.instance.isControlPressed;
  final isCmdOrCtrl = Platform.isMacOS ? isMetaPressed : isControlPressed;
  
  // Cmd+C / Ctrl+C - Copy
  if (isCmdOrCtrl && event.logicalKey == LogicalKeyboardKey.keyC) {
    _copySelectedItems();
    return KeyEventResult.handled;
  }
  
  // Cmd+V / Ctrl+V - Paste
  if (isCmdOrCtrl && event.logicalKey == LogicalKeyboardKey.keyV) {
    _handlePaste();
    return KeyEventResult.handled;
  }
  
  return KeyEventResult.ignored;
}

void _copySelectedItems() {
  final multiSelection = ref.read(multiSelectionProvider);
  final selectedItem = ref.read(selectedSpaceItemProvider);
  
  if (multiSelection != null && multiSelection.selectedIds.isNotEmpty) {
    // Copy multiple selected items
    final items = _getItemsByIds(widget.space, multiSelection.selectedIds);
    clipboardStore.copyItems(items, widget.space.id);
    
    // If single link, also copy URL to system clipboard
    if (items.length == 1 && items.first.type == SpaceItemType.link) {
      Clipboard.setData(ClipboardData(text: items.first.path));
    }
  } else if (selectedItem != null) {
    // Copy single selected item
    clipboardStore.copyItems([selectedItem.item], selectedItem.spaceId);
    
    if (selectedItem.item.type == SpaceItemType.link) {
      Clipboard.setData(ClipboardData(text: selectedItem.item.path));
    }
  }
}
```

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:800-908`

## Testing Checklist

### Unit Tests
- [ ] `handleCopySelected` with single item → clipboard has item
- [ ] `handleCopySelected` with single link → system clipboard has URL
- [ ] `handleCopySelected` with multiple items → clipboard has all items
- [ ] `handleCopySelected` with no selection → no error
- [ ] `handlePasteToSelected` with folder selected → paste into folder
- [ ] `handlePasteToSelected` with link selected → paste at root
- [ ] `getItemsByIds` finds all items by ID correctly

### Integration Tests
- [ ] Cmd+C on selected folder → folder copied to clipboard
- [ ] Cmd+C on selected link → URL in system clipboard
- [ ] Cmd+V → items pasted from clipboard
- [ ] Cmd+C with multi-select → all items copied
- [ ] Keyboard shortcuts only fire when sidebar has focus
- [ ] Shortcuts ignored when input field focused
- [ ] Shortcuts ignored during inline input mode
- [ ] Shortcuts work in both Sidebar and SpaceCard

### Manual Testing
- [ ] Select folder → Cmd+C → Cmd+V → folder duplicated
- [ ] Select link → Cmd+C → URL copied (can paste in browser)
- [ ] Select 3 items (multi-select) → Cmd+C → Cmd+V → all 3 pasted
- [ ] Select folder → Cmd+V → items pasted inside folder
- [ ] Cmd+C while typing in search → doesn't copy items (ignored)
- [ ] Cmd+V while renaming item → doesn't paste (ignored)
- [ ] Click outside sidebar → Cmd+C → nothing happens (no focus)
- [ ] Works consistently in both Sidebar and SpaceCard
- [ ] Mac: Cmd+C/V works, Windows: Ctrl+C/V works


## Acceptance Criteria to Cover

1. [ ] [ ] Cmd+C (Mac) / Ctrl+C (Win) → copies selected item(s)
2. [ ] [ ] Cmd+V (Mac) / Ctrl+V (Win) → pastes clipboard contents
3. [ ] [ ] Shortcuts only work when sidebar/tree has focus
4. [ ] [ ] Multiple selected items all copied together
5. [ ] [ ] Single link copy → also copies URL to system clipboard
6. [ ] [ ] Paste into selected folder if folder is selected
7. [ ] [ ] Paste at root if no folder selected
8. [ ] [ ] Shortcuts don't interfere with text inputs or other UI elements
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
describe('Feature: Keyboard Shortcuts (Copy/Paste)')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec F010`
2. **Run RED phase**: `aasef test tdd-red F010`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
