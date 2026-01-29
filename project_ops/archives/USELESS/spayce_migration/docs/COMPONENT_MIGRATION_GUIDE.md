# Component Migration Guide

> **Purpose**: Patterns and best practices for migrating Flutter components to React. This document will be updated as we discover patterns during implementation.

---

## Flutter → React Mapping

### State Management

| Flutter | React |
|---------|-------|
| `Riverpod StateProvider` | `Zustand store` |
| `ref.watch(provider)` | `useStore(selector)` |
| `ref.read(provider.notifier).update()` | `useStore.getState().action()` |
| `ConsumerWidget` | Component with hooks |

### Layout

| Flutter | React/CSS |
|---------|-----------|
| `Container` | `<div>` with styles |
| `Row` | `display: flex; flex-direction: row` |
| `Column` | `display: flex; flex-direction: column` |
| `Expanded` | `flex: 1` |
| `SizedBox(width: x)` | `<div style={{ width: x }} />` or CSS gap |
| `Padding` | `padding` CSS property |
| `EdgeInsets.all(x)` | `padding: ${x}px` |
| `EdgeInsets.symmetric(h, v)` | `padding: ${v}px ${h}px` |

### Decorations

| Flutter | React/CSS |
|---------|-----------|
| `BoxDecoration(color: x)` | `background-color: x` |
| `BoxDecoration(borderRadius: x)` | `border-radius: x` |
| `BoxDecoration(border: Border.all())` | `border: 1px solid x` |
| `BoxDecoration(boxShadow: [])` | `box-shadow: ...` |

### Animations

| Flutter | React |
|---------|-------|
| `AnimatedContainer` | CSS transitions or Framer Motion |
| `AnimatedRotation` | `transform: rotate()` with transition |
| `duration: Duration(milliseconds: x)` | `transition: property ${x}ms` |
| `Curves.easeOut` | `cubic-bezier(0, 0, 0.2, 1)` |
| `Curves.easeInOut` | `cubic-bezier(0.42, 0, 0.58, 1)` |

### Events

| Flutter | React |
|---------|-------|
| `GestureDetector(onTap: ...)` | `onClick` |
| `GestureDetector(onSecondaryTap: ...)` | `onContextMenu` |
| `InkWell` with ripple | Custom hover state or library |
| `onHover: (isHover) => ...` | `onMouseEnter/onMouseLeave` |

### Icons

| Flutter | React |
|---------|-------|
| `lucide_icons` package | `lucide-react` package |
| `Icon(LucideIcons.plus)` | `<Plus size={20} />` |
| `Icon(size: 16, color: x)` | `<Icon size={16} color="x" />` |

---

## Component Template

```tsx
// src/renderer/components/ComponentName.tsx

import React, { useState } from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // Props from spec
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  // Destructured props
}) => {
  // State (map from Riverpod providers)
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
};
```

---

## CSS Module Template

```css
/* src/renderer/components/ComponentName.module.css */

.container {
  /* Layout */
  display: flex;
  flex-direction: column;
  
  /* Sizing from design tokens */
  width: var(--layout-sidebar-width);
  padding: var(--spacing-md);
  
  /* Appearance */
  background-color: var(--color-bg-sidebar);
  border-radius: var(--radius-xl);
}

.item {
  /* Row layout */
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--spacing-sm);
  gap: var(--spacing-sm);
  
  /* Hover state */
  transition: background-color var(--duration-hover) ease;
}

.item:hover {
  background-color: var(--color-bg-accent);
}

/* Animation example */
.expandable {
  overflow: hidden;
  transition: height var(--duration-expand) var(--ease-out);
}

.chevron {
  transition: transform var(--duration-expand) var(--ease-out);
}

.chevron.expanded {
  transform: rotate(90deg);
}
```

---

## Animation Patterns

### Expand/Collapse (Height Animation)

```tsx
// Using CSS transitions
const TreeItem = ({ isExpanded, children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  
  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded]);
  
  return (
    <div 
      className={styles.expandable}
      style={{ height }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};
```

### Hover State

```tsx
// Using CSS (preferred)
<div className={styles.item}>...</div>

// CSS
.item {
  background-color: transparent;
  transition: background-color 150ms ease;
}
.item:hover {
  background-color: var(--color-bg-accent);
}
```

### Icon Rotation

```tsx
<ChevronRight 
  className={cn(styles.chevron, isExpanded && styles.expanded)}
  size={16}
/>

// CSS
.chevron {
  transition: transform 200ms var(--ease-out);
}
.chevron.expanded {
  transform: rotate(90deg);
}
```

---

## Context Menu Pattern

```tsx
// Reusable context menu hook
const useContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  return { isOpen, position, handleContextMenu, handleClose };
};
```

---

## Keyboard Navigation Pattern

```tsx
// Focus management for tree
const TreeView = () => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        // Activate item
        break;
      case 'Escape':
        setFocusedIndex(-1);
        break;
    }
  };
  
  return (
    <div 
      role="tree"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, i) => (
        <div
          role="treeitem"
          aria-selected={focusedIndex === i}
          className={cn(styles.item, focusedIndex === i && styles.focused)}
        >
          {item.title}
        </div>
      ))}
    </div>
  );
};
```

---

## Zustand Store Pattern

```typescript
// stores/sidebarStore.ts
import { create } from 'zustand';

interface SidebarState {
  expandedFolders: Set<string>;
  selectedItemId: string | null;
  
  // Actions
  toggleExpand: (id: string) => void;
  setSelectedItem: (id: string | null) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  expandedFolders: new Set(),
  selectedItemId: null,
  
  toggleExpand: (id) => set((state) => {
    const next = new Set(state.expandedFolders);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return { expandedFolders: next };
  }),
  
  setSelectedItem: (id) => set({ selectedItemId: id }),
}));
```

---

## Checklist for Each Component

Before marking a component as complete:

- [ ] Visual appearance matches screenshot
- [ ] All hover states implemented
- [ ] Animations match timing specs (±20ms tolerance)
- [ ] Keyboard navigation works (if applicable)
- [ ] Accessibility attributes present
- [ ] No console errors or warnings
- [ ] Works with mock data
- [ ] CSS uses design token variables

---

*This document will be updated as patterns are discovered during implementation.*
