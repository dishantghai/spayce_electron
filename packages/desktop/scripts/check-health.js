#!/usr/bin/env node
/**
 * Dependency Health Check Script
 * 
 * Run this script to verify that all dependencies are correctly installed
 * and configured before starting development.
 * 
 * Usage: node scripts/check-health.js
 * 
 * This script catches:
 * - Missing dependencies
 * - Architecture mismatches (arm64 vs x64)
 * - Build output issues
 * - Database configuration problems
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(DESKTOP_ROOT, '../..');
const DIST_DIR = path.join(DESKTOP_ROOT, 'dist');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(color, symbol, message) {
    console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function success(message) {
    log(colors.green, '✓', message);
}

function error(message) {
    log(colors.red, '✗', message);
}

function warning(message) {
    log(colors.yellow, '⚠', message);
}

function info(message) {
    log(colors.blue, 'ℹ', message);
}

function header(message) {
    console.log(`\n${colors.cyan}━━━ ${message} ━━━${colors.reset}\n`);
}

let hasErrors = false;
let hasWarnings = false;

function check(condition, successMsg, errorMsg, isWarning = false) {
    if (condition) {
        success(successMsg);
        return true;
    } else {
        if (isWarning) {
            warning(errorMsg);
            hasWarnings = true;
        } else {
            error(errorMsg);
            hasErrors = true;
        }
        return false;
    }
}

// ============================================================================
// CHECKS
// ============================================================================

function checkEnvironment() {
    header('Environment');

    // Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    check(major >= 18, `Node.js ${nodeVersion}`, `Node.js ${nodeVersion} - Requires >= 18`);

    // pnpm
    try {
        const pnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
        success(`pnpm ${pnpmVersion}`);
    } catch {
        error('pnpm not found - Install with: npm install -g pnpm');
        hasErrors = true;
    }

    // Platform & Architecture
    const platform = os.platform();
    const arch = os.arch();
    info(`Platform: ${platform} (${arch})`);

    if (platform === 'darwin' && arch === 'arm64') {
        info('Running on Apple Silicon - native modules must be arm64');
    }
}

function checkDependencies() {
    header('Dependencies');

    // node_modules
    check(
        fs.existsSync(path.join(WORKSPACE_ROOT, 'node_modules')),
        'Workspace node_modules installed',
        'Workspace node_modules missing - Run: pnpm install'
    );

    // Electron
    const electronExists =
        fs.existsSync(path.join(WORKSPACE_ROOT, 'node_modules', 'electron')) ||
        fs.existsSync(path.join(DESKTOP_ROOT, 'node_modules', 'electron'));
    check(electronExists, 'Electron installed', 'Electron not found - Run: pnpm install');

    // better-sqlite3
    const sqlite3Exists =
        fs.existsSync(path.join(WORKSPACE_ROOT, 'node_modules', 'better-sqlite3')) ||
        fs.existsSync(path.join(DESKTOP_ROOT, 'node_modules', 'better-sqlite3'));
    check(sqlite3Exists, 'better-sqlite3 installed', 'better-sqlite3 not found - Run: pnpm install');

    // esbuild
    const esbuildExists =
        fs.existsSync(path.join(WORKSPACE_ROOT, 'node_modules', 'esbuild')) ||
        fs.existsSync(path.join(DESKTOP_ROOT, 'node_modules', 'esbuild'));
    check(esbuildExists, 'esbuild installed', 'esbuild not found - Run: pnpm install');
}

async function checkNativeModules() {
    header('Native Modules');

    const arch = os.arch();
    const platform = os.platform();

    // Find better-sqlite3 native binary
    const possiblePaths = [
        path.join(WORKSPACE_ROOT, 'node_modules', 'better-sqlite3'),
        path.join(DESKTOP_ROOT, 'node_modules', 'better-sqlite3'),
    ];

    let nativeModulePath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            nativeModulePath = p;
            break;
        }
    }

    if (nativeModulePath) {
        const buildReleasePath = path.join(nativeModulePath, 'build', 'Release');
        if (fs.existsSync(buildReleasePath)) {
            const nodeFiles = fs.readdirSync(buildReleasePath).filter(f => f.endsWith('.node'));
            if (nodeFiles.length > 0) {
                const nodeFile = path.join(buildReleasePath, nodeFiles[0]);
                try {
                    const fileOutput = execSync(`file "${nodeFile}"`, { encoding: 'utf-8' });

                    if (platform === 'darwin' && arch === 'arm64') {
                        if (fileOutput.includes('arm64')) {
                            success('better-sqlite3 native module (arm64)');
                        } else if (fileOutput.includes('x86_64')) {
                            error('better-sqlite3 built for x64 but system is arm64');
                            info('Fix: pnpm rebuild better-sqlite3');
                        }
                    } else {
                        success('better-sqlite3 native module found');
                    }
                } catch (e) {
                    warning('Could not verify native module architecture');
                }
            }
        } else {
            // Check prebuilds
            const prebuildsPath = path.join(nativeModulePath, 'prebuilds');
            if (fs.existsSync(prebuildsPath)) {
                success('better-sqlite3 prebuilds found');
            } else {
                error('better-sqlite3 native binary not found');
                info('Fix: pnpm rebuild better-sqlite3');
            }
        }
    }

    // Note: Skip loading test - better-sqlite3 is built for Electron's Node.js (v20)
    // but this health check runs with system Node.js (v22). This is expected.
    info('better-sqlite3 is built for Electron runtime (skipping load test)');
}

async function checkDatabase() {
    header('Database');

    const devDbPath = path.join(WORKSPACE_ROOT, 'resources', 'db', 'spaces.sqlite');

    check(
        fs.existsSync(devDbPath),
        'Development database exists',
        'Development database not found at resources/db/spaces.sqlite'
    );

    if (fs.existsSync(devDbPath)) {
        // Check SQLite header
        const buffer = Buffer.alloc(16);
        const fd = fs.openSync(devDbPath, 'r');
        fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);

        check(
            buffer.toString('utf-8', 0, 15) === 'SQLite format 3',
            'Valid SQLite database',
            'Invalid SQLite database file'
        );

        // Skip database content check - better-sqlite3 is built for Electron runtime
        info('Database content check skipped (requires Electron runtime)');
    }
}

function checkBuild() {
    header('Build Outputs');

    const mainPath = path.join(DIST_DIR, 'main.cjs');
    const preloadPath = path.join(DIST_DIR, 'preload.cjs');

    const mainExists = fs.existsSync(mainPath);
    const preloadExists = fs.existsSync(preloadPath);

    if (mainExists && preloadExists) {
        success('dist/main.cjs exists');
        success('dist/preload.cjs exists');

        // Check for ESM syntax that would break
        const mainContent = fs.readFileSync(mainPath, 'utf-8');
        if (mainContent.match(/^import\s+.*from\s+['"][^'"]+['"]/m)) {
            error('main.cjs contains ESM imports - will fail in Electron');
        } else {
            success('main.cjs is valid CommonJS');
        }

        const preloadContent = fs.readFileSync(preloadPath, 'utf-8');
        if (preloadContent.match(/^import\s+.*from\s+['"][^'"]+['"]/m)) {
            error('preload.cjs contains ESM imports - will fail in Electron');
        } else {
            success('preload.cjs is valid CommonJS');
        }
    } else {
        warning('Build outputs not found - Run: pnpm build:main');
        hasWarnings = true;
    }
}

function checkConfiguration() {
    header('Configuration');

    // package.json
    const pkgJson = JSON.parse(fs.readFileSync(path.join(DESKTOP_ROOT, 'package.json'), 'utf-8'));

    check(
        pkgJson.main === './dist/main.cjs',
        'package.json main entry correct',
        `package.json main should be "./dist/main.cjs" but is "${pkgJson.main}"`
    );

    check(
        pkgJson.type === 'module',
        'package.json type is "module"',
        'package.json type should be "module"',
        true
    );

    // Build script
    check(
        fs.existsSync(path.join(DESKTOP_ROOT, 'scripts', 'build-main.js')),
        'Build script exists',
        'Build script missing at scripts/build-main.js'
    );

    // Source files
    check(
        fs.existsSync(path.join(DESKTOP_ROOT, 'src', 'main', 'index.ts')),
        'Main process entry exists',
        'Main process entry missing at src/main/index.ts'
    );

    check(
        fs.existsSync(path.join(DESKTOP_ROOT, 'src', 'preload', 'index.ts')),
        'Preload script exists',
        'Preload script missing at src/preload/index.ts'
    );
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║      SPAYCE ELECTRON HEALTH CHECK                 ║${colors.reset}`);
    console.log(`${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}`);

    checkEnvironment();
    checkDependencies();
    await checkNativeModules();
    await checkDatabase();
    checkBuild();
    checkConfiguration();

    // Summary
    header('Summary');

    if (hasErrors) {
        error('Health check FAILED - Fix errors above before running');
        process.exit(1);
    } else if (hasWarnings) {
        warning('Health check passed with warnings');
        process.exit(0);
    } else {
        success('All health checks passed!');
        info('Ready to run: pnpm dev');
        process.exit(0);
    }
}

main().catch(e => {
    error(`Health check crashed: ${e.message}`);
    process.exit(1);
});
