# Phase 1: Core Item Management

**Priority:** P0 - Critical  
**Dependencies:** 012, 015  
**Total Estimated Effort:** 17 hours

This phase implements the essential item creation and editing features.

---

## F001: Create Folder via Inline Input

**Priority:** P0 - Critical  
**Dependencies:** 012  
**Estimated Effort:** 6 hours  
**User Value:** Users can create folders directly in the tree without dialogs

### User Story

> As a user, I want to create a new folder by clicking a button and typing the name inline, so I can organize my content quickly without interruption.

### Acceptance Criteria

- [ ] Click "+" button in space header → shows inline input at tree root
- [ ] Click folder icon on folder hover → shows inline input inside that folder
- [ ] Input auto-focuses on appearance
- [ ] Press Enter → creates folder, clears input
- [ ] Press Escape → cancels, clears input
- [ ] Click outside with content → creates folder
- [ ] Click outside without content → cancels
- [ ] Parent folder auto-expands when adding subfolder

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Trigger Root Creation | `main_layout_final.dart` | 633-640 |
| Trigger Subfolder | `main_layout_final.dart` | 1785-1799 |
| InlineInputRow Widget | `main_layout_final.dart` | 3395-3604 |
| Focus Management | `main_layout_final.dart` | 3423-3450 |
| Folder Submit | `main_layout_final.dart` | 3500-3510 |

**Full Flutter Paths:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Trigger root folder creation (main_layout_final.dart:633-640)
void _startNewFolder() {
  ref.read(inlineInputProvider.notifier).state = InlineInputState(
    spaceId: widget.space.id,
    type: InlineInputType.folder,
    parentId: null,
  );
}

// Trigger subfolder creation (main_layout_final.dart:1785-1799)
void _addSubfolder() {
  // Auto-expand parent folder
  final expandedFolders = ref.read(expandedFoldersProvider);
  if (!expandedFolders.contains(widget.item.id)) {
    ref.read(expandedFoldersProvider.notifier).state = 
      Set<String>.from(expandedFolders)..add(widget.item.id);
  }
  
  ref.read(inlineInputProvider.notifier).state = InlineInputState(
    spaceId: widget.spaceId,
    type: InlineInputType.folder,
    parentId: widget.item.id,
  );
}

// InlineInputRow Widget (main_layout_final.dart:3395-3510)
class _InlineInputRow extends ConsumerStatefulWidget {
  final String spaceId;
  final String? parentId;
  final InlineInputType type;
  final int level;
  final Color accentColor;
}

// Submit folder (main_layout_final.dart:3500-3510)
if (widget.type == InlineInputType.folder) {
  final folder = SpaceItem(
    id: ref.read(spacesListProvider.notifier).generateId(),
    name: value,
    path: value,
    type: SpaceItemType.folder,
  );
  await ref
      .read(spacesListProvider.notifier)
      .addItemToSpace(widget.spaceId, folder, parentId: widget.parentId);
}
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/components/InlineInput.tsx
packages/react-ui/src/components/InlineInput.module.css
```

**Files to Update:**
```
packages/react-ui/src/components/TreeView.tsx
packages/react-ui/src/components/TreeItem.tsx
packages/react-ui/src/components/SpaceHeader.tsx
packages/react-ui/src/components/index.ts
```

### Implementation Steps

1. **Create InlineInput Component**
   - Text input with folder/link icon
   - Auto-focus on mount
   - Handle Enter (submit), Escape (cancel)
   - Handle blur (submit if content, cancel if empty)

2. **Update TreeView**
   - Check inlineInputStore for active input at each level
   - Render InlineInput at correct position in tree

3. **Update SpaceHeader**
   - Add "New Folder" button (FolderPlus icon)
   - onClick triggers `setSidebarInput({ spaceId, parentId: null, type: 'folder' })`

4. **Update TreeItem (Folder)**
   - Add hover action for "Add Subfolder"
   - onClick triggers `setSidebarInput({ spaceId, parentId: item.id, type: 'folder' })`

### Manual Testing Checklist

- [ ] Click folder+ in header → input appears at root
- [ ] Click folder+ on folder → input appears inside folder
- [ ] Type name, press Enter → folder created
- [ ] Press Escape → input cancelled, no folder
- [ ] Click outside with text → folder created
- [ ] Click outside empty → input cancelled
- [ ] Parent folder expands when adding subfolder
- [ ] Folder appears in correct tree position

---

## F002: Create Link via Inline Input

**Priority:** P0 - Critical  
**Dependencies:** F001  
**Estimated Effort:** 4 hours  
**User Value:** Users can add links quickly with auto-paste from clipboard

### User Story

> As a user, I want to add a new link by clicking a button and pasting a URL inline, so I can save links without switching context.

### Acceptance Criteria

- [ ] Click link icon in space header → shows inline input at tree root
- [ ] Click link icon on folder hover → shows inline input inside that folder
- [ ] Input auto-pastes URL from system clipboard if detected
- [ ] Press Enter → creates link with favicon, clears input
- [ ] Automatically adds https:// if missing
- [ ] Extracts domain name as default link name

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Trigger Root Link | `main_layout_final.dart` | 642-649 |
| Trigger Folder Link | `main_layout_final.dart` | 1801-1815 |
| Clipboard Auto-paste | `main_layout_final.dart` | 3452-3479 |
| Link Submit | `main_layout_final.dart` | 3511-3526 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Clipboard auto-paste (main_layout_final.dart:3452-3479)
Future<void> _loadClipboard() async {
  try {
    final clipboardData = await Clipboard.getData(Clipboard.kTextPlain);
    if (clipboardData?.text != null) {
      final text = clipboardData!.text!;
      // Check if it looks like a URL
      if (text.startsWith('http://') ||
          text.startsWith('https://') ||
          text.contains('.') && !text.contains(' ')) {
        setState(() {
          _controller.text = text;
          _controller.selection = TextSelection(
            baseOffset: 0,
            extentOffset: text.length,
          );
        });
      }
    }
  } catch (e) {
    // Ignore clipboard errors
  }
}

// Link submit (main_layout_final.dart:3511-3526)
final url = value.startsWith('http://') || value.startsWith('https://')
    ? value
    : 'https://$value';
final name = Uri.tryParse(url)?.host ?? value;

final link = SpaceItem(
  id: ref.read(spacesListProvider.notifier).generateId(),
  name: name,
  path: url,
  type: SpaceItemType.link,
  faviconUrl: FaviconService.getFaviconUrl(url),
);

await ref
    .read(spacesListProvider.notifier)
    .addItemToSpace(widget.spaceId, link, parentId: widget.parentId);
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/InlineInput.tsx (add link mode)
packages/react-ui/src/components/SpaceHeader.tsx (add link button)
packages/react-ui/src/components/TreeItem.tsx (add link hover action)
packages/desktop/src/main/ipc/handlers.ts (clipboard read IPC)
packages/desktop/src/preload/index.ts (expose clipboard API)
```

### Implementation Steps

1. **Add IPC for Clipboard Read**
   ```typescript
   // handlers.ts
   ipcMain.handle('clipboard:readText', () => clipboard.readText());
   
   // preload/index.ts
   clipboard: {
     readText: () => ipcRenderer.invoke('clipboard:readText'),
   }
   ```

2. **Update InlineInput for Link Mode**
   - On mount, if type === 'link', read system clipboard
   - If clipboard contains URL-like text, pre-fill input
   - On submit, normalize URL (add https://) and extract domain

3. **Add Link Button to SpaceHeader**
   - Link icon next to folder icon
   - onClick triggers `setSidebarInput({ spaceId, parentId: null, type: 'link' })`

4. **Add Link Hover Action to TreeItem (Folder)**
   - Link icon appears on folder hover
   - onClick triggers `setSidebarInput({ spaceId, parentId: item.id, type: 'link' })`

### Utility Functions

```typescript
// utils/url.ts
export function normalizeUrl(input: string): string {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  return `https://${input}`;
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function isLikelyUrl(text: string): boolean {
  return /^https?:\/\//.test(text) || 
         (/\.[a-z]{2,}/.test(text) && !/\s/.test(text));
}

export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return '';
  }
}
```

### Manual Testing Checklist

- [ ] Copy URL in browser, click link+ → URL pre-filled
- [ ] Type URL, press Enter → link created
- [ ] Partial URL (google.com) → https:// added
- [ ] Domain extracted as link name
- [ ] Favicon URL generated
- [ ] Link appears in correct tree position
- [ ] Non-URL text not auto-pasted

---

## F003: Inline Rename Items

**Priority:** P0 - Critical  
**Dependencies:** 015  
**Estimated Effort:** 4 hours  
**User Value:** Users can rename items without opening dialogs

### User Story

> As a user, I want to rename a folder or link by selecting "Rename" from the context menu and editing inline, so I can quickly fix names without interruption.

### Acceptance Criteria

- [ ] Context menu "Rename" → replaces item name with text input
- [ ] Input pre-filled with current name, all selected
- [ ] Press Enter → saves new name
- [ ] Press Escape → cancels, reverts to original
- [ ] Click outside with changes → saves
- [ ] Click outside without changes → cancels
- [ ] Empty name not allowed (validation)

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Trigger Rename | `main_layout_final.dart` | 2049-2051 |
| InlineRenameInput Widget | `main_layout_final.dart` | 3300-3393 |
| TreeItem Integration | `main_layout_final.dart` | 2468-2493 |
| Save Rename | `main_layout_final.dart` | 3355-3363 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// InlineRenameInput (main_layout_final.dart:3300-3393)
class _InlineRenameInput extends ConsumerStatefulWidget {
  final SpaceItem item;
  final String spaceId;
  final VoidCallback onComplete;
}

class _InlineRenameInputState extends ConsumerState<_InlineRenameInput> {
  late TextEditingController _controller;
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.item.name);
    // Select all text on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
      _controller.selection = TextSelection(
        baseOffset: 0,
        extentOffset: _controller.text.length,
      );
    });
  }

  void _saveRename() {
    final newName = _controller.text.trim();
    if (newName.isNotEmpty && newName != widget.item.name) {
      ref.read(spacesListProvider.notifier).renameItem(widget.item.id, newName);
    }
    widget.onComplete();
  }

  void _cancelRename() {
    widget.onComplete();
  }
}

// TreeItem checks for rename mode (main_layout_final.dart:2468-2493)
final isRenaming = ref.watch(inlineRenameItemIdProvider) == widget.item.id;

if (isRenaming) {
  return _InlineRenameInput(
    item: widget.item,
    spaceId: widget.spaceId,
    onComplete: () {
      ref.read(inlineRenameItemIdProvider.notifier).state = null;
    },
  );
}
```

### Electron Implementation

**Files to Create:**
```
packages/react-ui/src/components/InlineRenameInput.tsx
packages/react-ui/src/components/InlineRenameInput.module.css
```

**Files to Update:**
```
packages/react-ui/src/components/TreeItem.tsx
packages/desktop/src/renderer/App.tsx (context menu handler)
```

### Implementation Steps

1. **Create InlineRenameInput Component**
   - Text input pre-filled with item name
   - Auto-focus and select all on mount
   - Handle Enter (save), Escape (cancel)
   - Handle blur (save if changed, cancel if not)
   - Validate non-empty

2. **Update TreeItem**
   - Check if `sidebarRenameItemId === item.id`
   - If true, render InlineRenameInput instead of item name
   - Pass onComplete callback to clear rename state

3. **Update Context Menu Handler**
   - "Rename" action calls `setSidebarRenameItemId(item.id)`

### Manual Testing Checklist

- [ ] Right-click → Rename → input appears with name
- [ ] Name is pre-selected
- [ ] Type new name, Enter → saved
- [ ] Press Escape → reverted to original
- [ ] Click outside with changes → saved
- [ ] Empty name blocked
- [ ] Rename persists after refresh

---

## F004: Folder Hover Actions

**Priority:** P0 - Critical  
**Dependencies:** F001, F002  
**Estimated Effort:** 3 hours  
**User Value:** Users can quickly add content to folders via hover buttons

### User Story

> As a user, I want to see action buttons when I hover over a folder, so I can quickly add subfolders or links without right-clicking.

### Acceptance Criteria

- [ ] Hover over folder → shows action icons on right side
- [ ] FolderPlus icon → triggers subfolder inline input
- [ ] Link icon → triggers link inline input
- [ ] MoreVertical icon → opens context menu
- [ ] Icons fade in/out smoothly (150ms)
- [ ] Icons don't show during rename mode

### Flutter Source Reference

| Feature | Flutter File | Lines |
|---------|--------------|-------|
| Hover Actions | `main_layout_final.dart` | 2496-2525 |
| Action Icon Builder | `main_layout_final.dart` | 1770-1783 |

**Full Flutter Path:**
- `@/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/navigation/presentation/main_layout_final.dart`

### Flutter Code Reference

```dart
// Hover actions (main_layout_final.dart:2496-2525)
if (_isHovered && !isRenaming)
  AnimatedOpacity(
    opacity: 1.0,
    duration: const Duration(milliseconds: 150),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isFolder) ...[
          _buildSmallActionIcon(
            LucideIcons.folderPlus,
            'Add subfolder',
            _addSubfolder,
          ),
          _buildSmallActionIcon(
            LucideIcons.link,
            'Add link',
            _addLinkToFolder,
          ),
        ],
        _buildSmallActionIcon(
          LucideIcons.moreVertical,
          'More options',
          () => _showContextMenu(context, Offset.zero),
        ),
      ],
    ),
  ),

// Small action icon builder (main_layout_final.dart:1770-1783)
Widget _buildSmallActionIcon(IconData icon, String tooltip, VoidCallback onTap) {
  return Tooltip(
    message: tooltip,
    child: InkWell(
      borderRadius: BorderRadius.circular(4),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Icon(icon, size: 14, color: Colors.white60),
      ),
    ),
  );
}
```

### Electron Implementation

**Files to Update:**
```
packages/react-ui/src/components/TreeItem.tsx
packages/react-ui/src/components/TreeView.module.css
```

### Implementation Steps

1. **Update TreeItem**
   - Track hover state with `useState`
   - Render action buttons container when hovered and not renaming
   - Icons: FolderPlus (folder only), Link (folder only), MoreVertical (all)

2. **Add CSS for Hover Actions**
   ```css
   .hoverActions {
     opacity: 0;
     transition: opacity 150ms ease;
   }
   
   .treeItem:hover .hoverActions {
     opacity: 1;
   }
   ```

3. **Wire Up Actions**
   - FolderPlus: `setSidebarInput({ spaceId, parentId: item.id, type: 'folder' })`
   - Link: `setSidebarInput({ spaceId, parentId: item.id, type: 'link' })`
   - MoreVertical: `onContextMenu(item, event)`

### Manual Testing Checklist

- [ ] Hover folder → 3 icons appear (folder+, link, more)
- [ ] Hover link → 1 icon appears (more)
- [ ] Icons fade in smoothly
- [ ] Leave hover → icons fade out
- [ ] FolderPlus → inline folder input inside
- [ ] Link → inline link input inside
- [ ] MoreVertical → context menu opens
- [ ] No icons during rename mode
