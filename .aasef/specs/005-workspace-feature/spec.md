# Spec 005: Workspace Feature

## Overview
Implement VS Code-like workspace with file tree, activity bar, editor area, and local file system integration.

## Requirements

### R1: File Tree
- Show folder hierarchy from local file system
- FileNode: name, path, isDirectory, contentType, children, isExpanded, size, modifiedAt
- Indent: 12px per level (different from spaces tree)
- File content types: markdown, code, text, image, video, pdf, url, unknown
- File icons based on content type

### R2: Activity Bar (48px width)
- Files explorer icon (folder)
- Search icon
- Git icon (git-branch)
- Extensions icon (puzzle)
- Active indicator with primary color

### R3: Editor Area
- Markdown rendering with syntax highlighting
- Code display with syntax highlighting
- Image/video preview
- PDF viewer integration
- Tabs for open files (35px height)

### R4: Status Bar (22px height)
- Line/column indicator
- File type indicator
- Encoding indicator
- Background: WorkspaceTheme.statusBar (#1A1A1A)

### R5: Local File Integration
- SpaceItem types: localFolder, localFile
- localPath field for file system path
- securityBookmark for macOS sandbox
- File watching for changes

## Acceptance Criteria
- [ ] File tree renders folder hierarchy
- [ ] Files open in editor area
- [ ] Markdown renders correctly
- [ ] Code has syntax highlighting
- [ ] Activity bar switches views
- [ ] Status bar shows file info

## Dependencies
- 001-project-foundation
- 002-navigation-shell

## Reference Files
- Old: `spayce/frontend/lib/features/workspace/`
- Old Tests: `spayce/frontend/test/unit/workspace/`, `spayce/frontend/test/widget/workspace/`
