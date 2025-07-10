#!/bin/bash

# Script to compare SQLite and PostgreSQL tables
# This will show you which tables exist in SQLite but not in PostgreSQL

SQLITE_DB_PATH="/Users/mustafa.hanif/Downloads/@auto_pb_backup_we_tarseel_20250709000000/data.db"
PG_HOST="wetarseel-dev-postgres-v2.c78288muwwks.me-central-1.rds.amazonaws.com"
PG_PORT="5432"
PG_DATABASE="wetarseel"
PG_USER="dbadmin"
PG_PASSWORD="Jojo.3344"

echo "=== TABLE COMPARISON ==="
echo

echo "📋 Getting SQLite tables..."
sqlite_tables=$(sqlite3 "$SQLITE_DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null)

echo "📋 Getting PostgreSQL tables..."
pg_tables=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;" 2>/dev/null | tr -d ' ')

echo
echo "🔍 ANALYSIS:"
echo

# Convert to arrays
sqlite_array=()
while IFS= read -r table; do
    if [[ -n "$table" ]]; then
        sqlite_array+=("$table")
    fi
done <<< "$sqlite_tables"

pg_array=()
while IFS= read -r table; do
    if [[ -n "$table" ]]; then
        pg_array+=("$table")
    fi
done <<< "$pg_tables"

echo "SQLite tables found: ${#sqlite_array[@]}"
echo "PostgreSQL tables found: ${#pg_array[@]}"
echo

# Find tables in SQLite but not in PostgreSQL
missing_in_pg=()
for sqlite_table in "${sqlite_array[@]}"; do
    found=false
    for pg_table in "${pg_array[@]}"; do
        if [[ "$sqlite_table" == "$pg_table" ]]; then
            found=true
            break
        fi
    done
    if [[ "$found" == false ]]; then
        missing_in_pg+=("$sqlite_table")
    fi
done

if [[ ${#missing_in_pg[@]} -gt 0 ]]; then
    echo "❌ Tables in SQLite but NOT in PostgreSQL (${#missing_in_pg[@]} tables):"
    for table in "${missing_in_pg[@]}"; do
        echo "  - $table"
    done
else
    echo "✅ All SQLite tables exist in PostgreSQL"
fi

echo
echo "📊 EXCLUDED TABLES (from migration config):"
excluded="_litestream_lock _litestream_seq _migrations"
for table in $excluded; do
    echo "  - $table (excluded by configuration)"
done

echo
echo "🔍 To check why specific tables were skipped, run:"
echo "  ./scripts/migrate_sqlite_to_postgres_enhanced.sh --help"
