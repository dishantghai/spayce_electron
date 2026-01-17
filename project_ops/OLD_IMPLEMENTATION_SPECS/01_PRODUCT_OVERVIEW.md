# Spayce - Product Overview

> **Document Purpose**: Comprehensive product vision and scope for pixel-perfect recreation.

---

## Table of Contents

1. [Product Identity](#product-identity)
2. [Product Vision](#product-vision)
3. [Problem Statement](#problem-statement)
4. [Target Users](#target-users)
5. [Core Modules](#core-modules)
6. [Implemented Features](#implemented-features)
7. [Platform Support](#platform-support)
8. [Performance Requirements](#performance-requirements)
9. [Design Philosophy](#design-philosophy)

---

## Product Identity

| Attribute | Value |
|-----------|-------|
| **Name** | Spayce |
| **Tagline** | Your Personal Learning Command Center |
| **Type** | Personal Learning Management System with Integrated AI Browser |
| **Platforms** | macOS, iOS, Android, Windows, Linux, Web |
| **Framework** | Flutter (cross-platform) |

---

## Product Vision

### Long-Term Vision

Spayce is an **AI-powered integrated application** that unifies:

1. **Browsing** - Full-featured multi-tab web browser
2. **Learning** - Organized content spaces with hierarchical structure
3. **Notes** - Rich text and markdown editing (planned)
4. **Working with Local Files** - File explorer, viewer, and editor integration
5. **Coding** - IDE capabilities with file viewing, syntax highlighting (planned)
6. **AI Assistance** - Intelligent learning copilot (V2 feature)

### Mission Statement

Transform fragmented learning experiences across multiple platforms into a **unified environment** where students and professionals can:

- Discover and save valuable content
- Organize knowledge into contextual spaces
- Access local files and projects seamlessly
- Browse the web with learning-aware features
- Get AI-powered assistance for learning workflows

### Core Principles

1. **Unified Environment** - One app for browsing, learning, notes, and code
2. **Content-First** - Minimal UI chrome, maximum content focus
3. **Fast & Fluid** - Sub-second response times, 60fps animations
4. **Hierarchical Organization** - Unlimited nesting, intuitive structure
5. **Offline-First** - Local persistence, works without network
6. **Cross-Platform** - Consistent experience across all platforms

---

## Problem Statement

### The Fragmented Learning Problem

Modern learners face a fragmented experience:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE (PROBLEM)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Browser Tabs ───────▶  20+ tabs open, lost context                 │
│  Course Platforms ───▶  Udemy, Coursera, YouTube (scattered)        │
│  Notes Apps ─────────▶  Notion, Obsidian, Apple Notes               │
│  Local Files ────────▶  Downloads, Documents (disorganized)         │
│  Code Projects ──────▶  VSCode, IDE separate from learning          │
│  Bookmarks ──────────▶  Flat list, no context, rarely revisited     │
│                                                                     │
│                         ↓                                           │
│                                                                     │
│  Result: Context switching, lost knowledge, wasted time             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Spayce Solution

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SPAYCE STATE (SOLUTION)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      SPAYCE APP                              │   │
│  │                                                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  │ Browser │ │ Spaces  │ │Workspace│ │  Notes  │            │   │
│  │  │ (Tabs)  │ │ (Orgs)  │ │ (Files) │ │(Planned)│            │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │   │
│  │                    ↓                                          │   │
│  │              All Connected, One Context                       │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Result: Unified learning, preserved context, efficient workflow    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Target Users

### Primary Personas

#### 1. Graduate Student (Maya)

| Attribute | Description |
|-----------|-------------|
| **Age** | 24-30 |
| **Context** | Researching multiple topics, managing papers and resources |
| **Pain Points** | Too many browser tabs, bookmarks never revisited, notes scattered |
| **Uses Spayce For** | Research Spaces by topic, local paper organization, link management |

#### 2. Software Developer (Ravi)

| Attribute | Description |
|-----------|-------------|
| **Age** | 25-35 |
| **Context** | Learning new technologies, managing project docs and tutorials |
| **Pain Points** | Documentation across platforms, code snippets lost, tutorial tabs |
| **Uses Spayce For** | Tech-specific Spaces, local project browsing, docs + code together |

#### 3. Lifelong Learner (Sarah)

| Attribute | Description |
|-----------|-------------|
| **Age** | 30-50 |
| **Context** | Self-directed learning across multiple interests |
| **Pain Points** | Course platforms separated, progress not tracked, no unified view |
| **Uses Spayce For** | Interest-based Spaces, course link organization, progress visibility |

### User Scale

- **Personal**: Single user, local storage
- **Team**: Shared spaces (future)
- **Enterprise**: Multi-user deployment (future)

---

## Core Modules

### Module Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           SPAYCE APP                                │
├──────────────────────┬──────────────────────────────────────────────┤
│     SIDEBAR          │              MAIN CONTENT                    │
│                      │                                              │
│  ┌────────────────┐  │  ┌────────────────────────────────────────┐ │
│  │ Navigation     │  │  │ Browser View (Multi-Tab WebView)       │ │
│  │ [Browser]      │  │  │                                        │ │
│  │ [Spaces]       │  │  │ ───────────────────────────────────────│ │
│  └────────────────┘  │  │ Workspace View (File Browser + Editor) │ │
│                      │  │                                        │ │
│  ┌────────────────┐  │  │ ───────────────────────────────────────│ │
│  │ Space Tree     │  │  │ Spaces Screen (Card Grid)              │ │
│  │ (Active Space) │  │  └────────────────────────────────────────┘ │
│  └────────────────┘  │                                              │
│                      │                                              │
│  ┌────────────────┐  │                                              │
│  │ Bottom Bar     │  │                                              │
│  │ [Spaces][+]👤  │  │                                              │
│  └────────────────┘  │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Module Descriptions

| Module | Description | Status |
|--------|-------------|--------|
| **Browser** | Multi-tab WebView browser with full navigation | ✅ Implemented |
| **Spaces** | Hierarchical content organization system | ✅ Implemented |
| **Workspace** | Local file browser, viewer, and editor area | ✅ Implemented |
| **Navigation** | Sidebar with tree view, bottom bar with space icons | ✅ Implemented |
| **Authentication** | Firebase Auth with Google OAuth | ✅ Implemented |
| **Notes** | Rich text / Markdown editor | 📋 Planned |
| **AI Copilot** | Intelligent learning assistance | 📋 V2 Feature |

---

## Implemented Features

### Browser Module ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Multi-Tab Browsing** | Up to 20 concurrent tabs | `TabbedBrowserScreen`, `TabManager` |
| **Tab Bar** | Horizontal scrollable tabs with drag-reorder | `SpayceTabBar`, `_DraggableTabList` |
| **Tab Persistence** | Tabs survive app restart | `SharedPreferences` JSON storage |
| **Navigation Controls** | Back, Forward, Refresh, Stop | `InAppWebView` controller |
| **URL Bar** | Address input with validation | `UrlValidator.validateAndNormalize()` |
| **Progress Indicator** | Linear progress during page load | `LinearProgressIndicator` |
| **Tab Types** | Web, Note (planned), LocalFile (planned) | `TabType` enum |
| **Origin Tracking** | Track which Space a tab came from | `originSpaceId`, `originSpaceItemId` |
| **Duplicate Detection** | Don't open same URL twice | `findTabByUrl()`, `findTabBySpaceItem()` |
| **Link Interception** | CMD+Click opens new tab | JavaScript injection |
| **Link Preview** | Arc-style popup for cross-domain links | `LinkPreviewPopup` |

### Spaces Module ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Space Creation** | Create named spaces with icons and colors | `SpacesProvider.createSpace()` |
| **Hierarchical Items** | Links, folders, files, local folders | `SpaceItemType` enum |
| **Unlimited Nesting** | Folders within folders | Recursive `children` structure |
| **Inline Editing** | Double-click to rename | `InlineRenameWidget` |
| **Context Menus** | Right-click actions | `SpaceContextMenu`, `ItemContextMenu` |
| **Drag & Drop** | Reorder items, move between folders | Planned/partial |
| **Metadata Extraction** | Auto-extract title, description, favicon | JavaScript extraction |
| **Visit Counting** | Track access count and last visited | `visitCount`, `lastVisited` |
| **Local File Import** | Import folders from file system | `SpaceItemType.localFolder` |
| **Card Grid View** | Responsive grid of Space cards | `SpacesScreenHiFiV2` |
| **Tree View** | Sidebar hierarchical tree | `TreeItemWidget` |

### Workspace Module ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **File Tree** | Navigate local file system | `WorkspaceSidebar` |
| **Multiple Workspaces** | Manage multiple project roots | `WorkspaceManager` |
| **Editor Tabs** | Open multiple files | `EditorTabs` |
| **File Viewer** | View file contents | `FileViewer` |
| **Markdown Viewer** | Render markdown files | `MarkdownViewer` |
| **WebView in Workspace** | Open links in editor area | `WorkspaceWebview` |
| **Activity Bar** | VS Code-style side icons | `WorkspaceActivityBar` |
| **Status Bar** | Git branch, cursor position | `StatusBar` |
| **Breadcrumbs** | File path display | In `EditorArea` |
| **Zero State** | Empty state with actions | `WorkspaceZeroState` |

### Navigation Module ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Overlay Sidebar** | 320px slide-out sidebar | `SpayceOverlaySidebar` |
| **Mode Switching** | Browser / Spaces toggle | `SpayceNavButton` |
| **Bottom Tab Bar** | Space icons, nav dots, user profile | `SpayceBottomTabBar` |
| **Space Icons** | Circular accent-colored icons | `SpayceSpaceIcon` |
| **Space Switching** | Click icon to change active Space | `onSpaceSelected` callback |
| **User Profile** | Avatar, name, settings access | `SpayceUserProfile` |
| **Workspace Tab** | Fixed leftmost tab in browser | `WorkspaceTab` |

### Authentication Module ✅

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Firebase Auth** | Token management | `firebase_auth` package |
| **Google OAuth** | Primary sign-in method | `google_sign_in` package |
| **Auth State** | Reactive auth changes | StreamProvider |
| **Secure Storage** | Credential persistence | `flutter_secure_storage` |
| **Sign Out** | Clear session | `AuthService.signOut()` |

---

## Platform Support

### Desktop Platforms

| Platform | WebView Engine | File Access | Status |
|----------|----------------|-------------|--------|
| **macOS** | WKWebView | Full (sandbox) | ✅ Primary |
| **Windows** | Edge WebView2 | Full | 📋 Planned |
| **Linux** | WebKitGTK | Full | 📋 Planned |

### Mobile Platforms

| Platform | WebView Engine | File Access | Status |
|----------|----------------|-------------|--------|
| **iOS** | WKWebView | Sandboxed | 📋 Planned |
| **Android** | Android WebView | SAF required | 📋 Planned |

### Web Platform

| Aspect | Technology | Status |
|--------|------------|--------|
| **Rendering** | Flutter Web (HTML/CanvasKit) | 📋 Planned |
| **Storage** | localStorage / IndexedDB | - |
| **WebView** | iframe (limited) | - |

---

## Performance Requirements

### Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| App launch | < 2s | 3s |
| Tab switch | < 100ms | 200ms |
| Space selection | < 200ms | 500ms |
| Tree expand/collapse | < 100ms | 200ms |
| Page load (WiFi) | < 1.5s | 3s |
| Search results | < 300ms | 500ms |
| File open | < 500ms | 1s |

### Animation Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60fps |
| Animation duration | 100-300ms |
| Interaction feedback | < 100ms |

### Memory Limits

| Context | Maximum |
|---------|---------|
| Per WebView tab | 200MB |
| App total | 500MB |
| Tab limit | 20 concurrent |

---

## Design Philosophy

### Inspired By

- **Arc Browser** - Sidebar design, space organization, deep dark purple theme
- **VS Code** - Workspace/IDE layout, activity bar, editor tabs
- **Notion** - Hierarchical organization, block-based content
- **Linear** - Clean UI, keyboard-first, fast performance

### Visual Identity

| Aspect | Choice |
|--------|--------|
| Theme | Deep dark purple |
| Accent | Violet (#6D5AE6) |
| Typography | Inter (UI), JetBrains Mono (code) |
| Icons | Lucide Icons |
| Layout | Sidebar + Main content |
| Spacing | Consistent 4px base grid |

### Interaction Principles

1. **Keyboard First** - All actions accessible via shortcuts
2. **Minimal Chrome** - Maximum content visibility
3. **Consistent Feedback** - Every action has visual response
4. **Progressive Disclosure** - Hide complexity until needed
5. **Context Preservation** - Maintain state across navigations

---

## Success Metrics

### User Engagement

| Metric | Target |
|--------|--------|
| Daily active usage | > 5 sessions |
| Average session length | > 10 minutes |
| Items added per week | > 10 |
| Return rate | > 70% weekly |

### Performance

| Metric | Target |
|--------|--------|
| Crash-free rate | > 99.5% |
| App start time | < 2s |
| Memory stability | No growth over time |

---

## References

### Source Documents

- [LOVABLE_PRODUCT_BRIEF.md](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/LOVABLE_PRODUCT_BRIEF.md) - Product vision
- [.aasef/context/product.md](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/.aasef/context/product.md) - Product context
- [.aasef/context/tech_decisions.md](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/.aasef/context/tech_decisions.md) - Tech stack decisions
- [.aasef/specs/002-browser-module/spec.md](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/.aasef/specs/002-browser-module/spec.md) - Browser specification
- [.aasef/specs/006-spaces/spec.md](file:///Users/Shared/ALL%20WORKSPACE/projects/spayce/.aasef/specs/006-spaces/spec.md) - Spaces specification

### Implementation Files

- `frontend/lib/features/browser/` - Browser module
- `frontend/lib/features/spaces/` - Spaces module
- `frontend/lib/features/workspace/` - Workspace module
- `frontend/lib/features/navigation/` - Navigation module
- `frontend/lib/core/auth/` - Authentication module

---

*Document Version: 2.0*  
*Last Updated: January 17, 2026*
