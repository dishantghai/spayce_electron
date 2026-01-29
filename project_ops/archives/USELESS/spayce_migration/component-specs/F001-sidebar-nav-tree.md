# F001: Sidebar Navigation Tree

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `main_layout_final.dart` (lines 322-506), `sidebar_spaces_list.dart` |
| **Target File** | `src/renderer/components/sidebar/SidebarNavTree.tsx` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Sidebar with Local Imported Folders.png` |
| **Complexity** | High (state management, keyboard nav, animations) |

---

## Component Description

Hierarchical tree view in the sidebar showing spaces and their nested items (folders, links, local folders). Supports:
- Expand/collapse with animation
- Keyboard navigation (up/down arrows, enter, escape)
- Hover states with background highlight
- Active item indicator (left border accent)
- Multi-level indentation (16px per level)

---

## Design Tokens (from Flutter)

```json
{
  "layout": {
    "sidebarWidth": 320,
    "treeIndent": 16,
    "rowHeight": 32
  },
  "colors": {
    "hoverBackground": "#2D2645",
    "activeIndicator": "space.accentColor",
    "textPrimary": "#E5E7EB",
    "textSecondary": "#9CA3AF",
    "iconMuted": "#6B7280"
  },
  "animations": {
    "expandCollapse": { "duration": 200, "curve": "ease-out" },
    "hoverFade": { "duration": 150, "curve": "ease" },
    "iconRotate": { "duration": 200, "curve": "ease-out" }
  },
  "icons": {
    "treeItemSize": 16,
    "expandIcon": "ChevronRight",
    "folderIcon": "Folder",
    "linkIcon": "Link"
  }
}
```

---

## Flutter Source Reference

```dart
// From: main_layout_final.dart (SidebarFinal class, lines 322-456)
// Key implementation patterns:

class SidebarFinal extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      width: SpayceSpacing.sidebarWidth,  // 320px
      decoration: BoxDecoration(
        color: SpayceColors.sidebarDark,   // #131020
        borderRadius: BorderRadius.circular(SpayceRadius.sidebar), // 16px
      ),
      child: Column(
        children: [
          _TopIcons(),           // Pin/unpin toggle
          Expanded(
            child: _TreeContent(), // Tree view with spaces
          ),
          _BottomBar(),          // Bottom tab bar
        ],
      ),
    );
  }
}

// Tree item with expand/collapse animation
AnimatedContainer(
  duration: SpayceAnimations.expand,  // 200ms
  curve: Curves.easeOut,
  // ... expand animation
)

// Icon rotation on expand
AnimatedRotation(
  turns: isExpanded ? 0.25 : 0,  // 90 degrees
  duration: SpayceAnimations.expand,
)
```

---

## Visual Requirements

- [ ] Sidebar width exactly 320px
- [ ] Background color `#131020`
- [ ] Border radius 16px (top corners only when floating)
- [ ] Tree indentation 16px per level
- [ ] Hover state: background `#2D2645` with 150ms fade
- [ ] Active item: 3px left border with space accent color
- [ ] Expand icon rotates 90° clockwise when expanded
- [ ] Collapsed children slide up with opacity fade (200ms)

---

## Animation Requirements

| Animation | Duration | Curve | Property |
|-----------|----------|-------|----------|
| Expand/collapse children | 200ms | ease-out | height, opacity |
| Expand icon rotation | 200ms | ease-out | transform: rotate |
| Hover background | 150ms | ease | background-color |
| Item selection | 100ms | ease | border-left |

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move selection up/down |
| → | Expand folder / Enter link |
| ← | Collapse folder / Go to parent |
| Enter | Activate item (open link/toggle folder) |
| Escape | Clear selection |

---

## State Management

```typescript
// Zustand store slice
interface SidebarTreeState {
  expandedFolders: Set<string>;
  selectedItemId: string | null;
  focusedItemId: string | null;
  
  toggleExpand: (itemId: string) => void;
  setSelectedItem: (itemId: string | null) => void;
  navigateUp: () => void;
  navigateDown: () => void;
}
```

---

## Acceptance Criteria

- [ ] Visual: Screenshot matches reference within 5% pixel difference
- [ ] Animation: Expand/collapse timing verified via dev tools (200ms ± 20ms)
- [ ] Keyboard: All navigation keys work as specified
- [ ] State: Selections persist across re-renders
- [ ] Performance: 60fps during animations with 50+ items
