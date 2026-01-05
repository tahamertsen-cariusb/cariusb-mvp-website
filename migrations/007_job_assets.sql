-- =====================================================
-- 007_job_assets.sql
-- İş-Varlık İlişkisi Tablosu
-- =====================================================
-- Bağımlılık: jobs, assets
-- =====================================================

-- Job_assets tablosunu oluştur (many-to-many ilişki)
CREATE TABLE IF NOT EXISTS public.job_assets (
  job_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('input', 'output')),
  PRIMARY KEY (job_id, asset_id)
);

-- Foreign Keys
DO $$
BEGIN
  -- jobs'a bağla
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'job_assets_job_id_fkey'
  ) THEN
    ALTER TABLE public.job_assets 
    ADD CONSTRAINT job_assets_job_id_fkey 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
  END IF;

  -- assets'e bağla
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'job_assets_asset_id_fkey'
  ) THEN
    ALTER TABLE public.job_assets 
    ADD CONSTRAINT job_assets_asset_id_fkey 
    FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS job_assets_pkey ON public.job_assets USING btree (job_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_job_assets_job_id ON public.job_assets USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_job_assets_asset_id ON public.job_assets USING btree (asset_id);
CREATE INDEX IF NOT EXISTS idx_job_assets_purpose ON public.job_assets USING btree (purpose);

-- Comments
COMMENT ON TABLE public.job_assets IS 'İş-varlık ilişkisi (many-to-many)';
COMMENT ON COLUMN public.job_assets.purpose IS 'Varlık amacı: input (girdi) veya output (çıktı)';

-- =====================================================
-- Migration Tamamlandı: Job_Assets
-- =====================================================

