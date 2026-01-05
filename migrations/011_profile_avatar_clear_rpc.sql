-- =====================================================
-- 011_profile_avatar_clear_rpc.sql
-- Clear profile avatar via RPC
-- =====================================================

-- POST /rest/v1/rpc/clear_profile_avatar_url
-- Body: {}
CREATE OR REPLACE FUNCTION public.clear_profile_avatar_url()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET avatar_url = NULL,
      updated_at = now()
  WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_profile_avatar_url() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_profile_avatar_url() TO authenticated;

