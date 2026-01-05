-- Make 'mode' column nullable in jobs table
-- This allows jobs to be created without requiring a mode value initially

ALTER TABLE jobs 
ALTER COLUMN mode DROP NOT NULL;

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jobs'
  AND column_name = 'mode';

