---
id: F033
title: Keyboard Copy/Paste in Space Cards
type: feature
priority: P1
status: pending
related_specs: []
dependencies:
  - F007
  - F008
  - F009
  - F028
affected_files:
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
  - packages/react-ui/src/components/spaces/SpaceCardTreeItem.tsx
  - packages/react-ui/src/stores/clipboardStore.ts
  - packages/react-ui/src/stores/selectionStore.ts
estimated_hours: 3
---

# F033: Keyboard Copy/Paste in Space Cards

## User Story

> As a user, I want to use Cmd+C and Cmd+V keyboard shortcuts in space cards, just like in the sidebar, so I can efficiently copy and paste items using familiar keyboard shortcuts.

## Context

This feature extends keyboard copy/paste functionality (F007-F009) to work within Space Cards. Each card needs to track which item is focused/selected for paste operations. The card must be focusable to receive keyboard events.

## Flutter Reference

The Flutter implementation uses:
- Focus widget wrapper around card content
- KeyDownEvent listener for Cmd+C and Cmd+V
- `selectedSpaceItemProvider` to track focused item for paste target
- System clipboard integration for link URLs

**Key Flutter Files:**
- `space_card_hifi_v2.dart:680-750` - Keyboard listener (conceptual, actual in main_layout)
- `space_card_hifi_v2.dart:720-735` - Copy handler
- `space_card_hifi_v2.dart:470-565` - Paste handler

**Flutter keyboard handling pattern:**
```dart
Focus(
  onKeyEvent: (node, event) {
    if (event is KeyDownEvent) {
      // Copy: Cmd+C
      if (event.logicalKey == LogicalKeyboardKey.keyC && 
          HardwareKeyboard.instance.isMetaPressed) {
        _handleCopy();
        return KeyEventResult.handled;
      }
      
      // Paste: Cmd+V
      if (event.logicalKey == LogicalKeyboardKey.keyV && 
          HardwareKeyboard.instance.isMetaPressed) {
        _handlePaste();
        return KeyEventResult.handled;
      }
    }
    return KeyEventResult.ignored;
  },
  child: cardContent,
)
```

## Acceptance Criteria

- [ ] Space card is focusable (tabIndex={0})
- [ ] Click on card or item within card → card receives focus
- [ ] Cmd+C (Mac) / Ctrl+C (Windows) on selected item → copies to clipboard
- [ ] Cmd+V (Mac) / Ctrl+V (Windows) → pastes at focused item location
- [ ] Works with multi-selection in cards (copies all selected)
- [ ] Link copy → URLs copied to system clipboard
- [ ] Folder copy → folder and contents copied to internal clipboard
- [ ] Paste into folder → items appear inside folder
- [ ] Paste on link → items appear as siblings after link
- [ ] Keyboard shortcuts don't interfere with sidebar shortcuts
- [ ] Focus context properly managed (card vs sidebar)

## Technical Implementation

### Make SpaceCard Focusable

```typescript
// SpaceCard.tsx
export function SpaceCard({ space, spaceIndex, isSelected, onSelect }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { selectedCardItems, setSelectedCardItem } = useSelectionStore();
  const { clipboard, copy } = useClipboardStore();
  
  // Get selected items for this card
  const selectedItems = selectedCardItems.get(space.id) || [];
  const focusedItem = selectedItems[selectedItems.length - 1]; // Last selected
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;
    
    // Copy: Cmd/Ctrl+C
    if (cmdKey && e.key === 'c') {
      if (selectedItems.length > 0) {
        e.preventDefault();
        handleCopy(selectedItems, space.id);
      }
    }
    
    // Paste: Cmd/Ctrl+V
    if (cmdKey && e.key === 'v') {
      e.preventDefault();
      handlePaste(focusedItem, space.id);
    }
  }, [selectedItems, focusedItem, space.id]);
  
  return (
    <div
      ref={cardRef}
      className={styles.spaceCard}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => cardRef.current?.focus()}
    >
      {/* Card content */}
    </div>
  );
}
```

### Copy Handler

```typescript
const handleCopy = async (items: SpaceItem[], sourceSpaceId: string) => {
  // Copy to internal clipboard
  copy(items, sourceSpaceId);
  
  // If all items are links, copy URLs to system clipboard
  const allLinks = items.every(item => item.type === 'link');
  if (allLinks) {
    const urls = items.map(item => item.path).join('\n');
    await navigator.clipboard.writeText(urls);
  }
  
  // Show toast notification
  showToast(`Copied ${items.length} item${items.length > 1 ? 's' : ''}`);
};
```

### Paste Handler

```typescript
const handlePaste = async (targetItem: SpaceItem | null, spaceId: string) => {
  // Check internal clipboard first
  const clipboardData = clipboard;
  
  if (clipboardData && clipboardData.items.length > 0) {
    // Determine paste target
    let parentId: string | null = null;
    
    if (targetItem) {
      if (targetItem.type === 'folder' || targetItem.type === 'localFolder') {
        // Paste inside folder
        parentId = targetItem.id;
        // Expand folder to show pasted items
        expandCardFolder(targetItem.id);
      } else {
        // Paste as sibling (use target's parent)
        parentId = targetItem.parentId;
      }
    }
    
    // Paste each item
    for (const item of clipboardData.items) {
      await pasteItemRecursively(item, spaceId, parentId);
    }
    
    // Invalidate to refresh
    invalidate(`space-items:${spaceId}`);
    return;
  }
  
  // Try system clipboard for URLs
  try {
    const text = await navigator.clipboard.readText();
    if (isValidUrl(text)) {
      await createLinkFromUrl(text, spaceId, targetItem?.id);
    }
  } catch (e) {
    // Clipboard access denied or empty
  }
};

const pasteItemRecursively = async (
  item: SpaceItem, 
  spaceId: string, 
  parentId: string | null
) => {
  const newItem = await createItem({
    name: item.name,
    path: item.path,
    type: item.type,
    spaceId,
    parentId,
    faviconUrl: item.faviconUrl,
  });
  
  // Recursively paste children
  for (const child of item.children || []) {
    await pasteItemRecursively(child, spaceId, newItem.id);
  }
};
```

### Selection Tracking for Cards

```typescript
// In selectionStore.ts
interface SelectionStore {
  // Sidebar selection (existing)
  sidebarSelectedIds: Set<string>;
  
  // Card selection - map of spaceId to selected item IDs
  cardSelectedItems: Map<string, SpaceItem[]>;
  
  // Actions
  setCardSelectedItems: (spaceId: string, items: SpaceItem[]) => void;
  addCardSelectedItem: (spaceId: string, item: SpaceItem) => void;
  clearCardSelection: (spaceId: string) => void;
}
```

### Focus Context Management

```typescript
// Track which context has focus
type FocusContext = 'sidebar' | 'spacesScreen' | 'browser';

// In a focus store or context
const [focusContext, setFocusContext] = useState<FocusContext>('sidebar');

// When clicking in card
const handleCardClick = () => {
  setFocusContext('spacesScreen');
  cardRef.current?.focus();
};

// When clicking in sidebar
const handleSidebarClick = () => {
  setFocusContext('sidebar');
};
```

### Design System Tokens

```typescript
// Focus ring for cards
focusRing: '0 0 0 2px var(--color-primary)'
focusRingOffset: '2px'

// Selection highlight (existing)
selectedBg: 'rgba(109, 90, 230, 0.08)'
selectedBorder: 'rgba(109, 90, 230, 0.5)'
```

## Testing Checklist

### Unit Tests

- [ ] handleCopy copies items to clipboard store
- [ ] handleCopy copies URLs to system clipboard for links
- [ ] handlePaste pastes from internal clipboard
- [ ] handlePaste creates link from system clipboard URL
- [ ] pasteItemRecursively handles nested folders
- [ ] Selection store tracks card selections correctly

### Integration Tests

- [ ] Click item in card → item selected
- [ ] Cmd+C → items copied to clipboard
- [ ] Cmd+V → items pasted at correct location
- [ ] Multi-select + Cmd+C → all items copied
- [ ] Paste into folder → items inside folder
- [ ] Paste on link → items as siblings

### Manual Testing

- [ ] Click item in card → Cmd+C → item copied
- [ ] Click folder in card → Cmd+V → items pasted inside
- [ ] Multi-select in card → Cmd+C → all copied
- [ ] Link copy → URLs in system clipboard
- [ ] Paste works at correct position
- [ ] Keyboard shortcuts don't affect sidebar when card focused
- [ ] Keyboard shortcuts don't affect card when sidebar focused
- [ ] Focus ring visible when card has focus
