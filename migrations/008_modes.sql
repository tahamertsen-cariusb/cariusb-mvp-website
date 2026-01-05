-- =====================================================
-- 008_modes.sql
-- AI Mod Referans Verileri Tablosu
-- =====================================================
-- Bağımlılık: Yok (bağımsız referans tablosu)
-- =====================================================

-- Modes tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL UNIQUE,
  prompt TEXT NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS modes_pkey ON public.modes USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS modes_mode_key ON public.modes USING btree (mode);

-- Comments
COMMENT ON TABLE public.modes IS 'AI mod referans verileri - tüm kullanılabilir modlar';
COMMENT ON COLUMN public.modes.mode IS 'Mod adı: bodykitImage, paintImage, rimImage, vb.';
COMMENT ON COLUMN public.modes.prompt IS 'Mod için AI prompt metni';

-- NOT: RLS bu tabloda YOK - Public read olmalı (herkes mod listesini görebilmeli)
-- RLS policy'leri 010_rls_policies.sql'de eklenir

-- =====================================================
-- Migration Tamamlandı: Modes
-- =====================================================

