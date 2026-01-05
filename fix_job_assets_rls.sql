-- Fix job_assets table: Add Row-Level Security policies
-- This allows authenticated users to insert their own job_asset records

-- Enable RLS on job_assets table if not already enabled
ALTER TABLE job_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to insert job_assets for jobs they own
-- This assumes jobs table has a user_id column
-- Note: Casting to handle type mismatch between job_id (text) and jobid (uuid)
CREATE POLICY "Users can insert their own job_assets"
ON job_assets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.jobid::text = job_assets.job_id::text
    AND jobs.user_id = auth.uid()
  )
);

-- Policy: Allow users to view job_assets for jobs they own
CREATE POLICY "Users can view their own job_assets"
ON job_assets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.jobid::text = job_assets.job_id::text
    AND jobs.user_id = auth.uid()
  )
);

-- Policy: Allow users to update job_assets for jobs they own
CREATE POLICY "Users can update their own job_assets"
ON job_assets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.jobid::text = job_assets.job_id::text
    AND jobs.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.jobid::text = job_assets.job_id::text
    AND jobs.user_id = auth.uid()
  )
);

-- Policy: Allow users to delete job_assets for jobs they own
CREATE POLICY "Users can delete their own job_assets"
ON job_assets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.jobid::text = job_assets.job_id::text
    AND jobs.user_id = auth.uid()
  )
);

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
WHERE tablename = 'job_assets';

