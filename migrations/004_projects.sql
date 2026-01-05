-- =====================================================
-- 004_projects.sql
-- Projeler Tablosu
-- =====================================================
-- Bağımlılık: auth.users
-- =====================================================

-- Projects tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  thumbnail_url TEXT,
  type TEXT NOT NULL DEFAULT 'rim' CHECK (type IN ('video', 'rim')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Foreign Key: auth.users'a bağla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'projects_user_id_fkey'
  ) THEN
    ALTER TABLE public.projects 
    ADD CONSTRAINT projects_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes (Optimize edilmiş)
CREATE UNIQUE INDEX IF NOT EXISTS projects_pkey ON public.projects USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS projects_project_id_idx ON public.projects(project_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS projects_type_idx ON public.projects(type);
-- Composite index for dashboard queries (user_id + created_at)
CREATE INDEX IF NOT EXISTS projects_user_created_idx ON public.projects(user_id, created_at DESC);

-- Updated_at trigger'ı ekle
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.projects IS 'Kullanıcı projeleri - araç görselleştirme projeleri';
COMMENT ON COLUMN public.projects.id IS 'Unique project identifier (UUID)';
COMMENT ON COLUMN public.projects.user_id IS 'Proje sahibi kullanıcı ID';
COMMENT ON COLUMN public.projects.project_id IS 'Human-readable project identifier (unique)';
COMMENT ON COLUMN public.projects.title IS 'Proje başlığı';
COMMENT ON COLUMN public.projects.description IS 'Proje açıklaması (opsiyonel)';
COMMENT ON COLUMN public.projects.thumbnail_url IS 'Proje thumbnail görsel URL';
COMMENT ON COLUMN public.projects.type IS 'Proje tipi: video veya rim';

-- =====================================================
-- Migration Tamamlandı: Projects
-- =====================================================

