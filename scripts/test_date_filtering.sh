#!/bin/bash

# Test script to demonstrate date filtering functionality
# This script shows the difference in record counts with and without date filtering

SQLITE_DB_PATH="/Users/mustafa.hanif/Downloads/@auto_pb_backup_we_tarseel_20250709000000/data.db"
TEST_DATE="2024-06-01"

echo "🧪 Testing Date Filtering Functionality"
echo "========================================"
echo

echo "📅 Test Date: $TEST_DATE"
echo "📂 Database: $SQLITE_DB_PATH"
echo

# Get tables with 'created' column
echo "🔍 Tables with 'created' column and record counts:"
echo "------------------------------------------------"

TABLES_WITH_CREATED=$(sqlite3 "$SQLITE_DB_PATH" "SELECT name FROM sqlite_master WHERE type='table';" | while read table; do
    has_created=$(sqlite3 "$SQLITE_DB_PATH" "PRAGMA table_info(\`$table\`);" | grep -i created | wc -l)
    if [[ $has_created -gt 0 ]]; then
        echo "$table"
    fi
done)

for table in $TABLES_WITH_CREATED; do
    total=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\`;" 2>/dev/null || echo "0")
    filtered=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\` WHERE created >= '$TEST_DATE';" 2>/dev/null || echo "0")
    
    if [[ $total -gt 0 ]]; then
        percentage=$(( filtered * 100 / total ))
        echo "  $table: $filtered/$total records (${percentage}% since $TEST_DATE)"
    fi
done

echo
echo "📊 Summary:"
echo "----------"

total_all=0
total_filtered=0

for table in $TABLES_WITH_CREATED; do
    total=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\`;" 2>/dev/null || echo "0")
    filtered=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\` WHERE created >= '$TEST_DATE';" 2>/dev/null || echo "0")
    
    total_all=$((total_all + total))
    total_filtered=$((total_filtered + filtered))
done

if [[ $total_all -gt 0 ]]; then
    percentage=$(( total_filtered * 100 / total_all ))
    echo "  Total records (all dates): $total_all"
    echo "  Total records (since $TEST_DATE): $total_filtered"
    echo "  Reduction: $(( total_all - total_filtered )) records ($(( 100 - percentage ))%)"
else
    echo "  No records found in tables with 'created' column"
fi

echo
echo "✨ Date filtering would reduce your migration by $(( total_all - total_filtered )) records!"
echo "   Use: ./scripts/migrate_sqlite_to_postgres_enhanced.sh --since=$TEST_DATE"
