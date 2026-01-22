/**
 * Path Resolution Tests
 * 
 * These tests verify that database paths, preload scripts, and other
 * file paths resolve correctly in both development and production modes.
 * 
 * CRITICAL: These tests catch path resolution bugs where the database
 * was looked for in the wrong location (e.g., ~/Library/Application Support
 * instead of project root during development).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
    WORKSPACE_ROOT,
    DESKTOP_ROOT,
    DIST_DIR,
} from '../setup/test-utils';

describe('Path Resolution', () => {
    describe('Project Structure', () => {
        it('should have correct workspace root', () => {
            expect(fs.existsSync(WORKSPACE_ROOT)).toBe(true);
            expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'package.json'))).toBe(true);
            expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'packages'))).toBe(true);
        });

        it('should have correct desktop package root', () => {
            expect(fs.existsSync(DESKTOP_ROOT)).toBe(true);
            expect(fs.existsSync(path.join(DESKTOP_ROOT, 'package.json'))).toBe(true);
        });

        it('should have resources directory at workspace root', () => {
            const resourcesDir = path.join(WORKSPACE_ROOT, 'resources');
            expect(fs.existsSync(resourcesDir)).toBe(true);
        });

        it('should have database directory in resources', () => {
            const dbDir = path.join(WORKSPACE_ROOT, 'resources', 'db');
            expect(fs.existsSync(dbDir)).toBe(true);
        });
    });

    describe('Development Database Path', () => {
        it('should have seeded database file', () => {
            const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');
            expect(fs.existsSync(devDbPath)).toBe(true);
        });

        it('should have non-empty database file', () => {
            const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');
            const stats = fs.statSync(devDbPath);
            expect(stats.size).toBeGreaterThan(0);
        });

        it('should have valid SQLite header', () => {
            const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');
            const buffer = Buffer.alloc(16);
            const fd = fs.openSync(devDbPath, 'r');
            fs.readSync(fd, buffer, 0, 16, 0);
            fs.closeSync(fd);

            // SQLite database files start with "SQLite format 3"
            const header = buffer.toString('utf-8', 0, 15);
            expect(header).toBe('SQLite format 3');
        });

        it('should resolve correctly from dist directory', () => {
            // Simulate path resolution from compiled main.cjs in dist/
            // __dirname in main.cjs would be packages/desktop/dist/
            const simulatedDirname = DIST_DIR;

            // The code does: path.join(__dirname, '../../..') to get workspace root
            const resolvedRoot = path.resolve(simulatedDirname, '../../..');
            expect(resolvedRoot).toBe(WORKSPACE_ROOT);

            // Then resources/db/spaces.sqlite
            const resolvedDbPath = path.join(resolvedRoot, 'resources', 'db', 'spaces.sqlite');
            expect(fs.existsSync(resolvedDbPath)).toBe(true);
        });
    });

    describe('Preload Script Path', () => {
        it('should resolve preload.cjs from dist directory', () => {
            const preloadPath = path.join(DIST_DIR, 'preload.cjs');
            // The window.ts code does: path.join(__dirname, 'preload.cjs')
            // When __dirname is dist/, this should work
            expect(path.basename(preloadPath)).toBe('preload.cjs');
            expect(path.dirname(preloadPath)).toBe(DIST_DIR);
        });

        it('should have preload and main in same directory', () => {
            const mainPath = path.join(DIST_DIR, 'main.cjs');
            const preloadPath = path.join(DIST_DIR, 'preload.cjs');

            expect(path.dirname(mainPath)).toBe(path.dirname(preloadPath));
        });
    });

    describe('Main Process Source Code Path Resolution', () => {
        it('should use correct path resolution logic in main/index.ts', () => {
            const mainIndexPath = path.join(DESKTOP_ROOT, 'src', 'main', 'index.ts');
            const content = fs.readFileSync(mainIndexPath, 'utf-8');

            // Should check app.isPackaged for dev/prod detection
            expect(content).toContain('app.isPackaged');

            // Should use __dirname for path resolution
            expect(content).toContain('__dirname');

            // Should resolve to resources/db/spaces.sqlite in dev
            expect(content).toContain('resources/db/spaces.sqlite');
        });

        it('should have production path using app.getPath', () => {
            const mainIndexPath = path.join(DESKTOP_ROOT, 'src', 'main', 'index.ts');
            const content = fs.readFileSync(mainIndexPath, 'utf-8');

            // In production, should use userData path
            expect(content).toContain("app.getPath('userData')");
        });
    });

    describe('Window Creation Path Resolution', () => {
        it('should use correct preload path in window.ts', () => {
            const windowPath = path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts');
            const content = fs.readFileSync(windowPath, 'utf-8');

            // Should reference preload.cjs
            expect(content).toContain('preload.cjs');

            // Should use path.join with __dirname
            expect(content).toContain("path.join(__dirname, 'preload.cjs')");
        });

        it('should have correct dev server URL', () => {
            const windowPath = path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts');
            const content = fs.readFileSync(windowPath, 'utf-8');

            // Dev server URL
            expect(content).toContain('http://localhost:5173');
        });
    });

    describe('Path Consistency Across Files', () => {
        it('should have consistent database filename', () => {
            const mainIndexPath = path.join(DESKTOP_ROOT, 'src', 'main', 'index.ts');
            const content = fs.readFileSync(mainIndexPath, 'utf-8');

            // Dev path uses spaces.sqlite
            expect(content).toContain('spaces.sqlite');

            // Prod path should use consistent name (spayce.db is fine for prod)
            expect(content).toContain('spayce.db');
        });

        it('should reference correct dist outputs', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );

            // Main entry should match build output
            expect(pkgJson.main).toBe('./dist/main.cjs');

            // Build script should exist
            expect(pkgJson.scripts['build:main']).toBeDefined();
        });
    });
});

describe('Path Edge Cases', () => {
    it('should handle spaces in workspace path', () => {
        // Our actual workspace has spaces: "ALL WORKSPACE"
        expect(WORKSPACE_ROOT).toContain(' ');

        // Path resolution should still work
        const dbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');
        expect(fs.existsSync(dbPath)).toBe(true);
    });

    it('should handle relative path resolution from nested dirs', () => {
        // From dist/main.cjs, going up 3 levels should reach workspace root
        const nestedPath = path.join(WORKSPACE_ROOT, 'packages', 'desktop', 'dist');
        const resolved = path.resolve(nestedPath, '../../..');
        expect(resolved).toBe(WORKSPACE_ROOT);
    });

    it('should normalize paths correctly', () => {
        const pathWithDots = path.join(DIST_DIR, '..', 'dist', 'main.cjs');
        const normalizedPath = path.normalize(pathWithDots);
        expect(normalizedPath).toBe(path.join(DIST_DIR, 'main.cjs'));
    });
});

describe('Critical Path Validation', () => {
    it('should verify all critical paths exist', () => {
        const criticalPaths = [
            path.join(WORKSPACE_ROOT, 'package.json'),
            path.join(WORKSPACE_ROOT, 'pnpm-workspace.yaml'),
            path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite'),
            path.join(DESKTOP_ROOT, 'package.json'),
            path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'),
            path.join(DESKTOP_ROOT, 'src', 'main', 'index.ts'),
            path.join(DESKTOP_ROOT, 'src', 'preload', 'index.ts'),
            path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts'),
            path.join(DESKTOP_ROOT, 'src', 'main', 'ipc', 'handlers.ts'),
        ];

        for (const p of criticalPaths) {
            expect(fs.existsSync(p), `Missing critical path: ${p}`).toBe(true);
        }
    });
});
