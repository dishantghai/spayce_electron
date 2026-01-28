---
id: F026
title: Inline Creation in Space Cards
type: feature
priority: P1
status: pending
related_specs: []
dependencies:
  - F001
  - F002
affected_files:
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
  - packages/react-ui/src/components/spaces/SpaceCard.module.css
  - packages/react-ui/src/components/spaces/SpaceCardTreeItem.tsx
  - packages/react-ui/src/stores/inlineInputStore.ts
estimated_hours: 4
---

# F026: Inline Creation in Space Cards

## User Story

> As a user, I want to create folders and links inline within space cards on the Spaces screen, just like in the sidebar, so I can quickly add content to any space without switching context.

## Context

This feature extends the inline creation functionality (F001, F002) to work within Space Cards on the Spaces Screen. Space Cards display a tree view of items similar to the sidebar, but require independent state management to avoid conflicts. The card uses a separate `cardInput` state from the sidebar's `sidebarInput` state.

## Flutter Reference

The Flutter implementation uses:
- `CardInlineInputState` class with `spaceId`, `parentId`, and `type` fields
- `cardInlineInputProvider` - separate from sidebar's inline input provider
- `expandedCardFoldersProvider` - separate expanded state for cards
- Actions bar at bottom of selected card with folder+ and link+ buttons
- Hover actions on folder items (folder+, link, more)

**Key Flutter Files:**
- `space_card_hifi_v2.dart:42-58` - CardInlineInputState definition
- `space_card_hifi_v2.dart:1277-1343` - _SpaceActionsBar with add buttons
- `space_card_hifi_v2.dart:964-995` - Hover actions on tree items
- `space_card_hifi_v2.dart:1547-1772` - _CardInlineInputRow component

## Acceptance Criteria

- [ ] Space card actions bar (bottom) has folder+ and link+ buttons (visible when card is selected)
- [ ] Click folder+ in actions bar → inline input appears at card's tree root
- [ ] Click link+ in actions bar → inline link input at root with auto-paste from clipboard
- [ ] Folder hover in card shows 3 action buttons: folder+, link, more (three-dots)
- [ ] Link hover in card shows 1 action button: more (three-dots)
- [ ] Click folder+ hover icon → inline folder input inside that folder
- [ ] Click link hover icon → inline link input inside that folder
- [ ] Parent folder auto-expands when adding subfolder
- [ ] Same keyboard handling as sidebar: Enter (submit), Escape (cancel)
- [ ] Click outside with content → creates item
- [ ] Click outside without content → cancels
- [ ] Uses separate state from sidebar (`cardInput` vs `sidebarInput`)
- [ ] Hover actions fade in/out smoothly (150ms transition)
- [ ] No hover icons shown during rename mode

## Technical Implementation

### State Management

Extend `inlineInputStore.ts` to support card context:

```typescript
interface InlineInputStore {
  // Existing sidebar state
  sidebarInput: InlineInputState | null;
  sidebarRenameItemId: string | null;
  
  // New card state (independent from sidebar)
  cardInput: InlineInputState | null;
  cardRenameItemId: string | null;
  
  // Card-specific expanded folders
  expandedCardFolders: Set<string>;
  
  // Actions
  setCardInput: (input: InlineInputState | null) => void;
  clearCardInput: () => void;
  setCardRenameItemId: (id: string | null) => void;
  toggleCardFolder: (folderId: string) => void;
  expandCardFolder: (folderId: string) => void;
}
```

### Components to Create/Update

1. **SpaceCardActionsBar** - Bottom bar with action buttons
   ```typescript
   interface SpaceCardActionsBarProps {
     spaceId: string;
     accentColor: string;
   }
   ```
   - Folder+ button → `setCardInput({ spaceId, parentId: null, type: 'folder' })`
   - Link+ button → `setCardInput({ spaceId, parentId: null, type: 'link' })`
   - Note button (disabled, "Coming Soon")
   - Import folder button (disabled)
   - Import file button (disabled)

2. **SpaceCardTreeItem** - Tree item with hover actions
   ```typescript
   interface SpaceCardTreeItemProps {
     item: SpaceItem;
     spaceId: string;
     spaceIndex: number;
     level: number;
     accentColor: string;
     parentFolderIds: string[];
   }
   ```
   - Track hover state with `useState`
   - Show hover actions when hovered and not renaming
   - Folder items: folder+, link, more buttons
   - Link items: more button only

3. **CardInlineInput** - Reuse InlineInput component
   - Same component as sidebar, different store actions
   - Pass `context: 'card'` prop to use card store actions

### Design System Tokens

```typescript
// Actions bar
actionsBarPadding: '12px horizontal, 10px vertical'
actionsBarBorder: '1px solid var(--color-border-subtle)'

// Hover actions
hoverActionsGap: '2px'
actionButtonSize: '18px'
actionButtonRadius: '3px'
actionIconSize: '10px'
hoverTransition: '150ms ease'

// From existing design system
accentDark: '#2D2645'  // Hover background
surfaceDark: '#1A1628' // Button background
textMuted: '#6B7280'   // Icon color
textPrimary: '#E5E7EB' // Icon hover color
```

### CSS Updates (SpaceCard.module.css)

```css
.actionsBar {
  padding: var(--spacing-md) var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  justify-content: space-around;
}

.actionButton {
  padding: var(--spacing-sm);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color var(--duration-hover) ease,
              color var(--duration-hover) ease;
}

.actionButton:hover:not(:disabled) {
  background: rgba(45, 38, 69, 0.5);
  color: var(--color-text-primary);
}

.actionButton:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.hoverActions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--duration-hover) ease;
}

.treeItem:hover .hoverActions {
  opacity: 1;
}

.hoverActionIcon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface);
  border-radius: 3px;
  cursor: pointer;
  transition: background-color var(--duration-hover) ease;
}

.hoverActionIcon:hover {
  background: var(--color-bg-accent);
}

.hoverActionIcon svg {
  width: 10px;
  height: 10px;
  color: var(--color-text-muted);
  transition: color var(--duration-hover) ease;
}

.hoverActionIcon:hover svg {
  color: var(--color-text-primary);
}
```

## Testing Checklist

### Unit Tests

- [ ] SpaceCardActionsBar renders all buttons
- [ ] Folder+ button calls setCardInput with correct params
- [ ] Link+ button calls setCardInput with correct params
- [ ] Disabled buttons show correct styling
- [ ] SpaceCardTreeItem shows hover actions on hover
- [ ] Folder items show 3 action buttons
- [ ] Link items show 1 action button
- [ ] Hover actions hidden during rename mode
- [ ] CardInlineInput auto-focuses on mount
- [ ] Enter submits, Escape cancels

### Integration Tests

- [ ] Click folder+ in actions bar → inline input at root
- [ ] Click link+ in actions bar → inline input with clipboard URL
- [ ] Click folder+ hover → inline input inside folder
- [ ] Folder auto-expands when adding subfolder
- [ ] Created item appears in card tree
- [ ] Card state independent from sidebar state

### Manual Testing

- [ ] Click folder+ in card actions bar → input appears at root
- [ ] Click link+ in card actions bar → input with auto-paste
- [ ] Hover folder in card → shows 3 action buttons (folder+, link, more)
- [ ] Hover link in card → shows 1 action button (more)
- [ ] Click folder+ hover icon → inline folder input inside that folder
- [ ] Click link hover icon → inline link input inside that folder
- [ ] Click more icon → context menu opens
- [ ] Hover actions fade in/out smoothly (150ms)
- [ ] No hover icons during rename mode
- [ ] Subfolder creation works in cards
- [ ] Creating in card doesn't affect sidebar state
- [ ] Creating in sidebar doesn't affect card state
