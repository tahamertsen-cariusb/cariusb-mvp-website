-- =====================================================
-- 008_project_thumbnail_rpc.sql
-- Update project thumbnail from latest result asset
-- =====================================================

-- RPC: call from client or automation
-- POST /rest/v1/rpc/set_project_thumbnail
-- Body: { "p_project_id": "...", "p_thumbnail_url": "..." }
CREATE OR REPLACE FUNCTION public.set_project_thumbnail(
  p_project_id uuid,
  p_thumbnail_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_url text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_url := NULLIF(btrim(COALESCE(p_thumbnail_url, '')), '');
  IF v_url IS NULL THEN
    RAISE EXCEPTION 'Provide p_thumbnail_url';
  END IF;

  UPDATE public.projects
  SET
    thumbnail_url = v_url,
    updated_at = now()
  WHERE id = p_project_id
    AND user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_project_thumbnail(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_project_thumbnail(uuid, text) TO authenticated;

-- Optional: auto-apply on new result assets (no frontend needed)
CREATE OR REPLACE FUNCTION public.handle_asset_result_thumbnail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'result' AND NEW.project_id IS NOT NULL THEN
    -- Keep thumbnail aligned with latest generated result
    UPDATE public.projects
    SET
      thumbnail_url = NEW.url,
      updated_at = now()
    WHERE id = NEW.project_id
      AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assets_result_thumbnail ON public.assets;
CREATE TRIGGER assets_result_thumbnail
  AFTER INSERT ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_asset_result_thumbnail();
