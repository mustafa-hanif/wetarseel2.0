#!/bin/bash

# Detailed analysis of skipped tables
SQLITE_DB_PATH="/Users/mustafa.hanif/Downloads/@auto_pb_backup_we_tarseel_20250709000000/data.db"

echo "=== DETAILED TABLE ANALYSIS ==="
echo

# Get all SQLite tables
sqlite_tables=$(sqlite3 "$SQLITE_DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null)

echo "📊 Analyzing each SQLite table:"
echo

excluded_tables="_litestream_lock _litestream_seq _migrations"
skipped_count=0
empty_count=0
migrated_count=0

while IFS= read -r table; do
    if [[ -n "$table" ]]; then
        # Check if excluded
        is_excluded=false
        for excluded in $excluded_tables; do
            if [[ "$table" == "$excluded" ]]; then
                is_excluded=true
                break
            fi
        done
        
        if [[ "$is_excluded" == true ]]; then
            echo "❌ $table (excluded by config)"
            skipped_count=$((skipped_count + 1))
        else
            # Check row count
            row_count=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\`;" 2>/dev/null || echo "0")
            
            if [[ "$row_count" == "0" ]]; then
                echo "⚠️  $table (empty - $row_count rows)"
                empty_count=$((empty_count + 1))
            else
                echo "✅ $table ($row_count rows)"
                migrated_count=$((migrated_count + 1))
            fi
        fi
    fi
done <<< "$sqlite_tables"

echo
echo "📈 SUMMARY:"
echo "  - Tables excluded by config: $skipped_count"
echo "  - Empty tables: $empty_count"
echo "  - Tables with data: $migrated_count"
echo "  - Total potential skips: $((skipped_count + empty_count))"
echo
echo "💡 Note: Empty tables might be skipped if SKIP_EMPTY_TABLES=true in config"
