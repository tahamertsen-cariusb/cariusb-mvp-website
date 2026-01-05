-- =====================================================
-- 010_avatars_storage_policies_and_rpc.sql
-- Avatars bucket policies + RPC to persist avatar_url
-- =====================================================

-- Prereq (you already did): create a Storage bucket named 'avatars'
-- Recommended: set the bucket to Public if you want avatars visible in Community.

-- =====================================================
-- Step 1) Storage RLS policies (storage.objects)
-- =====================================================

-- Note: On Supabase, RLS is typically already enabled on storage.objects.
-- If you hit "must be owner of table objects" in SQL Editor, remove/skip any ALTER TABLE lines.

-- 1.a) Public read access for avatars (needed for Community pages).
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- 1.b) Allow authenticated users to upload avatars under their own folder:
-- Object name should look like: "<auth.uid()>/<filename>"
DROP POLICY IF EXISTS "avatars_user_insert_own_folder" ON storage.objects;
CREATE POLICY "avatars_user_insert_own_folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 1.c) Allow authenticated users to update/overwrite their own avatar objects.
DROP POLICY IF EXISTS "avatars_user_update_own_folder" ON storage.objects;
CREATE POLICY "avatars_user_update_own_folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 1.d) Allow authenticated users to delete their own avatar objects.
DROP POLICY IF EXISTS "avatars_user_delete_own_folder" ON storage.objects;
CREATE POLICY "avatars_user_delete_own_folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- Step 2) RPC: set_profile_avatar_url
-- =====================================================

-- POST /rest/v1/rpc/set_profile_avatar_url
-- Body: { "p_avatar_url": "https://.../storage/v1/object/public/avatars/<uid>/avatar.png" }
--
-- This function:
-- - Validates the caller is authenticated.
-- - Validates the URL belongs to the caller's folder in the avatars bucket.
-- - Updates profiles.avatar_url (creates profile row if missing).
CREATE OR REPLACE FUNCTION public.set_profile_avatar_url(p_avatar_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_url text;
  v_owner_marker text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_url := NULLIF(btrim(COALESCE(p_avatar_url, '')), '');
  IF v_url IS NULL THEN
    RAISE EXCEPTION 'Provide p_avatar_url';
  END IF;

  -- Require the URL to point into this user's avatars folder.
  v_owner_marker := '/avatars/' || v_user_id::text || '/';
  IF position(v_owner_marker in v_url) = 0 THEN
    RAISE EXCEPTION 'Invalid avatar_url (must be in your avatars folder)';
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  INSERT INTO public.profiles (id, email, avatar_url)
  VALUES (v_user_id, v_email, v_url)
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_avatar_url(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_avatar_url(text) TO authenticated;
