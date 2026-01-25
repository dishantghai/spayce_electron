---
id: F001
title: Create Folder via Inline Input
type: feature
priority: P0
status: pending
related_specs: []
affected_files:
  - packages/react-ui/src/components/InlineInput.tsx
  - packages/react-ui/src/components/InlineInput.module.css
  - packages/react-ui/src/components/TreeView.tsx
  - packages/react-ui/src/components/TreeItem.tsx
  - packages/react-ui/src/components/SpaceHeader.tsx
  - packages/react-ui/src/components/Sidebar.tsx
  - packages/react-ui/src/components/spaces/SpaceCard.tsx
estimated_hours: 6
---

# F001: Create Folder via Inline Input

## User Story

> As a user, I want to create a new folder by clicking a button and typing the name inline, so I can organize my content quickly without interruption.

## Context

This feature enables users to create folders directly in the tree view without opening dialogs. The inline input appears at the appropriate tree level and auto-focuses for immediate typing.

## Screenshots Reference

Based on Flutter app screenshots:
- Image 1: Shows inline folder input at root level with "Folder name" placeholder, "Add Folder" tooltip, and X cancel button
- Image 5: Shows inline subfolder input inside a folder with "Add Subfolder" tooltip

## Acceptance Criteria

- [ ] Click folder+ icon in SpaceHeader → shows inline input at tree root
- [ ] Click folder+ icon on folder hover → shows inline input inside that folder
- [ ] Input auto-focuses on appearance
- [ ] Press Enter → creates folder, clears input
- [ ] Press Escape → cancels, clears input
- [ ] Click outside with content → creates folder
- [ ] Click outside without content → cancels
- [ ] Parent folder auto-expands when adding subfolder
- [ ] Works in both Sidebar and SpaceCard contexts
- [ ] Context menu "New Folder" / "New Nested Folder" triggers inline input

## Technical Implementation

### Components to Create

1. **InlineInput.tsx** - Reusable inline input component
   - Props: `type: 'folder' | 'link'`, `spaceId`, `parentId`, `level`, `accentColor`, `onSubmit`, `onCancel`
   - Auto-focus on mount
   - Handle Enter (submit), Escape (cancel), blur (submit if content)
   - Icon based on type (Folder for folders, Link for links)
   - Styled input with accent color border

2. **InlineInput.module.css** - Styles matching Flutter design
   - Row height: 32px
   - Input with accent color border (1.5px, 2px on focus)
   - Proper indentation based on tree level

### Components to Update

1. **TreeView.tsx**
   - Check `inlineInputStore.sidebarInput` / `cardInput` for active input
   - Render InlineInput at correct position (root or after parent item)
   - Pass correct level for indentation

2. **TreeItem.tsx**
   - Wire up hover action buttons (FolderPlus, Link) to trigger inline input
   - Auto-expand folder when adding subfolder

3. **SpaceHeader.tsx**
   - Wire up onAddFolder to trigger inline input via store

4. **Sidebar.tsx**
   - Handle inline input state and submission
   - Call `useCreateItem` hook on submit

5. **SpaceCard.tsx**
   - Same inline input integration for card context

### State Management

Use existing `useInlineInputStore`:
```typescript
// Trigger folder input at root
setSidebarInput({ spaceId, parentId: null, type: 'folder' });

// Trigger subfolder input
setSidebarInput({ spaceId, parentId: folderId, type: 'folder' });
```

### Design System Tokens

```typescript
// From SpayceColors
fillColor: SpayceColors.surfaceDark,     // #1A1628
borderColor: accentColor,                 // Space accent color
textColor: SpayceColors.textPrimary,      // #E5E7EB
placeholderColor: SpayceColors.textMuted, // #6B7280

// Spacing
rowHeight: 32px
iconSize: 16px (folder), 14px (link)
inputPadding: 12px horizontal, 10px vertical
borderRadius: 6px
```

## Flutter Reference

```dart
// InlineInputRow (main_layout_final.dart:3395-3604)
// Key behaviors:
// - Auto-focus on mount
// - ESC to cancel
// - Enter to submit
// - Blur with content → submit
// - Blur without content → cancel
```

## Testing Checklist

### Unit Tests
- [ ] InlineInput renders with correct icon for folder type
- [ ] InlineInput auto-focuses on mount
- [ ] Enter key triggers onSubmit with input value
- [ ] Escape key triggers onCancel
- [ ] Empty input on blur triggers onCancel
- [ ] Non-empty input on blur triggers onSubmit

### Integration Tests
- [ ] SpaceHeader folder+ button triggers inline input
- [ ] TreeItem folder+ hover button triggers inline input
- [ ] Folder creation persists to database
- [ ] New folder appears in tree at correct position
- [ ] Parent folder expands when adding subfolder

### Manual Testing
- [ ] Click folder+ in header → input appears at root
- [ ] Click folder+ on folder → input appears inside folder
- [ ] Type name, press Enter → folder created
- [ ] Press Escape → input cancelled, no folder
- [ ] Click outside with text → folder created
- [ ] Click outside empty → input cancelled
- [ ] Parent folder expands when adding subfolder
- [ ] Folder appears in correct tree position
