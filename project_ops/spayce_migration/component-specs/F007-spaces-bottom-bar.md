# F007: Spaces Screen Bottom Bar

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `spaces_screen_hifi_v2.dart` (bottom action bar section) |
| **Target File** | `src/renderer/components/spaces/SpacesBottomBar.tsx` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Spaces Screen Bottom Bar.png` |
| **Complexity** | Low (simple bar with actions) |

---

## Component Description

Action bar at the bottom of Spaces Screen. Shows when items are selected, provides bulk actions. When no selection, shows "Add Space" button.

---

## Design Tokens

```json
{
  "bar": {
    "height": 56,
    "padding": 16,
    "background": "#1A1628",
    "borderTop": "#374151"
  },
  "button": {
    "height": 36,
    "paddingHorizontal": 16,
    "borderRadius": 8,
    "gap": 8
  },
  "colors": {
    "primaryButton": "#6D5AE6",
    "primaryButtonHover": "#5D4AD6",
    "secondaryButton": "transparent",
    "secondaryButtonBorder": "#374151"
  }
}
```

---

## Flutter Source Reference

```dart
// Bottom bar in spaces screen
Container(
  height: SpayceSpacing.topBarHeight,  // 56px
  padding: EdgeInsets.symmetric(horizontal: SpayceSpacing.p4),
  decoration: BoxDecoration(
    color: SpayceColors.surfaceDark,
    border: Border(top: BorderSide(color: SpayceColors.borderDark)),
  ),
  child: Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      // Selection count (when items selected)
      if (selectedCount > 0)
        Text('$selectedCount selected', style: SpayceTypography.body),
      
      // Actions
      Row(children: [
        if (selectedCount > 0) ...[
          _ActionButton(label: 'Delete', icon: LucideIcons.trash2, onTap: onDelete),
          SizedBox(width: 8),
        ],
        _ActionButton(label: 'New Space', icon: LucideIcons.plus, isPrimary: true, onTap: onNewSpace),
      ]),
    ],
  ),
)
```

---

## States

### Default (no selection)
- Shows "New Space" button on right

### With Selection
- Shows "{n} selected" on left
- Shows "Delete" and "New Space" buttons on right

---

## Visual Requirements

- [ ] Height 56px
- [ ] Background `#1A1628` with top border `#374151`
- [ ] Primary button: purple `#6D5AE6`, white text
- [ ] Secondary button: transparent, border `#374151`
- [ ] Button height 36px, radius 8px
- [ ] Selection text: body style, left aligned

---

## Animation Requirements

| Animation | Duration | Curve | Property |
|-----------|----------|-------|----------|
| Bar appear | 200ms | ease-out | opacity, transform: translateY |
| Button hover | 150ms | ease | background-color |
| Button press | 100ms | ease | transform: scale(0.98) |

---

## Acceptance Criteria

- [ ] Bar renders at bottom of spaces screen
- [ ] "New Space" button always visible
- [ ] Selection count shows when items selected
- [ ] Delete button appears with selection
- [ ] Button hover/press states work
- [ ] Actions trigger correct handlers
