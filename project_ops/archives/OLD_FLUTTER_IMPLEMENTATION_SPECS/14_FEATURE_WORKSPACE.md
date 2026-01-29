# Spayce - Feature: Workspace (File Browser & Editor)

> **Document Purpose**: Complete specification of the Workspace feature for pixel-perfect recreation.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [UI Layout](#ui-layout)
4. [Workspace Management](#workspace-management)
5. [File Tree](#file-tree)
6. [Editor Area](#editor-area)
7. [File Viewing](#file-viewing)
8. [State Management](#state-management)
9. [Visual Specifications](#visual-specifications)
10. [Screenshots](#screenshots)

---

## Feature Overview

### What is Workspace?

The Workspace is an **integrated file browser and viewer** that provides IDE-like capabilities:

- Browse and open local file system directories
- View files with syntax highlighting
- Render markdown files
- Open links in embedded WebView
- Multiple workspaces (project roots)
- Editor tabs for open files
- Activity bar (VS Code-style)
- Status bar with git branch info

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Purpose** | Work with local files alongside browsing |
| **Integration** | Tab in browser view, shares tab bar |
| **Multiple Roots** | Manage multiple project directories |
| **File Viewing** | Read-only viewing (editing planned) |
| **Format Support** | Text, Markdown, Code, Links |

### Key Files

```
frontend/lib/features/workspace/
├── data/
│   ├── workspace_manager.dart    # WorkspaceManagerNotifier
│   ├── workspace_repository.dart # File system operations
│   └── security_bookmark_manager.dart # macOS sandbox bookmarks
├── domain/
│   ├── workspace_file_model.dart # WorkspaceFile model
│   └── workspace_model.dart      # Workspace model
└── presentation/
    ├── workspace_screen.dart     # Main screen
    ├── workspace_theme.dart      # Theme constants
    └── widgets/
        ├── activity_bar.dart     # VS Code-style activity bar
        ├── workspace_sidebar.dart # File tree sidebar
        ├── editor_area.dart      # Editor + tabs
        ├── editor_tabs.dart      # File tabs
        ├── file_viewer.dart      # File content viewer
        ├── markdown_viewer.dart  # Markdown renderer
        ├── workspace_webview.dart # URL viewer
        ├── status_bar.dart       # Bottom status bar
        └── zero_state.dart       # Empty state
```

---

## Architecture

### Module Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                   TABBED BROWSER SCREEN                             │
├─────────────────────────────────────────────────────────────────────┤
│ [📁 Workspace] [+] │ [Tab 1] [Tab 2] [Tab 3]                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  IndexedStack [                                              │   │
│  │    index: isWorkspaceActive ? 0 : 1,                        │   │
│  │    children: [                                               │   │
│  │      WorkspaceScreen(),    // Full workspace UI              │   │
│  │      TabContent(),         // WebView for active tab         │   │
│  │    ]                                                         │   │
│  │  ]                                                           │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Workspace Tab Switching

The Workspace tab is the **leftmost fixed tab** in the browser tab bar:

1. Click "Workspace" tab → `_isWorkspaceActive = true`
2. IndexedStack shows index 0 (WorkspaceScreen)
3. Click any browser tab → `_isWorkspaceActive = false`
4. IndexedStack shows index 1 (WebView)

### State Preservation

Uses `AutomaticKeepAliveClientMixin`:

```dart
class _WorkspaceScreenState extends ConsumerState<WorkspaceScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true; // Preserve state when switching tabs
}
```

---

## UI Layout

### Full Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [📁 Workspace] [+] │ [Tab 1] [Tab 2]                                │
├─────────────────────────────────────────────────────────────────────┤
│ [A] │ ┌──────────────┐ │ ┌──────────────────────────────────────┐  │
│ [c] │ │ WORKSPACES   │ │ │ [file1.md] [file2.dart] [✕]         │  │
│ [t] │ │ ├─ Project1  │ │ │ /path/to/file.md                    │  │
│ [i] │ │ │  ├─ lib/   │ │ │────────────────────────────────────│  │
│ [v] │ │ │  └─ test/  │ │ │                                     │  │
│ [i] │ │ └─ Project2  │ │ │        FILE CONTENT                 │  │
│ [t] │ │              │ │ │     (Markdown/Code/Text)            │  │
│ [y] │ │ ───────────  │ │ │                                     │  │
│     │ │ EXPLORER     │ │ │                                     │  │
│ [B] │ │ ├─ src/      │ │ │                                     │  │
│ [a] │ │ │  └─ main.d │ │ │                                     │  │
│ [r] │ │ └─ README.md │ │ │                                     │  │
│     │ └──────────────┘ │ │ ────────────────────────────────────│  │
│     │      240px       │ │ ⚡ main │ Ln 1, Col 1 │ Markdown    │  │
└─────┴──────────────────┴─┴──────────────────────────────────────┴──┘
  48px                           remaining width
```

### Layout Dimensions

| Component | Width | Height |
|-----------|-------|--------|
| Activity Bar | 48px | Full |
| Sidebar | 240px | Full |
| Editor Area | Remaining | Full |
| Tabs | - | 35px |
| Breadcrumbs | - | 22px |
| Status Bar | - | 22px |

---

## Workspace Management

### Workspace Model

```dart
class Workspace {
  final String id;
  final String name;
  final String localPath;
  final DateTime createdAt;
  final DateTime? lastAccessedAt;
  bool isExpanded;
}
```

### WorkspaceManagerState

```dart
class WorkspaceManagerState {
  final List<Workspace> workspaces;
  final String? activeWorkspaceId;
  final Set<String> visibleWorkspaceIds;
  final Map<String, WorkspaceFileNode?> fileTrees;
  final WorkspaceFileNode? fileTree;
  final bool isLoading;
  final bool isZeroState;
}
```

### Workspace Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Create | `createWorkspace()` | Opens file picker, adds workspace |
| Remove | `removeWorkspace(id)` | Removes from list (not disk) |
| Select | `selectWorkspace(id)` | Sets active, loads file tree |
| Toggle Visibility | `toggleWorkspaceVisibility(id)` | Show/hide in sidebar |
| Clear All | `clearAllWorkspaces()` | Removes all workspaces |
| Get Git Branch | `getGitBranch()` | Reads .git/HEAD |

### Adding Workspace to Space

When a workspace is created, it's automatically added to the active Space:

```dart
Future<void> _addWorkspaceToActiveSpace() async {
  final folderItem = SpaceItem(
    id: spacesNotifier.generateId(),
    name: activeWorkspace.name,
    path: activeWorkspace.localPath,
    type: SpaceItemType.folder,
  );
  await spacesNotifier.addItemToSpace(activeSpaceId, folderItem);
}
```

---

## File Tree

### File Node Model

```dart
class WorkspaceFileNode {
  final String name;
  final String path;
  final bool isDirectory;
  final FileContentType? contentType;
  final int? size;
  final DateTime? modifiedAt;
  List<WorkspaceFileNode>? children;
  bool isExpanded;
}
```

### File Content Types

```dart
enum FileContentType {
  text,
  markdown,
  code,
  image,
  url,
  unknown,
}
```

### File Type Detection

```dart
static FileContentType detectContentType(String path) {
  final ext = path.split('.').last.toLowerCase();
  
  const markdownExts = ['md', 'markdown', 'mdx'];
  const codeExts = ['dart', 'js', 'ts', 'py', 'java', 'swift', ...];
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
  
  if (markdownExts.contains(ext)) return FileContentType.markdown;
  if (codeExts.contains(ext)) return FileContentType.code;
  if (imageExts.contains(ext)) return FileContentType.image;
  if (path.startsWith('http')) return FileContentType.url;
  return FileContentType.text;
}
```

### File Tree Widget

```
┌────────────────────────────────────────┐
│ EXPLORER                    [↻] [⊟]   │
├────────────────────────────────────────┤
│ ▼ 📁 lib                               │
│    ▶ 📁 core                           │
│    ▼ 📁 features                       │
│       ▶ 📁 browser                     │
│       ▶ 📁 spaces                      │
│    📄 main.dart                        │
│ 📄 pubspec.yaml                        │
│ 📄 README.md                           │
└────────────────────────────────────────┘
```

### File Icons

| Type | Icon | Color |
|------|------|-------|
| Folder (closed) | `Folder` | `amber` |
| Folder (open) | `FolderOpen` | `amber` |
| Dart file | `FileCode` | `blue` |
| Markdown | `FileText` | `textSecondary` |
| JSON/YAML | `Braces` | `yellow` |
| Image | `Image` | `purple` |
| Default | `File` | `textSecondary` |

---

## Editor Area

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [README.md] [main.dart] [pubspec.yaml ✕]                            │ ← Tabs
├─────────────────────────────────────────────────────────────────────┤
│ /Users/projects/spayce/README.md                                    │ ← Breadcrumbs
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                     FILE CONTENT                                    │ ← Viewer
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ ⚡ main │ Ln 42, Col 8 │ Markdown │ UTF-8                           │ ← Status Bar
└─────────────────────────────────────────────────────────────────────┘
```

### Editor Tabs

| Property | Value |
|----------|-------|
| Height | 35px |
| Tab Min Width | 100px |
| Tab Max Width | 200px |
| Background (active) | `#1E1E1E` |
| Background (inactive) | transparent |
| Close Button | 14px, appears on hover |
| Icon | File type icon |

### Breadcrumbs

| Property | Value |
|----------|-------|
| Height | 22px |
| Background | `editorBg` |
| Font | JetBrains Mono, 11px |
| Color | `textSecondary` 70% |
| Content | Full file path |

### Status Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚡ main │ Ln 42, Col 8  │  Markdown  │  UTF-8  │  LF               │
│    ↑         ↑               ↑          ↑        ↑                 │
│  Git      Cursor          File       Encoding  Line               │
│ Branch   Position         Type                 Ending             │
└─────────────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 22px |
| Background | `#007ACC` |
| Font | 11px |
| Padding | 8px horizontal |

---

## File Viewing

### Viewer Selection

```dart
Widget _buildContent() {
  if (_activeFile!.contentType == FileContentType.url) {
    return WorkspaceWebview(url: _activeFile!.path);
  }
  return FileViewer(file: _activeFile!);
}
```

### Markdown Viewer

Renders markdown with:

- Headers (H1-H6)
- Code blocks with syntax highlighting
- Links (clickable)
- Lists (ordered, unordered)
- Images
- Tables
- Blockquotes

### Code Viewer

Text viewer with:

- Monospace font (JetBrains Mono)
- Line numbers
- Syntax highlighting (planned)

### WebView for URLs

When a link is in the workspace tree:

```dart
class WorkspaceWebview extends StatefulWidget {
  final String url;
  final ValueChanged<String>? onNavigateNewTab;
  
  // Features:
  // - Embedded webview with full browser capabilities
  // - URL displayed in address bar below tab
  // - Same-domain navigation stays in same tab
  // - Cross-domain navigation opens new workspace tab
  // - Back, forward, refresh navigation controls
}
```

---

## State Management

### Providers

```dart
// Workspace manager
final workspaceManagerProvider = 
    StateNotifierProvider<WorkspaceManagerNotifier, WorkspaceManagerState>(...);

// Open files list
final openFilesProvider = StateProvider<List<WorkspaceFile>>((ref) => []);

// Active file ID
final activeFileIdProvider = StateProvider<String?>((ref) => null);

// Git branch
final gitBranchProvider = StateProvider<String?>((ref) => null);
```

### File Opening Flow

1. Click file in tree → `_handleFileSelected(absolutePath)`
2. Check if already open → If yes, activate existing tab
3. Check if URL → Handle differently for links
4. Call `workspaceManager.openFile(path)`
5. Add to `openFilesProvider`
6. Set as `activeFileIdProvider`

### File Closing Flow

1. Click close button → `_handleFileClosed(fileId)`
2. Remove from `openFilesProvider`
3. If was active, activate adjacent tab

---

## Visual Specifications

### WorkspaceTheme Constants

```dart
class WorkspaceTheme {
  // Colors
  static const Color workspaceBg = Color(0xFF0E0B14);
  static const Color sidebarBg = Color(0xFF171424);
  static const Color editorBg = Color(0xFF1A1628);
  static const Color activityBarBg = Color(0xFF131020);
  static const Color statusBarBg = Color(0xFF007ACC);
  static const Color tabActiveBg = Color(0xFF1E1E1E);
  static const Color border = Color(0xFF2D2645);
  
  // Text Colors
  static const Color textPrimary = Color(0xFFE5E7EB);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted = Color(0xFF6B7280);
  
  // Dimensions
  static const double activityBarWidth = 48.0;
  static const double sidebarWidth = 240.0;
  static const double tabHeight = 35.0;
  static const double breadcrumbsHeight = 22.0;
  static const double statusBarHeight = 22.0;
}
```

### Activity Bar

```
┌──────┐
│ [📁] │ ← Explorer
│ [🔍] │ ← Search
│ [🔀] │ ← Git
│ [🧩] │ ← Extensions
│      │
│      │
│ [⚙️] │ ← Settings
└──────┘
```

| Property | Value |
|----------|-------|
| Width | 48px |
| Background | `activityBarBg` |
| Icon Size | 24px |
| Icon Color (active) | `textPrimary` |
| Icon Color (inactive) | `textSecondary` |
| Indicator | 2px left border, `primary` |

---

## Zero State

When no workspaces are configured:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                          [📁]                                       │
│                                                                     │
│                  No workspaces yet                                  │
│                                                                     │
│      Open a folder to start working with local files               │
│                                                                     │
│                  [Open Folder]                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Screenshots

### Workspace View
![Workspace](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Worskspace%20View.png)

### Workspace in Browser
![Workspace Browser](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Workspace%20View%20in%20Browser.png)

### System File Picker
![File Picker](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/System%20File%20and%20Folder%20Picker.png)

---

## Security (macOS Sandbox)

### Security Bookmarks

macOS sandboxed apps require security bookmarks to persist file access:

```dart
class SecurityBookmarkManager {
  Future<void> saveBookmark(String path) async {
    // Save security-scoped bookmark for persistent access
  }
  
  Future<bool> resolveBookmark(String path) async {
    // Resolve bookmark and start accessing
  }
}
```

### Workspace Persistence

```dart
// Storage key
static const String _storageKey = 'spayce_workspaces_v2';

// Save workspaces with security bookmarks
Future<void> _saveToPersistence() async {
  final prefs = await SharedPreferences.getInstance();
  final json = state.workspaces.map((w) => w.toJson()).toList();
  await prefs.setString(_storageKey, jsonEncode(json));
}
```

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
