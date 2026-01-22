/**
 * Test Logger - Provides structured logging for test debugging
 */

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

export const testLogger = {
    suite: (name: string) => {
        console.log(`\n${COLORS.bright}${COLORS.blue}▶ SUITE: ${name}${COLORS.reset}`);
    },

    test: (name: string) => {
        console.log(`  ${COLORS.cyan}○ TEST: ${name}${COLORS.reset}`);
    },

    pass: (name: string, durationMs?: number) => {
        const duration = durationMs ? ` (${durationMs}ms)` : '';
        console.log(`  ${COLORS.green}✓ PASS: ${name}${duration}${COLORS.reset}`);
    },

    fail: (name: string, error?: string) => {
        console.log(`  ${COLORS.red}✗ FAIL: ${name}${COLORS.reset}`);
        if (error) {
            console.log(`    ${COLORS.dim}${error}${COLORS.reset}`);
        }
    },

    skip: (name: string, reason?: string) => {
        const msg = reason ? ` - ${reason}` : '';
        console.log(`  ${COLORS.yellow}⊘ SKIP: ${name}${msg}${COLORS.reset}`);
    },

    info: (message: string) => {
        console.log(`    ${COLORS.dim}ℹ ${message}${COLORS.reset}`);
    },

    warn: (message: string) => {
        console.log(`    ${COLORS.yellow}⚠ ${message}${COLORS.reset}`);
    },

    error: (message: string) => {
        console.log(`    ${COLORS.red}✗ ${message}${COLORS.reset}`);
    },

    debug: (label: string, value: unknown) => {
        console.log(`    ${COLORS.magenta}🔍 ${label}:${COLORS.reset}`, value);
    },

    timing: (label: string, startTime: number) => {
        const duration = Date.now() - startTime;
        const color = duration > 1000 ? COLORS.red : duration > 500 ? COLORS.yellow : COLORS.green;
        console.log(`    ${color}⏱ ${label}: ${duration}ms${COLORS.reset}`);
    },

    separator: () => {
        console.log(`${COLORS.dim}${'─'.repeat(60)}${COLORS.reset}`);
    },

    summary: (passed: number, failed: number, skipped: number, duration: number) => {
        console.log(`\n${COLORS.bright}═══ TEST SUMMARY ═══${COLORS.reset}`);
        console.log(`  ${COLORS.green}Passed:  ${passed}${COLORS.reset}`);
        console.log(`  ${COLORS.red}Failed:  ${failed}${COLORS.reset}`);
        console.log(`  ${COLORS.yellow}Skipped: ${skipped}${COLORS.reset}`);
        console.log(`  ${COLORS.cyan}Duration: ${duration}ms${COLORS.reset}`);
        console.log('');
    },
};

export default testLogger;
