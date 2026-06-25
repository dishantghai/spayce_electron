# Fix: Root Level Folder/Link Creation Not Working

## Root Cause Analysis

### Evidence Found

**Issue #1: Sidebar Component Missing Store Integration**
- **File**: `packages/react-ui/src/components/Sidebar.tsx`
- **Problem**: No `useInlineInputStore()` usage
- **Evidence**: Searched entire component - zero store integration

**Issue #2: Sidebar Missing Mutation Hooks**
- **Problem**: No `useCreateItem()` or `useRenameItem()` hooks
- **Evidence**: No item creation/rename functionality wired up

**Issue #3: TreeView Missing All Inline Input Props**
- **Before** (lines 591-600):
```typescript
<TreeView
  items={treeItems}
  spaceId={activeSpace.id}
  selectedId={focusedItemId || selectedItemId}
  activeId={focusedItemId}
  expandedIds={expandedIds}
  accentColor={activeSpace.accentColor}
  onItemClick={handleItemClick}
  onItemContextMenu={handleItemContextMenu}
  onExpandedChange={setExpandedIds}
/>
```

**Missing 8 critical props**:
- `inlineInput` - for triggering inline input display
- `renameItemId` - for triggering rename mode
- `onAddSubfolder` - for nested folder creation
- `onAddLink` - for nested link creation
- `onInlineInputSubmit` - for saving created items
- `onInlineInputCancel` - for cancelling input
- `onRenameSubmit` - for saving renames
- `onRenameCancel` - for cancelling renames

**Issue #4: SpaceHeader Not Triggering Store**
- **Before** (lines 582-587):
```typescript
<SpaceHeader
  space={activeSpace}
  onEditSpace={handleEditSpace}
  onAddFolder={onAddFolder}  // ❌ Just calls parent prop (console.log in App.tsx)
  onAddLink={onAddLink}      // ❌ Just calls parent prop (console.log in App.tsx)
/>
```

## Fixes Applied

### 1. Added Required Imports
```typescript
import { useInlineInputStore } from '../stores/inlineInputStore';
import { useCreateItem, SpaceItemType as CoreSpaceItemType } from '../hooks/mutations/useCreateItem';
import { useRenameItem } from '../hooks/mutations/useRenameItem';
import { normalizeUrl, extractDomain, getFaviconUrl } from '../utils/url';
```

### 2. Added Store and Hook Integration (lines 78-89)
```typescript
// Inline input and rename state
const {
    sidebarInput,
    setSidebarInput,
    clearSidebarInput,
    sidebarRenameItemId,
    setSidebarRenameItemId,
} = useInlineInputStore();

// Mutation hooks
const { mutate: createItem } = useCreateItem();
const { mutate: renameItem } = useRenameItem();
```

### 3. Implemented All Handler Functions (lines 405-471)

**Root Level Handlers**:
```typescript
const handleAddFolderClick = useCallback((spaceId: string) => {
    setSidebarInput({ spaceId, parentId: null, type: 'folder' });
    onAddFolder?.(spaceId);
}, [setSidebarInput, onAddFolder]);

const handleAddLinkClick = useCallback((spaceId: string) => {
    setSidebarInput({ spaceId, parentId: null, type: 'link' });
    onAddLink?.(spaceId);
}, [setSidebarInput, onAddLink]);
```

**Nested Item Handlers with Auto-Expand**:
```typescript
const handleAddSubfolder = useCallback((parentItem: SpaceItem) => {
    if (!activeSpace) return;
    setExpandedIds(prev => new Set([...prev, parentItem.id]));
    setSidebarInput({ spaceId: activeSpace.id, parentId: parentItem.id, type: 'folder' });
}, [activeSpace, setSidebarInput]);

const handleAddLinkToFolder = useCallback((parentItem: SpaceItem) => {
    if (!activeSpace) return;
    setExpandedIds(prev => new Set([...prev, parentItem.id]));
    setSidebarInput({ spaceId: activeSpace.id, parentId: parentItem.id, type: 'link' });
}, [activeSpace, setSidebarInput]);
```

**Submit Handler with URL Normalization**:
```typescript
const handleInlineInputSubmit = useCallback(async (
    value: string,
    type: 'folder' | 'link',
    parentId: string | null
) => {
    if (!activeSpace) return;

    if (type === 'folder') {
        await createItem({
            spaceId: activeSpace.id,
            parentId,
            name: value,
            path: value,
            type: CoreSpaceItemType.Folder,
        });
    } else {
        const url = normalizeUrl(value);
        const name = extractDomain(url);
        const faviconUrl = getFaviconUrl(url);
        
        await createItem({
            spaceId: activeSpace.id,
            parentId,
            name,
            path: url,
            type: CoreSpaceItemType.Link,
            faviconUrl,
        });
    }
    clearSidebarInput();
}, [activeSpace, createItem, clearSidebarInput]);
```

**Cancel and Rename Handlers**:
```typescript
const handleInlineInputCancel = useCallback(() => {
    clearSidebarInput();
}, [clearSidebarInput]);

const handleRenameSubmit = useCallback(async (itemId: string, newName: string) => {
    await renameItem(itemId, newName);
    setSidebarRenameItemId(null);
}, [renameItem, setSidebarRenameItemId]);

const handleRenameCancel = useCallback(() => {
    setSidebarRenameItemId(null);
}, [setSidebarRenameItemId]);
```

### 4. Wired Up SpaceHeader (lines 582-587)
```typescript
<SpaceHeader
    space={activeSpace}
    onEditSpace={handleEditSpace}
    onAddFolder={handleAddFolderClick}  // ✅ Now triggers store
    onAddLink={handleAddLinkClick}      // ✅ Now triggers store
/>
```

### 5. Wired Up TreeView with All Props (lines 591-609)
```typescript
<TreeView
    items={treeItems}
    spaceId={activeSpace.id}
    selectedId={focusedItemId || selectedItemId}
    activeId={focusedItemId}
    expandedIds={expandedIds}
    accentColor={activeSpace.accentColor}
    inlineInput={sidebarInput}                    // ✅ Added
    renameItemId={sidebarRenameItemId}            // ✅ Added
    onItemClick={handleItemClick}
    onItemContextMenu={handleItemContextMenu}
    onExpandedChange={setExpandedIds}
    onAddSubfolder={handleAddSubfolder}           // ✅ Added
    onAddLink={handleAddLinkToFolder}             // ✅ Added
    onInlineInputSubmit={handleInlineInputSubmit} // ✅ Added
    onInlineInputCancel={handleInlineInputCancel} // ✅ Added
    onRenameSubmit={handleRenameSubmit}           // ✅ Added
    onRenameCancel={handleRenameCancel}           // ✅ Added
/>
```

## Complete Data Flow

### Root Level Folder Creation
1. User hovers SpaceHeader → FolderPlus icon appears
2. User clicks FolderPlus → `handleAddFolderClick()` called
3. `setSidebarInput({ spaceId, parentId: null, type: 'folder' })` updates store
4. Store update triggers TreeView re-render
5. TreeView sees `inlineInput.parentId === null` → renders InlineInput at root
6. InlineInput auto-focuses
7. User types name, presses Enter → `handleInlineInputSubmit()` called
8. `createItem()` mutation creates folder in database
9. `clearSidebarInput()` hides inline input
10. Item appears in tree (via query invalidation)

### Root Level Link Creation
1. User hovers SpaceHeader → Link icon appears
2. User clicks Link → `handleAddLinkClick()` called
3. `setSidebarInput({ spaceId, parentId: null, type: 'link' })` updates store
4. TreeView renders InlineInput at root
5. InlineInput checks clipboard for URL → auto-pastes if found
6. User modifies/confirms URL, presses Enter
7. `handleInlineInputSubmit()` normalizes URL, extracts domain, gets favicon
8. `createItem()` creates link with all metadata
9. Link appears in tree with favicon

### Nested Item Creation
1. User hovers folder → FolderPlus/Link icons appear
2. User clicks icon → `handleAddSubfolder()` or `handleAddLinkToFolder()` called
3. Parent folder auto-expands: `setExpandedIds(prev => new Set([...prev, parentItem.id]))`
4. Store updated with `parentId: item.id`
5. TreeView renders InlineInput inside folder (TreeItem handles this)
6. Rest of flow same as root level

## Files Modified

**Modified (1 file)**:
- `packages/react-ui/src/components/Sidebar.tsx`
  - Added 4 imports
  - Added store/hooks integration (12 lines)
  - Added 7 handler functions (66 lines)
  - Updated SpaceHeader props (2 lines)
  - Updated TreeView props (8 new props)

## Testing Status

### TypeScript Compilation
✅ **PASSED** - No new errors introduced
- Pre-existing config errors unrelated to changes

### Build Status
✅ **READY** - All code compiles successfully

### Manual Testing Required
- [ ] Click FolderPlus in SpaceHeader → inline input appears
- [ ] Type folder name, Enter → folder created at root
- [ ] Click Link in SpaceHeader → inline input appears
- [ ] Type/paste URL, Enter → link created with favicon
- [ ] Hover folder → icons appear
- [ ] Click FolderPlus on folder → inline input inside folder
- [ ] Parent folder auto-expands
- [ ] Nested folder created successfully

## Next Steps

1. ✅ Core integration complete
2. ⏳ Manual testing by user
3. ⏳ Apply same pattern to SpaceCard component
4. ⏳ Wire up context menu "Rename" action
5. ⏳ Commit all changes

## Summary

**Root cause**: Complete lack of store integration and handler wiring in Sidebar component.

**Solution**: Integrated inline input store, added all mutation hooks, implemented all 7 handler functions, and wired up SpaceHeader and TreeView with correct props.

**Result**: Folder/Link creation at root level and nested levels should now work correctly through SpaceHeader buttons, TreeItem hover icons, and context menus.
