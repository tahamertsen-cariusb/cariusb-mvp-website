-- =====================================================
-- 003_credits.sql
-- Kredi Sistemi Tablosu
-- =====================================================
-- Bağımlılık: auth.users
-- =====================================================

-- Credits tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Foreign Key: auth.users'a bağla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'credits_user_id_fkey'
  ) THEN
    ALTER TABLE public.credits 
    ADD CONSTRAINT credits_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes (Performans için)
CREATE UNIQUE INDEX IF NOT EXISTS credits_pkey ON public.credits USING btree (id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_credits_created_at ON public.credits USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_source ON public.credits USING btree (source);

-- Comments
COMMENT ON TABLE public.credits IS 'Kullanıcı kredi işlemleri (pozitif = ekleme, negatif = harcama)';
COMMENT ON COLUMN public.credits.amount IS 'Kredi miktarı (pozitif = ekleme, negatif = harcama)';
COMMENT ON COLUMN public.credits.source IS 'Kredi kaynağı: signup, purchase, bonus, deduction, vb.';

-- =====================================================
-- Migration Tamamlandı: Credits
-- =====================================================

