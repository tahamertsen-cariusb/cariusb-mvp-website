# Frontend - Supabase İlişkileri Raporu

Bu rapor, frontend uygulamasının Supabase ile olan tüm ilişkilerini ve bunların kullanım sırasını detaylı olarak açıklamaktadır.

## 🎯 ÖNEMLİ ÖZET

**Supabase veritabanı işlemleri (tablo okuma/yazma) sadece 2 sayfada kullanılmaktadır:**

1. **My Garage (Dashboard)** - `src/app/dashboard/page.tsx`
   - Sadece `projects` tablosu ile çalışır
   - Proje listeleme, oluşturma, silme işlemleri

2. **Studio (Design Preview)** - `src/app/design-preview/page.tsx`
   - 5 farklı tablo ile çalışır: `projects`, `assets`, `profiles`, `jobs`, `job_assets`, `credits`
   - Tasarım yapma, asset yükleme, görsel üretme, job yönetimi

**Diğer sayfalar (login, signup, profile, billing)** sadece **authentication** işlemleri için Supabase kullanır, veritabanı tablolarına erişmez.

---

## 📋 İçindekiler

1. [Supabase Client Oluşturma](#1-supabase-client-oluşturma)
2. [Uygulama Başlangıcı ve İlk Yapılandırma](#2-uygulama-başlangıcı-ve-ilk-yapılandırma)
3. [Middleware - Oturum Yönetimi](#3-middleware---oturum-yönetimi)
4. [Authentication Provider](#4-authentication-provider)
5. [Kimlik Doğrulama İşlemleri](#5-kimlik-doğrulama-işlemleri)
6. [Veritabanı Tabloları ve İşlemler](#6-veritabanı-tabloları-ve-işlemler)
7. [Kredi Sistemi](#7-kredi-sistemi)
8. [Sayfa Bazlı İlişkiler](#8-sayfa-bazlı-ilişkiler)
9. [API Route'ları](#9-api-routeları)

---

## 1. Supabase Client Oluşturma

### 1.1. Client Tipleri

Frontend'de üç farklı Supabase client tipi kullanılmaktadır:

#### **Browser Client** (`src/lib/supabase/client.ts`)
- **Kullanım Amacı**: Client-side component'lerde kullanım
- **Oluşturma**: `createBrowserClient` (@supabase/ssr)
- **Export**: `createSupabaseClient()` fonksiyonu olarak export edilir
- **Kullanıldığı Yerler**: 
  - Tüm client component'ler
  - Sayfalar (login, signup, dashboard, profile, design-preview)
  - Hook'lar (useSupabaseAuth)
  - Utility fonksiyonları (credits/balance.ts)

#### **Server Client** (`src/lib/supabase/server.ts`)
- **Kullanım Amacı**: Server-side component'lerde ve API route'larında kullanım
- **Oluşturma**: `createServerClient` (@supabase/ssr)
- **Özellik**: Cookie yönetimi ile oturum bilgilerini saklar
- **Kullanıldığı Yerler**:
  - API route'ları (`/api/auth/callback`)
  - Server component'ler (gelecekte)

#### **Middleware Client** (`src/lib/supabase/middleware.ts`)
- **Kullanım Amacı**: Next.js middleware'de oturum kontrolü
- **Oluşturma**: `createServerClient` (@supabase/ssr)
- **Özellik**: Request cookie'lerini okur ve günceller
- **Kullanıldığı Yerler**:
  - `src/middleware.ts` - Her request'te çalışır

### 1.2. Environment Variables

Supabase bağlantısı için gerekli environment variable'lar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here (opsiyonel)
SUPABASE_DB_URL=postgresql://... (migration script'leri için)
```

**Validasyon**: `src/lib/env/validator.ts` dosyasında başlangıçta kontrol edilir.

---

## 2. Uygulama Başlangıcı ve İlk Yapılandırma

### 2.1. Layout.tsx - Uygulama Kökü

**Dosya**: `src/app/layout.tsx`

**Sıra**: 1. Adım (Uygulama başlangıcında)

**İşlemler**:
1. Environment variable validasyonu (`validateEnvOnStartup()`)
2. `AuthProvider` component'i ile sarmalama
3. `ErrorBoundaryProvider` ile hata yönetimi

**Supabase İlişkisi**: 
- Doğrudan Supabase client oluşturmaz
- Environment variable'ları kontrol eder
- AuthProvider üzerinden dolaylı bağlantı

---

## 3. Middleware - Oturum Yönetimi

### 3.1. Middleware.ts

**Dosya**: `src/middleware.ts`

**Sıra**: 2. Adım (Her HTTP request'te)

**İşlemler**:
1. `updateSession()` fonksiyonunu çağırır
2. Tüm route'lar için çalışır (static dosyalar hariç)

### 3.2. Supabase Middleware (`src/lib/supabase/middleware.ts`)

**Fonksiyon**: `updateSession(request: NextRequest)`

**İşlem Sırası**:
1. **Supabase Client Oluşturma**: Request cookie'lerinden oturum bilgisi alınır
2. **Kullanıcı Kontrolü**: `supabase.auth.getUser()` ile mevcut kullanıcı kontrol edilir
3. **Route Koruması**:
   - `/dashboard` ve alt route'lar → Giriş yapmamış kullanıcıları `/login`'e yönlendirir
   - `/login` veya `/signup` → Giriş yapmış kullanıcıları `/dashboard`'a yönlendirir
4. **Cookie Güncelleme**: Oturum cookie'leri güncellenir ve response'a eklenir

**Önemli Not**: Cookie yönetimi otomatik olarak yapılır, manuel müdahale gerekmez.

---

## 4. Authentication Provider

### 4.1. AuthProvider Component

**Dosya**: `src/components/providers/AuthProvider.tsx`

**Sıra**: 3. Adım (Layout'tan sonra, sayfa render'dan önce)

**İşlemler**:
- `useSupabaseAuth()` hook'unu çağırarak auth senkronizasyonunu başlatır
- Tüm uygulama boyunca auth state'i yönetir

### 4.2. useSupabaseAuth Hook

**Dosya**: `src/hooks/useSupabaseAuth.ts`

**Sıra**: 4. Adım (AuthProvider içinde)

**İşlemler**:

#### **A. İlk Oturum Kontrolü**
```typescript
supabase.auth.getSession()
```
- Sayfa yüklendiğinde mevcut oturumu kontrol eder
- Oturum varsa:
  1. Kullanıcı bilgilerini alır
  2. Kredi bakiyesini `getUserCreditBalance()` ile çeker
  3. Auth store'u günceller (`setUser()`)

#### **B. Oturum Değişiklik Dinleyicisi**
```typescript
supabase.auth.onAuthStateChange()
```
- Oturum değişikliklerini (login, logout, token refresh) dinler
- Her değişiklikte:
  1. Yeni kullanıcı bilgilerini alır
  2. Kredi bakiyesini günceller
  3. Auth store'u senkronize eder

#### **C. Logout Fonksiyonu**
```typescript
logout() {
  await supabase.auth.signOut();
  setUser(null);
  router.push('/login');
}
```

**Supabase Tabloları**:
- `auth.users` (built-in Supabase table)
- `credits` (kredi bakiyesi için)

---

## 5. Kimlik Doğrulama İşlemleri

### 5.1. Login Sayfası

**Dosya**: `src/app/login/page.tsx`

**Sıra**: Kullanıcı giriş yapmaya çalıştığında

**Supabase İşlemleri**:

#### **A. Email/Password Girişi**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

#### **B. OAuth Girişi (Google)**
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback`,
  },
});
```

#### **C. OAuth Girişi (GitHub)**
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${origin}/auth/callback`,
  },
});
```

**Sonuç**: Başarılı giriş sonrası `/dashboard`'a yönlendirilir.

### 5.2. Signup Sayfası

**Dosya**: `src/app/signup/page.tsx`

**Sıra**: Kullanıcı kayıt olmaya çalıştığında

**Supabase İşlemleri**:

#### **A. Kullanıcı Kaydı**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: name,
    },
  },
});
```

**Not**: Supabase otomatik olarak `auth.users` tablosuna kullanıcı ekler ve `profiles` tablosuna trigger ile profil oluşturur (migration: `011_auth_trigger.sql`).

### 5.3. Auth Callback Route

**Dosya**: `src/app/auth/callback/route.ts`

**Sıra**: OAuth girişi sonrası callback

**Supabase İşlemleri**:

```typescript
const supabase = await createClient(); // Server client
const { error } = await supabase.auth.exchangeCodeForSession(code);
```

**İşlem**: OAuth provider'dan gelen authorization code'u oturum token'ına çevirir.

---

## 6. Veritabanı Tabloları ve İşlemler

### 6.1. Profiles Tablosu

**Tablo**: `profiles`

**Kullanıldığı Yerler**:

#### **A. Profile Sayfası** (`src/app/profile/page.tsx`)

**Okuma İşlemi**:
```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

**Yazma İşlemi**:
```typescript
const { error } = await supabase
  .from('profiles')
  .upsert({
    id: user.id,
    full_name: fullName,
    display_name: fullName,
    email: formData.email,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'id'
  });
```

#### **B. Design Preview Sayfası** (`src/app/design-preview/page.tsx`)

**Okuma İşlemi**:
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('user_plan')
  .eq('id', user.id)
  .single();
```

**Amaç**: Kullanıcının plan bilgisini almak (free, pro, enterprise).

### 6.2. Projects Tablosu

**Tablo**: `projects`

**Kullanıldığı Yerler**:

#### **A. Dashboard Sayfası** (`src/app/dashboard/page.tsx`)

**Okuma İşlemi** (Proje Listesi):
```typescript
const { data: projectsData, error } = await supabase
  .from('projects')
  .select('id, title, thumbnail_url, type, created_at, updated_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

**Yazma İşlemi** (Yeni Proje):
```typescript
const { data: newProject, error } = await supabase
  .from('projects')
  .insert({
    id: newProjectId,
    user_id: user.id,
    project_id: projectId,
    title: 'Untitled Project',
    type: 'rim',
  })
  .select()
  .single();
```

**Silme İşlemi**:
```typescript
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)
  .eq('user_id', user.id); // Güvenlik: sadece kendi projelerini silebilir
```

#### **B. Design Preview Sayfası** (`src/app/design-preview/page.tsx`)

**Okuma İşlemi** (Proje Detayı):
```typescript
const { data: project, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single();
```

**Yazma İşlemi** (Yeni Proje - Asset Upload Sonrası):
```typescript
const { data: newProject, error: projectError } = await supabase
  .from('projects')
  .insert({
    id: newProjectId,
    user_id: currentUser.id,
    project_id: projectId,
    title: 'Untitled Project',
    type: mode === 'video' ? 'video' : 'rim',
  })
  .select()
  .single();
```

**Güncelleme İşlemi** (Proje Güncelleme):
```typescript
const { error: updateError } = await supabase
  .from('projects')
  .update({
    thumbnail_url: resultUrl,
    updated_at: new Date().toISOString(),
  })
  .eq('id', currentProjectId);
```

### 6.3. Assets Tablosu

**Tablo**: `assets`

**Kullanıldığı Yerler**:

#### **A. Design Preview Sayfası**

**Okuma İşlemi** (Proje Asset'leri):
```typescript
const { data: assets, error: assetsError } = await supabase
  .from('assets')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```

**Yazma İşlemi** (Yeni Asset):
```typescript
const { data: assetData, error: assetError } = await supabase
  .from('assets')
  .insert({
    id: assetId,
    project_id: currentProjectId,
    user_id: currentUser.id,
    asset_type: 'source',
    asset_url: uploadedImageUrl,
    metadata: {},
  })
  .select()
  .single();
```

#### **B. QuickUploadSection Component** (`src/components/sections/QuickUploadSection.tsx`)

**Yazma İşlemi** (Hızlı Upload):
```typescript
await supabase.from('assets').insert({
  user_id: user.id,
  asset_type: 'source',
  asset_url: uploadedImageUrl,
  metadata: {},
});
```

### 6.4. Jobs Tablosu

**Tablo**: `jobs`

**Kullanıldığı Yerler**:

#### **Design Preview Sayfası**

**Okuma İşlemi** (Job Durumu Kontrolü):
```typescript
const { data: jobData, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('id', currentJobId)
  .single();
```

**Yazma İşlemi** (Yeni Job Oluşturma):
```typescript
const { data: jobData, error: jobError } = await supabase
  .from('jobs')
  .insert({
    id: jobId,
    project_id: currentProjectId,
    user_id: currentUser.id,
    job_type: mode === 'video' ? 'video' : 'photo',
    status: 'pending',
    mode: mode === 'video' ? 'video' : 'photo',
    payload: mode === 'video' ? videoPayload : photoPayload,
  })
  .select()
  .single();
```

**Güncelleme İşlemi** (Job Durumu):
- Job durumu polling ile kontrol edilir
- Status: `pending` → `processing` → `completed` / `failed`

### 6.5. Job Assets Tablosu

**Tablo**: `job_assets`

**Kullanıldığı Yerler**:

#### **Design Preview Sayfası**

**Yazma İşlemi** (Job-Asset İlişkisi):
```typescript
const { error: jobAssetError } = await supabase
  .from('job_assets')
  .insert({
    job_id: jobId,
    asset_id: currentAssetId,
    asset_type: 'input',
  });
```

**Amaç**: Job ile kullanılan asset'leri ilişkilendirmek.

### 6.6. Credits Tablosu

**Tablo**: `credits`

**Kullanıldığı Yerler**: Detaylar için [Kredi Sistemi](#7-kredi-sistemi) bölümüne bakın.

---

## 7. Kredi Sistemi

### 7.1. Credit Balance Fonksiyonları

**Dosya**: `src/lib/credits/balance.ts`

#### **A. Kredi Bakiyesi Getirme**

**Fonksiyon**: `getUserCreditBalance(userId: string)`

**Supabase İşlemi**:
```typescript
const { data, error } = await supabase
  .from('credits')
  .select('amount')
  .eq('user_id', userId);
```

**Hesaplama**: Tüm kredi işlemlerinin toplamı (pozitif = ekleme, negatif = harcama)

**Kullanıldığı Yerler**:
- `useSupabaseAuth` hook - Oturum açıldığında
- `BillingPage` - Kredi bakiyesi gösterimi
- `DesignPreviewPage` - Kredi kontrolü (generate öncesi)

#### **B. Kredi Harcama**

**Fonksiyon**: `deductCredits(userId, amount, reason, jobId?)`

**Supabase İşlemi**:
```typescript
const { data, error } = await supabase
  .from('credits')
  .insert({
    user_id: userId,
    amount: -amount, // Negatif = harcama
    source: 'deduction',
    description: reason + (jobId ? ` (Job: ${jobId})` : '')
  })
  .select()
  .single();
```

**Kullanıldığı Yerler**:
- `DesignPreviewPage` - Generate işlemi öncesi kredi harcama

#### **C. Kredi Ekleme**

**Fonksiyon**: `addCredits(userId, amount, source, description)`

**Supabase İşlemi**:
```typescript
const { data, error } = await supabase
  .from('credits')
  .insert({
    user_id: userId,
    amount: amount, // Pozitif = ekleme
    source: source,
    description: description
  })
  .select()
  .single();
```

**Kullanıldığı Yerler**:
- Satın alma işlemleri (gelecekte)
- Bonus krediler (gelecekte)

#### **D. Kredi Geçmişi**

**Fonksiyon**: `getCreditHistory(userId, limit?)`

**Supabase İşlemi**:
```typescript
const { data, error } = await supabase
  .from('credits')
  .select('id, amount, source, description, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(limit);
```

**Kullanıldığı Yerler**:
- `BillingPage` - İşlem geçmişi gösterimi

---

## 8. Sayfa Bazlı İlişkiler

**ÖNEMLİ NOT**: Supabase veritabanı işlemleri (tablo okuma/yazma) sadece **2 sayfada** kullanılmaktadır:
- **My Garage** (Dashboard) - Proje yönetimi
- **Studio** (Design Preview) - Tasarım ve üretim işlemleri

Diğer sayfalar (login, signup, profile, billing) sadece **authentication** işlemleri için Supabase kullanır, veritabanı tablolarına erişmez.

### 8.1. My Garage (Dashboard) Sayfası

**Dosya**: `src/app/dashboard/page.tsx`

**Sayfa Adı**: "My Garage" - Kullanıcının tüm projelerini gösterir

**Supabase Veritabanı İşlemleri**:

#### **A. Proje Listesi Getirme**
```typescript
const { data: projectsData, error } = await supabase
  .from('projects')
  .select('id, title, thumbnail_url, type, created_at, updated_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```
**Tablo**: `projects`  
**İşlem**: SELECT  
**Sıra**: Sayfa yüklendiğinde `fetchProjects()` çağrılır

#### **B. Yeni Proje Oluşturma**
```typescript
const { data: newProject, error } = await supabase
  .from('projects')
  .insert({
    id: newProjectId,
    user_id: user.id,
    project_id: projectId,
    title: 'Untitled Project',
    type: 'rim',
  })
  .select()
  .single();
```
**Tablo**: `projects`  
**İşlem**: INSERT  
**Sıra**: Kullanıcı "New Project" butonuna tıkladığında `handleCreateProject()` çağrılır

#### **C. Proje Silme**
```typescript
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)
  .eq('user_id', user.id); // Güvenlik: sadece kendi projelerini silebilir
```
**Tablo**: `projects`  
**İşlem**: DELETE  
**Sıra**: Kullanıcı proje silmek istediğinde `handleDeleteProject()` çağrılır

**Özet**: Dashboard sayfası sadece `projects` tablosu ile çalışır.

### 8.2. Studio (Design Preview) Sayfası

**Dosya**: `src/app/design-preview/page.tsx`

**Sayfa Adı**: "Studio" - Tasarım yapma ve görsel üretme stüdyosu

**Supabase Veritabanı İşlemleri** (Kapsamlı):

#### **A. Sayfa Yüklendiğinde (Component Mount)**

**1. Proje Detayı Getirme**
```typescript
const { data: project, error } = await supabase
  .from('projects')
  .select('id, title, thumbnail_url, type')
  .eq('id', projectParam)
  .eq('user_id', user.id)
  .single();
```
**Tablo**: `projects`  
**İşlem**: SELECT  
**Sıra**: URL'den `project` parametresi alınır, proje bilgisi çekilir

**2. Proje Asset'lerini Getirme**
```typescript
const { data: assets, error: assetsError } = await supabase
  .from('assets')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```
**Tablo**: `assets`  
**İşlem**: SELECT  
**Sıra**: Proje yüklendikten sonra asset'ler çekilir

**3. Kullanıcı Plan Bilgisi Getirme**
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('user_plan')
  .eq('id', user.id)
  .single();
```
**Tablo**: `profiles`  
**İşlem**: SELECT  
**Sıra**: Kullanıcı plan bilgisi (free/pro/enterprise) çekilir

#### **B. Asset Upload Sonrası**

**1. Yeni Proje Oluşturma** (Eğer proje yoksa)
```typescript
const { data: newProject, error: projectError } = await supabase
  .from('projects')
  .insert({
    id: newProjectId,
    user_id: currentUser.id,
    project_id: projectId,
    title: 'Untitled Project',
    type: mode === 'video' ? 'video' : 'rim',
  })
  .select()
  .single();
```
**Tablo**: `projects`  
**İşlem**: INSERT  
**Sıra**: Asset upload edildiğinde, eğer proje yoksa oluşturulur

**2. Asset Kaydetme**
```typescript
const { data: assetData, error: assetError } = await supabase
  .from('assets')
  .insert({
    id: assetId,
    project_id: currentProjectId,
    user_id: currentUser.id,
    asset_type: 'source',
    asset_url: uploadedImageUrl,
    metadata: {},
  })
  .select()
  .single();
```
**Tablo**: `assets`  
**İşlem**: INSERT  
**Sıra**: Upload başarılı olduktan sonra asset kaydedilir

#### **C. Generate İşlemi (Photo/Video Üretimi)**

**1. Kredi Kontrolü**
```typescript
const balance = await getUserCreditBalance(currentUser.id);
```
**Tablo**: `credits` (dolaylı - balance.ts fonksiyonu üzerinden)  
**İşlem**: SELECT (toplam hesaplama)  
**Sıra**: Generate butonuna tıklanınca önce bakiye kontrol edilir

**2. Kredi Harcama**
```typescript
const result = await deductCredits(currentUser.id, cost, 'photo_generation', jobId);
```
**Tablo**: `credits`  
**İşlem**: INSERT (negatif amount)  
**Sıra**: Bakiye yeterliyse kredi harcanır

**3. Job Oluşturma**
```typescript
const { data: jobData, error: jobError } = await supabase
  .from('jobs')
  .insert({
    id: jobId,
    project_id: currentProjectId,
    user_id: currentUser.id,
    job_type: mode === 'video' ? 'video' : 'photo',
    status: 'pending',
    mode: mode === 'video' ? 'video' : 'photo',
    payload: mode === 'video' ? videoPayload : photoPayload,
  })
  .select()
  .single();
```
**Tablo**: `jobs`  
**İşlem**: INSERT  
**Sıra**: Kredi harcandıktan sonra job oluşturulur

**4. Job-Asset İlişkisi**
```typescript
const { error: jobAssetError } = await supabase
  .from('job_assets')
  .insert({
    job_id: jobId,
    asset_id: currentAssetId,
    asset_type: 'input',
  });
```
**Tablo**: `job_assets`  
**İşlem**: INSERT  
**Sıra**: Job oluşturulduktan sonra asset ile ilişkilendirilir

**5. Job Durumu Kontrolü (Polling)**
```typescript
const { data: jobData, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('id', currentJobId)
  .single();
```
**Tablo**: `jobs`  
**İşlem**: SELECT  
**Sıra**: Periyodik olarak (polling) job durumu kontrol edilir (pending → processing → completed/failed)

**6. Proje Thumbnail Güncelleme**
```typescript
const { error: updateError } = await supabase
  .from('projects')
  .update({
    thumbnail_url: resultUrl,
    updated_at: new Date().toISOString(),
  })
  .eq('id', currentProjectId);
```
**Tablo**: `projects`  
**İşlem**: UPDATE  
**Sıra**: Job tamamlandığında sonuç URL'i projeye kaydedilir

**Özet**: Studio sayfası **5 farklı tablo** ile çalışır:
- `projects` (okuma, yazma, güncelleme)
- `assets` (okuma, yazma)
- `profiles` (okuma - sadece plan bilgisi)
- `jobs` (yazma, okuma - polling)
- `job_assets` (yazma)
- `credits` (okuma, yazma - dolaylı)

**İşlem Sırası**:
1. Component mount → Proje/Asset/Profil bilgileri çekilir
2. Asset upload → Proje ve asset kaydedilir
3. Generate → Kredi kontrolü → Kredi harcama → Job oluşturma → Job-Asset ilişkisi → Polling başlar
4. Job tamamlanınca → Proje thumbnail güncellenir

---

## 9. API Route'ları

### 9.1. Auth Callback Route

**Dosya**: `src/app/auth/callback/route.ts`

**Method**: `GET`

**Supabase İşlemi**:
```typescript
const supabase = await createClient(); // Server client
const { error } = await supabase.auth.exchangeCodeForSession(code);
```

**Amaç**: OAuth callback'inde authorization code'u oturum token'ına çevirir.

**Sıra**: OAuth provider'dan yönlendirme sonrası otomatik çağrılır.

### 9.2. Upload Route

**Dosya**: `src/app/api/upload/route.ts`

**Method**: `POST`

**Supabase İlişkisi**: Bu route Supabase kullanmaz, sadece Cloudflare Worker'a dosya yükler.

---

## 📊 İşlem Sırası Özeti

### Uygulama Başlangıcı:
1. **Layout.tsx** → Environment validasyonu
2. **Middleware** → Her request'te oturum kontrolü
3. **AuthProvider** → Auth state senkronizasyonu başlatır
4. **useSupabaseAuth** → İlk oturum kontrolü ve dinleyici kurulumu

### Kullanıcı Girişi (Authentication - Veritabanı İşlemi Değil):
1. **Login/Signup Sayfası** → `supabase.auth.signInWithPassword()` veya `signUp()`
2. **Auth Callback** (OAuth için) → `supabase.auth.exchangeCodeForSession()`
3. **useSupabaseAuth** → Oturum değişikliği algılanır
4. **Kredi Bakiyesi** → `getUserCreditBalance()` çağrılır (sadece okuma)
5. **Auth Store** → Kullanıcı bilgileri güncellenir

### My Garage (Dashboard) İşlemleri:
1. **Sayfa Yüklendiğinde** → `projects` tablosundan projeler listelenir
2. **Yeni Proje Butonu** → `projects.insert()` ile yeni proje oluşturulur
3. **Proje Silme** → `projects.delete()` ile proje silinir

### Studio (Design Preview) İşlemleri:
1. **Sayfa Yüklendiğinde**:
   - `projects` tablosundan proje detayı çekilir
   - `assets` tablosundan proje asset'leri çekilir
   - `profiles` tablosundan kullanıcı plan bilgisi çekilir

2. **Asset Upload**:
   - Eğer proje yoksa → `projects.insert()` ile proje oluşturulur
   - `assets.insert()` ile asset kaydedilir

3. **Generate İşlemi**:
   - `credits` tablosundan bakiye kontrol edilir
   - `credits.insert()` ile kredi harcanır (negatif amount)
   - `jobs.insert()` ile job oluşturulur
   - `job_assets.insert()` ile job-asset ilişkisi kurulur
   - Polling ile `jobs` tablosundan durum kontrol edilir
   - Job tamamlanınca `projects.update()` ile thumbnail güncellenir

### Kredi İşlemleri (Sadece Studio'da Kullanılır):
1. **Oturum Açıldığında** → `getUserCreditBalance()` çağrılır (sadece okuma)
2. **Generate Öncesi** → Bakiye kontrol edilir
3. **Generate Sırasında** → `deductCredits()` ile kredi harcanır

---

## 🔐 Güvenlik Notları

1. **RLS (Row Level Security)**: Tüm tablolarda RLS politikaları aktif
2. **User ID Kontrolü**: Tüm sorgularda `user_id` kontrolü yapılır
3. **Middleware Koruması**: Protected route'lar middleware'de kontrol edilir
4. **Cookie Yönetimi**: Oturum cookie'leri otomatik olarak yönetilir

---

## 📝 Önemli Notlar

### Veritabanı İşlemleri Sadece 2 Sayfada:
- **My Garage (Dashboard)**: Sadece `projects` tablosu ile çalışır
- **Studio (Design Preview)**: 5 tablo ile çalışır (`projects`, `assets`, `profiles`, `jobs`, `job_assets`, `credits`)

### Diğer Sayfalar:
- **Login/Signup**: Sadece authentication işlemleri (`supabase.auth.*`)
- **Profile**: Sadece authentication işlemleri (veritabanı kullanmaz)
- **Billing**: Sadece authentication işlemleri (veritabanı kullanmaz)

### Teknik Notlar:
- Tüm Supabase client'ları `@supabase/ssr` paketinden oluşturulur
- Server ve client client'ları farklı cookie yönetimi kullanır
- Auth state değişiklikleri otomatik olarak dinlenir ve store'a yansır
- Kredi sistemi transaction-based çalışır (her işlem ayrı kayıt)
- Job durumu polling ile kontrol edilir (real-time değil)

---

**Rapor Tarihi**: 2025-01-XX
**Versiyon**: 1.0

