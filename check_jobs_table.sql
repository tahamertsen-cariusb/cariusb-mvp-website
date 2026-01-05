-- Check current structure of jobs table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

