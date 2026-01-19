# F005: Space Card

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `space_card_hifi_v2.dart` (1870 lines) |
| **Target File** | `packages/shared/src/components/spaces/SpaceCard.tsx` |
| **CSS Module** | `packages/shared/src/components/spaces/SpaceCard.module.css` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Space Card Design.png` |
| **Complexity** | High (tree structure, drag-drop, context menus, inline edit) |
| **Status** | ✅ IMPLEMENTED |

---

## Component Description

Card displaying a single space with:
- **Header**: Space icon (20px) + name (UPPERCASE, 12px, 700 weight, 1.2px letter-spacing) in accent color
- **Content**: Scrollable tree view of space items (folders, links, local folders, local files)
- **Expand/collapse folders**: Click to toggle, with smooth animation
- **Context menu**: Right-click for actions (Add subfolder, Add link, Rename, Copy, Paste, Delete)
- **Inline rename**: Double-click to edit item name
- **Actions bar**: Bottom bar with quick actions (only shown for selected card)
- **Hover actions**: FolderPlus, Link, MoreVertical icons appear on item hover

### Key Flutter Implementation Details (from space_card_hifi_v2.dart)

1. **Providers used**:
   - `expandedCardFoldersProvider` - Tracks expanded folder IDs
   - `cardInlineRenameItemIdProvider` - Tracks item being renamed
   - `cardInlineInputProvider` - Tracks inline input state for new items
   - `spacesScreenActiveSpaceIndexProvider` - Independent from sidebar active space
   - `keyboardFocusContextProvider` - Determines which area has keyboard focus

2. **Selection states**:
   - `isSelected` - Link currently open in browser (purple highlight with glow)
   - `isKeyboardSelected` - Item selected via keyboard navigation (subtle highlight)
   - `isMultiSelected` - Part of multi-selection
   - `hasContextMenuOpen` - Context menu visible for this item

---

## Design Tokens

```json
{
  "card": {
    "width": "dynamic (min 288px, responsive to fit 3 cards)",
    "borderRadius": 12,
    "background": "#1A1628",
    "borderDefault": "1px solid #1F2937",
    "borderSelected": "2px solid {accentColor}30"
  },
  "header": {
    "padding": 12,
    "iconSize": 20,
    "gap": 8,
    "titleFontSize": 12,
    "titleFontWeight": 700,
    "titleLetterSpacing": "1.2px",
    "titleTransform": "uppercase",
    "borderBottom": "1px solid #1F2937"
  },
  "content": {
    "padding": 12,
    "scrollbar": {
      "width": 6,
      "thumbColor": "#374151",
      "thumbHoverColor": "#4B5563"
    }
  },
  "treeItem": {
    "padding": "6px 8px",
    "indent": 16,
    "iconSize": 16,
    "faviconSize": 14,
    "fontSize": 12,
    "fontWeight": 400,
    "gap": 8,
    "borderRadius": 6
  },
  "colors": {
    "textPrimary": "#E5E7EB",
    "textMuted": "#6B7280",
    "hoverBackground": "rgba(45, 38, 69, 0.3)",
    "selectedBackground": "rgba(109, 90, 230, 0.08)",
    "selectedBorder": "rgba(109, 90, 230, 0.5)",
    "keyboardSelectedBackground": "rgba(45, 38, 69, 0.3)"
  },
  "actionsBar": {
    "padding": "10px 12px",
    "borderTop": "1px solid #1F2937",
    "iconSize": 18,
    "buttonPadding": 8,
    "buttonRadius": 6
  },
  "hoverActions": {
    "size": 18,
    "iconSize": 10,
    "gap": 2,
    "radius": 3
  }
}
```

---

## Flutter Source Reference

```dart
// From: space_card_hifi_v2.dart

class SpaceCardHiFiV2 extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      width: SpayceSpacing.cardWidth,  // 288px
      constraints: BoxConstraints(minHeight: 200, maxHeight: 500),
      decoration: BoxDecoration(
        color: SpayceColors.surfaceDark,  // #1A1628
        borderRadius: BorderRadius.circular(SpayceRadius.card),  // 12px
        boxShadow: SpayceShadows.cardSubtle,
      ),
      child: Column(
        children: [
          _CardHeader(space: space),
          Expanded(child: _CardContent(items: space.rootItems)),
        ],
      ),
    );
  }
}

// Tree item with animations
class _CardTreeItem extends StatefulWidget {
  // Expand/collapse with AnimatedContainer
  AnimatedContainer(
    duration: SpayceAnimations.expand,  // 200ms
    curve: Curves.easeOut,
    height: isExpanded ? calculatedHeight : 0,
  )
  
  // Icon rotation
  AnimatedRotation(
    turns: isExpanded ? 0.25 : 0,
    duration: SpayceAnimations.expand,
  )
}
```

---

## Visual Requirements

- [ ] Card width 288px
- [ ] Background `#1A1628` with 12px border radius
- [ ] Shadow: `0 2px 8px rgba(0,0,0,0.2)`
- [ ] Header: 32px space icon + name
- [ ] Tree items: 28px row height, 16px indent per level
- [ ] Folder icon: chevron that rotates on expand
- [ ] Hover: `#2D2645` background, 150ms transition

---

## Animation Requirements

| Animation | Duration | Curve | Property |
|-----------|----------|-------|----------|
| Folder expand | 200ms | ease-out | height, opacity |
| Chevron rotate | 200ms | ease-out | transform: rotate(90deg) |
| Item hover | 150ms | ease | background-color |
| Card hover | 200ms | ease-out | box-shadow, transform: translateY(-2px) |
| Drag start | 100ms | ease | opacity: 0.8, transform: scale(1.02) |

---

## Tree Item Types

| Type | Icon | Behavior |
|------|------|----------|
| folder | Folder (expandable) | Click to expand, shows children |
| link | Link + favicon | Click opens in browser |
| localFolder | FolderOpen | Expandable, shows file system children |
| file | FileText (or type-specific) | Click opens in workspace |

---

## Context Menu Actions

Right-click shows:
- Add subfolder
- Add link
- Rename
- Copy
- Paste (if clipboard has items)
- Delete
- (for local folders) Refresh, Import file/folder

---

## State Management

```typescript
interface SpaceCardState {
  expandedFolders: Set<string>;
  editingItemId: string | null;  // for inline rename
  draggedItemId: string | null;
  dropTargetId: string | null;
}
```

---

## Acceptance Criteria

- [x] Card renders with correct dimensions and styling
- [x] Header shows space icon + uppercase name in accent color
- [x] Tree items render with proper indentation (16px per level)
- [x] Folders expand/collapse on click
- [x] Hover states work on card and items
- [x] Hover actions appear (FolderPlus, Link, MoreVertical)
- [x] Context menu shows on right-click
- [x] Actions bar shows at bottom for selected card
- [x] Different item types render with appropriate icons
- [x] Favicon images load for links with fallback to Globe icon
- [ ] Inline rename works on double-click (TODO)
- [ ] Drag and drop reorders items (TODO - F008)
