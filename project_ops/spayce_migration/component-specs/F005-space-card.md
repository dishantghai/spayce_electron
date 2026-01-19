# F005: Space Card

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `space_card_hifi_v2.dart` (1870 lines) |
| **Target File** | `src/renderer/components/spaces/SpaceCard.tsx` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Space Card Design.png` |
| **Complexity** | High (tree structure, drag-drop, context menus, inline edit) |

---

## Component Description

Card displaying a single space with:
- Header: space icon + name + actions menu
- Content: tree view of space items (folders, links, local folders)
- Expand/collapse folders
- Context menu on right-click
- Inline rename on double-click
- Drag and drop reordering

---

## Design Tokens

```json
{
  "card": {
    "width": 288,
    "minHeight": 200,
    "maxHeight": 500,
    "borderRadius": 12,
    "background": "#1A1628",
    "padding": 16
  },
  "header": {
    "iconSize": 32,
    "gap": 12,
    "marginBottom": 16
  },
  "tree": {
    "indent": 16,
    "rowHeight": 28,
    "iconSize": 16
  },
  "colors": {
    "hoverBackground": "#2D2645",
    "selectedBackground": "#3D3655"
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

- [ ] Card renders with correct dimensions and styling
- [ ] Tree items expand/collapse with animation
- [ ] Chevron rotates on expand
- [ ] Hover states work on card and items
- [ ] Context menu shows on right-click
- [ ] Inline rename works on double-click
- [ ] Drag and drop reorders items (can defer to F008)
