# SQLite to PostgreSQL Migration Scripts

This directory contains automated scripts to migrate all tables from SQLite to PostgreSQL using the efficient CSV export/import method.

## 📁 Files

- `migrate_sqlite_to_postgres_enhanced.sh` - **Main script** (recommended)
- `migrate_sqlite_to_postgres.sh` - Basic version
- `migration_config.env` - Configuration file
- `data.load` - Original pgloader script for single tables

## 🚀 Quick Start

### 1. Configure the migration

Edit `migration_config.env`:

```bash
# Update these values for your setup
SQLITE_DB_PATH="/path/to/your/database.db"
PG_HOST="your-postgres-host"
PG_PORT="5432"
PG_DATABASE="your_database"
PG_USER="your_user"
PG_PASSWORD="your_password"

# Tables to exclude (system tables, etc.)
EXCLUDE_TABLES="_litestream_lock _litestream_seq _migrations"

# Options
SKIP_EMPTY_TABLES=false
CREATE_INDEXES=true
VERBOSE=true
```

### 2. Run the migration

```bash
# Run with default config (all records)
./scripts/migrate_sqlite_to_postgres_enhanced.sh

# Run with date filtering (only records created since 2024-01-01)
./scripts/migrate_sqlite_to_postgres_enhanced.sh --since=2024-01-01

# Run with custom config and date filtering
./scripts/migrate_sqlite_to_postgres_enhanced.sh my_config.env --since=2024-06-01

# See help
./scripts/migrate_sqlite_to_postgres_enhanced.sh --help
```

## ✨ Features

### Enhanced Script Features:

- 🎯 **Automatic table discovery** - Finds all tables in SQLite database
- 🚀 **Fast CSV method** - Uses efficient CSV export/import for large datasets
- 📊 **Progress tracking** - Shows progress bar and detailed status
- 🎨 **Colored output** - Easy to read logs with color coding
- 🔧 **Configurable** - Easy configuration via environment file
- 🛡️ **Error handling** - Robust error handling and recovery
- 📝 **Detailed reporting** - Comprehensive migration report
- 🏗️ **Index creation** - Automatically creates indexes from SQLite
- 🎛️ **Flexible filtering** - Exclude specific tables from migration
- 📅 **Date filtering** - Migrate only records created after a specific date

### Process Overview:

1. **Discovery** - Scans SQLite database for all tables
2. **Export** - Exports each table to CSV format
3. **Structure** - Creates table structure in PostgreSQL using pgloader
4. **Import** - Uses PostgreSQL COPY command for fast data import
5. **Indexes** - Creates indexes based on SQLite schema
6. **Report** - Generates detailed migration report

## 📊 Example Output

```
🚀 Starting SQLite to PostgreSQL migration...
📂 SQLite DB: /path/to/database.db
🐘 PostgreSQL: localhost:5432/mydb

✓ PostgreSQL connection successful
📁 Working directory: ./migration_temp
📋 Getting list of tables...
Found 15 tables

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] Processing table 1/15: 'accounts'
[====================] 100% (1/15)
[→] Exporting table 'accounts' to CSV...
[✓] Exported 'accounts': 148 rows, 53.5K
[→] Creating table structure for 'accounts'...
[✓] Created table structure for 'accounts'
[→] Importing CSV data for table 'accounts'...
[✓] Imported 148 rows into table 'accounts'
[→] Creating indexes for table 'accounts'...
[✓] Created 2 indexes for table 'accounts'
[✓] ✅ Completed table 'accounts'

===============================================
           MIGRATION REPORT
===============================================
Duration: 2m 34s
Total tables found: 15
Successfully migrated: 14
Failed: 0
Skipped: 1
===============================================
[✓] 🎉 All tables migrated successfully!
```

## � Date Filtering

The script supports filtering records by creation date using the `--since` parameter:

### Usage Examples:

```bash
# Migrate only records created since January 1st, 2024
./scripts/migrate_sqlite_to_postgres_enhanced.sh --since=2024-01-01

# Migrate only recent records (since June 1st, 2024)
./scripts/migrate_sqlite_to_postgres_enhanced.sh --since=2024-06-01

# Combine with custom config
./scripts/migrate_sqlite_to_postgres_enhanced.sh my_config.env --since=2024-01-01
```

### How It Works:

- ✅ **Smart detection** - Automatically detects which tables have a 'created' column
- 🎯 **Selective filtering** - Only applies to tables with 'created' column
- 📊 **Full migration fallback** - Tables without 'created' column migrate all records
- 📈 **Progress reporting** - Shows filtered vs total record counts

### Date Format:

- Must use **YYYY-MM-DD** format (ISO 8601)
- Examples: `2024-01-01`, `2023-12-31`, `2024-06-15`
- Uses `>=` comparison (greater than or equal to)

### Tables with Date Filtering Support:

Based on your database, these tables support date filtering:

- `accounts` - User accounts
- `leads` - Lead records
- `messages` - Message data
- `conversations` - Conversation history
- `templates` - Template records
- And more...

### Use Cases:

- 🔄 **Incremental migrations** - Only migrate new data since last migration
- 🗂️ **Recent data only** - Focus on current/active records
- 🔍 **Testing migrations** - Use recent small dataset for testing
- 📈 **Performance** - Reduce migration time for large databases

## �🔧 Customization

### Exclude Tables

Add table names to `EXCLUDE_TABLES` in config:

```bash
EXCLUDE_TABLES="_litestream_lock _migrations system_table"
```

### Large Tables

For very large tables (1M+ rows), the script automatically:

- Uses smaller batch sizes
- Shows progress updates
- Handles memory efficiently

### Error Recovery

If a table fails:

- Script continues with remaining tables
- Failed tables are reported at the end
- CSV files are cleaned up automatically

## 🐛 Troubleshooting

### Common Issues:

1. **Connection Failed**

   - Check PostgreSQL credentials in config
   - Ensure database exists
   - Verify network connectivity

2. **Permission Denied**

   - Make script executable: `chmod +x migrate_sqlite_to_postgres_enhanced.sh`
   - Check file permissions for SQLite database

3. **Table Already Exists**

   - Script uses `DROP` by default to recreate tables
   - Check PostgreSQL logs for detailed errors

4. **Large Table Timeout**
   - Use CSV method (automatic for large tables)
   - Increase PostgreSQL timeout settings if needed

### Debug Mode:

Set `VERBOSE=true` in config for detailed debugging output.

## 🎯 Performance Tips

- **For large databases (>1GB)**: Run during off-peak hours
- **For many tables**: Use SSD storage for temporary CSV files
- **For remote PostgreSQL**: Ensure good network connection
- **Memory usage**: Script is optimized for memory efficiency

## 📝 Notes

- Original table structure and indexes are preserved
- JSON columns are handled correctly
- Foreign key constraints may need manual adjustment
- Large tables use CSV method automatically for better performance

Enjoy your automated SQLite to PostgreSQL migration! 🎉
