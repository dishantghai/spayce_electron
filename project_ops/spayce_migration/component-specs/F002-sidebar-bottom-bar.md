# F002: Sidebar Bottom Bar

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `spayce_bottom_tab_bar.dart`, `spayce_space_icon.dart`, `spayce_nav_dot.dart` |
| **Target File** | `src/renderer/components/sidebar/SidebarBottomBar.tsx` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Create New Space Choose Space Icon.png` |
| **Complexity** | Medium (composition, hover states) |

---

## Component Description

Bottom bar of the sidebar containing:
- Space icons (circular, colored by space accent)
- Nav dots (small separators between icons)
- Add space button (+)
- User profile avatar (right side)

---

## Design Tokens

```json
{
  "layout": {
    "bottomBarHeight": 60,
    "spaceIconSize": 32,
    "navDotSize": 4,
    "addButtonSize": 40
  },
  "colors": {
    "background": "#131020",
    "borderTop": "#1F2937",
    "addButtonBg": "#1A1628",
    "addButtonBorder": "#1F2937",
    "navDot": "#4B5563"
  },
  "spacing": {
    "horizontalPadding": 16,
    "verticalPadding": 8,
    "iconGap": 8
  }
}
```

---

## Flutter Source Reference

```dart
// From: spayce_bottom_tab_bar.dart (full file)

class SpayceBottomTabBar extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      height: SpayceSpacing.bottomTabBarHeight,  // 60px
      padding: EdgeInsets.symmetric(
        horizontal: SpayceSpacing.p4,  // 16px
        vertical: SpayceSpacing.p2,    // 8px
      ),
      decoration: BoxDecoration(
        color: SpayceColors.sidebarDark,  // #131020
        border: Border(
          top: BorderSide(color: SpayceColors.borderSubtle)  // #1F2937
        ),
      ),
      child: Row(
        children: [
          Expanded(child: Row(children: _buildSpaceIcons())),
          SpayceUserProfile(...),
        ],
      ),
    );
  }
}

// Space icon (circular with accent color)
Container(
  width: 32, height: 32,
  decoration: BoxDecoration(
    color: space.accentColor,
    shape: BoxShape.circle,
  ),
)

// Nav dot separator
Container(
  width: 4, height: 4,
  decoration: BoxDecoration(
    color: SpayceColors.navDot,  // #4B5563
    shape: BoxShape.circle,
  ),
)

// Add button
Container(
  width: 40, height: 40,
  decoration: BoxDecoration(
    color: SpayceColors.surfaceDark,  // #1A1628
    shape: BoxShape.circle,
    border: Border.all(color: SpayceColors.borderSubtle),
  ),
  child: Icon(LucideIcons.plus, size: 20, color: SpayceColors.textMuted),
)
```

---

## Visual Requirements

- [ ] Height exactly 60px
- [ ] Background `#131020` with top border `#1F2937`
- [ ] Space icons: 32px circles with space accent color
- [ ] Nav dots: 4px circles, color `#4B5563`
- [ ] Add button: 40px circle, bg `#1A1628`, border `#1F2937`
- [ ] Plus icon: 20px, color `#6B7280`
- [ ] User profile avatar on right side

---

## Animation Requirements

| Animation | Duration | Curve | Property |
|-----------|----------|-------|----------|
| Space icon hover | 150ms | ease | transform: scale(1.1) |
| Add button hover | 150ms | ease | border-color, background |
| Icon press | 100ms | ease | transform: scale(0.95) |

---

## Interactions

- Click space icon → Switch to that space
- Click add button → Show context menu (new space options)
- Click user profile → Show settings menu

---

## Acceptance Criteria

- [ ] Visual: Layout matches reference screenshot
- [ ] Space icons display correct accent colors
- [ ] Hover states work on all interactive elements
- [ ] Add button triggers context menu
- [ ] User profile shows avatar/initials correctly
