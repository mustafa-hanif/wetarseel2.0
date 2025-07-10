#!/bin/bash

# SQLite to PostgreSQL Migration Script
# This script exports all tables from SQLite to CSV and imports them to PostgreSQL

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION - Modify these variables as needed
# =============================================================================

# SQLite database path
SQLITE_DB_PATH="/Users/mustafa.hanif/Downloads/@auto_pb_backup_we_tarseel_20250709000000/data.db"

# PostgreSQL connection details
PG_HOST="wetarseel-dev-postgres-v2.c78288muwwks.me-central-1.rds.amazonaws.com"
PG_PORT="5432"
PG_DATABASE="wetarseel"
PG_USER="dbadmin"
PG_PASSWORD="Jojo.3344"

# Working directory for temporary files
WORK_DIR="$(pwd)/migration_temp"

# Tables to exclude (space-separated list)
EXCLUDE_TABLES="_litestream_lock _litestream_seq _migrations"

# Batch size for large tables (optional - not used in CSV method but kept for reference)
BATCH_SIZE=1000

# =============================================================================
# SCRIPT FUNCTIONS
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a table should be excluded
is_excluded() {
    local table=$1
    for excluded in $EXCLUDE_TABLES; do
        if [[ "$table" == "$excluded" ]]; then
            return 0
        fi
    done
    return 1
}

# Function to get row count from SQLite table
get_row_count() {
    local table=$1
    sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\`;" 2>/dev/null || echo "0"
}

# Function to export table to CSV
export_table_to_csv() {
    local table=$1
    local csv_file="$WORK_DIR/${table}.csv"
    
    log_info "Exporting table '$table' to CSV..."
    
    # Export with proper quoting and escaping
    sqlite3 "$SQLITE_DB_PATH" << EOF
.headers on
.mode csv
.output $csv_file
SELECT * FROM \`$table\`;
.quit
EOF
    
    if [[ -f "$csv_file" ]]; then
        local file_size=$(ls -lh "$csv_file" | awk '{print $5}')
        log_success "Exported '$table' to CSV (Size: $file_size)"
        echo "$csv_file"
    else
        log_error "Failed to export table '$table'"
        return 1
    fi
}

# Function to create table structure using pgloader
create_table_structure() {
    local table=$1
    local pgloader_script="$WORK_DIR/create_${table}.load"
    
    log_info "Creating table structure for '$table'..."
    
    # Create pgloader script for schema only
    cat > "$pgloader_script" << EOF
LOAD DATABASE
    FROM sqlite://$SQLITE_DB_PATH
    INTO pgsql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE

WITH include drop, create tables, reset sequences,
     schema only

INCLUDING ONLY TABLE NAMES LIKE '$table';
EOF
    
    # Run pgloader
    if PGSSLMODE=prefer pgloader "$pgloader_script" > /dev/null 2>&1; then
        log_success "Created table structure for '$table'"
        rm -f "$pgloader_script"
        return 0
    else
        log_warning "pgloader failed for '$table', will try to create manually"
        rm -f "$pgloader_script"
        return 1
    fi
}

# Function to get table schema from SQLite and convert to PostgreSQL
create_table_manually() {
    local table=$1
    
    log_info "Creating table '$table' manually..."
    
    # Get column info from SQLite
    local schema=$(sqlite3 "$SQLITE_DB_PATH" ".schema \`$table\`" 2>/dev/null)
    
    if [[ -z "$schema" ]]; then
        log_error "Could not get schema for table '$table'"
        return 1
    fi
    
    # Basic conversion (this is simplified - you might need to enhance for complex types)
    local pg_schema=$(echo "$schema" | sed -e 's/TEXT/text/g' -e 's/INTEGER/integer/g' -e 's/REAL/real/g' -e 's/BLOB/bytea/g' -e 's/BOOLEAN/boolean/g')
    
    # Execute the schema creation
    echo "$pg_schema" | PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" > /dev/null 2>&1
    
    if [[ $? -eq 0 ]]; then
        log_success "Manually created table '$table'"
        return 0
    else
        log_error "Failed to manually create table '$table'"
        return 1
    fi
}

# Function to import CSV to PostgreSQL
import_csv_to_postgres() {
    local table=$1
    local csv_file=$2
    
    log_info "Importing CSV data for table '$table'..."
    
    # Import using PostgreSQL COPY command
    local copy_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "\\COPY \`$table\` FROM '$csv_file' WITH (FORMAT csv, HEADER true);" 2>&1)
    
    if [[ $? -eq 0 ]]; then
        local rows_imported=$(echo "$copy_result" | grep "COPY" | awk '{print $2}')
        log_success "Imported $rows_imported rows into table '$table'"
        return 0
    else
        log_error "Failed to import data for table '$table': $copy_result"
        return 1
    fi
}

# Function to create indexes for a table
create_indexes() {
    local table=$1
    
    log_info "Creating indexes for table '$table'..."
    
    # Get index definitions from SQLite
    local indexes=$(sqlite3 "$SQLITE_DB_PATH" "SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='$table' AND sql IS NOT NULL;" 2>/dev/null)
    
    if [[ -n "$indexes" ]]; then
        # Convert SQLite index syntax to PostgreSQL (basic conversion)
        echo "$indexes" | while IFS= read -r index_sql; do
            if [[ -n "$index_sql" ]]; then
                # Basic conversion - you might need to enhance this
                local pg_index_sql=$(echo "$index_sql" | sed -e "s/\`//g" -e "s/sqlite_autoindex_[^']*/''/g")
                
                # Try to create the index
                echo "$pg_index_sql" | PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" > /dev/null 2>&1
                
                if [[ $? -eq 0 ]]; then
                    log_success "Created index: $(echo "$pg_index_sql" | cut -d' ' -f3)"
                else
                    log_warning "Failed to create index: $pg_index_sql"
                fi
            fi
        done
    else
        log_info "No indexes found for table '$table'"
    fi
}

# =============================================================================
# MAIN SCRIPT
# =============================================================================

main() {
    log_info "Starting SQLite to PostgreSQL migration..."
    log_info "SQLite DB: $SQLITE_DB_PATH"
    log_info "PostgreSQL: $PG_HOST:$PG_PORT/$PG_DATABASE"
    
    # Check if SQLite database exists
    if [[ ! -f "$SQLITE_DB_PATH" ]]; then
        log_error "SQLite database not found: $SQLITE_DB_PATH"
        exit 1
    fi
    
    # Create working directory
    mkdir -p "$WORK_DIR"
    log_info "Working directory: $WORK_DIR"
    
    # Get list of all tables
    log_info "Getting list of tables from SQLite database..."
    local tables=$(sqlite3 "$SQLITE_DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null)
    
    if [[ -z "$tables" ]]; then
        log_error "No tables found in SQLite database"
        exit 1
    fi
    
    local total_tables=$(echo "$tables" | wc -l)
    log_info "Found $total_tables tables"
    
    # Initialize counters
    local processed=0
    local successful=0
    local failed=0
    local skipped=0
    
    # Process each table
    echo "$tables" | while IFS= read -r table; do
        if [[ -z "$table" ]]; then
            continue
        fi
        
        processed=$((processed + 1))
        
        echo
        log_info "Processing table $processed/$total_tables: '$table'"
        
        # Check if table should be excluded
        if is_excluded "$table"; then
            log_warning "Skipping excluded table: '$table'"
            skipped=$((skipped + 1))
            continue
        fi
        
        # Get row count
        local row_count=$(get_row_count "$table")
        log_info "Table '$table' has $row_count rows"
        
        # Skip empty tables if desired (uncomment next 4 lines to skip empty tables)
        # if [[ "$row_count" -eq 0 ]]; then
        #     log_warning "Skipping empty table: '$table'"
        #     continue
        # fi
        
        # Export table to CSV
        local csv_file=$(export_table_to_csv "$table")
        if [[ $? -ne 0 ]]; then
            log_error "Failed to export table '$table'"
            failed=$((failed + 1))
            continue
        fi
        
        # Create table structure
        if ! create_table_structure "$table"; then
            # If pgloader fails, try manual creation
            if ! create_table_manually "$table"; then
                log_error "Failed to create table structure for '$table'"
                failed=$((failed + 1))
                rm -f "$csv_file"
                continue
            fi
        fi
        
        # Import CSV data
        if import_csv_to_postgres "$table" "$csv_file"; then
            successful=$((successful + 1))
            
            # Create indexes
            create_indexes "$table"
            
        else
            failed=$((failed + 1))
        fi
        
        # Clean up CSV file
        rm -f "$csv_file"
        
        log_success "Completed processing table '$table'"
    done
    
    # Clean up working directory
    rm -rf "$WORK_DIR"
    
    # Final summary
    echo
    log_info "Migration completed!"
    log_info "Total tables processed: $processed"
    log_success "Successful: $successful"
    log_error "Failed: $failed"
    log_warning "Skipped: $skipped"
    
    if [[ $failed -eq 0 ]]; then
        log_success "All tables migrated successfully! 🎉"
    else
        log_warning "Some tables failed to migrate. Check the logs above for details."
    fi
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Check dependencies
command -v sqlite3 >/dev/null 2>&1 || { log_error "sqlite3 is required but not installed."; exit 1; }
command -v psql >/dev/null 2>&1 || { log_error "psql is required but not installed."; exit 1; }
command -v pgloader >/dev/null 2>&1 || { log_error "pgloader is required but not installed."; exit 1; }

# Run main function
main "$@"
