-- =====================================================
-- 002_profiles.sql
-- Kullanıcı Profilleri Tablosu
-- =====================================================
-- Bağımlılık: auth.users (Supabase built-in)
-- =====================================================

-- Profiller tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  user_plan TEXT NOT NULL DEFAULT 'free',
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Foreign Key: auth.users'a bağla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pkey ON public.profiles USING btree (id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);

-- Updated_at trigger'ı ekle
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.profiles IS 'Kullanıcı profil bilgileri';
COMMENT ON COLUMN public.profiles.id IS 'User ID (auth.users ile aynı)';
COMMENT ON COLUMN public.profiles.user_plan IS 'Kullanıcı planı: free, starter, pro, studio';

-- =====================================================
-- Migration Tamamlandı: Profiles
-- =====================================================

