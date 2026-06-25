# TDD Test Task: Spec F007 - Copy Single Item

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F007
title: Copy Single Item
type: feature
priority: P0
status: pending
related_specs: ["016"]
affected_files:
  - packages/react-ui/src/stores/clipboardStore.ts
  - packages/react-ui/src/utils/spaceItems.ts
  - packages/desktop/src/renderer/App.tsx
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/desktop/src/main/electron-api.ts
estimated_hours: 3
---

# F007: Copy Single Item

## User Story

> As a user, I want to copy a folder or link and paste it elsewhere, so I can organize my content efficiently.

## Context

This feature enables users to copy items (folders and links) via context menu. Links are copied to both internal clipboard (for pasting in Spayce) and system clipboard (for pasting URLs in other apps). The "Copy All Links" feature recursively collects all nested links from a folder.

## Screenshots Reference

Based on Flutter app implementation:
- Context menu shows "Copy Link", "Copy Folder", or "Copy All Links" options
- System clipboard receives URL(s) when copying links
- Internal clipboard stores full SpaceItem data for pasting within Spayce

## Acceptance Criteria

- [ ] Context menu "Copy Folder" → copies folder to internal clipboard
- [ ] Context menu "Copy Link" → copies link to internal clipboard AND URL to system clipboard
- [ ] Context menu "Copy All Links" → copies all nested links AND URLs to system clipboard (newline separated)
- [ ] Keyboard shortcut Cmd+C (Mac) / Ctrl+C (Win) copies selected item
- [ ] Copy operations work from both Sidebar and SpaceCard contexts
- [ ] Clipboard state persists until new copy or paste operation

## Technical Implementation

### Components to Create

1. **clipboardStore.ts** - Enhanced clipboard store
   - State: `{ items: SpaceItem[], sourceSpaceId: string, action: 'copy' | 'cut' }`
   - Actions: `copyItems(items, sourceSpaceId)`, `clear()`, `getState()`
   - Persist clipboard state globally across spaces

2. **spaceItems.ts utilities** - Helper functions
   ```typescript
   export function collectLinksRecursive(item: SpaceItem): SpaceItem[] {
     const links: SpaceItem[] = [];
     
     function collect(node: SpaceItem) {
       if (node.type === 'link') {
         links.push(node);
       }
       if (node.children) {
         node.children.forEach(collect);
       }
     }
     
     collect(item);
     return links;
   }
   
   export function hasLinksRecursive(item: SpaceItem): boolean {
     if (item.type === 'link') return true;
     if (item.children) {
       return item.children.some(hasLinksRecursive);
     }
     return false;
   }
   ```

### Components to Update

1. **App.tsx** - Copy action handlers
   ```typescript
   const handleCopyLink = (item: SpaceItem) => {
     clipboardStore.copyItems([item], activeSpaceId);
     window.electronApi.clipboard.writeText(item.path);
   };
   
   const handleCopyFolder = (item: SpaceItem) => {
     clipboardStore.copyItems([item], activeSpaceId);
   };
   
   const handleCopyAllLinks = (item: SpaceItem) => {
     const links = collectLinksRecursive(item);
     if (links.length > 0) {
       clipboardStore.copyItems(links, activeSpaceId);
       const urls = links.map(l => l.path).join('\n');
       window.electronApi.clipboard.writeText(urls);
     }
   };
   ```

2. **TreeItem.tsx** - Wire up context menu actions
   - Add "Copy Folder" / "Copy Link" to context menu
   - Add "Copy All Links" for folders that contain links
   - Conditionally show "Copy All Links" only if folder has nested links

3. **electron-api.ts** - Add clipboard API
   ```typescript
   clipboard: {
     writeText: (text: string) => clipboard.writeText(text),
     readText: () => clipboard.readText()
   }
   ```

### State Management

Clipboard store structure:
```typescript
interface ClipboardState {
  items: SpaceItem[];
  sourceSpaceId: string;
  action: 'copy' | 'cut';
}
```

## Flutter Reference

```dart
// Copy link (main_layout_final.dart:2162-2169)
void _copyLink(SpaceItem item) {
  Clipboard.setData(ClipboardData(text: item.path));
  ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
    items: [item],
    sourceSpaceId: widget.space.id,
    action: ClipboardAction.copy,
  );
}

// Copy folder (main_layout_final.dart:2171-2177)
void _copyFolder(SpaceItem item) {
  ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
    items: [item],
    sourceSpaceId: widget.space.id,
    action: ClipboardAction.copy,
  );
}

// Copy all links (main_layout_final.dart:2179-2200)
void _copyAllLinks(SpaceItem folder) {
  final links = <SpaceItem>[];
  _collectLinks(folder, links);
  if (links.isNotEmpty) {
    Clipboard.setData(ClipboardData(text: links.map((l) => l.path).join('\n')));
    ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
      items: links,
      sourceSpaceId: widget.space.id,
      action: ClipboardAction.copy,
    );
  }
}

void _collectLinks(SpaceItem item, List<SpaceItem> links) {
  if (item.type == SpaceItemType.link) {
    links.add(item);
  }
  for (final child in item.children) {
    _collectLinks(child, links);
  }
}
```

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart:2162-2200`

## Testing Checklist

### Unit Tests
- [ ] `collectLinksRecursive` returns all nested links from folder
- [ ] `collectLinksRecursive` returns empty array for folder without links
- [ ] `collectLinksRecursive` returns self for link item
- [ ] `hasLinksRecursive` returns true for folder containing links
- [ ] `hasLinksRecursive` returns false for folder without links
- [ ] `clipboardStore.copyItems` updates state correctly
- [ ] `clipboardStore.clear` clears clipboard state

### Integration Tests
- [ ] Copy link → internal clipboard has item
- [ ] Copy link → system clipboard has URL
- [ ] Copy folder → internal clipboard has folder
- [ ] Copy all links → internal clipboard has all links
- [ ] Copy all links → system clipboard has all URLs (newline separated)
- [ ] Context menu shows correct copy options based on item type

### Manual Testing
- [ ] Right-click link → "Copy Link" → URL in system clipboard (can paste in browser)
- [ ] Right-click link → "Copy Link" → internal clipboard has item
- [ ] Right-click folder → "Copy Folder" → internal clipboard has folder
- [ ] Right-click folder with links → "Copy All Links" → all URLs in system clipboard
- [ ] Right-click folder without links → "Copy All Links" not shown
- [ ] Internal clipboard persists until new copy or paste
- [ ] Copy operations work in both Sidebar and SpaceCard


## Acceptance Criteria to Cover

1. [ ] [ ] Context menu "Copy Folder" → copies folder to internal clipboard
2. [ ] [ ] Context menu "Copy Link" → copies link to internal clipboard AND URL to system clipboard
3. [ ] [ ] Context menu "Copy All Links" → copies all nested links AND URLs to system clipboard (newline separated)
4. [ ] [ ] Keyboard shortcut Cmd+C (Mac) / Ctrl+C (Win) copies selected item
5. [ ] [ ] Copy operations work from both Sidebar and SpaceCard contexts
6. [ ] [ ] Clipboard state persists until new copy or paste operation

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
describe('Feature: Copy Single Item')
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

1. **Link tests to spec**: `speky test link <test-file> --spec F007`
2. **Run RED phase**: `speky test tdd-red F007`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
