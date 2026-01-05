# Supabase Authentication Setup

Bu proje Supabase Authentication kullanmaktadır. Kurulum için aşağıdaki adımları izleyin:

## 1. Supabase Projesi Oluşturma

1. [Supabase](https://supabase.com) adresine gidin
2. Yeni bir proje oluşturun veya mevcut projenizi kullanın
3. Proje ayarlarından (Settings > API) şu bilgileri alın:
   - Project URL
   - Anon (public) key

## 2. Environment Variables

Proje root dizininde `.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Örnek:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Supabase Dashboard Ayarları

### Authentication Ayarları

1. Supabase Dashboard > Authentication > URL Configuration
2. **Site URL** alanına: `http://localhost:3000` (development için)
3. **Redirect URLs** alanına ekleyin:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (production için)

### OAuth Providers (Opsiyonel)

Google veya GitHub ile giriş yapmak için:

1. Supabase Dashboard > Authentication > Providers
2. İstediğiniz provider'ı aktif edin (Google, GitHub, vb.)
3. Client ID ve Client Secret bilgilerini girin
4. Provider'ın ayarlarından callback URL'lerini yapılandırın

## 4. Database Tabloları

Eğer `assets` tablosu gibi veritabanı tabloları kullanıyorsanız, bunları Supabase'de oluşturmanız gerekir.

Örnek `assets` tablosu:

```sql
CREATE TABLE assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  type TEXT NOT NULL,
  role TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) politikaları
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assets"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## 5. Test Etme

1. Development server'ı başlatın:
   ```bash
   npm run dev
   ```

2. Tarayıcıda `http://localhost:3000` adresine gidin
3. Sign up veya Login sayfasından hesap oluşturun/giriş yapın
4. Dashboard'a yönlendirildiğinizi kontrol edin

## Özellikler

- ✅ Email/Password authentication
- ✅ OAuth (Google, GitHub) desteği
- ✅ Session management
- ✅ Protected routes (middleware)
- ✅ Auto-redirect for authenticated/unauthenticated users
- ✅ Logout functionality

## Sorun Giderme

- **"Invalid API key" hatası**: `.env.local` dosyasındaki değişkenleri kontrol edin
- **OAuth callback hatası**: Redirect URL'lerinin Supabase Dashboard'da doğru yapılandırıldığından emin olun
- **Session bulunamıyor**: Middleware'in doğru çalıştığından ve cookie ayarlarının doğru olduğundan emin olun

