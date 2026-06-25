---
id: F035
title: Root Context Menu in Sidebar Spaces
type: feature
priority: P1
status: pending
related_specs: []
dependencies:
  - F006
affected_files:
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/react-ui/src/components/TreeView.tsx
  - packages/react-ui/src/components/TreeView.module.css
estimated_hours: 2
---

# F035: Root Context Menu in Sidebar Spaces

## User Story

> As a user, I want to right-click on the empty area of the sidebar space tree to create new folders and links at the root level, so I have a consistent right-click workflow across the app.

## Context

This feature mirrors F034 (Root Context Menu in Space Cards) but for the sidebar tree view. When right-clicking on empty space in the sidebar (below all items or in empty areas), a context menu appears with options to create items at the root level of the active space.

## Flutter Reference

The Flutter implementation uses a similar pattern to space cards:
- `GestureDetector` on the tree view container
- Menu shows: "New Folder", "New Link", "Paste" (conditional)
- Actions create items at root level of active space

**Key Flutter Files:**
- `main_layout_final.dart:1950-1990` - Sidebar background context menu

## Acceptance Criteria

- [ ] Right-click on empty area in sidebar tree → context menu appears
- [ ] Menu shows: "New Folder", "New Link", "Paste" (if clipboard has items)
- [ ] "New Folder" → triggers inline folder input at root level
- [ ] "New Link" → triggers inline link input at root level
- [ ] "Paste" → pastes clipboard items at root level
- [ ] Menu doesn't appear when right-clicking on items
- [ ] Same visual style as item context menus and card root menu
- [ ] Works with active space (uses activeSpaceId)

## Technical Implementation

### Add Context Menu to TreeView Background

```typescript
// In TreeView.tsx or Sidebar.tsx
const handleBackgroundContextMenu = (e: React.MouseEvent) => {
  // Only trigger if clicked on background, not on items
  const target = e.target as HTMLElement;
  const isBackground = target.classList.contains(styles.treeViewContainer) ||
                       target.classList.contains(styles.treeContent);
  
  if (!isBackground) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const hasClipboard = clipboardStore.hasItems();
  
  showContextMenu({
    items: [
      {
        id: 'new_folder',
        label: 'New Folder',
        icon: <FolderPlus size={16} />,
      },
      {
        id: 'new_link',
        label: 'New Link',
        icon: <Link size={16} />,
      },
      ...(hasClipboard ? [{
        id: 'paste',
        label: 'Paste',
        icon: <Clipboard size={16} />,
      }] : []),
    ],
    position: { x: e.clientX, y: e.clientY },
    onAction: handleRootAction,
  });
};

const handleRootAction = async (actionId: string) => {
  switch (actionId) {
    case 'new_folder':
      setSidebarInput({ 
        spaceId: activeSpaceId, 
        parentId: null, 
        type: 'folder' 
      });
      break;
      
    case 'new_link':
      setSidebarInput({ 
        spaceId: activeSpaceId, 
        parentId: null, 
        type: 'link' 
      });
      break;
      
    case 'paste':
      await handlePasteAtRoot(activeSpaceId);
      break;
  }
};
```

### Paste at Root Handler

```typescript
const handlePasteAtRoot = async (spaceId: string) => {
  const clipboard = clipboardStore.getClipboard();
  
  if (clipboard && clipboard.items.length > 0) {
    // Paste from internal clipboard
    for (const item of clipboard.items) {
      await pasteItemRecursively(item, spaceId, null); // null = root
    }
    invalidate(`space-items:${spaceId}`);
    return;
  }
  
  // Try system clipboard for URLs
  try {
    const text = await navigator.clipboard.readText();
    if (isValidUrl(text)) {
      await createLinkFromUrl(text, spaceId, null);
      invalidate(`space-items:${spaceId}`);
    }
  } catch (e) {
    // Clipboard access denied or empty
  }
};
```

### Apply to TreeView Container

```typescript
// In TreeView render
<div 
  className={styles.treeViewContainer}
  onContextMenu={handleBackgroundContextMenu}
>
  {/* Inline input at root if active */}
  {sidebarInput?.spaceId === activeSpaceId && sidebarInput?.parentId === null && (
    <InlineInput
      type={sidebarInput.type}
      spaceId={activeSpaceId}
      parentId={null}
      onSubmit={handleInlineSubmit}
      onCancel={clearSidebarInput}
      accentColor={activeSpace.accentColor}
    />
  )}
  
  {/* Tree items */}
  {items.map((item, index) => (
    <TreeItem
      key={item.id}
      item={item}
      spaceId={activeSpaceId}
      level={0}
      index={index}
      accentColor={activeSpace.accentColor}
    />
  ))}
  
  {/* Empty state or spacer for click target */}
  {items.length === 0 && (
    <div className={styles.emptyState}>
      Right-click to add items
    </div>
  )}
</div>
```

### CSS for Click Target

```css
.treeViewContainer {
  flex: 1;
  padding: var(--spacing-sm);
  overflow-y: auto;
  /* Ensure container fills space for click detection */
  min-height: 200px;
}

.treeContent {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.emptyState {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
```

### Shared Root Menu Items Function

Since F034 and F035 use the same menu items, extract to shared utility:

```typescript
// In utils/contextMenuItems.ts
export const getRootContextMenuItems = (hasClipboard: boolean): ContextMenuItem[] => [
  {
    id: 'new_folder',
    label: 'New Folder',
    icon: <FolderPlus size={16} />,
  },
  {
    id: 'new_link',
    label: 'New Link',
    icon: <Link size={16} />,
  },
  ...(hasClipboard ? [{
    id: 'paste',
    label: 'Paste',
    icon: <Clipboard size={16} />,
  }] : []),
];
```

## Testing Checklist

### Unit Tests

- [ ] handleBackgroundContextMenu only triggers on background click
- [ ] getRootContextMenuItems returns correct items (shared with F034)
- [ ] Paste item included only when clipboard has items
- [ ] handleRootAction dispatches correct actions
- [ ] Uses activeSpaceId for all operations

### Integration Tests

- [ ] Right-click sidebar background → menu appears
- [ ] Right-click item → item menu appears (not root menu)
- [ ] "New Folder" → inline input at root
- [ ] "New Link" → inline link input at root
- [ ] "Paste" → items pasted at root

### Manual Testing

- [ ] Right-click empty area in sidebar → menu appears at cursor
- [ ] Menu shows "New Folder", "New Link"
- [ ] Menu shows "Paste" only if clipboard has items
- [ ] Click "New Folder" → inline input appears at root
- [ ] Click "New Link" → inline link input at root
- [ ] Click "Paste" → items appear at root level
- [ ] Right-click on item → item context menu (not root menu)
- [ ] Menu styling matches card root menu (F034)
- [ ] Works with currently active space
- [ ] Menu closes on click outside
