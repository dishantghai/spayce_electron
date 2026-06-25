# Spayce - Product Profile

## Overview
Spayce is an **AI-powered integrated application** that unifies:

1. **Browsing** - Full-featured multi-tab web browser
2. **Learning** - Organized content spaces with hierarchical structure
3. **Notes** - Rich text and markdown editing (planned)
4. **Working with Local Files** - File explorer, viewer, and editor integration
5. **Coding** - IDE capabilities with file viewing, syntax highlighting (planned)
6. **AI Assistance** - Intelligent learning copilot (V2 feature)

## Target Users
- Knowledge workers who manage many bookmarks, Notes ,resources and Files
- Developers and designers who work with multiple projects
- Students and researchers organising learning materials
- Anyone who wants a unified workspace for browsing, Note Taking and file management

## Problem Statement
Existing browsers and bookmark managers fail to provide contextual organization. Users struggle with:
- Thousands of disorganized bookmarks
- Context switching between browser and file manager
- No visual hierarchy for related resources
- Poor integration between web content and local files


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


## Solution
Spayce provides:
- **Spaces**: Themed containers for organizing related links, folders, and files
- **Integrated Browser**: Arc-style multi-tab browser with WebContentsView
- **Workspace**: VS Code-like file explorer and editor
- **Pinned Links**: Quick-access grid for frequently used resources
- **Drag & Drop**: Intuitive organization with tree view and reordering

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Unified Context** | All content in one app, seamless switching |
| **Integration Magic** | Content from different modules can interact |
| **AI-Native** | AI understands context across all modules |
| **Desktop-First** | Full OS integration, file system access |
| **Solo-Dev Friendly** | AI-assisted development, proven patterns |

## Platforms
macOS, iOS, Android, Windows, Linux, Web

## Domain
Productivity / Knowledge Management / Browser
