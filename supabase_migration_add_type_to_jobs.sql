-- Add 'type' column to jobs table if it doesn't exist
-- This migration adds the type column to track job types (image_edit, video_generation, etc.)

-- Check if column exists and add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE jobs 
        ADD COLUMN type TEXT;
        
        -- Add comment for documentation
        COMMENT ON COLUMN jobs.type IS 'Job type: image_edit, video_generation, etc.';
    END IF;
END $$;

