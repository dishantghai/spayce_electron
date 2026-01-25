# Phase 3: Copy/Paste Operations

**Priority:** P0 - Critical  
**Dependencies:** 016, Phase 2  
**Total Estimated Effort:** 12 hours

This phase implements full copy/paste functionality for items.

---

## F007: Copy Single Item

**Priority:** P0 - Critical  
**Dependencies:** 016  
**Estimated Effort:** 3 hours  
**User Value:** Users can duplicate items via copy/paste

### User Story

> As a user, I want to copy a folder or link and paste it elsewhere, so I can organize my content efficiently.

### Acceptance Criteria

- [ ] Context menu "Copy Folder" → copies folder to internal clipboard
- [ ] Context menu "Copy Link" → copies link to internal clipboard AND URL to system clipboard
- [ ] Context menu "Copy All Links" → copies all nested links AND URLs to system clipboard
- [ ] Keyboard shortcut Cmd+C copies selected item

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Copy Link | `main_layout_final.dart` | 2162-2169 |
| Copy Folder | `main_layout_final.dart` | 2171-2177 |
| Copy All Links | `main_layout_final.dart` | 2179-2189 |
| Collect Links Recursive | `main_layout_final.dart` | 2191-2200 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Copy link (main_layout_final.dart:2162-2169)
void _copyLink(SpaceItem item) {
  Clipboard.setData(ClipboardData(text: item.path));
  ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
    items: [item],
    sourceSpaceId: widget.space.id,
    action: ClipboardAction.copy,
  );
}

// Copy folder (main_layout_final.dart:2171-2177)
void _copyFolder(SpaceItem item) {
  ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
    items: [item],
    sourceSpaceId: widget.space.id,
    action: ClipboardAction.copy,
  );
}

// Copy all links (main_layout_final.dart:2179-2200)
void _copyAllLinks(SpaceItem folder) {
  final links = <SpaceItem>[];
  _collectLinks(folder, links);
  if (links.isNotEmpty) {
    // Copy URLs to system clipboard (newline separated)
    Clipboard.setData(ClipboardData(text: links.map((l) => l.path).join('\n')));
    ref.read(spaceClipboardProvider.notifier).state = SpaceClipboardState(
      items: links,
      sourceSpaceId: widget.space.id,
      action: ClipboardAction.copy,
    );
  }
}

void _collectLinks(SpaceItem item, List<SpaceItem> links) {
  if (item.type == SpaceItemType.link) {
    links.add(item);
  }
  for (final child in item.children) {
    _collectLinks(child, links);
  }
}
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/stores/clipboardStore.ts
packages/desktop/src/renderer/App.tsx
```

### Implementation Steps

1. **Add Helper Function for Collecting Links**
   ```typescript
   // utils/spaceItems.ts
   export function collectLinksRecursive(item: SpaceItem): SpaceItem[] {
     const links: SpaceItem[] = [];
     
     function collect(node: SpaceItem) {
       if (node.type === 'link') {
         links.push(node);
       }
       if (node.children) {
         node.children.forEach(collect);
       }
     }
     
     collect(item);
     return links;
   }
   
   export function hasLinksRecursive(item: SpaceItem): boolean {
     if (item.type === 'link') return true;
     if (item.children) {
       return item.children.some(hasLinksRecursive);
     }
     return false;
   }
   ```

2. **Implement Copy Actions in App.tsx**
   ```typescript
   const handleCopyLink = (item: SpaceItem) => {
     clipboardStore.copyItems([item], activeSpaceId);
     window.electronApi.clipboard.writeText(item.path);
   };
   
   const handleCopyFolder = (item: SpaceItem) => {
     clipboardStore.copyItems([item], activeSpaceId);
   };
   
   const handleCopyAllLinks = (item: SpaceItem) => {
     const links = collectLinksRecursive(item);
     if (links.length > 0) {
       clipboardStore.copyItems(links, activeSpaceId);
       const urls = links.map(l => l.path).join('\n');
       window.electronApi.clipboard.writeText(urls);
     }
   };
   ```

### Manual Testing Checklist

- [ ] Copy link → URL in system clipboard (paste in browser works)
- [ ] Copy link → internal clipboard has item
- [ ] Copy folder → internal clipboard has folder
- [ ] Copy all links → all nested URLs in system clipboard
- [ ] Internal clipboard persists until new copy or paste

---

## F008: Paste Items

**Priority:** P0 - Critical  
**Dependencies:** F007  
**Estimated Effort:** 4 hours  
**User Value:** Users can paste copied items to organize content

### User Story

> As a user, I want to paste copied items into a space or folder, so I can duplicate and reorganize my content.

### Acceptance Criteria

- [ ] Context menu "Paste" → pastes from internal clipboard
- [ ] If folder selected, paste INTO folder
- [ ] If no folder selected, paste at space root
- [ ] Pasted items get new IDs (true copy)
- [ ] Children copied recursively (preserve hierarchy)
- [ ] Auto-expand target folder to show pasted items

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Paste Handler | `main_layout_final.dart` | 910-969 |
| Paste Recursive | `main_layout_final.dart` | 2218-2242 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Paste handler (main_layout_final.dart:910-969)
Future<void> _handlePaste() async {
  final selectedItem = ref.read(selectedSpaceItemProvider);
  String? targetParentId;

  // If a folder is selected, paste into it
  if (selectedItem != null &&
      selectedItem.spaceId == widget.space.id &&
      selectedItem.item.type == SpaceItemType.folder) {
    targetParentId = selectedItem.item.id;

    // Expand the folder to show pasted items
    final expandedFolders = ref.read(expandedFoldersProvider);
    if (!expandedFolders.contains(targetParentId)) {
      final newSet = Set<String>.from(expandedFolders);
      newSet.add(targetParentId);
      ref.read(expandedFoldersProvider.notifier).state = newSet;
    }
  }

  // First try internal clipboard (SpaceItems)
  final clipboard = ref.read(spaceClipboardProvider);
  if (clipboard != null && clipboard.items.isNotEmpty) {
    for (final item in clipboard.items) {
      await _pasteItemRecursively(widget.space.id, targetParentId, item);
    }
    return;
  }
}

// Paste recursive (main_layout_final.dart:2218-2242)
Future<void> _pasteItemRecursively(
  String spaceId,
  String? parentId,
  SpaceItem source,
) async {
  final newItem = SpaceItem(
    id: ref.read(spacesListProvider.notifier).generateId(),
    name: source.name,
    path: source.path,
    type: source.type,
    faviconUrl: source.faviconUrl,
    description: source.description,
  );

  await ref
      .read(spacesListProvider.notifier)
      .addItemToSpace(spaceId, newItem, parentId: parentId);

  // Recursively paste children
  for (final child in source.children) {
    await _pasteItemRecursively(spaceId, newItem.id, child);
  }
}
```

### Electron Implementation

**Files to Update:**
```
packages/desktop/src/renderer/App.tsx
packages/react-ui/src/hooks/mutations/ (may need new hook)
```

### Implementation Steps

1. **Create Paste Handler**
   ```typescript
   const handlePaste = async (targetParentId?: string) => {
     const clipboard = clipboardStore.getState();
     
     if (!clipboard.items.length) {
       // Try system clipboard (handled in US-009)
       return handleSystemClipboardPaste(targetParentId);
     }
     
     // Expand target folder if specified
     if (targetParentId) {
       expandFolder(targetParentId);
     }
     
     // Paste each item recursively
     for (const item of clipboard.items) {
       await pasteItemRecursively(activeSpaceId, targetParentId, item);
     }
     
     // Invalidate to refresh UI
     invalidate(`space-items:${activeSpaceId}`);
   };
   
   const pasteItemRecursively = async (
     spaceId: string,
     parentId: string | null,
     source: SpaceItem
   ) => {
     // Create new item with new ID
     const result = await window.itemsApi.create({
       spaceId,
       parentId,
       name: source.name,
       path: source.path,
       type: source.type,
       faviconUrl: source.faviconUrl,
       description: source.description,
     });
     
     if (!result.ok) {
       console.error('Failed to paste item:', result.error);
       return;
     }
     
     const newItemId = result.value.id;
     
     // Recursively paste children
     if (source.children) {
       for (const child of source.children) {
         await pasteItemRecursively(spaceId, newItemId, child);
       }
     }
   };
   ```

2. **Wire Up to Context Menu**
   ```typescript
   case 'paste':
     // If context menu was on a folder, paste into it
     handlePaste(item.type === 'folder' ? item.id : undefined);
     break;
   ```

### Manual Testing Checklist

- [ ] Copy folder → Paste → folder duplicated with new ID
- [ ] Paste into folder → items appear inside
- [ ] Paste at root → items appear at root
- [ ] Children copied recursively
- [ ] Hierarchy preserved
- [ ] Target folder auto-expands
- [ ] Items persist after refresh

---

## F009: Paste from System Clipboard

**Priority:** P0 - Critical  
**Dependencies:** F008  
**Estimated Effort:** 3 hours  
**User Value:** Users can paste URLs directly from browser or other apps

### User Story

> As a user, I want to paste a URL from my system clipboard directly into a space, so I can quickly save links from other applications.

### Acceptance Criteria

- [ ] If internal clipboard empty, check system clipboard
- [ ] Detect URL pattern in system clipboard text
- [ ] Create link from detected URL
- [ ] Extract domain as link name
- [ ] Generate favicon URL
- [ ] Support multiple URLs (newline separated)

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| System Clipboard Paste | `main_layout_final.dart` | 940-969 |
| URL Detection | `main_layout_final.dart` | 952-960 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// System clipboard paste (main_layout_final.dart:940-969)
// Fallback to system clipboard URLs
final clipboardData = await Clipboard.getData(Clipboard.kTextPlain);
if (clipboardData?.text != null) {
  final text = clipboardData!.text!.trim();
  
  // Check if it looks like a URL (or multiple URLs)
  final lines = text.split('\n').where((l) => l.trim().isNotEmpty);
  
  for (final line in lines) {
    final trimmedLine = line.trim();
    if (trimmedLine.startsWith('http://') ||
        trimmedLine.startsWith('https://') ||
        (trimmedLine.contains('.') && !trimmedLine.contains(' ') && trimmedLine.length > 3)) {
      
      final url = trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')
          ? trimmedLine
          : 'https://$trimmedLine';
      final name = Uri.tryParse(url)?.host ?? trimmedLine;
      
      final link = SpaceItem(
        id: ref.read(spacesListProvider.notifier).generateId(),
        name: name,
        path: url,
        type: SpaceItemType.link,
        faviconUrl: FaviconService.getFaviconUrl(url),
      );
      
      await ref
          .read(spacesListProvider.notifier)
          .addItemToSpace(widget.space.id, link, parentId: targetParentId);
    }
  }
}
```

### Electron Implementation

**Files to Update:**
```
packages/desktop/src/renderer/App.tsx
packages/react-ui/src/utils/url.ts (create if not exists)
```

### Implementation Steps

1. **Create URL Utilities**
   ```typescript
   // utils/url.ts
   export function isLikelyUrl(text: string): boolean {
     const trimmed = text.trim();
     return /^https?:\/\//.test(trimmed) || 
            (/\.[a-z]{2,}/i.test(trimmed) && !/\s/.test(trimmed) && trimmed.length > 3);
   }
   
   export function normalizeUrl(text: string): string {
     const trimmed = text.trim();
     if (/^https?:\/\//.test(trimmed)) {
       return trimmed;
     }
     return `https://${trimmed}`;
   }
   
   export function extractDomain(url: string): string {
     try {
       return new URL(url).hostname;
     } catch {
       return url;
     }
   }
   
   export function getFaviconUrl(url: string): string {
     try {
       const origin = new URL(url).origin;
       return `${origin}/favicon.ico`;
     } catch {
       return '';
     }
   }
   
   export function extractUrlsFromText(text: string): string[] {
     return text
       .split('\n')
       .map(line => line.trim())
       .filter(line => line && isLikelyUrl(line))
       .map(normalizeUrl);
   }
   ```

2. **Implement System Clipboard Paste**
   ```typescript
   const handleSystemClipboardPaste = async (targetParentId?: string) => {
     const text = await window.electronApi.clipboard.readText();
     if (!text) return;
     
     const urls = extractUrlsFromText(text);
     if (urls.length === 0) return;
     
     // Expand target folder if specified
     if (targetParentId) {
       expandFolder(targetParentId);
     }
     
     // Create a link for each URL
     for (const url of urls) {
       await window.itemsApi.create({
         spaceId: activeSpaceId,
         parentId: targetParentId || null,
         name: extractDomain(url),
         path: url,
         type: 'link',
         faviconUrl: getFaviconUrl(url),
       });
     }
     
     invalidate(`space-items:${activeSpaceId}`);
   };
   ```

3. **Update handlePaste to Try System Clipboard**
   ```typescript
   const handlePaste = async (targetParentId?: string) => {
     const clipboard = clipboardStore.getState();
     
     if (clipboard.items.length > 0) {
       // Use internal clipboard
       for (const item of clipboard.items) {
         await pasteItemRecursively(activeSpaceId, targetParentId, item);
       }
     } else {
       // Fallback to system clipboard
       await handleSystemClipboardPaste(targetParentId);
     }
     
     invalidate(`space-items:${activeSpaceId}`);
   };
   ```

### Manual Testing Checklist

- [ ] Copy URL from browser → Paste in Spayce → link created
- [ ] Multiple URLs (newline separated) → multiple links created
- [ ] Partial URL (google.com) → https:// added automatically
- [ ] Domain extracted as link name
- [ ] Favicon URL generated
- [ ] Non-URL text ignored
- [ ] Works when internal clipboard is empty

---

## F010: Keyboard Shortcuts (Copy/Paste)

**Priority:** P0 - Critical  
**Dependencies:** F007, F008  
**Estimated Effort:** 2 hours  
**User Value:** Power users can use keyboard for efficiency

### User Story

> As a user, I want to use Cmd+C and Cmd+V to copy and paste items, so I can work efficiently with keyboard shortcuts.

### Acceptance Criteria

- [ ] Cmd+C (Mac) / Ctrl+C (Win) → copies selected item(s)
- [ ] Cmd+V (Mac) / Ctrl+V (Win) → pastes clipboard
- [ ] Shortcuts only work when sidebar has focus
- [ ] Multiple selected items all copied

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Keyboard Handler | `main_layout_final.dart` | 800-908 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Keyboard handler (main_layout_final.dart:800-908)
KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
  if (event is! KeyDownEvent) return KeyEventResult.ignored;
  
  final isMetaPressed = HardwareKeyboard.instance.isMetaPressed;
  final isControlPressed = HardwareKeyboard.instance.isControlPressed;
  final isCmdOrCtrl = Platform.isMacOS ? isMetaPressed : isControlPressed;
  
  // Cmd+C / Ctrl+C - Copy
  if (isCmdOrCtrl && event.logicalKey == LogicalKeyboardKey.keyC) {
    _copySelectedItems();
    return KeyEventResult.handled;
  }
  
  // Cmd+V / Ctrl+V - Paste
  if (isCmdOrCtrl && event.logicalKey == LogicalKeyboardKey.keyV) {
    _handlePaste();
    return KeyEventResult.handled;
  }
  
  return KeyEventResult.ignored;
}

void _copySelectedItems() {
  final multiSelection = ref.read(multiSelectionProvider);
  final selectedItem = ref.read(selectedSpaceItemProvider);
  
  if (multiSelection != null && multiSelection.selectedIds.isNotEmpty) {
    // Copy multiple selected items
    final items = _getItemsByIds(widget.space, multiSelection.selectedIds);
    clipboardStore.copyItems(items, widget.space.id);
    
    // If single link, also copy URL to system clipboard
    if (items.length == 1 && items.first.type == SpaceItemType.link) {
      Clipboard.setData(ClipboardData(text: items.first.path));
    }
  } else if (selectedItem != null) {
    // Copy single selected item
    clipboardStore.copyItems([selectedItem.item], selectedItem.spaceId);
    
    if (selectedItem.item.type == SpaceItemType.link) {
      Clipboard.setData(ClipboardData(text: selectedItem.item.path));
    }
  }
}
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/Sidebar.tsx
```

### Implementation Steps

1. **Add Keyboard Event Handler to Sidebar**
   ```typescript
   // In Sidebar.tsx
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       // Only handle if sidebar has focus
       if (!sidebarRef.current?.contains(document.activeElement)) {
         return;
       }
       
       const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
       const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
       
       // Cmd+C / Ctrl+C - Copy
       if (isCmdOrCtrl && e.key === 'c') {
         e.preventDefault();
         handleCopySelected();
       }
       
       // Cmd+V / Ctrl+V - Paste
       if (isCmdOrCtrl && e.key === 'v') {
         e.preventDefault();
         handlePasteToSelected();
       }
     };
     
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [handleCopySelected, handlePasteToSelected]);
   ```

2. **Implement Copy/Paste Handlers**
   ```typescript
   const handleCopySelected = () => {
     const selection = selectionStore.getState();
     const selectedItem = /* get current selected item */;
     
     if (selection.selectedIds.size > 0) {
       // Multi-select copy
       const items = getItemsByIds(activeSpace, Array.from(selection.selectedIds));
       clipboardStore.copyItems(items, activeSpaceId);
       
       // If single link, copy URL to system clipboard
       if (items.length === 1 && items[0].type === 'link') {
         window.electronApi.clipboard.writeText(items[0].path);
       }
     } else if (selectedItem) {
       // Single item copy
       clipboardStore.copyItems([selectedItem], activeSpaceId);
       
       if (selectedItem.type === 'link') {
         window.electronApi.clipboard.writeText(selectedItem.path);
       }
     }
   };
   
   const handlePasteToSelected = () => {
     const selectedItem = /* get current selected item */;
     
     // If folder selected, paste into it; otherwise paste at root
     const targetParentId = selectedItem?.type === 'folder' ? selectedItem.id : undefined;
     handlePaste(targetParentId);
   };
   ```

### Manual Testing Checklist

- [ ] Select item → Cmd+C → item copied
- [ ] Cmd+V → items pasted
- [ ] Multi-select → Cmd+C → all items copied
- [ ] Cmd+C on link → URL in system clipboard
- [ ] Shortcuts only work with sidebar focus
- [ ] Shortcuts don't interfere with other inputs
