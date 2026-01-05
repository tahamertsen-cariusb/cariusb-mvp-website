-- =====================================================
-- 007_jobs_status_completed_all.sql
-- Keep jobs.status constraint and make mark_job_completed_all write 'completed'
-- =====================================================

-- Ensure status constraint stays compatible with frontend/state expectations.
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Supabase RPC expects: POST /rest/v1/rpc/mark_job_completed_all { "p_jobid": "job_..." }
-- This should mark the given job as completed (not "completed_all") to satisfy the constraint.
CREATE OR REPLACE FUNCTION public.mark_job_completed_all(p_jobid text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.jobs
  SET
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE jobid = p_jobid;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_job_completed_all(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_job_completed_all(text) TO authenticated;
