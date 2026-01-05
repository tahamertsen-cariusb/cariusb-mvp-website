-- Fix jobs table: Ensure jobid column has a default UUID generation
-- This assumes jobid is a UUID primary key that should auto-generate

-- Option 1: If jobid should auto-generate UUIDs, add default
-- (Only run this if jobid doesn't already have a default)
ALTER TABLE jobs 
ALTER COLUMN jobid SET DEFAULT gen_random_uuid();

-- Option 2: If the primary key should be 'id' instead of 'jobid', rename it
-- (Only run this if you want to standardize to 'id')
-- ALTER TABLE jobs RENAME COLUMN jobid TO id;

-- Check current structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

