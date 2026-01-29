# Flutter to Electron Reference Mapping

> **Purpose**: Map Flutter Spayce browser implementation to Electron equivalents
> **Use**: Reference during implementation to ensure feature parity

---

## File Mapping Overview

| Flutter File | Electron Equivalent | Package |
|--------------|---------------------|---------|
| `browser_screen.dart` | `BrowserArea.tsx` + `BrowserService.ts` | react-ui, desktop |
| `tabbed_browser_screen.dart` | `TabBar.tsx` + `BrowserLayout.tsx` | react-ui |
| `browser_controller.dart` | `browserUiStore.ts` + `BrowserService.ts` | react-ui, desktop |
| `tab_manager.dart` | `tabStore.ts` + `SqliteTabsRepository.ts` | react-ui, infrastructure |
| `tab_model.dart` | `TabEntity.ts` | core |
| `browser_state.dart` | `BrowserState.ts` + error types | core |
| `url_validator.dart` | `urlValidator.ts` | react-ui |
| `browser_error_view.dart` | `BrowserErrorView.tsx` | react-ui |
| `browser_navigation_bar.dart` | `NavigationBar.tsx` | react-ui |
| `link_preview_popup.dart` | `LinkPreviewPopup.tsx` | react-ui |
| `new_tab_menu.dart` | `NewTabMenu.tsx` | react-ui |

---

## Detailed File Mappings

### 1. browser_screen.dart → BrowserArea.tsx + BrowserService.ts

**Flutter Location**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/browser_screen.dart`

#### Key Components to Port

| Flutter (Line) | Description | Electron Equivalent |
|----------------|-------------|---------------------|
| 36-80 | State variables | `browserUiStore.ts` |
| 82-96 | `initState` | `useEffect` in BrowserArea |
| 98-138 | `dispose` | Cleanup in useEffect return |
| 143-186 | `build` - SafeArea layout | BrowserLayout.tsx |
| 188-298 | `InAppWebViewSettings` | WebContentsView webPreferences |
| 300-324 | WebView event handlers | BrowserService event forwarding |
| 326-407 | Navigation handlers | BrowserService navigation methods |
| 454-484 | URL scheme handling | setWindowOpenHandler |
| 486-536 | JavaScript handlers | executeJavaScript injection |

#### WebView Settings Translation

```dart
// Flutter InAppWebViewSettings
InAppWebViewSettings(
  useShouldOverrideUrlLoading: true,
  mediaPlaybackRequiresUserGesture: false,
  allowsInlineMediaPlayback: true,
  javaScriptEnabled: true,
  // ...
)
```

```typescript
// Electron WebContentsView
new WebContentsView({
  webPreferences: {
    javascript: true,
    autoplayPolicy: 'no-user-gesture-required',
    // ...
  }
})
```

---

### 2. tabbed_browser_screen.dart → TabBar.tsx + BrowserLayout.tsx

**Flutter Location**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/tabbed_browser_screen.dart`

#### Key Components to Port

| Flutter (Line) | Description | Electron Equivalent |
|----------------|-------------|---------------------|
| 27-37 | State: controllers, focus nodes | React refs and state |
| 46-56 | `initState` with initialUrl | useEffect with props |
| 58-70 | Focus change handler | onFocus/onBlur handlers |
| 114-186 | `build` - main layout | BrowserLayout.tsx |
| 188-243 | `_buildTabBar` | TabBar.tsx |
| 246-302 | Tab scroll logic | scrollIntoView logic |
| 304-386 | `_buildNavigationBar` | NavigationBar.tsx |
| 388-469 | `_buildWebViewForTab` | Tab switching logic |
| 471-509 | WebView settings | (same as browser_screen) |
| 512-539 | JavaScript handlers | IPC message handling |
| 544-603 | Link interceptor injection | preload script or injection |
| 647-668 | Link preview handling | LinkPreviewPopup.tsx |
| 694-751 | Add to Space dialog | AddToSpaceDialog.tsx |
| 754-886 | `_TabItem` widget | TabItem.tsx |
| 889-944 | `_NavIconButton` widget | NavButton.tsx |
| 946-1147 | `_DraggableTabList` | Drag-and-drop in TabBar |

#### Tab Bar Structure Translation

```dart
// Flutter
Widget _buildTabBar(TabManagerState tabState) {
  return Container(
    height: 40,
    child: Row(
      children: [
        WorkspaceTab(...),
        NewTabButton(...),
        Expanded(
          child: _DraggableTabList(...),
        ),
      ],
    ),
  );
}
```

```tsx
// React
function TabBar() {
  return (
    <div className={styles.tabBar}>
      <WorkspaceTab />
      <NewTabButton />
      <div className={styles.tabsContainer}>
        {tabs.map(tab => <TabItem key={tab.id} tab={tab} />)}
      </div>
    </div>
  );
}
```

---

### 3. browser_controller.dart → browserUiStore.ts + BrowserService.ts

**Flutter Location**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/browser_controller.dart`

#### Key Methods to Port

| Flutter Method | Description | Electron Equivalent |
|----------------|-------------|---------------------|
| `setWebViewController` | Store controller ref | Store viewId reference |
| `loadUrl` | Navigate to URL | `BrowserService.loadURL()` |
| `goBack/goForward` | Navigation | `BrowserService.goBack/goForward()` |
| `reload/stopLoading` | Page control | `BrowserService.reload/stop()` |
| `updateLoadingProgress` | Progress state | IPC event → store update |
| `onLoadError` | Error handling | `did-fail-load` event |
| `getCurrentPageMetadata` | Get title/URL/favicon | Query WebContentsView |

#### State Management Translation

```dart
// Flutter Riverpod StateNotifier
class BrowserController extends StateNotifier<BrowserState> {
  BrowserController() : super(const BrowserState());
  
  void updateLoadingProgress(double progress) {
    state = state.copyWith(loadingProgress: progress);
  }
}
```

```typescript
// Zustand store
const useBrowserStore = create<BrowserState>((set) => ({
  loadingProgress: 0,
  
  setLoadingProgress: (progress: number) => 
    set({ loadingProgress: progress }),
}));
```

---

### 4. tab_manager.dart → tabStore.ts + SqliteTabsRepository.ts

**Flutter Location**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/data/tab_manager.dart`

#### Key Methods to Port

| Flutter Method (Line) | Description | Electron Equivalent |
|-----------------------|-------------|---------------------|
| 52-99 | `_initializeFromStorage` | `tabStore.initialize()` |
| 101-132 | `_saveTabs` | SQLite persistence (auto) |
| 134-187 | `createTab` | `tabStore.createTab()` |
| 189-241 | `_enforceTabLimit` | `TabsFacade` with limit |
| 243-291 | `createTabFromSpace` | `useOpenLink` hook |
| 293-308 | `findExistingTabByUrl` | Repository query |
| 310-343 | `closeTab` | `tabStore.closeTab()` |
| 345-362 | `switchToTab` | `tabStore.switchTab()` |
| 364-386 | `reorderTab` | `tabStore.reorderTabs()` |
| 388-409 | `updateTabUrl` | Repository update |
| 491-507 | `shouldHighlightSpaceItem` | `useSpaceItemHighlight` hook |

#### Tab Limit Logic Translation

```dart
// Flutter
void _enforceTabLimit() {
  final maxWebTabs = 20;
  final webTabs = state.tabs.where((t) => t.tabType == TabType.web).toList();
  
  if (webTabs.length > maxWebTabs) {
    // Find oldest inactive tab
    final oldestInactive = webTabs
        .where((t) => !t.isActive)
        .reduce((a, b) => 
            (a.lastAccessedAt ?? a.createdAt).isBefore(b.lastAccessedAt ?? b.createdAt) 
            ? a : b);
    closeTab(oldestInactive.id);
  }
}
```

```typescript
// TypeScript TabsFacade
async createTab(input: CreateTabInput): Promise<Result<TabEntity, Error>> {
  const count = await this.tabsRepository.count();
  if (count >= this.MAX_TABS) {
    await this.tabsRepository.deleteOldestInactive();
  }
  // ... create tab
}
```

---

### 5. tab_model.dart → TabEntity.ts

**Flutter Location**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/domain/tab_model.dart`

#### Entity Translation

```dart
// Flutter
class BrowserTab {
  final String id;
  final TabType tabType;
  String url;
  String title;
  String? faviconUrl;
  final String? originSpaceId;
  final String? originSpaceItemId;
  bool isTracked;
  bool isActive;
  bool isLoading;
  double loadingProgress;
  bool canGoBack;
  bool canGoForward;
  final DateTime createdAt;
  DateTime updatedAt;
  DateTime? lastAccessedAt;
}
```

```typescript
// TypeScript
interface TabEntity {
  readonly id: string;
  readonly tabType: TabType;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl: string | null;
  readonly originSpaceId: string | null;
  readonly originSpaceItemId: string | null;
  readonly isTracked: boolean;
  readonly isActive: boolean;
  readonly isLoading: boolean;
  readonly loadingProgress: number;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly position: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastAccessedAt: Date | null;
}
```

---

### 6. url_validator.dart → urlValidator.ts

**Flutter Location**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/domain/url_validator.dart`

#### Direct Translation

```dart
// Flutter
static String? validateAndNormalize(String input) {
  if (input.trim().isEmpty) return null;
  
  String url = input.trim();
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Validate directly
    try {
      final uri = Uri.parse(url);
      if (uri.host.isEmpty) return null;
      return url;
    } catch (e) {
      return null;
    }
  }
  
  // Check if looks like search query
  if (!url.contains('.') || url.contains(' ')) {
    return 'https://www.google.com/search?q=${Uri.encodeComponent(url)}';
  }
  
  // Add https://
  url = 'https://$url';
  // ... validate
}
```

```typescript
// TypeScript
export function validateAndNormalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      if (url.host) return trimmed;
    } catch {
      return null;
    }
  }
  
  if (!trimmed.includes('.') || trimmed.includes(' ')) {
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  }
  
  const withScheme = `https://${trimmed}`;
  // ... validate
}
```

---

### 7. browser_state.dart → BrowserState types

**Flutter Location**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/domain/browser_state.dart`

#### Error Types Translation

```dart
// Flutter
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

```typescript
// TypeScript
type BrowserErrorType =
  | 'networkTimeout'
  | 'sslError'
  | 'pageNotFound'
  | 'authenticationRequired'
  | 'resourceLoadFailure'
  | 'memoryError'
  | 'crashFailure'
  | 'invalidUrl'
  | 'unknown';

interface BrowserError {
  type: BrowserErrorType;
  message: string;
  failedUrl?: string;
  retryCount: number;
  timestamp: Date;
}
```

---

### 8. link_preview_popup.dart → LinkPreviewPopup.tsx

**Flutter Location**: `/Users/Shared/ALL WORKSPACE/projects/spayce/frontend/lib/features/browser/presentation/widgets/link_preview_popup.dart`

#### Key Patterns to Port

| Flutter Pattern | Electron Equivalent |
|-----------------|---------------------|
| `showLinkPreviewPopup` global function | React portal + state |
| Dismissible overlay | Click-outside handler |
| Expand/Navigate options | Button actions with IPC |
| URL domain extraction | JS URL API |

---

## Technology Mapping

### State Management

| Flutter | Electron |
|---------|----------|
| Riverpod `StateNotifier` | Zustand store |
| `ref.watch(provider)` | `useStore(selector)` |
| `ref.read(provider.notifier)` | `useStore.getState()` |
| `ConsumerWidget` | Component with hooks |

### Persistence

| Flutter | Electron |
|---------|----------|
| `SharedPreferences` | SQLite (better-sqlite3) |
| `Drift` (SQLite ORM) | Raw SQL with better-sqlite3 |
| JSON serialization | TypeScript interfaces |

### WebView

| Flutter | Electron |
|---------|----------|
| `InAppWebView` | `WebContentsView` |
| `InAppWebViewController` | `view.webContents` |
| `onLoadStart/Stop` | `did-start-loading/did-stop-loading` |
| `onProgressChanged` | Custom progress tracking |
| `shouldOverrideUrlLoading` | `setWindowOpenHandler` |
| `evaluateJavascript` | `executeJavaScript` |
| `addJavaScriptHandler` | `preload` + `contextBridge` |

### UI Components

| Flutter | Electron (React) |
|---------|------------------|
| `StatefulWidget` | Functional component + hooks |
| `setState` | `useState` / Zustand |
| `Container` | `<div>` |
| `Row/Column` | Flexbox |
| `GestureDetector` | Event handlers |
| `AnimatedContainer` | CSS transitions |
| `Scaffold` | Layout component |

---

## Event Handling Mapping

### Flutter → Electron Event Names

| Flutter Event | Electron Event |
|---------------|----------------|
| `onLoadStart` | `did-start-loading` |
| `onLoadStop` | `did-stop-loading` |
| `onProgressChanged` | Manual (no direct equiv) |
| `onTitleChanged` | `page-title-updated` |
| `onUrlChanged` | `did-navigate` |
| `onLoadError` | `did-fail-load` |
| `onReceivedHttpError` | `did-fail-load` (check error code) |
| `shouldOverrideUrlLoading` | `will-navigate` / `setWindowOpenHandler` |
| `onEnterFullscreen` | `enter-html-full-screen` |
| `onExitFullscreen` | `leave-html-full-screen` |
| `onConsoleMessage` | `console-message` |

---

## Design System Token Mapping

Flutter `SpayceColors` → CSS Variables

| Flutter | CSS Variable |
|---------|--------------|
| `SpayceColors.backgroundDark` | `--color-bg-dark` |
| `SpayceColors.surfaceDark` | `--color-bg-surface` |
| `SpayceColors.sidebarDark` | `--color-bg-sidebar` |
| `SpayceColors.primary` | `--color-primary` |
| `SpayceColors.textPrimary` | `--color-text-primary` |
| `SpayceColors.textSecondary` | `--color-text-secondary` |
| `SpayceColors.textMuted` | `--color-text-muted` |
| `SpayceColors.borderSubtle` | `--color-border-subtle` |
| `SpayceColors.accentDark` | `--color-bg-accent` |

Flutter `SpayceTypography` → CSS

| Flutter | CSS |
|---------|-----|
| `SpayceTypography.headingMedium` | Font size 16px, weight 600 |
| `SpayceTypography.bodyMedium` | Font size 14px, weight 400 |
| `SpayceTypography.caption` | Font size 12px, weight 400 |

Flutter `SpayceAnimations` → CSS Durations

| Flutter | CSS Variable |
|---------|--------------|
| `SpayceAnimations.hover` (150ms) | `--duration-hover` |
| `SpayceAnimations.expand` (200ms) | `--duration-expand` |
| `SpayceAnimations.quick` (100ms) | `--duration-quick` |

---

## Implementation Checklist by Flutter File

### browser_screen.dart
- [ ] WebContentsView configuration
- [ ] Event handler setup
- [ ] JavaScript injection
- [ ] Error handling
- [ ] Fullscreen support

### tabbed_browser_screen.dart
- [ ] Tab bar layout
- [ ] Tab items with drag-and-drop
- [ ] Navigation bar
- [ ] URL bar
- [ ] Add to Space dialog
- [ ] Link preview popup
- [ ] Keyboard shortcuts

### browser_controller.dart
- [ ] Navigation controls
- [ ] Loading state
- [ ] Error state
- [ ] Page metadata extraction

### tab_manager.dart
- [ ] Tab CRUD operations
- [ ] Tab persistence
- [ ] Tab limit enforcement
- [ ] Duplicate detection
- [ ] Origin tracking
- [ ] Space item highlighting

### tab_model.dart
- [ ] TabEntity interface
- [ ] TabType enum
- [ ] Factory methods
- [ ] JSON serialization

### url_validator.dart
- [ ] URL validation
- [ ] URL normalization
- [ ] Search fallback
- [ ] Domain extraction

### browser_state.dart
- [ ] BrowserState interface
- [ ] BrowserError types
- [ ] Error messages
- [ ] Recoverable error detection

### Widgets
- [ ] BrowserErrorView
- [ ] BrowserNavigationBar
- [ ] LinkPreviewPopup
- [ ] NewTabMenu
- [ ] TabItem
- [ ] NavButton
