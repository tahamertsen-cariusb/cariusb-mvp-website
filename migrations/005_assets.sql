-- =====================================================
-- 005_assets.sql
-- Dosya Varlıkları Tablosu
-- =====================================================
-- Bağımlılık: auth.users, projects
-- =====================================================

-- Assets tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  role TEXT NOT NULL CHECK (role IN ('source', 'result')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Foreign Keys
DO $$
BEGIN
  -- auth.users'a bağla
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'assets_user_id_fkey'
  ) THEN
    ALTER TABLE public.assets 
    ADD CONSTRAINT assets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- projects'a bağla (nullable, çünkü proje olmadan da asset olabilir)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'assets_project_id_fkey'
  ) THEN
    ALTER TABLE public.assets 
    ADD CONSTRAINT assets_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS assets_pkey ON public.assets USING btree (id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON public.assets USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_assets_role ON public.assets USING btree (role);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets USING btree (type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets USING btree (created_at DESC);

-- Comments
COMMENT ON TABLE public.assets IS 'Dosya varlıkları - yüklenen ve üretilen dosyalar';
COMMENT ON COLUMN public.assets.type IS 'Dosya tipi: image veya video';
COMMENT ON COLUMN public.assets.role IS 'Dosya rolü: source (kaynak) veya result (sonuç)';
COMMENT ON COLUMN public.assets.project_id IS 'İlişkili proje (opsiyonel)';

-- =====================================================
-- Migration Tamamlandı: Assets
-- =====================================================

