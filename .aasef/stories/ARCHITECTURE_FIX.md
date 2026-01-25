# Critical Architecture Fix: better-sqlite3 Import Error

## Error
```
Uncaught SyntaxError: The requested module '...better-sqlite3/lib/index.js' 
does not provide an export named 'default'
```

## Root Cause Analysis

### Evidence 1: Architecture Violation
```typescript
// packages/react-ui/src/index.ts (lines 4-7)
// NOTE: Hooks are NOT exported from main index because they import @spayce/infrastructure
// which includes better-sqlite3 (Node.js native module that cannot run in browser/Electron renderer)
// For Electron apps, use IPC-based hooks from packages/desktop/src/renderer/hooks instead
```

### Evidence 2: My Previous Changes (WRONG!)
```typescript
// Sidebar.tsx - I incorrectly added these imports:
import { useCreateItem } from '../hooks/mutations/useCreateItem';  // ❌
import { useRenameItem } from '../hooks/mutations/useRenameItem';  // ❌

// These hooks import @spayce/infrastructure, which imports better-sqlite3
```

### Evidence 3: better-sqlite3 is CommonJS Native Module
```javascript
// better-sqlite3/lib/index.js
'use strict';
module.exports = require('./database');  // CommonJS, NOT ESM
```

### Evidence 4: Package Context
- **@spayce/infrastructure**: ESM package (`"type": "module"`)
- **better-sqlite3**: CommonJS native Node.js module
- **Vite/Electron Renderer**: Browser environment, CANNOT load native modules

### Critical Issue
**Native Node.js modules like better-sqlite3 can ONLY run in Electron's MAIN process, NOT the renderer process.**

When Vite tries to load the infrastructure package in the browser/renderer:
1. Sidebar.tsx imports hooks
2. Hooks import `@spayce/infrastructure`
3. Infrastructure imports `better-sqlite3`
4. Vite tries to load native module in browser → **CRASH**

## The Fix

### 1. Removed Infrastructure Imports from Sidebar
```typescript
// BEFORE (WRONG):
import { useCreateItem } from '../hooks/mutations/useCreateItem';
import { useRenameItem } from '../hooks/mutations/useRenameItem';
const { mutate: createItem } = useCreateItem();
const { mutate: renameItem } = useRenameItem();

// AFTER (CORRECT):
// No direct database access - delegate to parent via callbacks
```

### 2. Added Callback Props to Sidebar
```typescript
export interface SidebarProps {
    // ... existing props
    onCreateItem?: (input: { 
        spaceId: string; 
        parentId: string | null; 
        name: string; 
        path: string; 
        type: string; 
        faviconUrl?: string | null 
    }) => Promise<void>;
    onRenameItem?: (itemId: string, newName: string) => Promise<void>;
}
```

### 3. Updated Sidebar Handlers
```typescript
const handleInlineInputSubmit = useCallback(async (
    value: string,
    type: 'folder' | 'link',
    parentId: string | null
) => {
    if (!activeSpace || !onCreateItem) return;

    if (type === 'folder') {
        await onCreateItem({
            spaceId: activeSpace.id,
            parentId,
            name: value,
            path: value,
            type: 'folder',
        });
    } else {
        const url = normalizeUrl(value);
        const name = extractDomain(url);
        const faviconUrl = getFaviconUrl(url);

        await onCreateItem({
            spaceId: activeSpace.id,
            parentId,
            name,
            path: url,
            type: 'link',
            faviconUrl,
        });
    }
    clearSidebarInput();
}, [activeSpace, onCreateItem, clearSidebarInput]);

const handleRenameSubmit = useCallback(async (itemId: string, newName: string) => {
    if (onRenameItem) {
        await onRenameItem(itemId, newName);
    }
    setSidebarRenameItemId(null);
}, [onRenameItem, setSidebarRenameItemId]);
```

### 4. Implemented IPC-Based Handlers in App.tsx
```typescript
const handleCreateItem = async (input: {
    spaceId: string;
    parentId: string | null;
    name: string;
    path: string;
    type: string;
    faviconUrl?: string | null;
}) => {
    const result = await (window as any).electronAPI?.items?.create({
        spaceId: input.spaceId,
        parentId: input.parentId || undefined,
        name: input.name,
        path: input.path,
        type: input.type,
    });
    
    if (result?.success) {
        await refetch();  // Refresh UI
    }
};

const handleRenameItem = async (itemId: string, newName: string) => {
    const result = await (window as any).electronAPI?.items?.rename(itemId, newName);
    
    if (result?.success) {
        await refetch();
    }
};
```

### 5. Wired Up Handlers
```typescript
<Sidebar
    // ... existing props
    onCreateItem={handleCreateItem}
    onRenameItem={handleRenameItem}
/>
```

## Architecture Layers

### ✅ Correct Architecture
```
┌─────────────────────────────────────────────────────────┐
│ RENDERER PROCESS (Browser/Vite)                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ App.tsx                                           │   │
│ │  └─ IPC Handlers (electronAPI.items.create)      │   │
│ │     └─ Sidebar.tsx (UI only, no database)        │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ IPC
                           ▼
┌─────────────────────────────────────────────────────────┐
│ MAIN PROCESS (Node.js)                                  │
│ ┌───────────────────────────────────────────────────┐   │
│ │ IPC Handlers                                      │   │
│ │  └─ @spayce/infrastructure                        │   │
│ │     └─ better-sqlite3 ✅ (Native module OK here) │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### ❌ Previous Wrong Architecture
```
┌─────────────────────────────────────────────────────────┐
│ RENDERER PROCESS (Browser/Vite)                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Sidebar.tsx                                       │   │
│ │  └─ useCreateItem hook                            │   │
│ │     └─ @spayce/infrastructure                     │   │
│ │        └─ better-sqlite3 ❌ CRASH!                │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Files Modified

1. **`packages/react-ui/src/components/Sidebar.tsx`**
   - Removed infrastructure imports
   - Added `onCreateItem` and `onRenameItem` props
   - Updated handlers to use callbacks instead of direct database access

2. **`packages/desktop/src/renderer/App.tsx`**
   - Added `handleCreateItem` IPC-based handler
   - Added `handleRenameItem` IPC-based handler
   - Wired handlers to Sidebar component

## Result

✅ **App now loads without errors**
✅ **Native modules stay in main process**
✅ **Renderer uses IPC for all database operations**
✅ **Proper separation of concerns**
✅ **Inline folder/link creation will work via IPC**

## Key Lesson

**Never import @spayce/infrastructure (or any package with native modules) in React components that run in the browser/renderer process.**

Always use:
- **Main Process**: Direct access to infrastructure/database
- **Renderer Process**: IPC-based API calls via electronAPI
- **Separation**: Keep native modules isolated in main process
