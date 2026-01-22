#!/bin/bash
# Find Mock Data Script
# Searches for mock data patterns that should be removed
# Usage: ./scripts/find-mock-data.sh

set -e

echo "=== Finding Mock Data Patterns ==="
echo ""

# Directories to search (excluding test files)
SEARCH_DIRS="packages/desktop/src packages/react-ui/src"

# Patterns to search for
PATTERNS=(
    "mockSpaces"
    "mockItems"
    "DEMO_SPACES"
    "DEMO_ITEMS"
    "sampleSpaces"
    "sampleItems"
    "testSpaces"
    "testItems"
    "dummyData"
    "fakeData"
)

FOUND=0

for PATTERN in "${PATTERNS[@]}"; do
    echo "Searching for: $PATTERN"
    
    for DIR in $SEARCH_DIRS; do
        if [ -d "$DIR" ]; then
            RESULTS=$(grep -r --include="*.ts" --include="*.tsx" -l "$PATTERN" "$DIR" 2>/dev/null | grep -v "__tests__" | grep -v ".test." | grep -v ".spec." || true)
            
            if [ -n "$RESULTS" ]; then
                echo "  Found in:"
                echo "$RESULTS" | while read -r file; do
                    echo "    - $file"
                    FOUND=$((FOUND + 1))
                done
            fi
        fi
    done
done

echo ""

# Also search for hardcoded space arrays
echo "Searching for hardcoded space arrays..."
for DIR in $SEARCH_DIRS; do
    if [ -d "$DIR" ]; then
        grep -r --include="*.ts" --include="*.tsx" -n "const spaces = \[" "$DIR" 2>/dev/null | grep -v "__tests__" | grep -v ".test." || true
        grep -r --include="*.ts" --include="*.tsx" -n "const items = \[" "$DIR" 2>/dev/null | grep -v "__tests__" | grep -v ".test." || true
    fi
done

echo ""
echo "=== Search Complete ==="
