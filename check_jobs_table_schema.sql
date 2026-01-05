-- Check the exact structure of jobs table including column names
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'jobs'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    a.attname AS column_name
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE n.nspname = 'public'
  AND t.relname = 'jobs'
  AND contype = 'p'; -- Primary key constraint

