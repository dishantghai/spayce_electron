# Spayce Application Architecture

> **Purpose**: Complete technical architecture for Spayce - an integrated content browsing, learning, and working environment built with Electron.

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [High-Level Architecture](#high-level-architecture)
3. [System Architecture Diagram](#system-architecture-diagram)
4. [Module Architecture](#module-architecture)
5. [Data Architecture](#data-architecture)
6. [State Management Architecture](#state-management-architecture)
7. [Integration Architecture](#integration-architecture)
8. [Current Feature Map](#current-feature-map)
9. [Future Roadmap Architecture](#future-roadmap-architecture)
10. [Technology Stack](#technology-stack)

---

## Vision & Goals

### The Spayce Promise

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THE SPAYCE VISION                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BEFORE SPAYCE:                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Chrome  │ │ Notion  │ │ Obsidian│ │ VS Code │ │ Slack   │           │
│  │ (20tabs)│ │ (notes) │ │ (PKM)   │ │ (code)  │ │ (chat)  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │          │          │          │          │                     │
│       └──────────┴──────────┴──────────┴──────────┘                     │
│                              │                                           │
│                    FRAGMENTED CONTEXT                                   │
│                    Loss of focus, wasted time                           │
│                                                                          │
│  ════════════════════════════════════════════════════════════════       │
│                                                                          │
│  WITH SPAYCE:                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                          SPAYCE                                  │   │
│  │    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │   │
│  │    │ Browse  │◄►│ Learn   │◄►│ Notes   │◄►│ Work    │              │   │
│  │    └─────────┘ └─────────┘ └─────────┘ └─────────┘              │   │
│  │                         │                                        │   │
│  │                   UNIFIED CONTEXT                                │   │
│  │               + AI-powered connections                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Unified Context** | All content in one app, seamless switching |
| **Integration Magic** | Content from different modules can interact |
| **AI-Native** | AI understands context across all modules |
| **Desktop-First** | Full OS integration, file system access |
| **Solo-Dev Friendly** | AI-assisted development, proven patterns |

---

## High-Level Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SPAYCE LAYERED ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    PRESENTATION LAYER                            │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │ React Components (Shell UI)                             │    │    │
│  │  │ ├── Sidebar, TabBar, Omnibar, StatusBar                │    │    │
│  │  │ └── Spaces Panel, Notes Panel, Settings                │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │ BrowserViews (Web Content)                              │    │    │
│  │  │ └── Per-tab Chromium instances                          │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                              State Layer                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    APPLICATION STATE                             │    │
│  │  Zustand Stores: tabs, spaces, notes, ui, preferences          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                   IPC                                   │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    SERVICE LAYER (Main Process)                  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │ Tab      │ │ Space    │ │ Note     │ │ AI       │           │    │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │ File     │ │ Window   │ │ Menu     │ │ Search   │           │    │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    DATA LAYER                                    │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │ SQLite Database                                           │   │    │
│  │  │ ├── spaces.db (spaces, items, hierarchy)                 │   │    │
│  │  │ ├── notes.db (content, metadata)                         │   │    │
│  │  │ ├── browser.db (tabs, history, sessions)                 │   │    │
│  │  │ └── settings.db (preferences, profiles)                  │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │ File System                                               │   │    │
│  │  │ └── User files, workspaces, cached content               │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## System Architecture Diagram

### Complete System View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SPAYCE SYSTEM ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         ELECTRON CONTAINER                               │    │
│  │                                                                          │    │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │    │
│  │  │                       MAIN PROCESS                                 │  │    │
│  │  │                                                                    │  │    │
│  │  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │  │    │
│  │  │   │ App         │   │ Window      │   │ Native APIs         │    │  │    │
│  │  │   │ Lifecycle   │   │ Manager     │   │ Menu, Tray, Dialog  │    │  │    │
│  │  │   └─────────────┘   └─────────────┘   └─────────────────────┘    │  │    │
│  │  │                                                                    │  │    │
│  │  │   ┌─────────────────────────────────────────────────────────┐    │  │    │
│  │  │   │                   CORE SERVICES                          │    │  │    │
│  │  │   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │  │    │
│  │  │   │  │TabManager│ │SpaceMgr  │ │NoteMgr   │ │SearchMgr │   │    │  │    │
│  │  │   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │  │    │
│  │  │   └─────────────────────────────────────────────────────────┘    │  │    │
│  │  │                                                                    │  │    │
│  │  │   ┌─────────────────────────────────────────────────────────┐    │  │    │
│  │  │   │                   DATA SERVICES                          │    │  │    │
│  │  │   │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │    │  │    │
│  │  │   │  │Database  │ │FileSystem│ │Cache     │                 │    │  │    │
│  │  │   │  │(SQLite)  │ │Service   │ │Service   │                 │    │  │    │
│  │  │   │  └──────────┘ └──────────┘ └──────────┘                 │    │  │    │
│  │  │   └─────────────────────────────────────────────────────────┘    │  │    │
│  │  │                                                                    │  │    │
│  │  └───────────────────────────────────────────────────────────────────┘  │    │
│  │                                    │                                     │    │
│  │                       IPC (ipcMain ◄─► ipcRenderer)                     │    │
│  │                                    │                                     │    │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │    │
│  │  │                    RENDERER PROCESSES                              │  │    │
│  │  │                                                                    │  │    │
│  │  │   ┌─────────────────────────────────────────────────────────┐    │  │    │
│  │  │   │              SHELL RENDERER (React App)                  │    │  │    │
│  │  │   │                                                          │    │  │    │
│  │  │   │   ┌──────┐ ┌──────────────────────────────────────┐    │    │  │    │
│  │  │   │   │Sidebar│ │ Main Content Area                    │    │    │  │    │
│  │  │   │   │       │ │ ┌────────────────────────────────┐  │    │    │  │    │
│  │  │   │   │ ├─Nav │ │ │ Tab Bar [T1] [T2] [T3] [+]     │  │    │    │  │    │
│  │  │   │   │ ├─Tree│ │ ├────────────────────────────────┤  │    │    │  │    │
│  │  │   │   │ └─User│ │ │                                │  │    │    │  │    │
│  │  │   │   │       │ │ │   BrowserView Container        │  │    │    │  │    │
│  │  │   │   │       │ │ │   (Active Tab Content)         │  │    │    │  │    │
│  │  │   │   │       │ │ │                                │  │    │    │  │    │
│  │  │   │   └──────┘ │ └────────────────────────────────┘  │    │    │  │    │
│  │  │   │            └──────────────────────────────────────┘    │    │  │    │
│  │  │   └─────────────────────────────────────────────────────────┘    │  │    │
│  │  │                                                                    │  │    │
│  │  │   ┌─────────────────────────────────────────────────────────┐    │  │    │
│  │  │   │              BROWSERVIEW PROCESSES                       │    │  │    │
│  │  │   │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │    │  │    │
│  │  │   │   │ Tab 1  │ │ Tab 2  │ │ Tab 3  │ │ Tab N  │           │    │  │    │
│  │  │   │   │chromium│ │chromium│ │chromium│ │chromium│           │    │  │    │
│  │  │   │   └────────┘ └────────┘ └────────┘ └────────┘           │    │  │    │
│  │  │   └─────────────────────────────────────────────────────────┘    │  │    │
│  │  │                                                                    │  │    │
│  │  └───────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         EXTERNAL SERVICES                                │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐          │    │
│  │   │ AI APIs      │  │ Sync Service │  │ Extension Registry   │          │    │
│  │   │ (OpenAI etc) │  │ (Future)     │  │ (Future)             │          │    │
│  │   └──────────────┘  └──────────────┘  └──────────────────────┘          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

### Core Modules

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MODULE DEPENDENCY MAP                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    ┌────────────────────┐                               │
│                    │     SHELL APP      │                               │
│                    │   (Entry Point)    │                               │
│                    └─────────┬──────────┘                               │
│                              │                                           │
│         ┌────────────────────┼────────────────────┐                     │
│         │                    │                    │                     │
│         ▼                    ▼                    ▼                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   BROWSER    │◄──►│    SPACES    │◄──►│    NOTES     │              │
│  │   MODULE     │    │    MODULE    │    │    MODULE    │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                    │                    │                     │
│         │                    │                    │                     │
│         └────────────────────┼────────────────────┘                     │
│                              │                                           │
│                              ▼                                           │
│                    ┌────────────────────┐                               │
│                    │   SHARED SERVICES  │                               │
│                    │  ┌──────────────┐  │                               │
│                    │  │ Context      │  │                               │
│                    │  │ Engine       │◄────── AI INTEGRATION POINT     │
│                    │  └──────────────┘  │                               │
│                    │  ┌──────────────┐  │                               │
│                    │  │ Database     │  │                               │
│                    │  │ Service      │  │                               │
│                    │  └──────────────┘  │                               │
│                    │  ┌──────────────┐  │                               │
│                    │  │ Search       │  │                               │
│                    │  │ Service      │  │                               │
│                    │  └──────────────┘  │                               │
│                    └────────────────────┘                               │
│                                                                          │
│  ═══════════════════ FUTURE MODULES ═══════════════════                │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   WORKSPACE  │    │   AI COPILOT │    │  EXTENSIONS  │              │
│  │   (IDE)      │    │              │    │              │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Module Specifications

| Module | Purpose | Current Status | Key Components |
|--------|---------|----------------|----------------|
| **Browser** | Multi-tab web browsing | 🎯 Phase 1 | TabManager, BrowserView, Navigation |
| **Spaces** | Hierarchical content organization | 🎯 Phase 1 | SpaceTree, ItemCards, DragDrop |
| **Notes** | Rich text/markdown editing | 🎯 Phase 1 | Editor, Preview, Linking |
| **Workspace** | Local file browsing | 🎯 Phase 1 | FileTree, Viewer, Breadcrumb |
| **AI Copilot** | Intelligent assistance | 📋 Phase 2 | ChatInterface, ContextEngine |
| **IDE** | Code editing | 📋 Phase 3 | CodeEditor, LSP, Terminal |

---

## Data Architecture

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA MODEL (ERD)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐         ┌────────────────┐                          │
│  │     PROFILE    │         │     SPACE      │                          │
│  ├────────────────┤         ├────────────────┤                          │
│  │ id             │◄───────►│ id             │                          │
│  │ name           │    1:N  │ profileId      │                          │
│  │ email          │         │ name           │                          │
│  │ avatarUrl      │         │ icon           │                          │
│  │ createdAt      │         │ color          │                          │
│  └────────────────┘         │ parentId       │◄──┐ (self-reference)     │
│                             │ sortOrder      │   │                       │
│                             │ createdAt      │───┘                       │
│                             └───────┬────────┘                          │
│                                     │ 1:N                                │
│                                     ▼                                    │
│                             ┌────────────────┐                          │
│                             │  SPACE_ITEM    │                          │
│                             ├────────────────┤                          │
│                             │ id             │                          │
│                             │ spaceId        │                          │
│                             │ parentId       │◄──┐ (self-reference)     │
│                             │ type           │   │ (folder nesting)     │
│                             │ title          │───┘                       │
│                             │ url            │                          │
│                             │ favicon        │                          │
│                             │ description    │                          │
│                             │ localPath      │                          │
│                             │ sortOrder      │                          │
│                             │ visitCount     │                          │
│                             │ lastVisited    │                          │
│                             │ createdAt      │                          │
│                             └───────┬────────┘                          │
│                                     │ 1:N                                │
│                                     ▼                                    │
│  ┌────────────────┐         ┌────────────────┐                          │
│  │      TAB       │         │      NOTE      │                          │
│  ├────────────────┤         ├────────────────┤                          │
│  │ id             │         │ id             │                          │
│  │ url            │         │ spaceItemId    │ (optional link)          │
│  │ title          │         │ title          │                          │
│  │ favicon        │         │ content        │                          │
│  │ isActive       │         │ format         │ (md/richtext)            │
│  │ originSpaceId  │         │ createdAt      │                          │
│  │ originItemId   │         │ updatedAt      │                          │
│  │ scrollPosition │         └────────────────┘                          │
│  │ createdAt      │                                                      │
│  └────────────────┘                                                      │
│                                                                          │
│  ┌────────────────┐         ┌────────────────┐                          │
│  │    SESSION     │         │   PREFERENCE   │                          │
│  ├────────────────┤         ├────────────────┤                          │
│  │ id             │         │ key            │                          │
│  │ tabs[]         │ (JSON)  │ value          │ (JSON)                   │
│  │ activeSpaceId  │         │ profileId      │                          │
│  │ sidebarState   │         └────────────────┘                          │
│  │ savedAt        │                                                      │
│  └────────────────┘                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Core tables for Spayce

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  parent_id TEXT REFERENCES spaces(id),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spaces_profile ON spaces(profile_id);
CREATE INDEX idx_spaces_parent ON spaces(parent_id);

CREATE TABLE space_items (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id),
  parent_id TEXT REFERENCES space_items(id),
  type TEXT NOT NULL CHECK(type IN ('link', 'folder', 'file', 'localFolder', 'note')),
  title TEXT NOT NULL,
  url TEXT,
  favicon TEXT,
  description TEXT,
  local_path TEXT,
  sort_order INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visited DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_space ON space_items(space_id);
CREATE INDEX idx_items_parent ON space_items(parent_id);

CREATE TABLE tabs (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  favicon TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  origin_space_id TEXT REFERENCES spaces(id),
  origin_item_id TEXT REFERENCES space_items(id),
  scroll_position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  space_item_id TEXT REFERENCES space_items(id),
  title TEXT NOT NULL,
  content TEXT,
  format TEXT DEFAULT 'markdown',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  tabs_json TEXT,
  active_space_id TEXT,
  sidebar_state TEXT,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value TEXT,
  profile_id TEXT REFERENCES profiles(id)
);
```

---

## State Management Architecture

### Zustand Store Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         ZUSTAND STORES                           │    │
│  │                                                                   │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │    │
│  │   │  tabStore   │  │ spaceStore  │  │   noteStore         │     │    │
│  │   │             │  │             │  │                     │     │    │
│  │   │ • tabs[]    │  │ • spaces[]  │  │ • notes[]           │     │    │
│  │   │ • activeId  │  │ • activeId  │  │ • activeId          │     │    │
│  │   │ • history   │  │ • items{}   │  │ • draftContent      │     │    │
│  │   │             │  │ • expanded  │  │                     │     │    │
│  │   │ Actions:    │  │             │  │ Actions:            │     │    │
│  │   │ • create    │  │ Actions:    │  │ • save              │     │    │
│  │   │ • close     │  │ • create    │  │ • delete            │     │    │
│  │   │ • switch    │  │ • addItem   │  │ • link              │     │    │
│  │   │ • navigate  │  │ • move      │  │                     │     │    │
│  │   └─────────────┘  └─────────────┘  └─────────────────────┘     │    │
│  │                                                                   │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │    │
│  │   │   uiStore   │  │ prefStore   │  │   searchStore       │     │    │
│  │   │             │  │             │  │                     │     │    │
│  │   │ • sidebar   │  │ • theme     │  │ • query             │     │    │
│  │   │ • modals    │  │ • shortcuts │  │ • results[]         │     │    │
│  │   │ • panels    │  │ • defaults  │  │ • isSearching       │     │    │
│  │   └─────────────┘  └─────────────┘  └─────────────────────┘     │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                    Persist middleware                                    │
│                              │                                           │
│                              ▼                                           │
│                    ┌─────────────────┐                                  │
│                    │   IPC Bridge    │                                  │
│                    │ (sync to Main)  │                                  │
│                    └────────┬────────┘                                  │
│                              │                                           │
│                              ▼                                           │
│                    ┌─────────────────┐                                  │
│                    │  SQLite (Main)  │                                  │
│                    └─────────────────┘                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Store Implementation Pattern

```typescript
// stores/tabStore.ts - Example implementation

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  
  // Actions
  createTab: (url: string) => Promise<string>;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      createTab: async (url: string) => {
        // Call main process to create BrowserView
        const id = await window.spayce.tabs.create(url);
        
        set(state => ({
          tabs: [...state.tabs, { id, url, title: 'Loading...', isLoading: true }],
          activeTabId: id,
        }));
        
        return id;
      },

      closeTab: (id: string) => {
        // Call main process
        window.spayce.tabs.close(id);
        
        set(state => {
          const newTabs = state.tabs.filter(t => t.id !== id);
          const newActiveId = state.activeTabId === id 
            ? newTabs[0]?.id ?? null 
            : state.activeTabId;
          return { tabs: newTabs, activeTabId: newActiveId };
        });
      },

      switchTab: (id: string) => {
        window.spayce.tabs.switch(id);
        set({ activeTabId: id });
      },

      updateTab: (id, updates) => {
        set(state => ({
          tabs: state.tabs.map(t => t.id === id ? { ...t, ...updates } : t),
        }));
      },
    }),
    {
      name: 'spayce-tabs',
      partialize: (state) => ({ tabs: state.tabs }), // Only persist tabs, not activeId
    }
  )
);
```

---

## Integration Architecture

### Context Integration (The Magic)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONTEXT INTEGRATION SYSTEM                            │
│                    (What Makes Spayce Magical)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │    BROWSING     │     │    LEARNING     │     │     NOTES       │   │
│  │    CONTEXT      │     │    CONTEXT      │     │    CONTEXT      │   │
│  │                 │     │                 │     │                 │   │
│  │ • Current URLs  │     │ • Active Space  │     │ • Note content  │   │
│  │ • Tab history   │     │ • Course items  │     │ • Tags          │   │
│  │ • Scroll pos    │     │ • Progress      │     │ • Links         │   │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘   │
│           │                       │                       │             │
│           └───────────────────────┼───────────────────────┘             │
│                                   │                                      │
│                                   ▼                                      │
│                     ┌──────────────────────────┐                        │
│                     │     CONTEXT ENGINE       │                        │
│                     │                          │                        │
│                     │  • Aggregates all context│                        │
│                     │  • Finds connections     │                        │
│                     │  • Suggests actions      │                        │
│                     │  • Powers AI features    │                        │
│                     └────────────┬─────────────┘                        │
│                                  │                                       │
│              ┌───────────────────┼───────────────────┐                  │
│              │                   │                   │                  │
│              ▼                   ▼                   ▼                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐       │
│  │ SMART ACTIONS   │ │ AI SUGGESTIONS  │ │ CROSS-LINKING       │       │
│  │                 │ │                 │ │                     │       │
│  │ "Add to Space"  │ │ "Related notes" │ │ Note ↔ Tab links   │       │
│  │ "Create Note"   │ │ "Summarize"     │ │ Space ↔ Note links │       │
│  │ "Link Content"  │ │ "Next learning" │ │ Tab ↔ Space links  │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────────┘       │
│                                                                          │
│  ════════════════════════════════════════════════════════════════       │
│                                                                          │
│  EXAMPLE FLOW:                                                          │
│                                                                          │
│  1. User browses React documentation                                    │
│  2. Context Engine recognizes "React" topic                             │
│  3. Suggests: "Add to your 'Learning React' Space"                      │
│  4. User clicks → Link created                                          │
│  5. When creating note, shows: "Related: React docs you saved"          │
│  6. AI can answer: "What React concepts have I studied?"                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Current Feature Map

### Phase 1 Features (MVP)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1 FEATURE MAP (MVP)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BROWSER MODULE                                                         │
│  ══════════════                                                         │
│  [✓] Multi-tab browsing (BrowserView)                                  │
│  [✓] Tab bar with switching                                            │
│  [✓] Navigation (back/forward/refresh)                                 │
│  [✓] URL bar with validation                                           │
│  [✓] Tab persistence (survive restart)                                 │
│  [✓] Origin tracking (from which Space)                                │
│  [ ] Keyboard shortcuts (Cmd+T, Cmd+W, etc.)                           │
│  [ ] Find in page (Cmd+F)                                              │
│  [ ] Downloads management                                               │
│                                                                          │
│  SPACES MODULE                                                          │
│  ═════════════                                                          │
│  [✓] Create/edit/delete Spaces                                         │
│  [✓] Hierarchical items (unlimited nesting)                            │
│  [✓] Link items with metadata extraction                               │
│  [✓] Folder organization                                               │
│  [✓] Tree view in sidebar                                              │
│  [✓] Card grid view                                                    │
│  [ ] Drag and drop reordering                                          │
│  [ ] Search within Spaces                                              │
│  [ ] Quick add from browser                                            │
│                                                                          │
│  NOTES MODULE                                                           │
│  ════════════                                                           │
│  [ ] Create/edit notes                                                  │
│  [ ] Markdown support                                                   │
│  [ ] Link to Space items                                                │
│  [ ] Basic formatting toolbar                                           │
│  [ ] Auto-save                                                          │
│                                                                          │
│  WORKSPACE MODULE                                                       │
│  ════════════════                                                       │
│  [✓] File tree navigation                                              │
│  [✓] File viewer                                                        │
│  [✓] Markdown preview                                                   │
│  [ ] Multiple workspace roots                                           │
│  [ ] Recent files                                                       │
│                                                                          │
│  CORE/SHARED                                                            │
│  ═══════════                                                            │
│  [✓] SQLite persistence                                                │
│  [✓] Settings/preferences                                               │
│  [ ] Global search (Cmd+K)                                              │
│  [ ] Keyboard navigation                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Future Roadmap Architecture

### Phase 2: AI Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: AI COPILOT                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    AI SERVICE ARCHITECTURE                       │    │
│  │                                                                   │    │
│  │   ┌────────────────────┐    ┌────────────────────────────────┐  │    │
│  │   │ Chat Interface     │    │ Context Engine                 │  │    │
│  │   │ (Sidebar panel)    │◄──►│ (Aggregates all context)       │  │    │
│  │   └────────────────────┘    └────────────────────────────────┘  │    │
│  │                                         │                        │    │
│  │                                         ▼                        │    │
│  │                         ┌───────────────────────────────────┐   │    │
│  │                         │        AI PROVIDER LAYER          │   │    │
│  │                         │                                    │   │    │
│  │                         │  ┌──────────┐  ┌──────────────┐   │   │    │
│  │                         │  │ Cloud    │  │ Local LLM    │   │   │    │
│  │                         │  │ (OpenAI) │  │ (Ollama)     │   │   │    │
│  │                         │  └──────────┘  └──────────────┘   │   │    │
│  │                         └───────────────────────────────────┘   │    │
│  │                                                                   │    │
│  │   CAPABILITIES:                                                  │    │
│  │   • Summarize current page                                       │    │
│  │   • Answer questions about browsing history                      │    │
│  │   • Suggest related content from Spaces                          │    │
│  │   • Help write and organize notes                                │    │
│  │   • Smart search across all content                              │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase 3: IDE Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: IDE MODULE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    IDE ARCHITECTURE                              │    │
│  │                                                                   │    │
│  │   ┌─────────────────────────────────────────────────────────┐   │    │
│  │   │ Monaco Editor (VS Code's editor)                         │   │    │
│  │   │ • Syntax highlighting (100+ languages)                  │   │    │
│  │   │ • IntelliSense                                           │   │    │
│  │   │ • Multiple cursors                                       │   │    │
│  │   │ • Minimap                                                 │   │    │
│  │   └─────────────────────────────────────────────────────────┘   │    │
│  │                              │                                   │    │
│  │                              ▼                                   │    │
│  │   ┌─────────────────────────────────────────────────────────┐   │    │
│  │   │ Language Server Protocol (LSP)                           │   │    │
│  │   │ • TypeScript/JavaScript                                  │   │    │
│  │   │ • Python                                                  │   │    │
│  │   │ • Rust                                                    │   │    │
│  │   │ • Other languages                                        │   │    │
│  │   └─────────────────────────────────────────────────────────┘   │    │
│  │                              │                                   │    │
│  │                              ▼                                   │    │
│  │   ┌─────────────────────────────────────────────────────────┐   │    │
│  │   │ Integrated Terminal (xterm.js)                           │   │    │
│  │   │ • Shell access                                           │   │    │
│  │   │ • Command execution                                      │   │    │
│  │   │ • Multiple terminal tabs                                 │   │    │
│  │   └─────────────────────────────────────────────────────────┘   │    │
│  │                                                                   │    │
│  │   THE INTEGRATION MAGIC:                                         │    │
│  │   • Browse docs → Open in IDE → Code with context               │    │
│  │   • Note with code snippets → Execute in terminal               │    │
│  │   • AI understands code + browsing + notes together             │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Long-Term Vision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LONG-TERM FEATURE ROADMAP                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  NOW          PHASE 2        PHASE 3        PHASE 4        FUTURE       │
│   │              │              │              │              │          │
│   ▼              ▼              ▼              ▼              ▼          │
│ ┌────┐       ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐   │
│ │MVP │──────►│ AI     │────►│ IDE    │────►│ Sync   │────►│ Mobile │   │
│ │    │       │ Copilot│     │        │     │        │     │        │   │
│ └────┘       └────────┘     └────────┘     └────────┘     └────────┘   │
│                                                                          │
│  Features:                                                              │
│  • Browser    • Chat AI      • Monaco      • Cloud sync  • iOS app     │
│  • Spaces     • Summarize    • Terminal    • Share       • Android     │
│  • Notes      • Context      • LSP         • Collaborate • Web app     │
│  • Files      • Smart search • Git         • Team spaces               │
│                                                                          │
│  Timeline (estimated):                                                  │
│  ─────────────────────────────────────────────────────────────────      │
│  │←── 2-3 mo ──►│←── 2 mo ──►│←── 3 mo ──►│←── 3 mo ──►│              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Complete Stack Overview

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Electron | 29+ | Desktop container |
| **Browser Engine** | Chromium | (bundled) | Web rendering |
| **UI Framework** | React | 18+ | Shell UI |
| **Language** | TypeScript | 5+ | Type safety |
| **Build Tool** | Vite | 5+ | Fast builds |
| **State** | Zustand | 4+ | State management |
| **Styling** | CSS Modules | - | Scoped styles |
| **Database** | SQLite | 3.x | Local persistence |
| **DB Driver** | better-sqlite3 | - | Sync SQLite access |
| **Icons** | Lucide React | - | Icon system |
| **Editor** | Monaco | (Phase 3) | Code editing |
| **Terminal** | xterm.js | (Phase 3) | Terminal emulation |

### Project Structure

```
spayce-electron/
├── package.json
├── electron-vite.config.ts
├── tsconfig.json
│
├── src/
│   ├── main/                      # Main process
│   │   ├── index.ts               # Entry point
│   │   ├── services/
│   │   │   ├── TabManager.ts
│   │   │   ├── SpaceManager.ts
│   │   │   ├── NoteManager.ts
│   │   │   ├── DatabaseService.ts
│   │   │   ├── FileService.ts
│   │   │   └── WindowManager.ts
│   │   ├── ipc/
│   │   │   └── handlers.ts        # IPC handler registration
│   │   └── menu.ts                # Application menu
│   │
│   ├── preload/                    # Preload scripts
│   │   └── index.ts               # Context bridge
│   │
│   ├── renderer/                   # Renderer process (React)
│   │   ├── index.html
│   │   ├── main.tsx               # React entry
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── TabBar.tsx
│   │   │   │   └── StatusBar.tsx
│   │   │   ├── browser/
│   │   │   │   ├── BrowserArea.tsx
│   │   │   │   └── TabItem.tsx
│   │   │   ├── spaces/
│   │   │   │   ├── SpaceTree.tsx
│   │   │   │   └── SpaceCard.tsx
│   │   │   ├── notes/
│   │   │   │   ├── NoteEditor.tsx
│   │   │   │   └── NoteList.tsx
│   │   │   └── shared/
│   │   │       ├── Button.tsx
│   │   │       └── Modal.tsx
│   │   ├── stores/
│   │   │   ├── tabStore.ts
│   │   │   ├── spaceStore.ts
│   │   │   ├── noteStore.ts
│   │   │   └── uiStore.ts
│   │   ├── hooks/
│   │   │   ├── useTabs.ts
│   │   │   └── useSpaces.ts
│   │   └── styles/
│   │       ├── globals.css
│   │       └── variables.css
│   │
│   └── shared/                     # Shared between processes
│       ├── types/
│       │   ├── tab.ts
│       │   ├── space.ts
│       │   └── note.ts
│       └── constants.ts
│
├── resources/                      # Static assets
│   └── icons/
│
└── database/                       # SQLite schemas
    └── schema.sql
```

---

## Summary

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Electron | Full browser compat, AI-friendly, proven |
| Tabs | BrowserView | Designed for multi-tab, process isolation |
| UI | React + TypeScript | Best AI assistance, mature ecosystem |
| State | Zustand | Simple, scalable, persistent |
| Database | SQLite | Reliable, embedded, offline-first |
| Build | Vite | Fast dev experience |

### The Integration Advantage

```
                    ┌───────────────────────┐
                    │                       │
          ┌────────►│   CONTEXT ENGINE      │◄────────┐
          │         │                       │         │
          │         └───────────┬───────────┘         │
          │                     │                     │
          │          ┌──────────┴──────────┐          │
          │          │                     │          │
    ┌─────┴─────┐  ┌─┴───────┐  ┌─────────┴┐  ┌─────┴─────┐
    │  BROWSER  │  │ SPACES  │  │  NOTES   │  │   (IDE)   │
    │           │  │         │  │          │  │  Future   │
    └───────────┘  └─────────┘  └──────────┘  └───────────┘
    
    All modules share context → AI understands everything
    → Magical integrated experience
```

---

*Document Version: 1.0*  
*Created: January 19, 2026*  
*Architecture: Electron + React + TypeScript + SQLite*
