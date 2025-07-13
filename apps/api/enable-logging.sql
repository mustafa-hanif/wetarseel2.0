-- Enable query logging for current session
SET log_statement = 'all';
SET log_min_duration_statement = 0;

-- Check current logging settings
SHOW log_statement;
SHOW log_min_duration_statement;

-- To disable logging later:
-- SET log_statement = 'none';
-- SET log_min_duration_statement = -1;
