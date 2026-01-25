# TDD Test Task: Spec F004 - Folder Hover Actions & Context Menu

## Phase: RED (Create Failing Tests)

> **TDD Workflow**: Write tests FIRST, verify they FAIL, then implement.

## Spec Context

---
id: F004
title: Folder Hover Actions & Context Menu
type: feature
priority: P0
status: pending
related_specs: []
dependencies: [F001, F002, F003]
affected_files:
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/TreeView.module.css
  - packages/react-ui/src/components/ContextMenu.tsx
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
estimated_hours: 3
---

# F004: Folder Hover Actions & Context Menu

## User Story

> As a user, I want to see action buttons when I hover over a folder, so I can quickly add subfolders or links without right-clicking.

## Context

This feature completes the hover action buttons on tree items and implements the full context menu for folders and links. The hover actions provide quick access to common operations, while the context menu provides the full set of options.

## Screenshots Reference

Based on Flutter app screenshots:
- Image 5: Shows folder hover with FolderPlus icon and "Add Subfolder" tooltip
- Image 6: Shows full context menu with options:
  - New Nested Folder
  - Add Link
  - Import Local Folder
  - Import Local File
  - Rename
  - Copy Folder
  - Copy All Links
  - Open in Workspace
  - Delete (red)

## Acceptance Criteria

### Hover Actions
- [ ] Hover over folder → shows action icons on right side
- [ ] FolderPlus icon → triggers subfolder inline input
- [ ] Link icon → triggers link inline input
- [ ] MoreVertical icon → opens context menu
- [ ] Icons fade in/out smoothly (150ms)
- [ ] Icons don't show during rename mode
- [ ] Hover over link → shows only MoreVertical icon

### Context Menu - Folders
- [ ] New Nested Folder → triggers inline folder input
- [ ] Add Link → triggers inline link input
- [ ] Rename → triggers inline rename
- [ ] Copy Folder → copies folder to clipboard
- [ ] Copy All Links → copies all links in folder
- [ ] Delete → deletes folder (with confirmation for non-empty)

### Context Menu - Links
- [ ] Rename → triggers inline rename
- [ ] Copy Link → copies link URL to clipboard
- [ ] Pin to Top / Unpin → toggles pin status
- [ ] Remove → deletes link

### Space Header Context Menu
- [ ] Right-click on space header → shows context menu
- [ ] New Folder → triggers inline folder input at root
- [ ] Add Link → triggers inline link input at root
- [ ] Paste (if clipboard has items) → pastes items

## Technical Implementation

### TreeItem Hover Actions

```typescript
// In TreeItem.tsx
{isHovered && !isRenaming && (
  <div className={styles.hoverActions}>
    {isFolder && (
      <>
        <button
          className={styles.hoverAction}
          onClick={(e) => {
            e.stopPropagation();
            onAddSubfolder?.(item);
          }}
          title="Add Subfolder"
        >
          <FolderPlus size={14} />
        </button>
        <button
          className={styles.hoverAction}
          onClick={(e) => {
            e.stopPropagation();
            onAddLink?.(item);
          }}
          title="Add Link"
        >
          <Link size={14} />
        </button>
      </>
    )}
    <button
      className={styles.hoverAction}
      onClick={(e) => {
        e.stopPropagation();
        onContextMenu?.(item, e);
      }}
      title="More options"
    >
      <MoreVertical size={14} />
    </button>
  </div>
)}
```

### CSS for Hover Actions

```css
.hoverActions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 150ms ease;
}

.treeItem:hover .hoverActions {
  opacity: 1;
}

.hoverAction {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background-color 150ms ease, color 150ms ease;
}

.hoverAction:hover {
  background-color: var(--color-bg-accent);
  color: var(--color-text-primary);
}
```

### Context Menu Items

```typescript
// Folder context menu items
const folderMenuItems: ContextMenuItem[] = [
  { id: 'new_folder', label: 'New Nested Folder', icon: FolderPlus },
  { id: 'add_link', label: 'Add Link', icon: Link },
  { id: 'divider1', isDivider: true },
  { id: 'import_folder', label: 'Import Local Folder', icon: FolderInput, isDisabled: true },
  { id: 'import_file', label: 'Import Local File', icon: FileInput, isDisabled: true },
  { id: 'divider2', isDivider: true },
  { id: 'rename', label: 'Rename', icon: Pencil },
  { id: 'copy_folder', label: 'Copy Folder', icon: Copy },
  { id: 'copy_links', label: 'Copy All Links', icon: Link2 },
  { id: 'divider3', isDivider: true },
  { id: 'open_workspace', label: 'Open in Workspace', icon: PanelLeft, isDisabled: true },
  { id: 'delete', label: 'Delete', icon: Trash2, isDestructive: true },
];

// Link context menu items
const linkMenuItems: ContextMenuItem[] = [
  { id: 'rename', label: 'Rename', icon: Pencil },
  { id: 'copy_link', label: 'Copy Link', icon: Copy },
  { id: 'divider1', isDivider: true },
  { id: item.isPinned ? 'unpin' : 'pin', 
    label: item.isPinned ? 'Unpin' : 'Pin to Top', 
    icon: item.isPinned ? PinOff : Pin },
  { id: 'divider2', isDivider: true },
  { id: 'remove', label: 'Remove', icon: Trash2, isDestructive: true },
];
```

### Context Menu Handler

```typescript
const handleContextMenuAction = async (actionId: string, item: SpaceItem) => {
  switch (actionId) {
    case 'new_folder':
      setSidebarInput({ spaceId, parentId: item.id, type: 'folder' });
      // Auto-expand folder
      setExpandedIds(prev => new Set([...prev, item.id]));
      break;
    case 'add_link':
      setSidebarInput({ spaceId, parentId: item.id, type: 'link' });
      setExpandedIds(prev => new Set([...prev, item.id]));
      break;
    case 'rename':
      setSidebarRenameItemId(item.id);
      break;
    case 'copy_link':
      await navigator.clipboard.writeText(item.path);
      break;
    case 'pin':
      await pinItem(item.id);
      break;
    case 'unpin':
      await unpinItem(item.id);
      break;
    case 'delete':
    case 'remove':
      await deleteItem(item.id);
      break;
  }
};
```

## Flutter Reference

```dart
// Hover actions (main_layout_final.dart:2496-2525)
if (_isHovered && !isRenaming)
  AnimatedOpacity(
    opacity: 1.0,
    duration: const Duration(milliseconds: 150),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isFolder) ...[
          _buildSmallActionIcon(LucideIcons.folderPlus, 'Add subfolder', _addSubfolder),
          _buildSmallActionIcon(LucideIcons.link, 'Add link', _addLinkToFolder),
        ],
        _buildSmallActionIcon(LucideIcons.moreVertical, 'More options', _showContextMenu),
      ],
    ),
  ),
```

## Testing Checklist

### Unit Tests
- [ ] Hover actions render for folders (3 buttons)
- [ ] Hover actions render for links (1 button)
- [ ] Hover actions hidden during rename mode
- [ ] Context menu renders correct items for folders
- [ ] Context menu renders correct items for links

### Integration Tests
- [ ] FolderPlus hover action triggers inline input
- [ ] Link hover action triggers inline input
- [ ] Context menu actions execute correctly
- [ ] Auto-expand on subfolder/link add

### Manual Testing
- [ ] Hover folder → 3 icons appear (folder+, link, more)
- [ ] Hover link → 1 icon appears (more)
- [ ] Icons fade in smoothly
- [ ] Leave hover → icons fade out
- [ ] FolderPlus → inline folder input inside
- [ ] Link → inline link input inside
- [ ] MoreVertical → context menu opens
- [ ] No icons during rename mode
- [ ] All context menu actions work correctly


## Acceptance Criteria to Cover



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
describe('Feature: Folder Hover Actions & Context Menu')
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

1. **Link tests to spec**: `aasef test link <test-file> --spec F004`
2. **Run RED phase**: `aasef test tdd-red F004`
3. **Verify tests FAIL** (expected in RED phase)
4. **Then implement the feature**

## Output Location

Create test files in:
- Create in appropriate test directory

Report back:
1. Which test files were created
2. How many tests were added
3. Which acceptance criteria are covered
