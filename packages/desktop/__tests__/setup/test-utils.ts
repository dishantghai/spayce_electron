/**
 * Test utilities for desktop package tests
 * Provides helpers for testing Electron main process code
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync, spawn, ChildProcess } from 'child_process';

// ============================================================================
// PATH UTILITIES
// ============================================================================

export const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');
export const DESKTOP_ROOT = path.resolve(__dirname, '../..');
export const DIST_DIR = path.join(DESKTOP_ROOT, 'dist');

export function getTestDbPath(): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spayce-test-'));
    return path.join(tempDir, 'test.sqlite');
}

export function cleanupTestDb(dbPath: string): void {
    try {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
        const dir = path.dirname(dbPath);
        if (fs.existsSync(dir)) {
            fs.rmdirSync(dir);
        }
    } catch {
        // Ignore cleanup errors
    }
}

// ============================================================================
// BUILD VERIFICATION
// ============================================================================

export interface BuildOutput {
    mainExists: boolean;
    preloadExists: boolean;
    mainPath: string;
    preloadPath: string;
    mainSize: number;
    preloadSize: number;
}

export function checkBuildOutputs(): BuildOutput {
    const mainPath = path.join(DIST_DIR, 'main.cjs');
    const preloadPath = path.join(DIST_DIR, 'preload.cjs');

    const mainExists = fs.existsSync(mainPath);
    const preloadExists = fs.existsSync(preloadPath);

    return {
        mainExists,
        preloadExists,
        mainPath,
        preloadPath,
        mainSize: mainExists ? fs.statSync(mainPath).size : 0,
        preloadSize: preloadExists ? fs.statSync(preloadPath).size : 0,
    };
}

export function validateCommonJsOutput(filePath: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fs.existsSync(filePath)) {
        return { valid: false, errors: ['File does not exist'] };
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for CommonJS markers
    if (!content.includes('require(') && !content.includes('module.exports') && !content.includes('exports.')) {
        // Could be bundled differently, check for IIFE or other patterns
        if (!content.includes('__commonJS') && !content.includes('__toCommonJS')) {
            errors.push('No CommonJS markers found (require, module.exports, or esbuild CommonJS helpers)');
        }
    }

    // Check for problematic ESM syntax that would break in Electron
    if (content.match(/^import\s+.*from\s+['"][^'"]+['"]/m)) {
        errors.push('Contains ESM import statements - will fail in Electron CJS context');
    }
    if (content.match(/^export\s+(default|const|function|class)/m)) {
        errors.push('Contains ESM export statements - will fail in Electron CJS context');
    }

    // Check for source maps
    const hasSourceMap = content.includes('//# sourceMappingURL=');
    if (!hasSourceMap) {
        errors.push('No source map reference found');
    }

    return { valid: errors.length === 0, errors };
}

// ============================================================================
// NATIVE MODULE VERIFICATION
// ============================================================================

export interface NativeModuleInfo {
    path: string;
    exists: boolean;
    architecture: string | null;
    error: string | null;
}

export function findNativeModule(moduleName: string): NativeModuleInfo {
    const possiblePaths = [
        path.join(WORKSPACE_ROOT, 'node_modules', moduleName),
        path.join(DESKTOP_ROOT, 'node_modules', moduleName),
        path.join(WORKSPACE_ROOT, 'node_modules/.pnpm', `${moduleName}@*`, 'node_modules', moduleName),
    ];

    for (const modulePath of possiblePaths) {
        if (fs.existsSync(modulePath)) {
            // Look for the .node file
            const buildReleasePath = path.join(modulePath, 'build', 'Release');
            if (fs.existsSync(buildReleasePath)) {
                const nodeFiles = fs.readdirSync(buildReleasePath).filter(f => f.endsWith('.node'));
                if (nodeFiles.length > 0) {
                    const nodeFile = path.join(buildReleasePath, nodeFiles[0]);
                    try {
                        const fileOutput = execSync(`file "${nodeFile}"`, { encoding: 'utf-8' });
                        const architecture = fileOutput.includes('arm64') ? 'arm64' :
                            fileOutput.includes('x86_64') ? 'x64' : 'unknown';
                        return {
                            path: nodeFile,
                            exists: true,
                            architecture,
                            error: null,
                        };
                    } catch (e) {
                        return {
                            path: nodeFile,
                            exists: true,
                            architecture: null,
                            error: `Failed to determine architecture: ${e}`,
                        };
                    }
                }
            }
            // Also check prebuilds
            const prebuildsPath = path.join(modulePath, 'prebuilds');
            if (fs.existsSync(prebuildsPath)) {
                const platforms = fs.readdirSync(prebuildsPath);
                const darwinArm64 = platforms.find(p => p.includes('darwin') && p.includes('arm64'));
                if (darwinArm64) {
                    return {
                        path: path.join(prebuildsPath, darwinArm64),
                        exists: true,
                        architecture: 'arm64',
                        error: null,
                    };
                }
            }
        }
    }

    return {
        path: '',
        exists: false,
        architecture: null,
        error: 'Native module not found in any expected location',
    };
}

export function getElectronArch(): string {
    const platform = os.platform();

    // On macOS, we need to detect the actual hardware architecture
    // os.arch() returns 'x64' when Node.js runs under Rosetta on Apple Silicon
    if (platform === 'darwin') {
        try {
            // Use sysctl to get the actual CPU architecture
            const cpuBrand = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf-8' });
            if (cpuBrand.includes('Apple')) {
                return 'arm64'; // Apple Silicon
            }
        } catch {
            // Fallback to uname
            try {
                const uname = execSync('uname -m', { encoding: 'utf-8' }).trim();
                if (uname === 'arm64') {
                    return 'arm64';
                }
            } catch {
                // Ignore
            }
        }
    }

    return os.arch();
}

// ============================================================================
// DATABASE VERIFICATION
// ============================================================================

export function verifyDatabaseSchema(dbPath: string): { valid: boolean; tables: string[]; errors: string[] } {
    const errors: string[] = [];
    const tables: string[] = [];

    try {
        // Use better-sqlite3 directly to check schema
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);

        const tableRows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
        tables.push(...tableRows.map(r => r.name));

        // Check required tables
        const requiredTables = ['spaces', 'space_items'];
        for (const table of requiredTables) {
            if (!tables.includes(table)) {
                errors.push(`Missing required table: ${table}`);
            }
        }

        db.close();
    } catch (e) {
        errors.push(`Failed to verify database: ${e}`);
    }

    return {
        valid: errors.length === 0,
        tables,
        errors,
    };
}

// ============================================================================
// ELECTRON PROCESS VERIFICATION
// ============================================================================

export interface ElectronStartResult {
    success: boolean;
    output: string;
    error: string;
    process: ChildProcess | null;
}

export async function startElectronWithTimeout(timeoutMs: number = 5000): Promise<ElectronStartResult> {
    return new Promise((resolve) => {
        let output = '';
        let error = '';
        let resolved = false;

        const electronPath = path.join(DESKTOP_ROOT, 'node_modules', '.bin', 'electron');
        const mainPath = path.join(DIST_DIR, 'main.cjs');

        if (!fs.existsSync(mainPath)) {
            resolve({
                success: false,
                output: '',
                error: 'main.cjs not found - build first',
                process: null,
            });
            return;
        }

        const proc = spawn(electronPath, [mainPath], {
            cwd: DESKTOP_ROOT,
            env: {
                ...process.env,
                ELECTRON_RUN_AS_NODE: undefined, // Ensure Electron runs normally
                NODE_ENV: 'test',
            },
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        proc.stdout?.on('data', (data) => {
            output += data.toString();
            // Check for successful startup indicators
            if (output.includes('[Spayce] Services initialized') || output.includes('IPC handlers registered')) {
                if (!resolved) {
                    resolved = true;
                    resolve({ success: true, output, error, process: proc });
                }
            }
        });

        proc.stderr?.on('data', (data) => {
            error += data.toString();
        });

        proc.on('error', (err) => {
            if (!resolved) {
                resolved = true;
                resolve({ success: false, output, error: err.message, process: null });
            }
        });

        proc.on('exit', (code) => {
            if (!resolved) {
                resolved = true;
                resolve({
                    success: code === 0,
                    output,
                    error: error || `Process exited with code ${code}`,
                    process: null,
                });
            }
        });

        // Timeout
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                proc.kill();
                resolve({
                    success: false,
                    output,
                    error: `Timeout after ${timeoutMs}ms. Output: ${output}. Stderr: ${error}`,
                    process: null,
                });
            }
        }, timeoutMs);
    });
}

// ============================================================================
// IPC TESTING UTILITIES
// ============================================================================

export interface IpcChannel {
    name: string;
    type: 'handle' | 'on' | 'send';
}

export const EXPECTED_IPC_CHANNELS: IpcChannel[] = [
    { name: 'spaces:getAll', type: 'handle' },
    { name: 'spaces:create', type: 'handle' },
    { name: 'spaces:delete', type: 'handle' },
    { name: 'spaces:rename', type: 'handle' },
    { name: 'spaces:update', type: 'handle' },
    { name: 'spaces:reorder', type: 'handle' },
    { name: 'items:getBySpace', type: 'handle' },
    { name: 'items:create', type: 'handle' },
    { name: 'items:delete', type: 'handle' },
    { name: 'items:move', type: 'handle' },
    { name: 'items:rename', type: 'handle' },
    { name: 'search:items', type: 'handle' },
    { name: 'search:recent', type: 'handle' },
    { name: 'search:mostVisited', type: 'handle' },
    { name: 'app:getVersion', type: 'handle' },
    { name: 'app:getPlatform', type: 'handle' },
];

export function extractIpcChannelsFromSource(sourceFile: string): string[] {
    const content = fs.readFileSync(sourceFile, 'utf-8');
    const channels: string[] = [];

    // Match ipcMain.handle('channel:name', ...)
    const handleMatches = content.matchAll(/ipcMain\.handle\(['"]([^'"]+)['"]/g);
    for (const match of handleMatches) {
        channels.push(match[1]);
    }

    // Match ipcRenderer.invoke('channel:name', ...)
    const invokeMatches = content.matchAll(/ipcRenderer\.invoke\(['"]([^'"]+)['"]/g);
    for (const match of invokeMatches) {
        if (!channels.includes(match[1])) {
            channels.push(match[1]);
        }
    }

    return channels;
}
