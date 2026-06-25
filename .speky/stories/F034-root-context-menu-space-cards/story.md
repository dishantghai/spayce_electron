---
id: F034
title: Root Context Menu in Space Cards
type: feature
priority: P1
status: pending
related_specs: []
dependencies:
  - F028
affected_files:
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
  - packages/react-ui/src/components/spaces/SpaceCard.module.css
estimated_hours: 2
---

# F034: Root Context Menu in Space Cards

## User Story

> As a user, I want to right-click on the empty area of a space card to create new folders and links at the root level, so I can quickly add items without using the actions bar.

## Context

This feature adds a context menu to the empty/background area of space cards. When right-clicking on the card background (not on an item), a menu appears with options to create items at the root level of that space. This complements the actions bar and provides a familiar right-click workflow.

## Flutter Reference

The Flutter implementation uses:
- `GestureDetector` with `onSecondaryTapDown` on the card's tree container
- Menu shows: "New Folder", "New Link", "Paste" (conditional)
- Actions create items at root level (parentId: null)

**Key Flutter Files:**
- `space_card_hifi_v2.dart:780-820` (conceptual - background context menu)

**Flutter pattern:**
```dart
GestureDetector(
  onSecondaryTapDown: (details) {
    showContextMenu(
      context: context,
      position: details.globalPosition,
      items: [
        ContextMenuItem(
          label: 'New Folder',
          icon: LucideIcons.folderPlus,
          onTap: () => _createRootFolder(),
        ),
        ContextMenuItem(
          label: 'New Link',
          icon: LucideIcons.link,
          onTap: () => _createRootLink(),
        ),
        if (_hasClipboard)
          ContextMenuItem(
            label: 'Paste',
            icon: LucideIcons.clipboard,
            onTap: () => _pasteAtRoot(),
          ),
      ],
    );
  },
  child: /* card tree area */,
)
```

## Acceptance Criteria

- [ ] Right-click on empty area in card → context menu appears at cursor
- [ ] Menu shows: "New Folder", "New Link", "Paste" (if clipboard has items)
- [ ] "New Folder" → triggers inline folder input at root level
- [ ] "New Link" → triggers inline link input at root level
- [ ] "Paste" → pastes clipboard items at root level
- [ ] Menu doesn't appear when right-clicking on items (item menu shows instead)
- [ ] Same visual style as item context menus
- [ ] Menu closes on action selection or click outside

## Technical Implementation

### Add Context Menu to Card Background

```typescript
// In SpaceCard.tsx
const handleBackgroundContextMenu = (e: React.MouseEvent) => {
  // Only trigger if clicked on background, not on items
  // Check if the click target is the container itself or empty space
  const target = e.target as HTMLElement;
  const isBackground = target.classList.contains(styles.cardTreeContainer) ||
                       target.classList.contains(styles.cardContent);
  
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
    onAction: handleRootContextAction,
  });
};

const handleRootContextAction = async (actionId: string) => {
  switch (actionId) {
    case 'new_folder':
      setCardInput({ 
        spaceId: space.id, 
        parentId: null, 
        type: 'folder' 
      });
      break;
      
    case 'new_link':
      setCardInput({ 
        spaceId: space.id, 
        parentId: null, 
        type: 'link' 
      });
      break;
      
    case 'paste':
      await handlePasteAtRoot(space.id);
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

### Apply to Card Tree Container

```typescript
// In SpaceCard render
<div 
  className={styles.cardTreeContainer}
  onContextMenu={handleBackgroundContextMenu}
>
  {/* Inline input at root if active */}
  {cardInput?.spaceId === space.id && cardInput?.parentId === null && (
    <InlineInput
      type={cardInput.type}
      spaceId={space.id}
      parentId={null}
      onSubmit={handleInlineSubmit}
      onCancel={clearCardInput}
      accentColor={space.accentColor}
    />
  )}
  
  {/* Tree items */}
  {space.rootItems.map((item, index) => (
    <SpaceCardTreeItem
      key={item.id}
      item={item}
      spaceId={space.id}
      spaceIndex={spaceIndex}
      level={0}
      accentColor={space.accentColor}
      parentFolderIds={[]}
    />
  ))}
</div>
```

### CSS for Click Target

```css
.cardTreeContainer {
  flex: 1;
  padding: var(--spacing-sm);
  overflow-y: auto;
  /* Ensure container fills space for click detection */
  min-height: 100px;
}

.cardContent {
  display: flex;
  flex-direction: column;
  height: 100%;
}
```

### Context Menu Items

```typescript
interface RootContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const getRootContextMenuItems = (hasClipboard: boolean): RootContextMenuItem[] => [
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
- [ ] getRootContextMenuItems returns correct items
- [ ] Paste item included only when clipboard has items
- [ ] handleRootContextAction dispatches correct actions
- [ ] handlePasteAtRoot pastes items at root level

### Integration Tests

- [ ] Right-click background → menu appears
- [ ] Right-click item → item menu appears (not root menu)
- [ ] "New Folder" → inline input at root
- [ ] "New Link" → inline link input at root
- [ ] "Paste" → items pasted at root

### Manual Testing

- [ ] Right-click empty area in card → menu appears at cursor
- [ ] Menu shows "New Folder", "New Link"
- [ ] Menu shows "Paste" only if clipboard has items
- [ ] Click "New Folder" → inline input appears at root
- [ ] Click "New Link" → inline link input at root
- [ ] Click "Paste" → items appear at root level
- [ ] Right-click on item → item context menu (not root menu)
- [ ] Menu styling matches item context menus
- [ ] Menu closes on click outside
