# TDD Test Task: Spec F008 - Paste Items

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F008
title: Paste Items
type: feature
priority: P0
status: pending
related_specs: ["016"]
affected_files:
  - packages/desktop/src/renderer/App.tsx
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/react-ui/src/utils/spaceItems.ts
  - packages/react-ui/src/stores/expandedFoldersStore.ts
estimated_hours: 4
---

# F008: Paste Items

## User Story

> As a user, I want to paste copied items into a space or folder, so I can duplicate and reorganize my content.

## Context

This feature enables users to paste items from the internal clipboard. Items are pasted with new IDs (true copy), and the entire hierarchy is preserved when pasting folders with children. If a folder is selected, items paste INTO that folder; otherwise they paste at the space root.

## Dependencies

- **F007**: Copy Single Item (must be completed first to have clipboard functionality)

## Screenshots Reference

Based on Flutter app implementation:
- Paste creates duplicate items with new IDs
- Pasted items appear in tree at correct location
- Target folder auto-expands to show newly pasted items
- Entire folder hierarchy is preserved recursively

## Acceptance Criteria

- [ ] Context menu "Paste" → pastes from internal clipboard
- [ ] If folder selected, paste INTO folder as children
- [ ] If no folder selected, paste at space root level
- [ ] Pasted items get new IDs (true copy, not reference)
- [ ] Children copied recursively (preserve complete hierarchy)
- [ ] Auto-expand target folder to show pasted items
- [ ] Keyboard shortcut Cmd+V (Mac) / Ctrl+V (Win) pastes items
- [ ] Paste operations work from both Sidebar and SpaceCard contexts
- [ ] Items persist to database and survive refresh

## Technical Implementation

### Components to Create

1. **pasteItemRecursively utility** - Recursive paste function
   ```typescript
   async function pasteItemRecursively(
     spaceId: string,
     parentId: string | null,
     source: SpaceItem
   ): Promise<void> {
     // Create new item with new ID
     const result = await window.itemsApi.create({
       spaceId,
       parentId,
       name: source.name,
       path: source.path,
       type: source.type,
       faviconUrl: source.faviconUrl,
       description: source.description,
     });
     
     if (!result.ok) {
       console.error('Failed to paste item:', result.error);
       return;
     }
     
     const newItemId = result.value.id;
     
     // Recursively paste children
     if (source.children && source.children.length > 0) {
       for (const child of source.children) {
         await pasteItemRecursively(spaceId, newItemId, child);
       }
     }
   }
   ```

### Components to Update

1. **App.tsx** - Paste handler
   ```typescript
   const handlePaste = async (targetParentId?: string) => {
     const clipboard = clipboardStore.getState();
     
     if (!clipboard || clipboard.items.length === 0) {
       // No items in clipboard (will handle system clipboard in F009)
       return;
     }
     
     // Expand target folder if specified
     if (targetParentId) {
       expandFolder(targetParentId);
     }
     
     // Paste each item recursively
     for (const item of clipboard.items) {
       await pasteItemRecursively(activeSpaceId, targetParentId || null, item);
     }
     
     // Invalidate queries to refresh UI
     queryClient.invalidateQueries({ queryKey: ['space-items', activeSpaceId] });
   };
   ```

2. **TreeItem.tsx** - Context menu paste option
   - Add "Paste" to context menu
   - Show "Paste" only if clipboard has items
   - When clicking paste on folder, call `handlePaste(item.id)`
   - When clicking paste on non-folder or empty space, call `handlePaste()`

3. **Sidebar.tsx** - Handle paste in sidebar context
   - Wire paste handler to context menu
   - Handle paste via keyboard shortcut (Cmd+V / Ctrl+V)

4. **expandedFoldersStore.ts** - Ensure expand function exists
   ```typescript
   export function expandFolder(folderId: string) {
     const current = expandedFoldersStore.getState();
     if (!current.includes(folderId)) {
       expandedFoldersStore.setState([...current, folderId]);
     }
   }
   ```

### State Management

Clipboard state (from F007):
```typescript
interface ClipboardState {
  items: SpaceItem[];
  sourceSpaceId: string;
  action: 'copy' | 'cut';
}
```

Context menu state:
```typescript
// Check if paste should be enabled
const canPaste = clipboardStore.getState()?.items.length > 0;
```

## Flutter Reference

```dart
// Paste handler (main_layout_final.dart:910-969)
Future<void> _handlePaste() async {
  final selectedItem = ref.read(selectedSpaceItemProvider);
  String? targetParentId;

  // If a folder is selected, paste into it
  if (selectedItem != null &&
      selectedItem.spaceId == widget.space.id &&
      selectedItem.item.type == SpaceItemType.folder) {
    targetParentId = selectedItem.item.id;

    // Expand the folder to show pasted items
    final expandedFolders = ref.read(expandedFoldersProvider);
    if (!expandedFolders.contains(targetParentId)) {
      final newSet = Set<String>.from(expandedFolders);
      newSet.add(targetParentId);
      ref.read(expandedFoldersProvider.notifier).state = newSet;
    }
  }

  // First try internal clipboard (SpaceItems)
  final clipboard = ref.read(spaceClipboardProvider);
  if (clipboard != null && clipboard.items.isNotEmpty) {
    for (final item in clipboard.items) {
      await _pasteItemRecursively(widget.space.id, targetParentId, item);
    }
    return;
  }
}

// Paste recursive (main_layout_final.dart:2218-2242)
Future<void> _pasteItemRecursively(
  String spaceId,
  String? parentId,
  SpaceItem source,
) async {
  final newItem = SpaceItem(
    id: ref.read(spacesListProvider.notifier).generateId(),
    name: source.name,
    path: source.path,
    type: source.type,
    faviconUrl: source.faviconUrl,
    description: source.description,
  );

  await ref
      .read(spacesListProvider.notifier)
      .addItemToSpace(spaceId, newItem, parentId: parentId);

  // Recursively paste children
  for (final child in source.children) {
    await _pasteItemRecursively(spaceId, newItem.id, child);
  }
}
```

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:910-969`
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2218-2242`

## Testing Checklist

### Unit Tests
- [ ] `pasteItemRecursively` creates item with new ID
- [ ] `pasteItemRecursively` recursively creates all children
- [ ] `pasteItemRecursively` preserves item properties (name, path, type, etc.)
- [ ] Paste with targetParentId creates item as child of target
- [ ] Paste without targetParentId creates item at root

### Integration Tests
- [ ] Copy folder → Paste → folder duplicated with new ID
- [ ] Pasted folder has different ID than source
- [ ] Paste into folder → items appear inside target folder
- [ ] Paste at root → items appear at space root
- [ ] Children copied recursively with correct parent-child relationships
- [ ] Hierarchy structure preserved (3-level deep folder test)
- [ ] Target folder auto-expands after paste
- [ ] Items persist after page refresh
- [ ] Database contains all pasted items with correct parentId

### Manual Testing
- [ ] Copy folder → Right-click space → Paste → folder appears at root
- [ ] Copy folder → Right-click another folder → Paste → folder appears inside
- [ ] Copy folder with 3 nested children → Paste → all children appear
- [ ] Target folder expands automatically to show pasted items
- [ ] Refresh page → pasted items still present
- [ ] Pasted folder has different ID (check in React DevTools)
- [ ] Paste multiple times → creates multiple copies
- [ ] Works in both Sidebar and SpaceCard contexts


## Acceptance Criteria to Cover

1. [ ] [ ] Context menu "Paste" → pastes from internal clipboard
2. [ ] [ ] If folder selected, paste INTO folder as children
3. [ ] [ ] If no folder selected, paste at space root level
4. [ ] [ ] Pasted items get new IDs (true copy, not reference)
5. [ ] [ ] Children copied recursively (preserve complete hierarchy)
6. [ ] [ ] Auto-expand target folder to show pasted items
7. [ ] [ ] Keyboard shortcut Cmd+V (Mac) / Ctrl+V (Win) pastes items
8. [ ] [ ] Paste operations work from both Sidebar and SpaceCard contexts
9. [ ] [ ] Items persist to database and survive refresh

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
describe('Feature: Paste Items')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec F008`
2. **Run RED phase**: `aasef test tdd-red F008`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
