# F008: Detailed Folder Tree Structure

## Migration Context

| Property | Value |
|----------|-------|
| **Source Files** | `sidebar_spaces_list.dart`, `main_layout_final.dart` (tree rendering) |
| **Target File** | `src/renderer/components/shared/TreeView.tsx` |
| **Screenshot Reference** | `/Users/Shared/ALL WORKSPACE/projects/spayce_electron/project_ops/HIFI_UI_DESIGN_SCREENS/Folder Tree Structure.png` |
| **Complexity** | High (reusable tree component, virtualization for performance) |

---

## Component Description

Reusable tree view component used in both:
- Sidebar (full tree of all spaces)
- Space Cards (tree of single space's items)

Supports:
- Infinite nesting levels
- Multiple item types (folders, links, local folders, files)
- Virtual scrolling for performance
- Drag and drop

---

## Design Tokens

```json
{
  "tree": {
    "indent": 16,
    "rowHeight": 32,
    "iconSize": 16,
    "iconGap": 8
  },
  "colors": {
    "text": "#E5E7EB",
    "textSecondary": "#9CA3AF",
    "icon": "#6B7280",
    "folderIcon": "#6B7280",
    "linkIcon": "#3B82F6",
    "hoverBg": "#2D2645",
    "selectedBg": "#3D3655",
    "activeBorder": "var(--space-accent)"
  },
  "expansion": {
    "chevronSize": 16,
    "rotationDegrees": 90
  }
}
```

---

## Flutter Source Reference

```dart
// Tree item rendering pattern from main_layout_final.dart

Widget _buildTreeItem(SpaceItem item, int depth) {
  final isExpanded = expandedFolders.contains(item.id);
  final isSelected = selectedItemId == item.id;
  
  return Column(
    children: [
      // Row with indentation
      Padding(
        padding: EdgeInsets.only(left: depth * SpayceSpacing.treeIndent),
        child: InkWell(
          onTap: () => _handleItemTap(item),
          onSecondaryTap: (details) => _showContextMenu(details.globalPosition),
          child: Container(
            height: 32,
            decoration: BoxDecoration(
              color: isSelected ? selectedBg : (isHovered ? hoverBg : transparent),
              border: Border(
                left: isActive 
                  ? BorderSide(color: spaceAccentColor, width: 3)
                  : BorderSide.none,
              ),
            ),
            child: Row(
              children: [
                // Expand icon (folders only)
                if (item.isFolder)
                  AnimatedRotation(
                    turns: isExpanded ? 0.25 : 0,
                    duration: Duration(milliseconds: 200),
                    child: Icon(LucideIcons.chevronRight, size: 16),
                  ),
                SizedBox(width: 8),
                // Item icon
                _buildItemIcon(item),
                SizedBox(width: 8),
                // Title
                Expanded(child: Text(item.title, overflow: TextOverflow.ellipsis)),
              ],
            ),
          ),
        ),
      ),
      // Children (if expanded folder)
      if (isExpanded && item.children.isNotEmpty)
        AnimatedContainer(
          duration: Duration(milliseconds: 200),
          child: Column(
            children: item.children.map((child) => _buildTreeItem(child, depth + 1)).toList(),
          ),
        ),
    ],
  );
}
```

---

## Item Type Icons

| Type | Icon | Color |
|------|------|-------|
| folder | `Folder` | `#6B7280` (muted) |
| folder (expanded) | `FolderOpen` | `#6B7280` |
| link | `Link` or favicon | `#3B82F6` (blue) |
| localFolder | `FolderOpen` + badge | `#10B981` (green) |
| file | Type-specific icon | `#9CA3AF` |

### File Type Icons

| Extension | Icon |
|-----------|------|
| .md, .txt | `FileText` |
| .js, .ts, .py | `FileCode` |
| .jpg, .png, .gif | `Image` |
| .mp4, .mov | `Video` |
| .pdf | `FileText` |
| default | `File` |

---

## Visual Requirements

- [ ] Indentation: 16px per level
- [ ] Row height: 32px
- [ ] Icon size: 16px
- [ ] Gap between icon and text: 8px
- [ ] Hover: `#2D2645` background
- [ ] Selected: `#3D3655` background
- [ ] Active item: 3px left border in space accent color
- [ ] Chevron rotates 90° on expand
- [ ] Text truncates with ellipsis

---

## Animation Requirements

| Animation | Duration | Curve | Property |
|-----------|----------|-------|----------|
| Expand children | 200ms | ease-out | height, opacity |
| Collapse children | 200ms | ease-in | height, opacity |
| Chevron rotate | 200ms | ease-out | transform: rotate |
| Hover fade | 150ms | ease | background-color |
| Selection change | 100ms | ease | background-color, border |

---

## Virtual Scrolling (for performance)

For trees with 50+ items, implement virtualization:

```typescript
// Use react-window or similar
import { VariableSizeList } from 'react-window';

// Estimate row heights based on expanded state
function getItemHeight(index: number): number {
  const item = flattenedItems[index];
  if (!item.isFolder || !expandedFolders.has(item.id)) {
    return 32; // Single row
  }
  return 32 + (item.children.length * 32); // Expanded
}
```

---

## Accessibility

- [ ] Tree has `role="tree"`
- [ ] Items have `role="treeitem"`
- [ ] Expanded state announced via `aria-expanded`
- [ ] Focus visible indicator
- [ ] Screen reader announces item type

---

## Acceptance Criteria

- [ ] Tree renders with correct indentation
- [ ] All item types display correct icons
- [ ] Expand/collapse works with animation
- [ ] Hover and selected states visible
- [ ] Active item shows accent border
- [ ] Performance: 60fps with 100+ items
- [ ] Keyboard navigation works
- [ ] Drag and drop reorders items (can be separate story)
