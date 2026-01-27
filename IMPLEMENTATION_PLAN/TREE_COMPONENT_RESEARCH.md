# Tree Component Library Research - Deep Analysis

> **Date:** January 27, 2026  
> **Purpose:** Evaluate ready-made React tree components for Spayce's drag-drop functionality

---

## Executive Summary

After comprehensive research, **React Arborist** is the **RECOMMENDED** choice for Spayce due to:
1. Built-in drag-and-drop sorting (no custom implementation needed)
2. Virtualized rendering for performance
3. Full customization of node rendering (matches our design system)
4. MIT license, zero cost
5. Active maintenance (3,400+ GitHub stars, 115K+ weekly downloads)
6. Smallest learning curve with excellent API design

---

## Current Project Requirements

Based on analysis of `packages/react-ui/src/components/`:

### Must-Have Features
| Feature | Current Implementation | Status |
|---------|----------------------|--------|
| Drag & Drop Reordering | Custom (buggy) | ❌ Needs fix |
| Folder Open/Close | ✅ Working | ✅ |
| Inline Renaming | ✅ InlineRenameInput | ✅ |
| Multi-level Nesting | ✅ Recursive TreeItem | ✅ |
| Custom Node Rendering | ✅ TreeItemIcon, favicons | ✅ |
| Context Menu | ✅ onItemContextMenu | ✅ |
| Hover Actions | ✅ Add subfolder/link buttons | ✅ |
| Selection State | ✅ selectedId, activeId | ✅ |
| Keyboard Navigation | ⚠️ Partial | Needs improvement |

### Design System Constraints
```typescript
// Must match these EXACTLY from @spayce/shared/theme
const TREE_CONFIG = {
  rowHeight: 32,        // px
  iconSize: 16,         // px
  indent: 16,           // Per-level indentation (SpayceSpacing.treeIndent)
  hoverBg: '#2D2645',   // SpayceColors.accentDark
  selectedBg: '#2D2645',
  fontSize: 14,         // SpayceTypography.fontSize.base
  fontWeight: 500,      // Tree Item weight
};
```

---

## Library Comparison Matrix

| Criteria | React Arborist | React Complex Tree | Syncfusion | KendoReact |
|----------|---------------|-------------------|------------|------------|
| **License** | MIT (Free) | MIT (Free) | Commercial ($999+/yr) | Commercial ($999+/yr) |
| **Weekly Downloads** | ~115,000 | ~33,000 | N/A | N/A |
| **GitHub Stars** | 3,430+ | 1,200+ | N/A | N/A |
| **Bundle Size** | ~25KB gzipped | ~35KB gzipped | ~200KB+ (whole suite) | ~150KB+ |
| **Dependencies** | react-window (virtualization) | Zero | Many | Many |
| **TypeScript** | ✅ Full support | ✅ Full support | ✅ | ✅ |
| **Drag & Drop** | ✅ Native | ✅ Native | ✅ | ✅ Premium |
| **Multi-Select Drag** | ✅ | ✅ | ✅ | ✅ |
| **Keyboard Navigation** | ✅ Full | ✅ W3C Compliant | ✅ | ✅ |
| **Virtualization** | ✅ Built-in | ❌ Manual | ✅ | ✅ |
| **Custom Rendering** | ✅ Full control | ✅ Full control | ⚠️ Template-based | ⚠️ Template-based |
| **Inline Renaming** | ✅ Built-in | ✅ Built-in (F2) | ✅ | ❌ Manual |
| **Search/Filter** | ✅ Built-in | ✅ Built-in | ✅ | ✅ |
| **Multi-Tree Drag** | ⚠️ Manual | ✅ Native | ✅ | ✅ |
| **Learning Curve** | Low | Medium | Medium | Medium |
| **Documentation** | Excellent | Good | Excellent | Good |

---

## Detailed Analysis

### 1. React Arborist ⭐ RECOMMENDED

**Repository:** https://github.com/brimdata/react-arborist

**Strengths:**
- **Simplest API** - Works with just `<Tree initialData={data} />`
- **Virtualized by default** - Uses react-window, handles 10,000+ nodes smoothly
- **Full rendering control** - Custom `Node` component renders any design
- **Built-in CRUD callbacks** - `onCreate`, `onRename`, `onMove`, `onDelete`
- **Drag & Drop just works** - No configuration needed for basic reordering
- **Tree filtering** - `searchTerm` prop with custom `searchMatch` function
- **Selection sync** - `selection` prop auto-scrolls to selected item
- **Ref API** - Full tree control via `useRef` (selectAll, scrollTo, etc.)

**Code Example (matches Spayce design):**
```tsx
import { Tree, NodeRendererProps } from 'react-arborist';

function SpayceNode({ node, style, dragHandle }: NodeRendererProps<SpaceItem>) {
  return (
    <div 
      ref={dragHandle}
      style={style}
      className={`${styles.treeItem} ${node.isSelected ? styles.selected : ''}`}
      onClick={() => node.isInternal && node.toggle()}
    >
      <TreeItemIcon 
        type={node.data.type}
        isExpanded={node.isOpen}
        faviconUrl={node.data.faviconUrl}
      />
      <span className={styles.itemText}>{node.data.name}</span>
      {node.isEditing && (
        <InlineRenameInput 
          item={node.data}
          onSave={(name) => node.submit(name)}
          onCancel={() => node.reset()}
        />
      )}
    </div>
  );
}

function SpayceTree({ items, spaceId }) {
  return (
    <Tree
      data={items}
      idAccessor="id"
      childrenAccessor="children"
      width={SpayceSpacing.sidebarWidth}
      height={600}
      indent={SpayceSpacing.treeIndent}
      rowHeight={32}
      onMove={({ dragIds, parentId, index }) => {
        // Called automatically when drag ends
        itemsApi.move(dragIds[0], spaceId, parentId, index);
      }}
      onRename={({ id, name }) => itemsApi.rename(id, name)}
    >
      {SpayceNode}
    </Tree>
  );
}
```

**Weaknesses:**
- Multi-tree drag (sidebar ↔ space cards) requires custom setup
- No built-in context menu (but easy to add via custom node)

---

### 2. React Complex Tree

**Repository:** https://github.com/lukasbach/react-complex-tree

**Strengths:**
- **Zero dependencies** - Smallest footprint
- **W3C Accessible** - Full ARIA compliance, screen reader support
- **Multi-tree native** - `TreeEnvironment` manages state across trees
- **Keyboard-only drag** - CTRL+D to drag, arrow keys to position, Enter to drop
- **Granular D&D control** - `canDragAndDrop`, `canReorderItems`, `canDropOnFolder`, etc.
- **Unopinionated styling** - CSS classes only, no forced aesthetics

**Code Example:**
```tsx
import { 
  UncontrolledTreeEnvironment, 
  Tree, 
  StaticTreeDataProvider 
} from 'react-complex-tree';

function SpayceTreeEnvironment({ spaces }) {
  return (
    <UncontrolledTreeEnvironment
      dataProvider={new StaticTreeDataProvider(items)}
      getItemTitle={item => item.data.name}
      viewState={{}}
      canDragAndDrop={true}
      canReorderItems={true}
      canDropOnFolder={true}
      renderItem={({ item, depth, children, title, context, arrow }) => (
        <div className={styles.treeItem} {...context.itemContainerWithChildrenProps}>
          <TreeItemIcon type={item.data.type} />
          <span>{title}</span>
          {children}
        </div>
      )}
    >
      <Tree treeId="sidebar" rootItem="root" />
      {spaces.map(space => (
        <Tree key={space.id} treeId={space.id} rootItem={space.id} />
      ))}
    </UncontrolledTreeEnvironment>
  );
}
```

**Weaknesses:**
- No built-in virtualization (performance issue with large trees)
- Steeper learning curve with data provider pattern
- More verbose setup

---

### 3. Syncfusion React TreeView

**Website:** https://www.syncfusion.com/react-components/react-tree-view

**Strengths:**
- Enterprise-grade features
- Excellent documentation and demos
- Built-in themes
- Professional support included

**Weaknesses:**
- **Commercial license required** - $999/developer/year minimum
- Heavy bundle size (~200KB+ with dependencies)
- Opinionated styling harder to customize
- Overkill for our use case

**Verdict:** ❌ Not recommended due to cost and bundle size

---

### 4. KendoReact TreeView

**Website:** https://www.telerik.com/kendo-react-ui/components/treeview

**Strengths:**
- Mature, battle-tested
- Good TypeScript support
- Helper utilities for drag operations

**Weaknesses:**
- **Commercial license required** - Similar pricing to Syncfusion
- Drag & Drop is a **Premium** feature (additional cost)
- Heavy bundle size
- Less flexibility in node rendering

**Verdict:** ❌ Not recommended due to cost

---

## Recommendation: React Arborist

### Why React Arborist Wins

1. **Solves the exact problem** - Our custom drag-drop has bugs; Arborist's is battle-tested
2. **Perfect API match** - `onMove({ dragIds, parentId, index })` is exactly what our backend expects
3. **Design system compatible** - Full control over node rendering means we keep our exact UI
4. **Performance built-in** - Virtualization handles large trees without extra work
5. **Zero licensing cost** - MIT license, no vendor lock-in
6. **Active community** - 115K+ weekly downloads, responsive maintainers

### Migration Effort Estimate

| Task | Effort | Risk |
|------|--------|------|
| Replace TreeView with Arborist Tree | 4-6 hours | Low |
| Port TreeItem to custom Node renderer | 2-3 hours | Low |
| Wire up onMove to existing API | 1 hour | Low |
| Wire up onRename to existing API | 30 mins | Low |
| Port hover actions (add subfolder/link) | 2 hours | Low |
| Port context menu trigger | 1 hour | Low |
| Style to match design system | 2-3 hours | Low |
| Handle multi-tree (sidebar ↔ cards) | 4-6 hours | Medium |
| Testing & polish | 4-6 hours | Low |
| **Total** | **~20-28 hours** | **Low-Medium** |

---

## Implementation Plan

### Phase 1: Core Tree Replacement (Day 1)

1. **Install React Arborist**
   ```bash
   pnpm add react-arborist
   ```

2. **Create SpayceTreeNode component**
   - Port existing TreeItem rendering logic
   - Maintain all current styles from TreeView.module.css
   - Keep TreeItemIcon, InlineRenameInput, InlineInput

3. **Create SpayceTree wrapper component**
   - Props interface matching current TreeViewProps
   - Map our SpaceItem[] to Arborist's expected format
   - Configure dimensions from SpayceSpacing

### Phase 2: Drag & Drop (Day 1-2)

4. **Wire up onMove callback**
   - Connect to existing `itemsApi.move()`
   - Remove all custom drag-drop code (DraggableTreeItem, DroppableTreeItem)
   - Delete useDragDropUiStore (no longer needed)

5. **Handle multi-tree drag**
   - Sidebar → Space Card drops
   - Space Card → Sidebar drops
   - May need custom drag preview

### Phase 3: Features & Polish (Day 2-3)

6. **Inline operations**
   - Wire up onRename to existing rename flow
   - Port inline folder/link creation

7. **Context menu & hover actions**
   - Add to custom node renderer
   - Maintain existing onItemContextMenu flow

8. **Testing**
   - Verify all 36 position calculation test scenarios work
   - Manual testing of all drag-drop edge cases
   - Verify design system compliance

### Phase 4: Cleanup (Day 3)

9. **Remove deprecated code**
   - Delete DraggableTreeItem.tsx
   - Delete DroppableTreeItem.tsx
   - Delete FlashItem.tsx (use Arborist's built-in)
   - Delete DropIndicatorLine.tsx
   - Delete DragPreview.tsx
   - Clean up useDragDropUiStore.ts

10. **Final testing & documentation**

---

## Files to Modify/Delete

### DELETE (after migration):
```
packages/react-ui/src/components/drag-drop/
├── DraggableTreeItem.tsx      ← DELETE
├── DroppableTreeItem.tsx      ← DELETE
├── DragPreview.tsx            ← DELETE
├── DropIndicatorLine.tsx      ← DELETE
├── FlashItem.tsx              ← DELETE (use Arborist animation)
└── index.ts                   ← DELETE

packages/react-ui/src/stores/
└── dragDropUiStore.ts         ← DELETE (Arborist manages state)
```

### MODIFY:
```
packages/react-ui/src/components/
├── TreeView.tsx               ← Replace with Arborist wrapper
├── TreeItem.tsx               ← Convert to Arborist Node renderer
└── TreeView.module.css        ← Adapt for Arborist classes

packages/desktop/src/renderer/
└── App.tsx                    ← Simplify handleItemDrop
```

### ADD:
```
packages/react-ui/src/components/
├── SpayceTree.tsx             ← Arborist wrapper with our config
└── SpayceTreeNode.tsx         ← Custom node renderer
```

---

## Conclusion

**React Arborist** is the clear winner for Spayce because:

1. ✅ **Fixes our drag-drop bugs** with battle-tested implementation
2. ✅ **Matches our design system** with full rendering control
3. ✅ **No licensing cost** (MIT)
4. ✅ **Small bundle** (~25KB gzipped)
5. ✅ **Performance** with built-in virtualization
6. ✅ **Clean migration path** with ~20-28 hours effort
7. ✅ **Reduces code complexity** by removing 6+ custom components

### Next Steps

1. Get approval from user to proceed with React Arborist
2. Create feature branch for migration
3. Follow implementation plan phases
4. Delete deprecated drag-drop code
5. Comprehensive testing
