-- =====================================================
-- 001_functions.sql
-- Database Functions (En temel katman - diğer her şey buna bağlı)
-- =====================================================
-- Bu migration, tüm trigger ve fonksiyonları oluşturur
-- Diğer migration'lar bu fonksiyonları kullanır
-- =====================================================

-- Updated_at otomatik güncelleme fonksiyonu
-- Tüm tablolarda updated_at kolonunu otomatik günceller
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Yeni kullanıcı oluşturulduğunda otomatik profil ve kredi oluştur
-- Bu fonksiyon auth.users tablosuna trigger olarak bağlanır
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Profil oluştur
  INSERT INTO public.profiles (id, email, display_name, avatar_url, user_plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Hoş geldin bonusu kredisi ekle (381k kredi = ~$10)
  INSERT INTO public.credits (user_id, amount, source, description)
  VALUES (
    NEW.id,
    381000,
    'signup',
    'Welcome bonus - 381k credits'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- Migration Tamamlandı: Functions
-- =====================================================

