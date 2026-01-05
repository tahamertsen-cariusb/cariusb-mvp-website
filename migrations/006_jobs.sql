-- =====================================================
-- 006_jobs.sql
-- İş Kuyruğu Tablosu
-- =====================================================
-- Bağımlılık: auth.users, projects
-- =====================================================

-- Jobs tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobid TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  project_id UUID,
  mode TEXT, -- Nullable (fix_jobs_mode_nullable.sql'den)
  type TEXT, -- Job type: image_edit, video_generation, etc.
  plan TEXT DEFAULT 'free',
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  options JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Foreign Keys
DO $$
BEGIN
  -- auth.users'a bağla
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'jobs_user_id_fkey'
  ) THEN
    ALTER TABLE public.jobs 
    ADD CONSTRAINT jobs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- projects'a bağla (nullable)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'jobs_project_id_fkey'
  ) THEN
    ALTER TABLE public.jobs 
    ADD CONSTRAINT jobs_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS jobs_pkey ON public.jobs USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS jobs_jobid_key ON public.jobs USING btree (jobid);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON public.jobs USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_jobs_mode ON public.jobs USING btree (mode);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs USING btree (type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs USING btree (created_at DESC);

-- Updated_at trigger'ı ekle
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.jobs IS 'AI iş kuyruğu - render ve işlem takibi';
COMMENT ON COLUMN public.jobs.jobid IS 'Human-readable job identifier (unique)';
COMMENT ON COLUMN public.jobs.mode IS 'AI mod: bodykitImage, paintImage, rimImage, vb. (nullable)';
COMMENT ON COLUMN public.jobs.type IS 'Job type: image_edit, video_generation, etc.';
COMMENT ON COLUMN public.jobs.status IS 'İş durumu: pending, processing, completed, failed';
COMMENT ON COLUMN public.jobs.options IS 'İş seçenekleri (JSON)';

-- =====================================================
-- Migration Tamamlandı: Jobs
-- =====================================================

