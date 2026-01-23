#!/usr/bin/env node

/**
 * Architecture Validation Script
 * 
 * Prevents architecture mismatch issues with native Node.js modules.
 * Ensures Node.js architecture matches system architecture on Apple Silicon Macs.
 */

import os from 'os';
import { execSync } from 'child_process';

const systemArch = os.arch();
const nodeArch = process.arch;

console.log('🔍 System Architecture Check:');
console.log(`  System: ${systemArch}`);
console.log(`  Node.js: ${nodeArch}`);

// Check for problematic mismatch on Apple Silicon
if (systemArch === 'arm64' && nodeArch === 'x64') {
    console.error('\n❌ ERROR: Architecture Mismatch Detected!');
    console.error('  You are using x86_64 (Intel) Node.js on an arm64 (Apple Silicon) Mac.');
    console.error('  This will cause native module (better-sqlite3) failures.\n');
    console.error('📋 How to Fix:');
    console.error('  1. Uninstall current Node.js:');
    console.error('     nvm uninstall $(nvm current)');
    console.error('  2. Reinstall as arm64:');
    console.error('     arch -arm64 nvm install --lts');
    console.error('  3. Rebuild native modules:');
    console.error('     pnpm install\n');
    process.exit(1);
}

// Warn if running x64 on x64 (might be Rosetta, but acceptable)
if (systemArch === 'arm64' && nodeArch === 'arm64') {
    console.log('✅ Architecture matches - all good!\n');
} else if (systemArch === 'x64' && nodeArch === 'x64') {
    console.log('✅ Architecture matches (x64)\n');
} else {
    console.log(`ℹ️  Architecture: ${systemArch} system, ${nodeArch} Node.js\n`);
}

process.exit(0);
