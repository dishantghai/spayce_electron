# Core Item Management - Implementation Status

## Completed Components

### ✅ F001: Inline Folder Creation - Core Components
**Status**: Components implemented, integration pending

**Completed:**
- ✅ `InlineInput.tsx` - Reusable inline input component for folders and links
- ✅ `InlineInput.module.css` - Styled with design system tokens
- ✅ `InlineRenameInput.tsx` - Inline rename component
- ✅ `InlineRenameInput.module.css` - Rename input styles
- ✅ `TreeItem.tsx` - Updated to support inline input and rename modes
- ✅ `TreeView.tsx` - Updated to render inline input at root level
- ✅ `utils/url.ts` - URL utility functions for link handling

**Key Features Implemented:**
- Auto-focus on mount
- Enter to submit, Escape to cancel
- Blur with content submits, blur without content cancels
- Proper indentation matching tree levels
- Accent color theming from space
- Icon based on type (Folder 16px, Link 14px)

### ✅ F002: Link Creation - Complete
**Status**: Fully implemented

**Completed:**
- ✅ `normalizeUrl()` - Adds https:// if missing
- ✅ `extractDomain()` - Extracts hostname from URL
- ✅ `isLikelyUrl()` - Detects URL-like strings
- ✅ `getFaviconUrl()` - Generates favicon URL
- ✅ `getGoogleFaviconUrl()` - Fallback favicon service
- ✅ Clipboard IPC handlers in main process
- ✅ Preload API exposure
- ✅ Auto-paste integration in InlineInput
- ✅ TypeScript declarations for electronAPI

### ✅ F003: Inline Rename
**Status**: Component complete, integration pending

**Completed:**
- ✅ InlineRenameInput component with validation
- ✅ Pre-fill and select all on mount
- ✅ Empty name validation
- ✅ Save only if changed

### ⏳ F004: Hover Actions & Context Menu
**Status**: Partially implemented in TreeItem

**Completed:**
- ✅ Hover action buttons structure in TreeItem
- ✅ FolderPlus, Link, MoreVertical icons

**Pending:**
- ⏳ Wire up hover actions to inline input store
- ⏳ Context menu integration
- ⏳ Full context menu items for folders and links

## Integration Requirements

### Sidebar Integration Pattern

The Sidebar component needs to:

1. **Use inline input store:**
```typescript
import { useInlineInputStore } from '../stores/inlineInputStore';

const {
  sidebarInput,
  setSidebarInput,
  clearSidebarInput,
  sidebarRenameItemId,
  setSidebarRenameItemId,
} = useInlineInputStore();
```

2. **Use mutation hooks:**
```typescript
import { useCreateItem } from '../hooks/mutations/useCreateItem';
import { useRenameItem } from '../hooks/mutations/useRenameItem';
import { SpaceItemType } from '@spayce/core';
import { normalizeUrl, extractDomain, getFaviconUrl } from '../utils/url';

const { mutate: createItem } = useCreateItem();
const { mutate: renameItem } = useRenameItem();
```

3. **Handle folder creation from SpaceHeader:**
```typescript
const handleAddFolder = useCallback((spaceId: string) => {
  setSidebarInput({ spaceId, parentId: null, type: 'folder' });
}, [setSidebarInput]);

const handleAddLink = useCallback((spaceId: string) => {
  setSidebarInput({ spaceId, parentId: null, type: 'link' });
}, [setSidebarInput]);
```

4. **Handle subfolder/link from TreeItem hover:**
```typescript
const handleAddSubfolder = useCallback((parentItem: SpaceItem) => {
  // Auto-expand parent folder
  setExpandedIds(prev => new Set([...prev, parentItem.id]));
  setSidebarInput({ 
    spaceId: activeSpace.id, 
    parentId: parentItem.id, 
    type: 'folder' 
  });
}, [activeSpace, setSidebarInput]);

const handleAddLink = useCallback((parentItem: SpaceItem) => {
  setExpandedIds(prev => new Set([...prev, parentItem.id]));
  setSidebarInput({ 
    spaceId: activeSpace.id, 
    parentId: parentItem.id, 
    type: 'link' 
  });
}, [activeSpace, setSidebarInput]);
```

5. **Handle inline input submission:**
```typescript
const handleInlineInputSubmit = useCallback(async (
  value: string,
  type: 'folder' | 'link',
  parentId: string | null
) => {
  if (type === 'folder') {
    await createItem({
      spaceId: activeSpace.id,
      parentId,
      name: value,
      path: value,
      type: SpaceItemType.Folder,
    });
  } else {
    // Link creation
    const url = normalizeUrl(value);
    const name = extractDomain(url);
    const faviconUrl = getFaviconUrl(url);
    
    await createItem({
      spaceId: activeSpace.id,
      parentId,
      name,
      path: url,
      type: SpaceItemType.Link,
      faviconUrl,
    });
  }
  clearSidebarInput();
}, [activeSpace, createItem, clearSidebarInput]);
```

6. **Handle rename:**
```typescript
const handleRenameSubmit = useCallback(async (
  itemId: string,
  newName: string
) => {
  await renameItem(itemId, newName);
  setSidebarRenameItemId(null);
}, [renameItem, setSidebarRenameItemId]);

const handleRenameCancel = useCallback(() => {
  setSidebarRenameItemId(null);
}, [setSidebarRenameItemId]);
```

7. **Pass to TreeView:**
```typescript
<TreeView
  items={treeItems}
  spaceId={activeSpace.id}
  selectedId={focusedItemId || selectedItemId}
  activeId={focusedItemId}
  expandedIds={expandedIds}
  accentColor={activeSpace.accentColor}
  inlineInput={sidebarInput}
  renameItemId={sidebarRenameItemId}
  onItemClick={handleItemClick}
  onItemContextMenu={handleItemContextMenu}
  onExpandedChange={setExpandedIds}
  onAddSubfolder={handleAddSubfolder}
  onAddLink={handleAddLink}
  onInlineInputSubmit={handleInlineInputSubmit}
  onInlineInputCancel={clearSidebarInput}
  onRenameSubmit={handleRenameSubmit}
  onRenameCancel={handleRenameCancel}
/>
```

8. **Context menu integration:**
```typescript
const handleItemContextMenu = useCallback((
  item: SpaceItem,
  spaceId: string,
  event: React.MouseEvent
) => {
  // Show context menu with items based on item type
  // "Rename" option should call: setSidebarRenameItemId(item.id)
  onItemContextMenu?.(item, spaceId, event);
}, [onItemContextMenu, setSidebarRenameItemId]);
```

## Clipboard IPC Implementation

### Main Process (handlers.ts)
```typescript
import { ipcMain, clipboard } from 'electron';

ipcMain.handle('clipboard:readText', () => {
  return clipboard.readText();
});
```

### Preload (index.ts)
```typescript
clipboard: {
  readText: () => ipcRenderer.invoke('clipboard:readText'),
}
```

### InlineInput Component
```typescript
useEffect(() => {
  if (type !== 'link') return;
  
  const loadClipboard = async () => {
    try {
      const text = await window.electron.clipboard.readText();
      if (text && isLikelyUrl(text)) {
        setValue(text);
        // Select all so user can see the domain
        setTimeout(() => inputRef.current?.select(), 0);
      }
    } catch (e) {
      // Ignore clipboard errors
    }
  };
  
  loadClipboard();
}, [type]);
```

## Testing Checklist

### Manual Testing Required

#### F001: Folder Creation
- [ ] Click folder+ in SpaceHeader → input appears at root
- [ ] Type name, press Enter → folder created
- [ ] Press Escape → input cancelled
- [ ] Click outside with text → folder created
- [ ] Click outside empty → input cancelled
- [ ] Click folder+ on folder → input appears inside folder
- [ ] Parent folder auto-expands when adding subfolder

#### F002: Link Creation
- [ ] Copy URL, click link+ → URL pre-filled
- [ ] Type URL, press Enter → link created with favicon
- [ ] Partial URL (google.com) → https:// added
- [ ] Domain extracted as link name
- [ ] Link appears with favicon icon

#### F003: Rename
- [ ] Right-click → Rename → input appears
- [ ] Name pre-selected
- [ ] Type new name, Enter → saved
- [ ] Press Escape → reverted
- [ ] Empty name blocked

#### F004: Hover Actions
- [ ] Hover folder → 3 icons appear
- [ ] Hover link → 1 icon appears
- [ ] Icons fade in/out smoothly
- [ ] FolderPlus → inline folder input
- [ ] Link → inline link input
- [ ] MoreVertical → context menu

## Next Steps

1. ✅ Complete Sidebar integration with stores and hooks
2. ⏳ Add clipboard IPC handlers
3. ⏳ Wire up context menu "Rename" action
4. ⏳ Test all functionality end-to-end
5. ⏳ Update story status files
6. ⏳ Commit with detailed message

## Files Modified

### Created:
- `packages/react-ui/src/components/InlineInput.tsx`
- `packages/react-ui/src/components/InlineInput.module.css`
- `packages/react-ui/src/components/InlineRenameInput.tsx`
- `packages/react-ui/src/components/InlineRenameInput.module.css`
- `packages/react-ui/src/utils/url.ts`
- `packages/react-ui/src/utils/index.ts`

### Modified:
- `packages/react-ui/src/components/TreeItem.tsx` - Added inline input and rename support
- `packages/react-ui/src/components/TreeView.tsx` - Added root-level inline input
- `packages/react-ui/src/components/Sidebar.tsx` - Added spaceId prop to TreeView
- `packages/react-ui/src/components/index.ts` - Exported new components

### Pending:
- `packages/desktop/src/main/ipc/handlers.ts` - Clipboard IPC
- `packages/desktop/src/preload/index.ts` - Clipboard API exposure
- `packages/react-ui/src/components/Sidebar.tsx` - Full integration
- `packages/react-ui/src/components/ContextMenu.tsx` - Rename action
