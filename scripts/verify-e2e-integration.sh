#!/bin/bash
# E2E Integration Verification Script
# Verifies that all integration points are working correctly
# Usage: ./scripts/verify-e2e-integration.sh

set -e

echo "=== Spayce E2E Integration Verification ==="
echo ""

ERRORS=0

# 1. Check TypeScript compilation
echo "1. Checking TypeScript compilation..."
if pnpm typecheck 2>/dev/null; then
    echo "   ✓ TypeScript compilation passed"
else
    echo "   ✗ TypeScript compilation failed"
    ERRORS=$((ERRORS + 1))
fi

# 2. Check database exists
echo ""
echo "2. Checking database..."
DB_PATH="resources/db/spaces.sqlite"
if [ -f "$DB_PATH" ]; then
    echo "   ✓ Database exists at $DB_PATH"
else
    echo "   ✗ Database not found at $DB_PATH"
    ERRORS=$((ERRORS + 1))
fi

# 3. Run unit tests
echo ""
echo "3. Running unit tests..."
if pnpm test -- --run 2>/dev/null; then
    echo "   ✓ Unit tests passed"
else
    echo "   ✗ Some unit tests failed"
    ERRORS=$((ERRORS + 1))
fi

# 4. Check required exports
echo ""
echo "4. Checking required exports..."

# Check @spayce/core exports
if grep -q "SpaceEntity" packages/core/src/index.ts 2>/dev/null; then
    echo "   ✓ @spayce/core exports SpaceEntity"
else
    echo "   ✗ @spayce/core missing SpaceEntity export"
    ERRORS=$((ERRORS + 1))
fi

# Check @spayce/infrastructure exports
if grep -q "ServiceBootstrap" packages/infrastructure/src/index.ts 2>/dev/null; then
    echo "   ✓ @spayce/infrastructure exports ServiceBootstrap"
else
    echo "   ✗ @spayce/infrastructure missing ServiceBootstrap export"
    ERRORS=$((ERRORS + 1))
fi

# Check @spayce/react-ui exports
if grep -q "useSpaces" packages/react-ui/src/index.ts 2>/dev/null; then
    echo "   ✓ @spayce/react-ui exports useSpaces"
else
    echo "   ✗ @spayce/react-ui missing useSpaces export"
    ERRORS=$((ERRORS + 1))
fi

# 5. Check no mock data in production
echo ""
echo "5. Checking for mock data..."
MOCK_COUNT=$(grep -r "mockSpaces\|DEMO_SPACES" packages/desktop/src packages/react-ui/src 2>/dev/null | grep -v "__tests__" | grep -v ".test." | wc -l || echo "0")
if [ "$MOCK_COUNT" -eq 0 ]; then
    echo "   ✓ No mock data found in production code"
else
    echo "   ✗ Found $MOCK_COUNT files with mock data"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "=== Verification Summary ==="
if [ $ERRORS -eq 0 ]; then
    echo "✓ All checks passed!"
    exit 0
else
    echo "✗ $ERRORS check(s) failed"
    exit 1
fi
