-- =====================================================
-- 011_auth_trigger.sql
-- Auth Trigger (Yeni kullanıcı oluşturulduğunda)
-- =====================================================
-- Bağımlılık: profiles, credits, handle_new_user() fonksiyonu
-- =====================================================
-- NOT: Bu trigger auth.users tablosuna bağlanır
-- =====================================================

-- Mevcut trigger'ı kaldır (varsa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Yeni trigger'ı oluştur
-- Yeni kullanıcı oluşturulduğunda otomatik profil ve kredi oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Migration Tamamlandı: Auth Trigger
-- =====================================================

