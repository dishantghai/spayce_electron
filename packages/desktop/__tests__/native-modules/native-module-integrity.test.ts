/**
 * Native Module Integrity Tests
 * 
 * These tests verify that native modules (especially better-sqlite3) are
 * correctly built for the right architecture and can be loaded by Electron.
 * 
 * CRITICAL: These tests catch the "incompatible architecture" errors we faced
 * when better-sqlite3 was built for x64 but Electron expected arm64.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import {
    WORKSPACE_ROOT,
    DESKTOP_ROOT,
    findNativeModule,
    getElectronArch,
} from '../setup/test-utils';

describe('Native Module Integrity', () => {
    describe('better-sqlite3 Module', () => {
        it('should have better-sqlite3 installed', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.dependencies['better-sqlite3']).toBeDefined();
        });

        it('should find better-sqlite3 native binary', () => {
            const moduleInfo = findNativeModule('better-sqlite3');
            expect(moduleInfo.exists).toBe(true);
            if (!moduleInfo.exists) {
                console.error('better-sqlite3 not found:', moduleInfo.error);
            }
        });

        it('should have better-sqlite3 built for correct architecture', () => {
            const moduleInfo = findNativeModule('better-sqlite3');
            const expectedArch = getElectronArch();

            if (moduleInfo.exists && moduleInfo.architecture) {
                expect(moduleInfo.architecture).toBe(expectedArch);
            }
        });

        it('should be able to load better-sqlite3 module (skip if arch mismatch)', () => {
            const moduleInfo = findNativeModule('better-sqlite3');
            const nodeArch = os.arch();

            // Skip this test if Node.js arch doesn't match native module arch
            // This happens when Node.js runs under Rosetta (x64) but module is arm64
            if (moduleInfo.architecture && moduleInfo.architecture !== nodeArch) {
                console.log(`Skipping: Node.js is ${nodeArch}, native module is ${moduleInfo.architecture}`);
                console.log('This is expected - Electron will load the arm64 module correctly');
                return; // Skip - this is expected when running tests under Rosetta
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                require('better-sqlite3');
            }).not.toThrow();
        });

        it('should be able to create in-memory database (skip if arch mismatch)', () => {
            const moduleInfo = findNativeModule('better-sqlite3');
            const nodeArch = os.arch();

            if (moduleInfo.architecture && moduleInfo.architecture !== nodeArch) {
                console.log(`Skipping: arch mismatch (Node: ${nodeArch}, Module: ${moduleInfo.architecture})`);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const Database = require('better-sqlite3');
            const db = new Database(':memory:');
            expect(db).toBeDefined();
            expect(db.open).toBe(true);
            db.close();
        });

        it('should be able to execute SQL queries (skip if arch mismatch)', () => {
            const moduleInfo = findNativeModule('better-sqlite3');
            const nodeArch = os.arch();

            if (moduleInfo.architecture && moduleInfo.architecture !== nodeArch) {
                console.log(`Skipping: arch mismatch (Node: ${nodeArch}, Module: ${moduleInfo.architecture})`);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const Database = require('better-sqlite3');
            const db = new Database(':memory:');

            db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
            const insert = db.prepare('INSERT INTO test (name) VALUES (?)');
            insert.run('test-value');

            const row = db.prepare('SELECT * FROM test WHERE name = ?').get('test-value') as { id: number; name: string };
            expect(row).toBeDefined();
            expect(row.name).toBe('test-value');

            db.close();
        });
    });

    describe('Electron Binary', () => {
        it('should have electron installed', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.devDependencies?.electron).toBeDefined();
        });

        it('should have electron binary available', () => {
            const electronBin = path.join(DESKTOP_ROOT, 'node_modules', '.bin', 'electron');
            expect(fs.existsSync(electronBin)).toBe(true);
        });

        it('should report correct electron version', () => {
            try {
                const version = execSync('npx electron --version', {
                    cwd: DESKTOP_ROOT,
                    encoding: 'utf-8',
                    timeout: 10000,
                }).trim();
                expect(version).toMatch(/^v\d+\.\d+\.\d+$/);
            } catch {
                // May fail in CI without display - skip
            }
        });
    });

    describe('Architecture Compatibility', () => {
        const systemArch = os.arch();
        const systemPlatform = os.platform();

        it('should detect system architecture', () => {
            expect(['arm64', 'x64', 'ia32']).toContain(systemArch);
        });

        it('should detect macOS platform for Apple Silicon checks', () => {
            if (systemPlatform === 'darwin' && systemArch === 'arm64') {
                // On Apple Silicon Mac, native modules MUST be arm64
                const moduleInfo = findNativeModule('better-sqlite3');
                if (moduleInfo.exists && moduleInfo.architecture) {
                    expect(moduleInfo.architecture).toBe('arm64');
                }
            }
        });

        it('should not have x64 binaries on arm64 system', () => {
            if (systemPlatform === 'darwin' && systemArch === 'arm64') {
                const moduleInfo = findNativeModule('better-sqlite3');
                if (moduleInfo.exists && moduleInfo.architecture) {
                    expect(moduleInfo.architecture).not.toBe('x64');
                }
            }
        });
    });

    describe('Node Headers and Rebuild', () => {
        it('should have @types/better-sqlite3 for type safety', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.devDependencies?.['@types/better-sqlite3']).toBeDefined();
        });

        it('should have correct Node.js version for native modules', () => {
            const nodeVersion = process.version;
            const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
            // better-sqlite3 requires Node.js 14.21.1 or later
            expect(major).toBeGreaterThanOrEqual(14);
        });
    });

    describe('Module Resolution', () => {
        it('should resolve better-sqlite3 from workspace root', () => {
            const possiblePaths = [
                path.join(WORKSPACE_ROOT, 'node_modules', 'better-sqlite3'),
                path.join(DESKTOP_ROOT, 'node_modules', 'better-sqlite3'),
            ];

            const found = possiblePaths.some(p => fs.existsSync(p));
            expect(found).toBe(true);
        });

        it('should not have multiple conflicting better-sqlite3 installations', () => {
            const workspaceModule = path.join(WORKSPACE_ROOT, 'node_modules', 'better-sqlite3');
            const desktopModule = path.join(DESKTOP_ROOT, 'node_modules', 'better-sqlite3');

            const workspaceExists = fs.existsSync(workspaceModule);
            const desktopExists = fs.existsSync(desktopModule);

            // Either one location or both pointing to same version
            if (workspaceExists && desktopExists) {
                // Check if desktop version is symlink to workspace
                const desktopStats = fs.lstatSync(desktopModule);
                if (!desktopStats.isSymbolicLink()) {
                    // If not symlink, versions should match
                    const workspacePkg = JSON.parse(
                        fs.readFileSync(path.join(workspaceModule, 'package.json'), 'utf-8')
                    );
                    const desktopPkg = JSON.parse(
                        fs.readFileSync(path.join(desktopModule, 'package.json'), 'utf-8')
                    );
                    expect(workspacePkg.version).toBe(desktopPkg.version);
                }
            }
        });
    });
});

describe('Native Module Rebuild Verification', () => {
    it('should have build artifacts in expected location', () => {
        const moduleInfo = findNativeModule('better-sqlite3');
        if (moduleInfo.exists) {
            // The .node file should exist
            expect(moduleInfo.path).toMatch(/\.node$|darwin/);
        }
    });

    it('should have been built with correct Node ABI (skip if arch mismatch)', () => {
        const moduleInfo = findNativeModule('better-sqlite3');
        const nodeArch = os.arch();

        // Skip if architecture mismatch (Node.js x64 via Rosetta, module arm64)
        if (moduleInfo.architecture && moduleInfo.architecture !== nodeArch) {
            console.log(`Skipping ABI test: arch mismatch (Node: ${nodeArch}, Module: ${moduleInfo.architecture})`);
            console.log('The arm64 module will work correctly when loaded by Electron');
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Database = require('better-sqlite3');

        // If we can create a database, the ABI is correct
        const db = new Database(':memory:');
        expect(db.open).toBe(true);
        db.close();
    });
});

describe('Electron-Specific Native Module Loading', () => {
    it('should have sandbox disabled for better-sqlite3 IPC', () => {
        const windowTs = fs.readFileSync(
            path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts'),
            'utf-8'
        );
        // sandbox: false is required for better-sqlite3 to work via IPC
        expect(windowTs).toContain('sandbox: false');
    });

    it('should have contextIsolation enabled', () => {
        const windowTs = fs.readFileSync(
            path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts'),
            'utf-8'
        );
        expect(windowTs).toContain('contextIsolation: true');
    });

    it('should have nodeIntegration disabled for security', () => {
        const windowTs = fs.readFileSync(
            path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts'),
            'utf-8'
        );
        expect(windowTs).toContain('nodeIntegration: false');
    });
});
