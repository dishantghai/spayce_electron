/**
 * Pre-flight Checks
 * 
 * These tests run BEFORE starting the development server to catch
 * configuration issues early. They're designed to be fast and catch
 * the most common setup problems.
 * 
 * CRITICAL: Run these before `pnpm dev` to catch issues early.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import {
    WORKSPACE_ROOT,
    DESKTOP_ROOT,
    DIST_DIR,
    findNativeModule,
    getElectronArch,
} from '../setup/test-utils';

describe('Pre-flight Checks', () => {
    describe('Environment', () => {
        it('should have Node.js >= 18', () => {
            const version = process.version;
            const major = parseInt(version.slice(1).split('.')[0], 10);
            expect(major).toBeGreaterThanOrEqual(18);
        });

        it('should have pnpm installed', () => {
            try {
                const version = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
                expect(version).toMatch(/^\d+\.\d+/);
            } catch {
                throw new Error('pnpm is not installed. Install with: npm install -g pnpm');
            }
        });

        it('should be running from correct workspace root', () => {
            expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'pnpm-workspace.yaml'))).toBe(true);
        });
    });

    describe('Dependencies', () => {
        it('should have node_modules installed at workspace root', () => {
            expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'node_modules'))).toBe(true);
        });

        it('should have electron installed', () => {
            const electronPath = path.join(WORKSPACE_ROOT, 'node_modules', 'electron');
            const desktopElectronPath = path.join(DESKTOP_ROOT, 'node_modules', 'electron');

            const hasElectron = fs.existsSync(electronPath) || fs.existsSync(desktopElectronPath);
            expect(hasElectron).toBe(true);
        });

        it('should have better-sqlite3 installed', () => {
            const moduleInfo = findNativeModule('better-sqlite3');
            expect(moduleInfo.exists).toBe(true);
        });

        it('should have vite installed', () => {
            const vitePath = path.join(WORKSPACE_ROOT, 'node_modules', 'vite');
            const desktopVitePath = path.join(DESKTOP_ROOT, 'node_modules', 'vite');

            const hasVite = fs.existsSync(vitePath) || fs.existsSync(desktopVitePath);
            expect(hasVite).toBe(true);
        });

        it('should have esbuild installed', () => {
            const esbuildPath = path.join(WORKSPACE_ROOT, 'node_modules', 'esbuild');
            const desktopEsbuildPath = path.join(DESKTOP_ROOT, 'node_modules', 'esbuild');

            const hasEsbuild = fs.existsSync(esbuildPath) || fs.existsSync(desktopEsbuildPath);
            expect(hasEsbuild).toBe(true);
        });
    });

    describe('Native Module Architecture', () => {
        const systemArch = os.arch();
        const systemPlatform = os.platform();

        it('should have native modules for correct architecture', () => {
            if (systemPlatform === 'darwin' && systemArch === 'arm64') {
                const moduleInfo = findNativeModule('better-sqlite3');
                if (moduleInfo.exists && moduleInfo.architecture) {
                    expect(moduleInfo.architecture).toBe('arm64');
                }
            }
        });

        it('should match Electron expected architecture', () => {
            const expectedArch = getElectronArch();
            const moduleInfo = findNativeModule('better-sqlite3');

            if (moduleInfo.exists && moduleInfo.architecture) {
                expect(moduleInfo.architecture).toBe(expectedArch);
            }
        });
    });

    describe('Database', () => {
        it('should have development database file', () => {
            const dbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');
            expect(fs.existsSync(dbPath)).toBe(true);
        });

        it('should have valid SQLite database', () => {
            const dbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');

            // Check SQLite magic header
            const buffer = Buffer.alloc(16);
            const fd = fs.openSync(dbPath, 'r');
            fs.readSync(fd, buffer, 0, 16, 0);
            fs.closeSync(fd);

            expect(buffer.toString('utf-8', 0, 15)).toBe('SQLite format 3');
        });
    });

    describe('Source Files', () => {
        it('should have main process entry', () => {
            expect(fs.existsSync(path.join(DESKTOP_ROOT, 'src', 'main', 'index.ts'))).toBe(true);
        });

        it('should have preload script', () => {
            expect(fs.existsSync(path.join(DESKTOP_ROOT, 'src', 'preload', 'index.ts'))).toBe(true);
        });

        it('should have build script', () => {
            expect(fs.existsSync(path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'))).toBe(true);
        });

        it('should have vite config', () => {
            expect(fs.existsSync(path.join(DESKTOP_ROOT, 'vite.config.ts'))).toBe(true);
        });
    });

    describe('Package Configuration', () => {
        it('should have correct main entry in package.json', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.main).toBe('./dist/main.cjs');
        });

        it('should have dev script', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.scripts.dev).toBeDefined();
        });

        it('should have build:main script', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.scripts['build:main']).toBeDefined();
        });
    });

    describe('Build Artifacts (if present)', () => {
        it('should validate dist/main.cjs if it exists', () => {
            const mainPath = path.join(DIST_DIR, 'main.cjs');
            if (fs.existsSync(mainPath)) {
                const content = fs.readFileSync(mainPath, 'utf-8');
                // Should be CommonJS, not ESM
                expect(content).not.toMatch(/^import\s+.*from\s+['"][^'"]+['"]/m);
                expect(content).not.toMatch(/^export\s+(default|const|function|class)/m);
            }
        });

        it('should validate dist/preload.cjs if it exists', () => {
            const preloadPath = path.join(DIST_DIR, 'preload.cjs');
            if (fs.existsSync(preloadPath)) {
                const content = fs.readFileSync(preloadPath, 'utf-8');
                // Should be CommonJS, not ESM
                expect(content).not.toMatch(/^import\s+.*from\s+['"][^'"]+['"]/m);
                expect(content).not.toMatch(/^export\s+(default|const|function|class)/m);
            }
        });
    });
});

describe('Common Pitfalls Detection', () => {
    describe('Module System Configuration', () => {
        it('should have type: module in desktop package.json', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.type).toBe('module');
        });

        it('should use .cjs extension for Electron main entry', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.main).toMatch(/\.cjs$/);
        });
    });

    describe('Build Script Configuration', () => {
        it('should externalize better-sqlite3 in build', () => {
            const buildScript = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'),
                'utf-8'
            );
            expect(buildScript).toContain('better-sqlite3');
            expect(buildScript).toContain('external');
        });

        it('should externalize electron in build', () => {
            const buildScript = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'),
                'utf-8'
            );
            expect(buildScript).toContain("'electron'");
            expect(buildScript).toContain('external');
        });

        it('should output CommonJS format', () => {
            const buildScript = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'),
                'utf-8'
            );
            expect(buildScript).toContain("format: 'cjs'");
        });
    });

    describe('Electron Security Configuration', () => {
        it('should have contextIsolation enabled', () => {
            const windowTs = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts'),
                'utf-8'
            );
            expect(windowTs).toContain('contextIsolation: true');
        });

        it('should have nodeIntegration disabled', () => {
            const windowTs = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts'),
                'utf-8'
            );
            expect(windowTs).toContain('nodeIntegration: false');
        });
    });
});
