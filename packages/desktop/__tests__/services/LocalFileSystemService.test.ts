import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalFileSystemService } from '../../src/main/services/LocalFileSystemService';
import { dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

vi.mock('electron', () => ({
    dialog: {
        showOpenDialog: vi.fn(),
    },
}));

vi.mock('fs/promises');

describe('LocalFileSystemService', () => {
    let service: LocalFileSystemService;

    beforeEach(() => {
        service = new LocalFileSystemService();
        vi.clearAllMocks();
    });

    describe('selectFolder', () => {
        it('should return selected folder path', async () => {
            const mockPath = '/Users/test/Documents';

            vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
                canceled: false,
                filePaths: [mockPath],
            } as any);

            const result = await service.selectFolder();

            expect(result).toBe(mockPath);
            expect(dialog.showOpenDialog).toHaveBeenCalledWith({
                properties: ['openDirectory', 'createDirectory'],
                title: 'Select Folder',
            });
        });

        it('should return null when user cancels', async () => {
            vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
                canceled: true,
                filePaths: [],
            } as any);

            const result = await service.selectFolder();

            expect(result).toBeNull();
        });

        it('should return null when no path selected', async () => {
            vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
                canceled: false,
                filePaths: [],
            } as any);

            const result = await service.selectFolder();

            expect(result).toBeNull();
        });

        it('should handle dialog errors', async () => {
            vi.mocked(dialog.showOpenDialog).mockRejectedValueOnce(new Error('Dialog error'));

            await expect(service.selectFolder()).rejects.toThrow('Dialog error');
        });
    });

    describe('selectFile', () => {
        it('should return selected file path', async () => {
            const mockPath = '/Users/test/document.pdf';

            vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
                canceled: false,
                filePaths: [mockPath],
            } as any);

            const result = await service.selectFile();

            expect(result).toBe(mockPath);
            expect(dialog.showOpenDialog).toHaveBeenCalledWith({
                properties: ['openFile'],
                title: 'Select File',
            });
        });

        it('should return null when user cancels', async () => {
            vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
                canceled: true,
                filePaths: [],
            } as any);

            const result = await service.selectFile();

            expect(result).toBeNull();
        });

        it('should handle multiple files selected (return first)', async () => {
            vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
                canceled: false,
                filePaths: ['/path/file1.txt', '/path/file2.txt'],
            } as any);

            const result = await service.selectFile();

            expect(result).toBe('/path/file1.txt');
        });
    });

    describe('loadFolderChildren', () => {
        it('should return folder contents with file info', async () => {
            const mockPath = '/Users/test/folder';
            const mockFiles = [
                { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
                { name: 'file2.pdf', isDirectory: () => false, isFile: () => true },
                { name: 'folder1', isDirectory: () => true, isFile: () => false },
            ];

            vi.mocked(fs.readdir).mockResolvedValueOnce(mockFiles as any);

            vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
                const name = path.basename(filePath);
                return {
                    isFile: () => name !== 'folder1',
                    isDirectory: () => name === 'folder1',
                    size: name === 'file1.txt' ? 1024 : 2048,
                    mtime: new Date('2024-01-01'),
                } as any;
            });

            const result = await service.loadFolderChildren(mockPath);

            expect(result).toHaveLength(3);

            const file1 = result.find(f => f.name === 'file1.txt');
            expect(file1).toEqual({
                name: 'file1.txt',
                path: path.join(mockPath, 'file1.txt'),
                type: 'file',
                size: 1024,
                modified: expect.any(Date),
            });

            const folder1 = result.find(f => f.name === 'folder1');
            expect(folder1).toEqual({
                name: 'folder1',
                path: path.join(mockPath, 'folder1'),
                type: 'folder',
                size: undefined,
                modified: expect.any(Date),
            });
        });

        it('should filter hidden files', async () => {
            const mockPath = '/Users/test/folder';
            const mockFiles = [
                { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
                { name: '.hidden', isDirectory: () => false, isFile: () => true },
                { name: '.DS_Store', isDirectory: () => false, isFile: () => true },
                { name: 'visible.pdf', isDirectory: () => false, isFile: () => true },
            ];

            vi.mocked(fs.readdir).mockResolvedValueOnce(mockFiles as any);

            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                isDirectory: () => false,
                size: 1024,
                mtime: new Date('2024-01-01'),
            } as any);

            const result = await service.loadFolderChildren(mockPath);

            expect(result).toHaveLength(2);
            expect(result.find(f => f.name === '.hidden')).toBeUndefined();
            expect(result.find(f => f.name === '.DS_Store')).toBeUndefined();
            expect(result.find(f => f.name === 'file1.txt')).toBeDefined();
            expect(result.find(f => f.name === 'visible.pdf')).toBeDefined();
        });

        it('should handle empty folders', async () => {
            const mockPath = '/Users/test/empty';

            vi.mocked(fs.readdir).mockResolvedValueOnce([] as any);

            const result = await service.loadFolderChildren(mockPath);

            expect(result).toEqual([]);
        });

        it('should handle read errors', async () => {
            const mockPath = '/Users/test/nopermission';

            vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('Permission denied'));

            await expect(service.loadFolderChildren(mockPath)).rejects.toThrow('Permission denied');
        });

        it('should skip files that fail stat', async () => {
            const mockPath = '/Users/test/folder';
            const mockFiles = [
                { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
                { name: 'broken-file.txt', isDirectory: () => false, isFile: () => true },
                { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
            ];

            vi.mocked(fs.readdir).mockResolvedValueOnce(mockFiles as any);

            vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
                const name = path.basename(filePath);
                if (name === 'broken-file.txt') {
                    throw new Error('Stat error');
                }
                return {
                    isFile: () => true,
                    isDirectory: () => false,
                    size: 1024,
                    mtime: new Date('2024-01-01'),
                } as any;
            });

            const result = await service.loadFolderChildren(mockPath);

            expect(result).toHaveLength(2);
            expect(result.map(f => f.name)).toEqual(['file1.txt', 'file2.txt']);
        });

        it('should handle various file types', async () => {
            const mockPath = '/Users/test/mixed';
            const mockFiles = [
                { name: 'document.pdf', isDirectory: () => false, isFile: () => true },
                { name: 'image.png', isDirectory: () => false, isFile: () => true },
                { name: 'video.mp4', isDirectory: () => false, isFile: () => true },
                { name: 'archive.zip', isDirectory: () => false, isFile: () => true },
                { name: 'subfolder', isDirectory: () => true, isFile: () => false },
            ];

            vi.mocked(fs.readdir).mockResolvedValueOnce(mockFiles as any);

            vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
                const name = path.basename(filePath);
                return {
                    isFile: () => name !== 'subfolder',
                    isDirectory: () => name === 'subfolder',
                    size: 5000,
                    mtime: new Date('2024-01-01'),
                } as any;
            });

            const result = await service.loadFolderChildren(mockPath);

            expect(result).toHaveLength(5);
            expect(result.filter(f => f.type === 'file')).toHaveLength(4);
            expect(result.filter(f => f.type === 'folder')).toHaveLength(1);
        });

        it('should handle folders with special characters in names', async () => {
            const mockPath = '/Users/test/folder';
            const mockFiles = [
                { name: 'file (1).txt', isDirectory: () => false, isFile: () => true },
                { name: 'file [backup].txt', isDirectory: () => false, isFile: () => true },
                { name: 'file & folder', isDirectory: () => false, isFile: () => true },
            ];

            vi.mocked(fs.readdir).mockResolvedValueOnce(mockFiles as any);

            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                isDirectory: () => false,
                size: 1024,
                mtime: new Date('2024-01-01'),
            } as any);

            const result = await service.loadFolderChildren(mockPath);

            expect(result).toHaveLength(3);
            expect(result.map(f => f.name)).toEqual(['file (1).txt', 'file [backup].txt', 'file & folder']);
        });
    });

    describe('createSecurityBookmark', () => {
        it('should create security bookmark for path', async () => {
            const result = await service.createSecurityBookmark('/some/path');

            expect(result).toBe('/some/path');
        });

        it('should handle macOS platform', async () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'darwin' });

            const result = await service.createSecurityBookmark('/some/path');
            expect(result).toBe('/some/path');

            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });
    });

    describe('resolveSecurityBookmark', () => {
        it('should resolve security bookmark to path', async () => {
            vi.mocked(fs.access).mockResolvedValueOnce(undefined);

            const result = await service.resolveSecurityBookmark('/some/path');

            expect(result).toBe('/some/path');
        });

        it('should return null if path does not exist', async () => {
            vi.mocked(fs.access).mockRejectedValueOnce(new Error('Not found'));

            const result = await service.resolveSecurityBookmark('/invalid/path');

            expect(result).toBeNull();
        });
    });

    describe('watchFolder', () => {
        it('should return cleanup function', () => {
            const cleanup = service.watchFolder('/some/path', vi.fn());

            expect(typeof cleanup).toBe('function');

            cleanup();
        });

        it('should handle watch errors', () => {
            const callback = vi.fn();
            const cleanup = service.watchFolder('/invalid/path', callback);

            expect(typeof cleanup).toBe('function');
            cleanup();
        });
    });
});
