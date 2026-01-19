# F007: Spaces Screen Bottom Bar

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `spaces_screen_hifi_v2.dart` (_SpacesBottomNav class, lines 653-914) |
| **Target File** | `packages/shared/src/components/spaces/SpacesBottomBar.tsx` |
| **CSS Module** | `packages/shared/src/components/spaces/SpacesScreen.module.css` (shared styles) |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Spaces Screen Bottom Bar.png` |
| **Complexity** | Medium (tabs, drag-to-reorder, animations) |
| **Status** | ✅ IMPLEMENTED |

---

## Component Description

Navigation bar at the bottom of Spaces Screen showing all spaces as tabs. Each tab displays the space icon and name. Supports drag-to-reorder.

### Key Flutter Implementation Details (from _SpacesBottomNav in spaces_screen_hifi_v2.dart)

1. **Structure**:
   - Horizontal scrollable row of space tabs
   - Each tab: icon + name with accent color when active
   - Add space button (+) at the end
   - Drop indicator line appears between tabs during drag

2. **Drag-to-Reorder (F024)**:
   - `_draggedIndex` - Index of tab being dragged
   - `_dropTargetSlot` - Calculated insertion point
   - Arc-style animated gap opens at drop position
   - Feedback widget shows dragged tab with glow effect
   - `reorderSpaces()` called on successful drop

3. **Tab Button States**:
   - Default: transparent background, muted text/icon
   - Hover: subtle background highlight
   - Active: accent color background (20% opacity), accent border, accent text/icon
   - Dragging: reduced opacity (0.3)

---

## Design Tokens

```json
{
  "container": {
    "padding": "12px 16px",
    "margin": 24,
    "background": "#131020",
    "borderRadius": 12,
    "border": "1px solid #1F2937"
  },
  "spaceTab": {
    "padding": "8px 16px",
    "borderRadius": 8,
    "gap": 8,
    "iconSize": 16,
    "fontSize": 13,
    "fontWeight": 500,
    "textColor": "#9CA3AF",
    "activeBackground": "{accentColor}20",
    "activeBorder": "1.5px solid {accentColor}",
    "activeTextColor": "{accentColor}",
    "hoverBackground": "rgba(45, 38, 69, 0.5)"
  },
  "addButton": {
    "size": 32,
    "borderRadius": 8,
    "border": "1px solid #374151",
    "iconSize": 16,
    "iconColor": "#6B7280",
    "hoverBackground": "rgba(45, 38, 69, 0.5)",
    "hoverIconColor": "#E5E7EB"
  },
  "dropIndicator": {
    "width": 3,
    "height": 24,
    "expandedWidth": 40,
    "color": "#6D5AE6",
    "borderRadius": 2,
    "glowBlur": 6,
    "glowOpacity": 0.5
  },
  "dragFeedback": {
    "background": "{accentColor}30",
    "border": "2px solid {accentColor}",
    "glowBlur": 12,
    "glowSpread": 2,
    "glowOpacity": 0.6
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

- [x] Bar renders at bottom of spaces screen with correct styling
- [x] All spaces shown as tabs with icon + name
- [x] Active tab has accent color background/border/text
- [x] Tabs respond to hover with background highlight
- [x] Add space button (+) visible at end
- [x] Click tab selects that space
- [x] Tabs are draggable (HTML5 drag)
- [x] Drop indicator shows insertion point during drag
- [ ] Animated gap opens at drop position (CSS transition implemented)
- [ ] Haptic feedback on drag (desktop only - not applicable to web)
