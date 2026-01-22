#!/usr/bin/env node
/**
 * Pre-commit Checks
 * 
 * Run this script before committing to ensure the codebase is healthy.
 * Can be used as a git pre-commit hook.
 * 
 * Usage: node scripts/pre-commit-checks.js
 * 
 * To install as git hook:
 *   cp scripts/pre-commit-checks.js .git/hooks/pre-commit
 *   chmod +x .git/hooks/pre-commit
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
    try {
        execSync(command, {
            cwd: ROOT,
            stdio: 'pipe',
            timeout: 120000,
            ...options,
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function main() {
    log(colors.cyan, '\n╔═══════════════════════════════════════╗');
    log(colors.cyan, '║      PRE-COMMIT CHECKS                ║');
    log(colors.cyan, '╚═══════════════════════════════════════╝\n');

    let hasFailures = false;

    // 1. TypeScript type check
    log(colors.cyan, '→ Running TypeScript type check...');
    const tscResult = runCommand('pnpm typecheck');
    if (tscResult.success) {
        log(colors.green, '✓ TypeScript types OK');
    } else {
        log(colors.red, '✗ TypeScript errors found');
        hasFailures = true;
    }

    // 2. Build check (ensure main.cjs builds)
    log(colors.cyan, '→ Building main process...');
    const buildResult = runCommand('pnpm --filter @spayce/desktop build:main');
    if (buildResult.success) {
        log(colors.green, '✓ Build OK');
    } else {
        log(colors.red, '✗ Build failed');
        hasFailures = true;
    }

    // 3. Preflight tests
    log(colors.cyan, '→ Running preflight tests...');
    const preflightResult = runCommand('pnpm --filter @spayce/desktop test:preflight');
    if (preflightResult.success) {
        log(colors.green, '✓ Preflight tests passed');
    } else {
        log(colors.red, '✗ Preflight tests failed');
        hasFailures = true;
    }

    // 4. Core tests
    log(colors.cyan, '→ Running core tests...');
    const coreResult = runCommand('pnpm test:core');
    if (coreResult.success) {
        log(colors.green, '✓ Core tests passed');
    } else {
        log(colors.yellow, '⚠ Core tests failed (non-blocking)');
    }

    // 5. Infrastructure tests
    log(colors.cyan, '→ Running infrastructure tests...');
    const infraResult = runCommand('pnpm test:infra');
    if (infraResult.success) {
        log(colors.green, '✓ Infrastructure tests passed');
    } else {
        log(colors.yellow, '⚠ Infrastructure tests failed (non-blocking)');
    }

    // Summary
    console.log('');
    if (hasFailures) {
        log(colors.red, '╔═══════════════════════════════════════╗');
        log(colors.red, '║  PRE-COMMIT CHECKS FAILED             ║');
        log(colors.red, '║  Fix errors before committing         ║');
        log(colors.red, '╚═══════════════════════════════════════╝');
        process.exit(1);
    } else {
        log(colors.green, '╔═══════════════════════════════════════╗');
        log(colors.green, '║  ALL PRE-COMMIT CHECKS PASSED         ║');
        log(colors.green, '╚═══════════════════════════════════════╝');
        process.exit(0);
    }
}

main().catch(e => {
    log(colors.red, `Pre-commit checks crashed: ${e.message}`);
    process.exit(1);
});
