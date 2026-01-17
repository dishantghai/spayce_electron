# Spayce - Feature: Browser Module

> **Document Purpose**: Complete specification of the multi-tab browser for pixel-perfect recreation.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Multi-Tab Architecture](#multi-tab-architecture)
3. [Tab Bar UI](#tab-bar-ui)
4. [Navigation Controls](#navigation-controls)
5. [URL Bar](#url-bar)
6. [Tab Management](#tab-management)
7. [Link Interception](#link-interception)
8. [State Management](#state-management)
9. [WebView Configuration](#webview-configuration)
10. [Screenshots](#screenshots)

---

## Feature Overview

### What is the Browser Module?

A **full-featured multi-tab web browser** integrated into Spayce that provides:

- Up to 20 concurrent browser tabs
- Tab persistence across app restarts
- Drag-and-drop tab reordering
- Origin tracking (which Space opened the tab)
- Duplicate tab detection
- Link preview popups for cross-domain links
- CMD/CTRL+click to open in new tab

### Technical Stack

| Component | Technology |
|-----------|------------|
| WebView Package | `flutter_inappwebview` 6.0+ |
| State Management | Riverpod StateNotifier |
| Persistence | SharedPreferences (JSON) |
| Platform WebViews | WKWebView (iOS/macOS), Android WebView, Edge WebView2 |

### Key Files

```
frontend/lib/features/browser/
├── data/
│   └── tab_manager.dart          # TabManagerNotifier, persistence
├── domain/
│   ├── tab_model.dart            # BrowserTab model
│   └── url_validator.dart        # URL validation/normalization
└── presentation/
    ├── tabbed_browser_screen.dart # Main browser view
    └── widgets/
        ├── spayce_browser_tab.dart   # Tab item widget
        ├── spayce_tab_bar.dart       # Tab bar container
        ├── new_tab_menu.dart         # New tab button
        └── link_preview_popup.dart   # Arc-style popup
```

---

## Multi-Tab Architecture

### Tab State Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TabManagerNotifier                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   TabManagerState                            │   │
│  │                                                               │   │
│  │  tabs: List<BrowserTab>   ──────────► UI (Tab Bar)           │   │
│  │  activeTabId: String?     ──────────► Active Tab Highlight   │   │
│  │  isInitialized: bool      ──────────► Loading State          │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Methods:                                                           │
│  ├─ createTab(url?, title?, tabType?, originSpaceId?, ...)         │
│  ├─ createTabFromSpace(url, title, spaceId, spaceItemId, ...)      │
│  ├─ closeTab(tabId)                                                 │
│  ├─ switchToTab(tabId)                                              │
│  ├─ reorderTab(oldIndex, newIndex)                                  │
│  ├─ updateTabUrl(tabId, newUrl)                                     │
│  ├─ updateTabTitle(tabId, title)                                    │
│  ├─ updateTabLoading(tabId, isLoading?, progress?)                  │
│  └─ updateTabNavigation(tabId, canGoBack?, canGoForward?)           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### BrowserTab Model

```dart
class BrowserTab {
  final String id;                    // UUID v4
  final TabType tabType;              // web, note, localFile
  String url;                         // Current URL
  String title;                       // Page title
  String? faviconUrl;                 // Favicon URL
  
  // Origin tracking (for Space integration)
  final String? originSpaceId;        // Which Space opened this
  final String? originSpaceItemId;    // Which SpaceItem opened this
  bool isTracked;                     // Still at origin URL?
  
  // State
  bool isActive;                      // Is this the active tab?
  bool isLoading;                     // Currently loading?
  double loadingProgress;             // 0.0 to 1.0
  bool canGoBack;                     // Navigation state
  bool canGoForward;                  // Navigation state
  
  // Timestamps
  final DateTime createdAt;
  DateTime updatedAt;
  DateTime? lastAccessedAt;
}
```

### Tab Types

```dart
enum TabType {
  web,       // WebView browser tab (implemented)
  note,      // Rich text/Markdown note (planned)
  localFile, // Local file viewer (planned)
}
```

---

## Tab Bar UI

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [📁 Workspace] [+] │ [🌐 Tab 1] [📄 Tab 2] [📄 Tab 3] ───────────► │
│       ↑        ↑    │     ↑                                         │
│   Fixed    New Tab  │  Scrollable, Draggable Tabs                   │
│   Workspace   Button│                                               │
│   Tab              │                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Tab Bar Specifications

| Property | Value |
|----------|-------|
| Height | 40px |
| Background | `sidebarDark` (#131020) |
| Border | Bottom 1px `borderSubtle` |

### Tab Components

#### Workspace Tab (Fixed, Leftmost)

| Property | Value |
|----------|-------|
| Position | Fixed left (per Spec 042 FR-1) |
| Icon | Folder icon |
| Purpose | Switch to Workspace view |
| Active | Blue background when in Workspace |

#### New Tab Button

| Property | Value |
|----------|-------|
| Icon | `Plus` |
| Size | 32px |
| Background | transparent (hover: `accentDark`) |
| Border | Right 1px `borderSubtle` |
| Action | Creates new tab with google.com |

#### Browser Tab

| Property | Value |
|----------|-------|
| Min Width | 120px |
| Max Width | 200px |
| Height | 32px |
| Padding | 12px horizontal, 8px vertical |
| Background (active) | `surfaceDark` |
| Background (inactive) | transparent |
| Background (hover) | `accentDark` |
| Border Radius | 6px top only |
| Close Button | 14px (appears on hover) |

### Tab Item Widget

```
┌──────────────────────────────────────────────────────────────────┐
│ [🌐] Flutter Documentation                                [✕]   │
│   ↑   ↑                                                    ↑     │
│ Favicon/Type Title (truncated with ellipsis)          Close     │
│ Icon                                           (hover only)     │
└──────────────────────────────────────────────────────────────────┘
```

### Tab Type Icons

| TabType | Icon | Color |
|---------|------|-------|
| `web` | `Globe` | `textSecondary` |
| `note` | `FileText` | `textSecondary` |
| `localFile` | `File` | `textSecondary` |

---

## Navigation Controls

### Toolbar Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [◀] [▶] [🔄]  │ 🔒 https://flutter.dev/docs                     [+]│
│  ↑   ↑    ↑         ↑                                            ↑  │
│ Back Fwd Refresh   URL Bar                                 Add to  │
│          /Stop                                              Space  │
└─────────────────────────────────────────────────────────────────────┘
```

### Toolbar Specifications

| Property | Value |
|----------|-------|
| Height | 48px |
| Background | `surfaceDark` (#1A1628) |
| Padding | Left 32px, Right 8px, Vertical 8px |
| Border | Bottom 1px `borderSubtle` |

### Navigation Buttons

| Button | Icon | Enabled Condition | Action |
|--------|------|-------------------|--------|
| Back | `ChevronLeft` | `canGoBack == true` | `controller.goBack()` |
| Forward | `ChevronRight` | `canGoForward == true` | `controller.goForward()` |
| Refresh | `RotateCw` | `isLoading == false` | `controller.reload()` |
| Stop | `X` | `isLoading == true` | `controller.stopLoading()` |

### Button Styling

| Property | Value |
|----------|-------|
| Size | 36px × 36px |
| Icon Size | 18px |
| Border Radius | 8px |
| Background (default) | transparent |
| Background (hover) | `accentDark` |
| Icon Color (enabled) | `textSecondary` |
| Icon Color (disabled) | `textMuted` 50% opacity |

---

## URL Bar

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  https://flutter.dev/docs/get-started/install                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Height | 32px |
| Background | `backgroundDark` |
| Border (default) | 1px `borderSubtle` |
| Border (focused) | 1px `primary` |
| Border Radius | 8px |
| Padding | 12px horizontal, 8px vertical |
| Font Family | monospace |
| Font Size | 13px |
| Text Color | `textPrimary` |

### URL Validation

```dart
class UrlValidator {
  static String? validateAndNormalize(String input) {
    if (input.isEmpty) return null;
    
    String url = input.trim();
    
    // Add https:// if no scheme
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it looks like a domain
      if (url.contains('.') && !url.contains(' ')) {
        url = 'https://$url';
      } else {
        // Treat as search query
        return 'https://www.google.com/search?q=${Uri.encodeComponent(url)}';
      }
    }
    
    try {
      final uri = Uri.parse(url);
      if (uri.host.isEmpty) return null;
      return url;
    } catch (e) {
      return null;
    }
  }
}
```

### Focus Behavior

1. **Click URL bar** → Focus + select all text
2. **Start typing** → Replace selected text
3. **Press Enter** → Navigate to URL, unfocus
4. **Press Escape** → Restore original URL, unfocus

---

## Tab Management

### Creating Tabs

#### From New Tab Button
```dart
ref.read(tabManagerProvider.notifier).createTab();
// Creates tab with google.com, activates it
```

#### From Space Item Click
```dart
ref.read(tabManagerProvider.notifier).createTabFromSpace(
  url: item.path,
  title: item.name,
  spaceId: spaceId,
  spaceItemId: item.id,
  faviconUrl: item.faviconUrl,
);
// Checks for existing tab by spaceItemId or URL first
```

#### From CMD/CTRL+Click
```dart
ref.read(tabManagerProvider.notifier).createTab(url: url);
// Opens in new tab without origin tracking
```

### Tab Limits

| Limit | Value | Behavior |
|-------|-------|----------|
| Max web tabs | 20 | Closes oldest inactive tab when exceeded |
| Inactive timeout | 30 days | Old tabs cleaned up on load |

### Duplicate Detection

```dart
BrowserTab? findTabBySpaceItem(String spaceItemId) {
  // PRIMARY: Find by exact Space item ID
  return tabs.firstWhere((t) => t.originSpaceItemId == spaceItemId);
}

BrowserTab? findTabByUrl(String url) {
  // SECONDARY: Find by normalized URL
  return tabs.firstWhere((t) => _normalizeUrl(t.url) == _normalizeUrl(url));
}
```

### Tab Persistence

Tabs are persisted to `SharedPreferences` on every change:

```dart
static const String _storageKey = 'spayce_browser_tabs';

Future<void> _saveTabs() async {
  final prefs = await SharedPreferences.getInstance();
  final tabsJson = jsonEncode(state.tabs.map((t) => t.toJson()).toList());
  await prefs.setString(_storageKey, tabsJson);
}
```

### Tab Reordering

Drag-and-drop reordering is implemented with `_DraggableTabList`:

1. Long press or drag on tab
2. Tab becomes draggable ghost
3. Drop between other tabs
4. `reorderTab(oldIndex, newIndex)` updates state

---

## Link Interception

### JavaScript Injection

After each page load, JavaScript is injected to intercept link clicks:

```javascript
document.addEventListener('click', function(e) {
  var target = e.target;
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
  }
  
  if (target && target.tagName === 'A' && target.href) {
    if (e.ctrlKey || e.metaKey) {
      // CMD/CTRL+Click: Open in new tab
      e.preventDefault();
      window.flutter_inappwebview.callHandler('openInNewTab', href);
    } else if (isSameDomain) {
      // Same domain: Normal navigation
    } else {
      // Different domain: Show popup preview
      e.preventDefault();
      window.flutter_inappwebview.callHandler('showLinkPreview', href);
    }
  }
}, true);
```

### Link Behavior

| Click Type | Same Domain | Different Domain |
|------------|-------------|------------------|
| Normal click | Navigate in same tab | Show preview popup |
| CMD/CTRL+click | Open in new tab | Open in new tab |

### Link Preview Popup

Arc-style popup showing link preview:

```
┌────────────────────────────────────────────┐
│  external-site.com                         │
├────────────────────────────────────────────┤
│                                            │
│  [Expand to New Tab]  [Cancel]             │
│                                            │
└────────────────────────────────────────────┘
```

---

## State Management

### Riverpod Providers

```dart
// Main tab manager
final tabManagerProvider = 
    StateNotifierProvider<TabManagerNotifier, TabManagerState>(...);

// Active tab convenience provider
final activeTabProvider = Provider<BrowserTab?>((ref) {
  return ref.watch(tabManagerProvider).activeTab;
});

// Tab count provider
final tabCountProvider = Provider<int>((ref) {
  return ref.watch(tabManagerProvider).tabs.length;
});
```

### WebView Controllers

Each tab maintains its own `InAppWebViewController`:

```dart
final Map<String, InAppWebViewController?> _webViewControllers = {};
```

### IndexedStack for Tab Content

Tabs use `IndexedStack` to preserve WebView state when switching:

```dart
IndexedStack(
  index: tabState.activeTabIndex >= 0 ? tabState.activeTabIndex : 0,
  children: tabState.tabs.map((tab) => _buildWebViewForTab(tab)).toList(),
)
```

---

## WebView Configuration

```dart
InAppWebViewSettings(
  // Navigation
  useShouldOverrideUrlLoading: true,
  
  // Media
  mediaPlaybackRequiresUserGesture: false,
  allowsInlineMediaPlayback: true,
  allowsPictureInPictureMediaPlayback: true,
  allowsAirPlayForMediaPlayback: true,
  allowBackgroundAudioPlaying: true,
  
  // JavaScript
  javaScriptEnabled: true,
  javaScriptCanOpenWindowsAutomatically: false,
  
  // Storage
  domStorageEnabled: true,
  databaseEnabled: true,
  cacheEnabled: true,
  
  // Security
  thirdPartyCookiesEnabled: true,
  safeBrowsingEnabled: false,
  mixedContentMode: MixedContentMode.MIXED_CONTENT_COMPATIBILITY_MODE,
  
  // Zoom
  supportZoom: true,
  builtInZoomControls: true,
  displayZoomControls: false,
  
  // Hardware
  hardwareAcceleration: true,
  
  // Fullscreen
  isElementFullscreenEnabled: true,
  
  // User Agent
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
)
```

---

## Screenshots

### Browser View with Tabs
![Browser View](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Browser%20View.png)

### Browser Tab Bar
![Tab Bar](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Browser%20Tab%20Bar.png)

### Workspace in Browser
![Workspace Browser](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/project_ops/UI/Images/Workspace%20View%20in%20Browser.png)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | New tab |
| `Cmd/Ctrl + W` | Close current tab |
| `Cmd/Ctrl + L` | Focus URL bar |
| `Cmd/Ctrl + R` | Refresh page |
| `Cmd/Ctrl + [` | Go back |
| `Cmd/Ctrl + ]` | Go forward |
| `Cmd/Ctrl + 1-9` | Switch to tab 1-9 |
| `Cmd/Ctrl + Tab` | Next tab |
| `Cmd/Ctrl + Shift + Tab` | Previous tab |
| `Escape` | Stop loading / blur URL bar |

---

## Error Handling

### Error Types

```dart
enum BrowserErrorType {
  networkTimeout,
  sslError,
  pageNotFound,
  authenticationRequired,
  resourceLoadFailure,
  memoryError,
  crashFailure,
  invalidUrl,
  unknown,
}
```

### Recovery Strategy

| Error | Action |
|-------|--------|
| Network timeout | Retry with exponential backoff (max 3 attempts) |
| SSL error | Show warning, option to proceed |
| Page not found | Show 404 page |
| Invalid URL | Show error message, clear URL bar |

---

*Document Version: 2.0*  
*Last Updated: January 17, 2026*
