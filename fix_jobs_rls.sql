-- Fix jobs table: Add Row-Level Security policies
-- This allows authenticated users to insert, view, update, and delete their own jobs

-- Enable RLS on jobs table if not already enabled
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can view their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON jobs;

-- Policy: Allow users to insert their own jobs
CREATE POLICY "Users can insert their own jobs"
ON jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to view their own jobs
CREATE POLICY "Users can view their own jobs"
ON jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to update their own jobs
CREATE POLICY "Users can update their own jobs"
ON jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own jobs
CREATE POLICY "Users can delete their own jobs"
ON jobs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Check if policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'jobs'
ORDER BY policyname;

