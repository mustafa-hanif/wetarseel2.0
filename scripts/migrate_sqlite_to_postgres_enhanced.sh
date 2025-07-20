#!/bin/bash

# SQLite to PostgreSQL Migration Script (Enhanced Version)
# This script exports all tables from SQLite to CSV and imports them to PostgreSQL
# Usage: ./migrate_sqlite_to_postgres_enhanced.sh [config_file] [--since=YYYY-MM-DD]

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION LOADING
# =============================================================================

# Show usage information
show_usage() {
    echo "SQLite to PostgreSQL Migration Script"
    echo
    echo "Usage: $0 [config_file] [--since=YYYY-MM-DD]"
    echo
    echo "Options:"
    echo "  config_file         Path to configuration file (default: migration_config.env)"
    echo "  --since=YYYY-MM-DD  Only migrate records created on or after this date"
    echo "  -h, --help          Show this help message"
    echo
    echo "Examples:"
    echo "  $0                                    # Migrate all records with default config"
    echo "  $0 custom_config.env                 # Use custom config, migrate all records"
    echo "  $0 --since=2024-01-01                # Migrate records created since 2024-01-01"
    echo "  $0 custom_config.env --since=2024-06-01  # Custom config + date filter"
    echo
    echo "Date Filtering:"
    echo "  - Only applies to tables with a 'created' column"
    echo "  - Tables without 'created' column will migrate all records"
    echo "  - Date format must be YYYY-MM-DD (ISO 8601)"
    echo "  - Comparison uses >= (greater than or equal to)"
    echo "  - When date filtering is used, incremental mode is automatically enabled"
    echo
    echo "Incremental Mode:"
    echo "  - Automatically enabled when using --since parameter"
    echo "  - Existing tables are preserved (not dropped)"
    echo "  - Only new records are added (no updates to existing records)"
    echo "  - Safe for repeated runs with future dates"
    echo
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse command line arguments
SINCE_DATE=""
CONFIG_FILE=""

for arg in "$@"; do
    case $arg in
        --since=*)
            SINCE_DATE="${arg#*=}"
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            if [[ -z "$CONFIG_FILE" ]]; then
                CONFIG_FILE="$arg"
            fi
            ;;
    esac
done

# Set default config file if not provided
CONFIG_FILE="${CONFIG_FILE:-$SCRIPT_DIR/migration_config.env}"

# Load configuration
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
    echo "✓ Loaded configuration from: $CONFIG_FILE"
else
    echo "⚠️  Configuration file not found: $CONFIG_FILE"
    echo "Using default values..."
    
    # Default configuration
    SQLITE_DB_PATH="/Users/mustafa.hanif/Downloads/@auto_pb_backup_we_tarseel_20250709000000/data.db"
    PG_HOST="wetarseel-dev-postgres-v2.c78288muwwks.me-central-1.rds.amazonaws.com"
    PG_PORT="5432"
    PG_DATABASE="wetarseel"
    PG_USER="dbadmin"
    PG_PASSWORD="Jojo.3344"
    EXCLUDE_TABLES="_litestream_lock _collections _litestream_seq _migrations _otps _mfas _authOrigins _externalAuths"
    SKIP_EMPTY_TABLES=false
    CREATE_INDEXES=true
    VERBOSE=true
    DEFAULT_SINCE_DATE=""
    INCREMENTAL_MODE=false
fi

# =============================================================================
# UTILITY FUNCTIONS (DEFINED EARLY)
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_progress() {
    echo -e "${PURPLE}[→]${NC} $1"
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

# Working directory for temporary files
WORK_DIR="$(pwd)/migration_temp"

# Use command line date if provided, otherwise use config default
if [[ -z "$SINCE_DATE" ]] && [[ -n "$DEFAULT_SINCE_DATE" ]]; then
    SINCE_DATE="$DEFAULT_SINCE_DATE"
    echo "📅 Using default date filter from config: $SINCE_DATE"
fi

# Enable incremental mode when using date filtering
if [[ -n "$SINCE_DATE" ]]; then
    INCREMENTAL_MODE=true
    echo "🔄 Incremental mode enabled: Only new records will be added"
fi

# Validate date format if provided
if [[ -n "$SINCE_DATE" ]]; then
    if [[ ! "$SINCE_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        log_error "Invalid date format. Use YYYY-MM-DD format (e.g., 2024-01-01)"
        exit 1
    fi
    echo "📅 Filtering records created since: $SINCE_DATE"
fi

# Progress bar function
show_progress() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local completed=$((current * width / total))
    local remaining=$((width - completed))
    
    printf "\r["
    printf "%*s" $completed | tr ' ' '='
    printf "%*s" $remaining | tr ' ' '-'
    printf "] %d%% (%d/%d)" $percentage $current $total
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

# Function to validate PostgreSQL connection
test_postgres_connection() {
    log_info "Testing PostgreSQL connection..."
    
    if PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "SELECT version();" > /dev/null 2>&1; then
        log_success "PostgreSQL connection successful"
        return 0
    else
        log_error "Failed to connect to PostgreSQL"
        return 1
    fi
}

# Function to check if table has a 'created' column
has_created_column() {
    local table=$1
    local has_created=$(sqlite3 "$SQLITE_DB_PATH" "PRAGMA table_info(\`$table\`);" | grep -i "created" | wc -l)
    [[ $has_created -gt 0 ]]
}

# Function to get table information with date filtering
get_table_info() {
    local table=$1
    local row_count
    
    if [[ -n "$SINCE_DATE" ]] && has_created_column "$table"; then
        # Count rows created since the specified date
        row_count=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\` WHERE created >= '$SINCE_DATE';" 2>/dev/null || echo "0")
        log_debug "Table '$table' has 'created' column, applying date filter"
    else
        # Count all rows
        row_count=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\`;" 2>/dev/null || echo "0")
        if [[ -n "$SINCE_DATE" ]]; then
            log_debug "Table '$table' does not have 'created' column, migrating all records"
        fi
    fi
    
    echo "$row_count"
}

# Function to export table to CSV with better error handling and date filtering
export_table_to_csv() {
    local table=$1
    local csv_file="$WORK_DIR/${table}.csv"
    
    # Ensure working directory exists
    mkdir -p "$WORK_DIR"
    
    log_progress "Exporting table '$table' to CSV..." >&2
    # log_debug "CSV file path: $csv_file" >&2
    # log_debug "Working directory: $WORK_DIR" >&2
    
    # Determine the SQL query based on date filtering
    local sql_query
    if [[ -n "$SINCE_DATE" ]] && has_created_column "$table"; then
        sql_query="SELECT * FROM \`$table\` WHERE created >= '$SINCE_DATE';"
        log_debug "Using date filter for table '$table': created >= '$SINCE_DATE'" >&2
    else
        sql_query="SELECT * FROM \`$table\`;"
        if [[ -n "$SINCE_DATE" ]]; then
            log_debug "No 'created' column in table '$table', exporting all records" >&2
        fi
    fi
    
    # Create the CSV export with proper error handling
    if sqlite3 "$SQLITE_DB_PATH" << EOF
.headers on
.mode csv
.output $csv_file
$sql_query
.quit
EOF
    then
        if [[ -f "$csv_file" ]]; then
            local file_size=$(ls -lh "$csv_file" | awk '{print $5}')
            local row_count=$(wc -l < "$csv_file")
            row_count=$((row_count - 1))  # Subtract header row
            
            if [[ -n "$SINCE_DATE" ]] && has_created_column "$table"; then
                log_success "Exported '$table' (since $SINCE_DATE): $row_count rows, $file_size" >&2
            else
                log_success "Exported '$table': $row_count rows, $file_size" >&2
            fi
            
            echo "$csv_file"
            return 0
        else
            log_error "CSV file was not created for table '$table'" >&2
            return 1
        fi
    else
        log_error "SQLite export failed for table '$table'" >&2
        return 1
    fi
}

# Function to check if table exists in PostgreSQL
table_exists_in_postgres() {
    local table=$1
    local exists=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';" 2>/dev/null | tr -d ' ')
    [[ "$exists" == "1" ]]
}

# Function to create table structure using pgloader
create_table_structure() {
    local table=$1
    local pgloader_script="$WORK_DIR/create_${table}.load"
    
    # Check if we're in incremental mode and table already exists
    if [[ "$INCREMENTAL_MODE" == "true" ]] && table_exists_in_postgres "$table"; then
        log_info "Table '$table' already exists, skipping structure creation (incremental mode)"
        return 0
    fi
    
    log_progress "Creating table structure for '$table'..."
    
    # Create pgloader script for schema only
    # Note: We only reach this point if the table doesn't exist
    # Data import is always done via CSV, not pgloader
    if [[ "$INCREMENTAL_MODE" == "true" ]]; then
        # Incremental mode: create table without dropping (table doesn't exist)
        cat > "$pgloader_script" << EOF
LOAD DATABASE
    FROM sqlite://$SQLITE_DB_PATH
    INTO pgsql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE

WITH create tables, reset sequences,
     schema only

INCLUDING ONLY TABLE NAMES LIKE '$table';
EOF
    else
        # Full migration mode: drop and recreate tables
        cat > "$pgloader_script" << EOF
LOAD DATABASE
    FROM sqlite://$SQLITE_DB_PATH
    INTO pgsql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE

WITH include drop, create tables, reset sequences,
     schema only

INCLUDING ONLY TABLE NAMES LIKE '$table';
EOF
    fi
    
    # Run pgloader
    local pgloader_output
    if pgloader_output=$(PGSSLMODE=prefer pgloader "$pgloader_script" 2>&1); then
        log_success "Created table structure for '$table'"
        log_debug "pgloader output: $pgloader_output"
        rm -f "$pgloader_script"
        return 0
    else
        log_warning "pgloader failed for '$table': $pgloader_output"
        rm -f "$pgloader_script"
        return 1
    fi
}

# Function to import CSV to PostgreSQL with duplicate handling
import_csv_to_postgres() {
    local table=$1
    local csv_file=$2
    
    log_progress "Importing CSV data for table '$table'..."
    # log_debug "Import CSV file path: $csv_file"
    # log_debug "Current working directory: $(pwd)"
    # log_debug "WORK_DIR variable: $WORK_DIR"
    # log_debug "Absolute CSV path: $(realpath "$csv_file" 2>/dev/null || echo "Cannot resolve path")"
    # log_debug "Working directory contents: $(ls -la "$WORK_DIR" 2>/dev/null | grep -v '^total' || echo 'Directory not accessible')"
    # log_debug "CSV file exists: $(if [[ -f "$csv_file" ]]; then echo "YES"; else echo "NO"; fi)"
    # log_debug "CSV file size: $(if [[ -f "$csv_file" ]]; then ls -lh "$csv_file" | awk '{print $5}'; else echo "N/A"; fi)"
    
    # Check if we can read the file
    if [[ ! -f "$csv_file" ]]; then
        log_error "CSV file does not exist at: $csv_file"
        return 1
    fi
    
    if [[ ! -r "$csv_file" ]]; then
        log_error "CSV file is not readable: $csv_file"
        return 1
    fi
    
    # Convert to absolute path to ensure psql can find it
    local abs_csv_path=$(realpath "$csv_file")
    # log_debug "Absolute CSV path for psql: $abs_csv_path"
    
    # Get the primary key or unique columns for conflict resolution
    local primary_key_cols=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -t -c "
        SELECT string_agg(a.attname, ', ' ORDER BY a.attnum)
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = '$table'::regclass AND i.indisprimary;
    " 2>/dev/null | xargs)
    
    # ALWAYS get unique constraints (even if we have a primary key)
    # Try both named constraints and unique indexes
    local unique_constraints=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -t -c "
        SELECT c.conname
        FROM pg_constraint c
        WHERE c.conrelid = '$table'::regclass AND c.contype = 'u'
        UNION
        SELECT i.indexname
        FROM pg_indexes i
        WHERE i.tablename = '$table' AND i.indexdef LIKE '%UNIQUE%'
        ORDER BY 1;
    " 2>/dev/null)
    
    log_debug "Raw unique constraints result: '$unique_constraints'"
    
    # If no named constraints, try to get the failing constraint name from error patterns
    if [[ -z "$unique_constraints" ]]; then
        log_debug "No named constraints found, will try direct constraint names"
        # For conversations table, we know the constraint is "account_from"
        if [[ "$table" == "conversations" ]]; then
            unique_constraints="account_from"
            log_debug "Using known constraint for conversations table: account_from"
        fi
    fi
    
    # Get the first unique constraint details for fallback
    local unique_constraint_name=""
    local unique_constraint_cols=""
    if [[ -n "$unique_constraints" ]]; then
        unique_constraint_name=$(echo "$unique_constraints" | head -n1 | xargs)
        log_debug "Selected unique constraint name: '$unique_constraint_name'"
        
        # Try to get columns from constraint
        unique_constraint_cols=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -t -c "
            SELECT string_agg(
                CASE WHEN a.attname = ANY(ARRAY['from', 'to', 'order', 'user', 'group', 'table']) 
                     THEN '\"' || a.attname || '\"' 
                     ELSE a.attname 
                END, 
                ', ' ORDER BY array_position(c.conkey, a.attnum)
            )
            FROM pg_constraint c
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
            WHERE c.conrelid = '$table'::regclass AND c.contype = 'u' AND c.conname = '$unique_constraint_name'
            GROUP BY c.conname, c.conkey;
        " 2>/dev/null | xargs)
        
        # If constraint query failed, try getting from unique index
        if [[ -z "$unique_constraint_cols" ]]; then
            unique_constraint_cols=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -t -c "
                SELECT string_agg(
                    CASE WHEN a.attname = ANY(ARRAY['from', 'to', 'order', 'user', 'group', 'table']) 
                         THEN '\"' || a.attname || '\"' 
                         ELSE a.attname 
                    END, 
                    ', ' ORDER BY a.attnum
                )
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = '$table'::regclass AND i.indisunique AND NOT i.indisprimary
                  AND (SELECT relname FROM pg_class WHERE oid = i.indexrelid) = '$unique_constraint_name'
                GROUP BY i.indexrelid;
            " 2>/dev/null | xargs)
        fi
        
        # For account_from constraint, we know the correct order from the error message
        if [[ "$unique_constraint_name" == "account_from" ]] && [[ "$table" == "conversations" ]]; then
            # The error shows: Key (account, "from") so this is the correct order
            unique_constraint_cols='account, "from"'
            log_debug "Using corrected column order for conversations.account_from based on error message"
        fi
        
        log_debug "Unique constraint columns: '$unique_constraint_cols'"
    fi
    
    # Method 1: Use temporary table approach for better control
    local temp_table="${table}_temp_import"
    
    log_debug "Using temporary table approach for duplicate handling"
    log_debug "Primary key columns: ${primary_key_cols:-"none found"}"
    log_debug "Unique constraints found: ${unique_constraints:-"none found"}"
    log_debug "First unique constraint: ${unique_constraint_name:-"none"} with columns: ${unique_constraint_cols:-"none"}"
    
    # Create temporary table with same structure but WITHOUT constraints/indexes
    local create_temp_result
    if create_temp_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "
        DROP TABLE IF EXISTS \"$temp_table\";
        CREATE TABLE \"$temp_table\" (LIKE \"$table\" INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING GENERATED);
    " 2>&1); then
        log_debug "Created temporary table without constraints: $temp_table"
    else
        log_error "Failed to create temporary table: $create_temp_result"
        return 1
    fi
    
    # Import to temporary table
    local copy_result
    if copy_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "\\COPY \"$temp_table\" FROM '$abs_csv_path' WITH (FORMAT csv, HEADER true);" 2>&1); then
        local rows_loaded=$(echo "$copy_result" | grep "COPY" | awk '{print $2}')
        log_debug "Loaded $rows_loaded rows into temporary table"
    else
        log_error "Failed to load data into temporary table: $copy_result"
        # Clean up temp table
        PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "DROP TABLE IF EXISTS \"$temp_table\";" >/dev/null 2>&1
        return 1
    fi
    
    # Insert from temporary table with conflict handling
    local insert_result
    local success=false
    
    # Strategy 1: Try primary key conflict resolution
    if [[ -n "$primary_key_cols" ]] && [[ "$success" == "false" ]]; then
        log_debug "Trying Strategy 1: ON CONFLICT with primary key columns: $primary_key_cols"
        insert_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "
            INSERT INTO \"$table\" 
            SELECT * FROM \"$temp_table\"
            ON CONFLICT ($primary_key_cols) DO NOTHING;
        " 2>&1)
        
        if ! echo "$insert_result" | grep -q "ERROR"; then
            success=true
            log_debug "Strategy 1 succeeded"
        else
            log_debug "Strategy 1 failed: $insert_result"
        fi
    fi
    
    # Strategy 2: Try unique constraint by constraint/index name
    if [[ -n "$unique_constraint_name" ]] && [[ "$success" == "false" ]]; then
        # First try as a constraint name
        log_debug "Trying Strategy 2a: ON CONFLICT ON CONSTRAINT: $unique_constraint_name"
        insert_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "
            INSERT INTO \"$table\" 
            SELECT * FROM \"$temp_table\"
            ON CONFLICT ON CONSTRAINT \"$unique_constraint_name\" DO NOTHING;
        " 2>&1)
        
        if ! echo "$insert_result" | grep -q "ERROR"; then
            success=true
            log_debug "Strategy 2a succeeded"
        else
            log_debug "Strategy 2a failed: $insert_result"
            
            # Try as an index name (remove any idx_ prefix patterns)
            local clean_index_name="$unique_constraint_name"
            if [[ "$unique_constraint_name" =~ ^idx_[0-9]+_ ]]; then
                clean_index_name=$(echo "$unique_constraint_name" | sed 's/^idx_[0-9]*_//')
            fi
            
            if [[ "$clean_index_name" != "$unique_constraint_name" ]]; then
                log_debug "Trying Strategy 2b: ON CONFLICT using cleaned index name: $clean_index_name"
                insert_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "
                    INSERT INTO \"$table\" 
                    SELECT * FROM \"$temp_table\"
                    ON CONFLICT ON CONSTRAINT \"$clean_index_name\" DO NOTHING;
                " 2>&1)
                
                if ! echo "$insert_result" | grep -q "ERROR"; then
                    success=true
                    log_debug "Strategy 2b succeeded"
                else
                    log_debug "Strategy 2b failed: $insert_result"
                fi
            fi
        fi
    fi
    
    # Strategy 3: Try unique constraint by columns
    if [[ -n "$unique_constraint_cols" ]] && [[ "$success" == "false" ]]; then
        log_debug "Trying Strategy 3: ON CONFLICT with unique constraint columns: $unique_constraint_cols"
        insert_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "
            INSERT INTO \"$table\" 
            SELECT * FROM \"$temp_table\"
            ON CONFLICT ($unique_constraint_cols) DO NOTHING;
        " 2>&1)
        
        if ! echo "$insert_result" | grep -q "ERROR"; then
            success=true
            log_debug "Strategy 3 succeeded"
        else
            log_debug "Strategy 3 failed: $insert_result"
        fi
    fi
    
    # Strategy 4: Fallback to NOT EXISTS approach
    if [[ "$success" == "false" ]]; then
        log_debug "Trying Strategy 4: NOT EXISTS approach (fallback)"
        
        # Get all column names with proper quoting for reserved words
        local all_columns=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -t -c "
            SELECT string_agg(
                CASE WHEN column_name IN ('from', 'to', 'order', 'user', 'group', 'table', 'select', 'where', 'insert', 'update', 'delete') 
                     THEN '\"' || column_name || '\"' 
                     ELSE column_name 
                END, 
                ', ' ORDER BY ordinal_position
            )
            FROM information_schema.columns 
            WHERE table_name = '$table' AND table_schema = 'public';
        " 2>/dev/null | xargs)
        
        log_debug "Strategy 4 column list: '$all_columns'"
        
        # Use a more conservative approach - check if exact row exists
        insert_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "
            INSERT INTO \"$table\" ($all_columns)
            SELECT $all_columns FROM \"$temp_table\" t1
            WHERE NOT EXISTS (
                SELECT 1 FROM \"$table\" t2 
                WHERE (t1.id IS NOT NULL AND t2.id IS NOT NULL AND t1.id = t2.id) 
                   OR (t1.created IS NOT NULL AND t2.created IS NOT NULL AND t1.created = t2.created AND coalesce(t1.id, 0) = coalesce(t2.id, 0))
            );
        " 2>&1)
        
        if ! echo "$insert_result" | grep -q "ERROR"; then
            success=true
            log_debug "Strategy 4 succeeded"
        else
            log_debug "Strategy 4 failed: $insert_result"
        fi
    fi
    
    # Check insert result
    if [[ "$success" == "true" ]] && echo "$insert_result" | grep -q "INSERT"; then
        local rows_inserted=$(echo "$insert_result" | grep "INSERT" | awk '{print $3}')
        local rows_loaded_num=$(echo "$copy_result" | grep "COPY" | awk '{print $2}')
        local duplicates_skipped=$((rows_loaded_num - rows_inserted))
        
        if [[ $duplicates_skipped -gt 0 ]]; then
            log_success "Imported $rows_inserted rows into table '$table' (skipped $duplicates_skipped duplicates)"
        else
            log_success "Imported $rows_inserted rows into table '$table'"
        fi
    elif [[ "$success" == "true" ]]; then
        log_success "Import completed for table '$table' (couldn't parse exact row count)"
    else
        log_error "All import strategies failed for table '$table'. Last error: $insert_result"
        return 1
    fi
    
    # Clean up temporary table
    local cleanup_result
    cleanup_result=$(PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" -c "DROP TABLE IF EXISTS \"$temp_table\";" 2>&1)
    log_debug "Cleaned up temporary table: $cleanup_result"
    
    return 0
}

# Function to create indexes
create_indexes_for_table() {
    local table=$1
    
    if [[ "$CREATE_INDEXES" != "true" ]]; then
        return 0
    fi
    
    log_progress "Creating indexes for table '$table'..."
    
    # Get index definitions from SQLite
    local indexes=$(sqlite3 "$SQLITE_DB_PATH" "SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='$table' AND sql IS NOT NULL;" 2>/dev/null)
    
    if [[ -n "$indexes" ]]; then
        local index_count=0
        while IFS= read -r index_sql; do
            if [[ -n "$index_sql" ]] && [[ "$index_sql" != *"sqlite_autoindex"* ]]; then
                # Convert SQLite index to PostgreSQL format
                local pg_index_sql=$(echo "$index_sql" | sed -e "s/\`//g")
                
                if echo "$pg_index_sql" | PGSSLMODE=prefer psql "postgresql://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE" > /dev/null 2>&1; then
                    index_count=$((index_count + 1))
                    log_debug "Created index: $(echo "$pg_index_sql" | grep -o 'INDEX [^ ]*' | cut -d' ' -f2)"
                fi
            fi
        done <<< "$indexes"
        
        if [[ $index_count -gt 0 ]]; then
            log_success "Created $index_count indexes for table '$table'"
        else
            log_info "No indexes created for table '$table'"
        fi
    else
        log_debug "No indexes found for table '$table'"
    fi
}

# Function to generate migration report
generate_report() {
    local total_tables=$1
    local successful=$2
    local failed=$3
    local skipped=$4
    local start_time=$5
    local end_time=$6
    
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    echo
    echo "==============================================="
    echo "           MIGRATION REPORT"
    echo "==============================================="
    echo "Start time: $(date -r $start_time)"
    echo "End time: $(date -r $end_time)"
    echo "Duration: ${minutes}m ${seconds}s"
    echo
    echo "Total tables found: $total_tables"
    echo "Successfully migrated: $successful"
    echo "Failed: $failed"
    echo "Skipped: $skipped"
    echo "==============================================="
    
    if [[ $failed -eq 0 ]]; then
        log_success "🎉 All tables migrated successfully!"
    else
        log_warning "⚠️  Some tables failed to migrate. Check the logs above."
    fi
}

# =============================================================================
# MAIN MIGRATION FUNCTION
# =============================================================================

migrate_all_tables() {
    local start_time=$(date +%s)
    
    log_info "🚀 Starting SQLite to PostgreSQL migration..."
    log_info "📂 SQLite DB: $SQLITE_DB_PATH"
    log_info "🐘 PostgreSQL: $PG_HOST:$PG_PORT/$PG_DATABASE"
    
    if [[ "$INCREMENTAL_MODE" == "true" ]]; then
        log_info "🔄 Mode: Incremental (preserving existing data)"
    else
        log_info "🔄 Mode: Full migration (replacing all data)"
    fi
    
    if [[ -n "$SINCE_DATE" ]]; then
        log_info "📅 Date filter: Records created since $SINCE_DATE"
    else
        log_info "📅 Date filter: All records (no date filter)"
    fi
    
    echo
    
    # Validate inputs
    if [[ ! -f "$SQLITE_DB_PATH" ]]; then
        log_error "SQLite database not found: $SQLITE_DB_PATH"
        exit 1
    fi
    
    # Test PostgreSQL connection
    if ! test_postgres_connection; then
        exit 1
    fi
    
    # Create working directory
    mkdir -p "$WORK_DIR"
    log_info "📁 Working directory: $WORK_DIR"
    
    # Get list of all tables
    log_info "📋 Getting list of tables..."
    local tables=$(sqlite3 "$SQLITE_DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null)
    
    if [[ -z "$tables" ]]; then
        log_error "No tables found in SQLite database"
        exit 1
    fi
    
    local table_array=()
    while IFS= read -r table; do
        if [[ -n "$table" ]]; then
            table_array+=("$table")
        fi
    done <<< "$tables"
    
    local total_tables=${#table_array[@]}
    log_info "Found $total_tables tables"
    
    # Initialize counters
    local successful=0
    local failed=0
    local skipped=0
    local processed=0
    
    # Process each table
    for table in "${table_array[@]}"; do
        processed=$((processed + 1))
        
        echo
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_info "Processing table $processed/$total_tables: '$table'"
        
        # Show progress bar
        show_progress $processed $total_tables
        echo
        
        # Check if table should be excluded
        if is_excluded "$table"; then
            log_warning "Skipping excluded table: '$table'"
            skipped=$((skipped + 1))
            continue
        fi
        
        # Get table info
        local row_count=$(get_table_info "$table")
        if [[ -n "$SINCE_DATE" ]] && has_created_column "$table"; then
            local total_rows=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM \`$table\`;" 2>/dev/null || echo "0")
            log_info "Table '$table' has $row_count rows (since $SINCE_DATE) out of $total_rows total"
        else
            log_info "Table '$table' has $row_count rows"
            if [[ -n "$SINCE_DATE" ]]; then
                log_warning "Table '$table' does not have 'created' column - migrating all records"
            fi
        fi
        
        # Skip empty tables if configured
        if [[ "$SKIP_EMPTY_TABLES" == "true" ]] && [[ "$row_count" -eq 0 ]]; then
            log_warning "Skipping empty table: '$table'"
            skipped=$((skipped + 1))
            continue
        fi
        
        # Export table to CSV
        local csv_file
        if csv_file=$(export_table_to_csv "$table"); then
            log_debug "Export returned CSV path: $csv_file"
            log_debug "File exists after export: $(if [[ -f "$csv_file" ]]; then echo "YES"; else echo "NO"; fi)"
            log_debug "File permissions: $(if [[ -f "$csv_file" ]]; then ls -la "$csv_file"; else echo "N/A"; fi)"
            
            # Create table structure
            if create_table_structure "$table"; then
                # Import CSV data
                if import_csv_to_postgres "$table" "$csv_file"; then
                    # Create indexes
                    create_indexes_for_table "$table"
                    successful=$((successful + 1))
                    log_success "✅ Completed table '$table'"
                else
                    failed=$((failed + 1))
                    log_error "❌ Failed to import data for '$table'"
                fi
            else
                failed=$((failed + 1))
                log_error "❌ Failed to create structure for '$table'"
            fi
            
            # Clean up CSV file
            rm -f "$csv_file"
        else
            failed=$((failed + 1))
            log_error "❌ Failed to export table '$table'"
        fi
    done
    
    # Clean up working directory
    rm -rf "$WORK_DIR"
    
    # Generate final report
    local end_time=$(date +%s)
    generate_report $total_tables $successful $failed $skipped $start_time $end_time
}

# =============================================================================
# DEPENDENCY CHECKS AND SCRIPT EXECUTION
# =============================================================================

check_dependencies() {
    local missing_deps=()
    
    command -v sqlite3 >/dev/null 2>&1 || missing_deps+=("sqlite3")
    command -v psql >/dev/null 2>&1 || missing_deps+=("psql")
    command -v pgloader >/dev/null 2>&1 || missing_deps+=("pgloader")
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        echo
        echo "Install instructions:"
        echo "  - sqlite3: brew install sqlite"
        echo "  - psql: brew install postgresql"
        echo "  - pgloader: brew install pgloader"
        exit 1
    fi
}

# Main execution
main() {
    if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    log_info "🔍 Checking dependencies..."
    check_dependencies
    
    migrate_all_tables
}

# Run the script
main "$@"
