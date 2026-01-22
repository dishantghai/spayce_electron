#!/bin/bash
# Import Migration Script
# Migrates import paths from @spayce/shared to new package structure
# Usage: ./scripts/migrate-imports.sh

set -e

echo "=== Spayce Import Migration ==="
echo ""

# Directories to process
DIRS="packages/desktop/src packages/react-ui/src"

# Migration patterns
declare -A MIGRATIONS=(
    ["@spayce/shared/types"]="@spayce/core"
    ["@spayce/shared/hooks"]="@spayce/react-ui/hooks"
    ["@spayce/shared/stores/spaces"]="@spayce/react-ui/hooks"
    ["@spayce/shared/components"]="@spayce/react-ui/components"
)

for DIR in $DIRS; do
    if [ ! -d "$DIR" ]; then
        echo "Skipping non-existent directory: $DIR"
        continue
    fi
    
    echo "Processing: $DIR"
    
    for OLD in "${!MIGRATIONS[@]}"; do
        NEW="${MIGRATIONS[$OLD]}"
        
        # Find and replace imports
        find "$DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "$OLD" {} \; 2>/dev/null | while read -r file; do
            echo "  Migrating: $file"
            echo "    $OLD -> $NEW"
            sed -i '' "s|$OLD|$NEW|g" "$file" 2>/dev/null || sed -i "s|$OLD|$NEW|g" "$file"
        done
    done
done

echo ""
echo "=== Import Migration Complete ==="
echo ""
echo "Please review changes and run: pnpm typecheck"
