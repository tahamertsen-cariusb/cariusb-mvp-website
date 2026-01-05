-- =====================================================
-- 009_profile_names_rpc.sql
-- Canonical profile name update via RPC (prod-safe)
-- =====================================================

-- POST /rest/v1/rpc/set_profile_names
-- Body: { "p_full_name": "Optional", "p_community_user_name": "Optional" }
--
-- Notes:
-- - Uses auth.uid() to scope updates to the caller.
-- - Inserts the profiles row if missing.
-- - Updates posts.user_community_name for the caller to keep Community consistent.
CREATE OR REPLACE FUNCTION public.set_profile_names(
  p_full_name text DEFAULT NULL,
  p_community_user_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_full_name text;
  v_community text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_full_name := NULLIF(btrim(COALESCE(p_full_name, '')), '');
  v_community := NULLIF(btrim(COALESCE(p_community_user_name, '')), '');

  IF v_full_name IS NULL AND v_community IS NULL THEN
    RAISE EXCEPTION 'Provide p_full_name, p_community_user_name, or both';
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  -- Fallbacks
  IF v_full_name IS NULL THEN
    v_full_name := v_community;
  END IF;
  IF v_community IS NULL THEN
    v_community := v_full_name;
  END IF;
  IF v_full_name IS NULL THEN
    v_full_name := COALESCE(split_part(v_email, '@', 1), 'User');
  END IF;
  IF v_community IS NULL THEN
    v_community := COALESCE(split_part(v_email, '@', 1), 'User');
  END IF;

  INSERT INTO public.profiles (id, email, full_name, display_name, community_user_name)
  VALUES (v_user_id, v_email, v_full_name, v_community, v_community)
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    community_user_name = COALESCE(EXCLUDED.community_user_name, public.profiles.community_user_name),
    updated_at = now();

  UPDATE public.posts
  SET user_community_name = v_community
  WHERE user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_names(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_names(text, text) TO authenticated;
