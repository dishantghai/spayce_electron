# Implementation Plan: 005-workspace-feature

## Step 1: Workspace Theme
1. Create `WorkspaceTheme.ts` with separate color scheme
2. Apply theme to workspace components

## Step 2: File System Integration (Main Process)
1. Create `src/main/filesystem/FileManager.ts`
2. Implement directory reading
3. Implement file content reading
4. Set up file watching with chokidar
5. Handle macOS security bookmarks

## Step 3: Activity Bar
1. Create `ActivityBar.tsx` (48px width)
2. Create `ActivityBarItem.tsx` with icons
3. Implement active state indicator

## Step 4: File Tree
1. Create `FileTree.tsx` container
2. Create `FileTreeItem.tsx` with 12px indent
3. Create `FolderIcon.tsx` and `FileIcon.tsx` based on type
4. Implement expand/collapse
5. Connect to file system via IPC

## Step 5: Editor Area
1. Create `EditorArea.tsx` container
2. Create `EditorTabs.tsx` (35px height)
3. Create `MarkdownViewer.tsx` with react-markdown
4. Create `CodeViewer.tsx` with syntax highlighting
5. Create `ImageViewer.tsx` and `VideoViewer.tsx`

## Step 6: Status Bar
1. Create `StatusBar.tsx` (22px height)
2. Create `LineColumnIndicator.tsx`
3. Create `FileTypeIndicator.tsx`
4. Create `EncodingIndicator.tsx`

## TDD Approach
- Test file tree expansion logic
- Test content type detection
- Test file watching events
- Test editor tab management
