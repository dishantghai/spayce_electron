# F006: Space Card Context Menu

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `space_card_hifi_v2.dart` (_showContextMenu method, lines 241-342) |
| **Target File** | `src/renderer/components/shared/ContextMenu.tsx` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Spaces Card Folder Context Menu.png` |
| **Complexity** | Medium (positioning, actions, keyboard) |

---

## Component Description

Context menu that appears on right-click of tree items. Shows different options based on item type (folder, link, local folder).

---

## Design Tokens

```json
{
  "menu": {
    "minWidth": 180,
    "maxWidth": 240,
    "padding": 4,
    "borderRadius": 8,
    "background": "#1A1628",
    "border": "#374151"
  },
  "menuItem": {
    "height": 32,
    "paddingHorizontal": 12,
    "iconSize": 16,
    "gap": 8,
    "hoverBackground": "#2D2645",
    "borderRadius": 4
  },
  "divider": {
    "height": 1,
    "marginVertical": 4,
    "color": "#374151"
  },
  "destructive": {
    "textColor": "#EF4444",
    "iconColor": "#EF4444"
  }
}
```

---

## Flutter Source Reference

```dart
// From: space_card_hifi_v2.dart (_showContextMenu)

void _showContextMenu(BuildContext context, Offset position) {
  showMenu<String>(
    context: context,
    position: RelativeRect.fromLTRB(position.dx, position.dy, ...),
    items: [
      _buildMenuItem('rename', 'Rename', LucideIcons.pencil),
      _buildMenuItem('copy', 'Copy', LucideIcons.copy),
      if (hasClipboard) _buildMenuItem('paste', 'Paste', LucideIcons.clipboard),
      PopupMenuDivider(),
      _buildMenuItem('delete', 'Delete', LucideIcons.trash2, isDestructive: true),
    ],
  );
}

// Menu item builder
PopupMenuItem<String> _buildMenuItem(String value, String label, IconData icon, {bool isDestructive = false}) {
  return PopupMenuItem<String>(
    value: value,
    height: 32,
    child: Row(
      children: [
        Icon(icon, size: 16, color: isDestructive ? SpayceColors.error : SpayceColors.textSecondary),
        SizedBox(width: 8),
        Text(label, style: TextStyle(color: isDestructive ? SpayceColors.error : SpayceColors.textPrimary)),
      ],
    ),
  );
}
```

---

## Menu Items by Type

### Folder
- Add subfolder
- Add link
- ---
- Rename
- Copy
- Paste (if clipboard)
- ---
- Delete

### Link
- Open in new tab
- Copy URL
- ---
- Rename
- Delete

### Local Folder
- Open in Workspace
- Refresh
- ---
- Import file
- Import folder
- ---
- Remove

---

## Visual Requirements

- [ ] Menu appears at cursor position (adjusted to stay on screen)
- [ ] Background `#1A1628`, border `#374151`, radius 8px
- [ ] Shadow: `0 4px 12px rgba(0,0,0,0.4)`
- [ ] Items: 32px height, 16px icons
- [ ] Hover: `#2D2645` background, 4px radius
- [ ] Destructive items: red text and icon `#EF4444`
- [ ] Dividers: 1px line, color `#374151`

---

## Animation Requirements

| Animation | Duration | Curve | Property |
|-----------|----------|-------|----------|
| Menu appear | 100ms | ease-out | opacity, transform: scale |
| Menu dismiss | 75ms | ease-in | opacity |
| Item hover | 100ms | ease | background-color |

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move focus between items |
| Enter | Activate focused item |
| Escape | Close menu |

---

## Positioning Logic

```typescript
function positionMenu(
  triggerRect: DOMRect,
  menuSize: { width: number; height: number },
  viewport: { width: number; height: number }
): { x: number; y: number } {
  let x = triggerRect.left;
  let y = triggerRect.bottom;
  
  // Flip horizontal if overflows right
  if (x + menuSize.width > viewport.width) {
    x = triggerRect.right - menuSize.width;
  }
  
  // Flip vertical if overflows bottom
  if (y + menuSize.height > viewport.height) {
    y = triggerRect.top - menuSize.height;
  }
  
  return { x, y };
}
```

---

## Acceptance Criteria

- [ ] Menu appears at correct position on right-click
- [ ] Menu stays within viewport bounds
- [ ] Correct items shown for each item type
- [ ] Hover states work
- [ ] Keyboard navigation works
- [ ] Clicking item triggers action and closes menu
- [ ] Clicking outside closes menu
- [ ] Destructive items styled in red
