-- =====================================================
-- 011_job_with_credits.sql
-- Atomic job creation + credit deduction
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_job_with_credits(
  p_jobid text,
  p_user_id uuid,
  p_project_id uuid,
  p_mode text,
  p_job_type text,
  p_credit_cost integer,
  p_credit_reason text
)
RETURNS TABLE (
  id uuid,
  jobid text,
  status text,
  mode text,
  type text,
  project_id uuid,
  new_balance integer
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance integer;
  v_job_id uuid;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM public.credits
  WHERE user_id = p_user_id;

  IF v_balance < p_credit_cost THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  INSERT INTO public.credits (user_id, amount, source, description)
  VALUES (p_user_id, -p_credit_cost, 'deduction', p_credit_reason);

  INSERT INTO public.jobs (jobid, user_id, project_id, status, type, mode)
  VALUES (p_jobid, p_user_id, p_project_id, 'pending', p_job_type, p_mode)
  RETURNING public.jobs.id INTO v_job_id;

  v_balance := v_balance - p_credit_cost;

  RETURN QUERY
  SELECT v_job_id, p_jobid, 'pending', p_mode, p_job_type, p_project_id, v_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_job_with_credits(
  text, uuid, uuid, text, text, integer, text
) TO authenticated;
