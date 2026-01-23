import { dialog } from 'electron';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

export interface FileInfo {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    modified?: Date;
}

export class LocalFileSystemService {
    async selectFolder(): Promise<string | null> {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Folder',
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    }

    async selectFile(): Promise<string | null> {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            title: 'Select File',
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    }

    async selectMultipleFiles(): Promise<string[]> {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            title: 'Select Files',
        });

        if (result.canceled) {
            return [];
        }

        return result.filePaths;
    }

    async loadFolderChildren(folderPath: string): Promise<FileInfo[]> {
        try {
            const entries = await fs.readdir(folderPath, { withFileTypes: true });
            const fileInfos: FileInfo[] = [];

            for (const entry of entries) {
                // Skip hidden files (starting with .)
                if (entry.name.startsWith('.')) {
                    continue;
                }

                const fullPath = path.join(folderPath, entry.name);

                try {
                    const stats = await fs.stat(fullPath);

                    fileInfos.push({
                        name: entry.name,
                        path: fullPath,
                        type: entry.isDirectory() ? 'folder' : 'file',
                        size: entry.isFile() ? stats.size : undefined,
                        modified: stats.mtime,
                    });
                } catch (error) {
                    // Skip files we can't access
                    console.warn(`Cannot access ${fullPath}:`, error);
                    continue;
                }
            }

            // Sort: folders first, then files, alphabetically within each group
            return fileInfos.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name);
                }
                return a.type === 'folder' ? -1 : 1;
            });
        } catch (error) {
            console.error(`Failed to load folder children for ${folderPath}:`, error);
            throw new Error(`Cannot read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async checkPathExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async getFileStats(filePath: string): Promise<FileInfo | null> {
        try {
            const stats = await fs.stat(filePath);
            const isDirectory = stats.isDirectory();

            return {
                name: path.basename(filePath),
                path: filePath,
                type: isDirectory ? 'folder' : 'file',
                size: isDirectory ? undefined : stats.size,
                modified: stats.mtime,
            };
        } catch (error) {
            console.error(`Failed to get stats for ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Create a security bookmark for macOS to persist folder access permissions.
     * On non-macOS platforms, this is a no-op and returns the path itself.
     */
    async createSecurityBookmark(filePath: string): Promise<string | null> {
        // Security bookmarks are macOS-specific
        // For now, just return the path as a fallback
        // In a full implementation, we would use native modules to create actual bookmarks
        if (process.platform === 'darwin') {
            // TODO: Implement proper security bookmark creation using native modules
            // For now, store the path directly
            console.warn('Security bookmarks not yet implemented - storing path directly');
        }
        return filePath;
    }

    /**
     * Resolve a security bookmark to get the actual file path.
     * On non-macOS platforms, this just returns the bookmark string.
     */
    async resolveSecurityBookmark(bookmark: string): Promise<string | null> {
        // Security bookmarks are macOS-specific
        // For now, treat the bookmark as the path itself
        if (process.platform === 'darwin') {
            // TODO: Implement proper security bookmark resolution using native modules
            console.warn('Security bookmarks not yet implemented - treating as path');
        }

        // Verify the path still exists
        const exists = await this.checkPathExists(bookmark);
        return exists ? bookmark : null;
    }

    /**
     * Watch a folder for changes. Returns a function to stop watching.
     * Note: This is a simplified implementation. Full implementation would use fs.watch or chokidar.
     */
    watchFolder(folderPath: string, onChange: (event: 'change' | 'rename', filename: string) => void): () => void {
        try {
            const watcher = fsSync.watch(folderPath, (eventType: 'change' | 'rename', filename: string | null) => {
                if (filename) {
                    onChange(eventType, filename);
                }
            });

            // Return cleanup function
            return () => {
                watcher.close();
            };
        } catch (error) {
            console.error(`Failed to watch folder ${folderPath}:`, error);
            // Return no-op cleanup function
            return () => { };
        }
    }
}
