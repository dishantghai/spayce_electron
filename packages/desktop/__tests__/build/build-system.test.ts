/**
 * Build System Health Tests
 * 
 * These tests verify that the esbuild compilation process works correctly
 * and produces valid output that Electron can load.
 * 
 * CRITICAL: These tests catch the ERR_UNKNOWN_FILE_EXTENSION errors we faced
 * when Electron tried to load TypeScript files directly.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
    DESKTOP_ROOT,
    DIST_DIR,
    checkBuildOutputs,
    validateCommonJsOutput,
} from '../setup/test-utils';

describe('Build System Health', () => {
    describe('Build Script Existence', () => {
        it('should have build-main.js script', () => {
            const buildScript = path.join(DESKTOP_ROOT, 'scripts', 'build-main.js');
            expect(fs.existsSync(buildScript)).toBe(true);
        });

        it('should have esbuild as dependency', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.devDependencies?.esbuild || pkgJson.dependencies?.esbuild).toBeDefined();
        });

        it('should have correct main entry point in package.json', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.main).toBe('./dist/main.cjs');
        });

        it('should have build:main script in package.json', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.scripts['build:main']).toBeDefined();
            expect(pkgJson.scripts['build:main']).toContain('build-main.js');
        });
    });

    describe('Source Files', () => {
        it('should have main process entry point', () => {
            const mainEntry = path.join(DESKTOP_ROOT, 'src', 'main', 'index.ts');
            expect(fs.existsSync(mainEntry)).toBe(true);
        });

        it('should have preload script entry point', () => {
            const preloadEntry = path.join(DESKTOP_ROOT, 'src', 'preload', 'index.ts');
            expect(fs.existsSync(preloadEntry)).toBe(true);
        });

        it('should have IPC handlers', () => {
            const handlersPath = path.join(DESKTOP_ROOT, 'src', 'main', 'ipc', 'handlers.ts');
            expect(fs.existsSync(handlersPath)).toBe(true);
        });

        it('should have window creation module', () => {
            const windowPath = path.join(DESKTOP_ROOT, 'src', 'main', 'window.ts');
            expect(fs.existsSync(windowPath)).toBe(true);
        });
    });

    describe('Build Execution', () => {
        beforeAll(() => {
            // Run the build before these tests
            try {
                execSync('pnpm build:main', {
                    cwd: DESKTOP_ROOT,
                    stdio: 'pipe',
                    timeout: 30000,
                });
            } catch (error) {
                console.error('Build failed during test setup:', error);
                throw error;
            }
        }, 60000);

        it('should produce main.cjs output', () => {
            const outputs = checkBuildOutputs();
            expect(outputs.mainExists).toBe(true);
            expect(outputs.mainSize).toBeGreaterThan(1000); // Should be a substantial file
        });

        it('should produce preload.cjs output', () => {
            const outputs = checkBuildOutputs();
            expect(outputs.preloadExists).toBe(true);
            expect(outputs.preloadSize).toBeGreaterThan(500);
        });

        it('should produce source maps for main.cjs', () => {
            const sourceMapPath = path.join(DIST_DIR, 'main.cjs.map');
            expect(fs.existsSync(sourceMapPath)).toBe(true);
        });

        it('should produce source maps for preload.cjs', () => {
            const sourceMapPath = path.join(DIST_DIR, 'preload.cjs.map');
            expect(fs.existsSync(sourceMapPath)).toBe(true);
        });

        it('should produce valid CommonJS output for main.cjs', () => {
            const mainPath = path.join(DIST_DIR, 'main.cjs');
            const validation = validateCommonJsOutput(mainPath);
            expect(validation.valid).toBe(true);
            if (!validation.valid) {
                console.error('main.cjs validation errors:', validation.errors);
            }
        });

        it('should produce valid CommonJS output for preload.cjs', () => {
            const preloadPath = path.join(DIST_DIR, 'preload.cjs');
            const validation = validateCommonJsOutput(preloadPath);
            expect(validation.valid).toBe(true);
            if (!validation.valid) {
                console.error('preload.cjs validation errors:', validation.errors);
            }
        });

        it('should bundle workspace dependencies correctly', () => {
            const mainContent = fs.readFileSync(path.join(DIST_DIR, 'main.cjs'), 'utf-8');

            // Should NOT have unresolved workspace imports
            expect(mainContent).not.toMatch(/require\(['"]@spayce\/core['"]\)/);
            expect(mainContent).not.toMatch(/require\(['"]@spayce\/infrastructure['"]\)/);

            // The code from these packages should be bundled in
            // Check for characteristic code from each package
            expect(mainContent).toContain('ServiceBootstrap'); // From infrastructure
        });

        it('should externalize better-sqlite3', () => {
            const mainContent = fs.readFileSync(path.join(DIST_DIR, 'main.cjs'), 'utf-8');

            // better-sqlite3 should be external (require call preserved)
            expect(mainContent).toMatch(/require\(['"]better-sqlite3['"]\)/);
        });

        it('should externalize electron', () => {
            const mainContent = fs.readFileSync(path.join(DIST_DIR, 'main.cjs'), 'utf-8');

            // electron should be external
            expect(mainContent).toMatch(/require\(['"]electron['"]\)/);
        });
    });

    describe('Build Configuration', () => {
        it('should configure esbuild for Node.js platform', () => {
            const buildScript = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'),
                'utf-8'
            );
            expect(buildScript).toContain("platform: 'node'");
        });

        it('should configure esbuild for CommonJS format', () => {
            const buildScript = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'),
                'utf-8'
            );
            expect(buildScript).toContain("format: 'cjs'");
        });

        it('should configure workspace aliases', () => {
            const buildScript = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'),
                'utf-8'
            );
            expect(buildScript).toContain('@spayce/core');
            expect(buildScript).toContain('@spayce/infrastructure');
        });

        it('should have sourcemap enabled', () => {
            const buildScript = fs.readFileSync(
                path.join(DESKTOP_ROOT, 'scripts', 'build-main.js'),
                'utf-8'
            );
            expect(buildScript).toContain('sourcemap: true');
        });
    });

    describe('Package.json Module Configuration', () => {
        it('should have type: module for ESM source files', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            expect(pkgJson.type).toBe('module');
        });

        it('should use .cjs extension for CommonJS outputs', () => {
            const pkgJson = JSON.parse(
                fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8')
            );
            // Main entry should end with .cjs to work with "type": "module"
            expect(pkgJson.main).toMatch(/\.cjs$/);
        });
    });
});

describe('Build Failure Scenarios', () => {
    it('should detect TypeScript source files (not compiled JS)', () => {
        const mainEntry = path.join(DESKTOP_ROOT, 'src', 'main', 'index.ts');
        const content = fs.readFileSync(mainEntry, 'utf-8');

        // Verify this is TypeScript (has type annotations)
        expect(content).toMatch(/:\s*(string|number|boolean|BrowserWindow|void)/);
    });

    it('should not have compiled JS in src directory', () => {
        const srcDir = path.join(DESKTOP_ROOT, 'src');
        const jsFiles = findJsFilesRecursive(srcDir);

        // There should be no .js files in src (only .ts/.tsx)
        const nonDeclarationJs = jsFiles.filter(f => !f.endsWith('.d.ts'));
        expect(nonDeclarationJs).toHaveLength(0);
    });
});

function findJsFilesRecursive(dir: string): string[] {
    const results: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results.push(...findJsFilesRecursive(fullPath));
        } else if (item.name.endsWith('.js')) {
            results.push(fullPath);
        }
    }

    return results;
}
