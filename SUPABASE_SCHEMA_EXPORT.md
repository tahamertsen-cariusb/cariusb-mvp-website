# Supabase Schema Export - CARIUSB Projesi

**Proje ID:** zhfoygasvpjtsngebahn  
**Tarih:** 2025-01-27

## 📊 Tablo Özeti

### Public Schema Tabloları

| Tablo Adı | Satır Sayısı | RLS Aktif | Açıklama |
|-----------|--------------|-----------|----------|
| `profiles` | 1 | ✅ | Kullanıcı profil bilgileri |
| `credits` | 1 | ✅ | Kullanıcı kredi sistemi |
| `projects` | 4 | ✅ | Proje yönetimi |
| `renders` | 18 | ✅ | Render işlemleri |
| `results_video` | 0 | ✅ | Video sonuçları |
| `last_results_files` | 0 | ✅ | Son sonuç dosyaları |
| `modes` | 12 | ❌ | AI mod referans verileri |
| `webhook_events` | 0 | ✅ | Webhook event logları |
| `assets` | 7 | ✅ | Dosya varlıkları |
| `jobs` | 13 | ❌ | İş kuyruğu |
| `job_assets` | 0 | ❌ | İş-varlık ilişkisi |

---

## 📋 Detaylı Tablo Şemaları

### 1. `profiles` - Kullanıcı Profilleri

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  display_name text,
  avatar_url text,
  user_plan text NOT NULL DEFAULT 'free'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  full_name text
);

-- Primary Key
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- Foreign Key
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id);

-- Indexes
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

-- RLS Policies
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

**Değerlendirme:** ✅ **GEREKLİ** - Temel kullanıcı profil yönetimi için kritik.

---

### 2. `credits` - Kredi Sistemi

```sql
CREATE TABLE public.credits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  source text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Primary Key
ALTER TABLE credits ADD PRIMARY KEY (id);

-- Foreign Key
ALTER TABLE credits ADD CONSTRAINT credits_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Indexes
CREATE UNIQUE INDEX credits_pkey ON public.credits USING btree (id);
CREATE INDEX idx_credits_user_id ON public.credits USING btree (user_id);
CREATE INDEX idx_credits_created_at ON public.credits USING btree (created_at DESC);

-- RLS Policies
CREATE POLICY "credits_insert_own" ON credits FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credits_select_own" ON credits FOR SELECT 
  USING (auth.uid() = user_id);
```

**Değerlendirme:** ✅ **GEREKLİ** - Kredi/fatura sistemi için gerekli.

---

### 3. `projects` - Projeler

```sql
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id text NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  thumbnail_url text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Primary Key
ALTER TABLE projects ADD PRIMARY KEY (id);

-- Foreign Key
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Constraints
ALTER TABLE projects ADD CONSTRAINT projects_type_check 
  CHECK (type = ANY (ARRAY['video'::text, 'rim'::text]));

ALTER TABLE projects ADD CONSTRAINT projects_project_id_key 
  UNIQUE (project_id);

-- Indexes
CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);
CREATE UNIQUE INDEX projects_project_id_key ON public.projects USING btree (project_id);
CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);
CREATE INDEX idx_projects_type ON public.projects USING btree (type);
CREATE INDEX idx_projects_created_at ON public.projects USING btree (created_at DESC);
CREATE INDEX idx_projects_project_id ON public.projects USING btree (project_id);

-- RLS Policies
CREATE POLICY "projects_insert_own" ON projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_select_own" ON projects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

**Değerlendirme:** ✅ **GEREKLİ** - Proje yönetimi için temel tablo.

---

### 4. `renders` - Render İşlemleri

```sql
CREATE TABLE public.renders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  jobid character varying(255) NOT NULL,
  user_id uuid NOT NULL,
  project_id uuid,
  mode text NOT NULL,
  plan character varying(50) NOT NULL DEFAULT 'free'::character varying,
  result_url text,
  status character varying(50) NOT NULL DEFAULT 'pending'::character varying,
  error_message text,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  detection_result jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at timestamp with time zone
);

-- Primary Key
ALTER TABLE renders ADD PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE renders ADD CONSTRAINT renders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE renders ADD CONSTRAINT renders_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- Constraints
ALTER TABLE renders ADD CONSTRAINT renders_status_check 
  CHECK (status::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[]));

ALTER TABLE renders ADD CONSTRAINT renders_jobid_key 
  UNIQUE (jobid);

-- Indexes
CREATE UNIQUE INDEX renders_pkey ON public.renders USING btree (id);
CREATE UNIQUE INDEX renders_jobid_key ON public.renders USING btree (jobid);
CREATE INDEX idx_renders_user_id ON public.renders USING btree (user_id);
CREATE INDEX idx_renders_project_id ON public.renders USING btree (project_id);
CREATE INDEX idx_renders_status ON public.renders USING btree (status);
CREATE INDEX idx_renders_mode ON public.renders USING btree (mode);
CREATE INDEX idx_renders_jobid ON public.renders USING btree (jobid);
CREATE INDEX idx_renders_created_at ON public.renders USING btree (created_at DESC);

-- RLS Policies
CREATE POLICY "renders_insert_own" ON renders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "renders_select_own" ON renders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "renders_update_own" ON renders FOR UPDATE 
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_renders_updated_at
  BEFORE UPDATE ON renders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

**Değerlendirme:** ⚠️ **İKİLEM** - `jobs` tablosu ile çakışıyor gibi görünüyor. Hangisinin kullanıldığına bakmak gerekiyor.

---

### 5. `results_video` - Video Sonuçları

```sql
CREATE TABLE public.results_video (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  jobid character varying(255),
  user_id uuid,
  project_id uuid,
  plan character varying(50),
  result_url text,
  status character varying(50),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Primary Key
ALTER TABLE results_video ADD PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE results_video ADD CONSTRAINT results_video_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE results_video ADD CONSTRAINT results_video_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- Indexes
CREATE UNIQUE INDEX results_video_pkey ON public.results_video USING btree (id);
CREATE INDEX idx_results_video_user_id ON public.results_video USING btree (user_id);
CREATE INDEX idx_results_video_project_id ON public.results_video USING btree (project_id);
CREATE INDEX idx_results_video_status ON public.results_video USING btree (status);
CREATE INDEX idx_results_video_jobid ON public.results_video USING btree (jobid);

-- RLS Policies
CREATE POLICY "results_video_insert_own" ON results_video FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "results_video_select_own" ON results_video FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "results_video_update_own" ON results_video FOR UPDATE 
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_results_video_updated_at
  BEFORE UPDATE ON results_video
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

**Değerlendirme:** ❓ **SORU İŞARETİ** - 0 satır var. Kullanılıyor mu? `renders` ile birleştirilebilir mi?

---

### 6. `last_results_files` - Son Sonuç Dosyaları

```sql
CREATE TABLE public.last_results_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  owner_id uuid NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  moderation_status text DEFAULT 'pending'::text
);

-- Primary Key
ALTER TABLE last_results_files ADD PRIMARY KEY (id);

-- Foreign Key
ALTER TABLE last_results_files ADD CONSTRAINT last_results_files_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id);

-- Constraints
ALTER TABLE last_results_files ADD CONSTRAINT last_results_files_file_path_key 
  UNIQUE (file_path);

ALTER TABLE last_results_files ADD CONSTRAINT last_results_files_moderation_status_check 
  CHECK (moderation_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));

-- Indexes
CREATE UNIQUE INDEX last_results_files_pkey ON public.last_results_files USING btree (id);
CREATE UNIQUE INDEX last_results_files_file_path_key ON public.last_results_files USING btree (file_path);
CREATE INDEX idx_last_results_files_owner_id ON public.last_results_files USING btree (owner_id);
CREATE INDEX idx_last_results_files_file_path ON public.last_results_files USING btree (file_path);
CREATE INDEX idx_last_results_files_moderation_status ON public.last_results_files USING btree (moderation_status);
CREATE INDEX idx_last_results_files_created_at ON public.last_results_files USING btree (created_at DESC);

-- RLS Policies
CREATE POLICY "last_results_files_insert_owner" ON last_results_files FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "last_results_files_select_own" ON last_results_files FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "last_results_files_update_owner" ON last_results_files FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "last_results_files_delete_owner" ON last_results_files FOR DELETE 
  USING (auth.uid() = owner_id);
```

**Değerlendirme:** ❓ **SORU İŞARETİ** - 0 satır var. Moderation sistemi için mi? `assets` ile birleştirilebilir mi?

---

### 7. `modes` - AI Mod Referans Verileri

```sql
CREATE TABLE public.modes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mode text NOT NULL,
  prompt text NOT NULL
);

-- Primary Key
ALTER TABLE modes ADD PRIMARY KEY (id);

-- Constraints
ALTER TABLE modes ADD CONSTRAINT modes_mode_key 
  UNIQUE (mode);

-- Indexes
CREATE UNIQUE INDEX modes_pkey ON public.modes USING btree (id);
CREATE UNIQUE INDEX modes_mode_key ON public.modes USING btree (mode);

-- RLS Policies
-- ❌ RLS YOK - Bu tablo public okunabilir olmalı
```

**Mevcut Modlar (12 adet):**
- `bodykitImage` - Body kit transfer (image reference)
- `bodykitInstruction` - Body kit (instruction based)
- `height_extreme_low` - Extreme low ride height
- `height_high` - High ride height (SUV)
- `height_low` - Low ride height (sporty)
- `insert_personInstruction` - Insert person into scene
- `liveryImage` - Livery/wrap transfer
- `multicarsImage` - Multi-car scene
- `paintImage` - Paint color transfer
- `paintInstruction` - Paint color (instruction)
- `rimImage` - Rim/wheel replacement
- `tintInstruction` - Window tint

**Değerlendirme:** ✅ **GEREKLİ** - AI mod yönetimi için kritik. Ancak RLS eklenmeli veya public read yapılmalı.

---

### 8. `webhook_events` - Webhook Event Logları

```sql
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  status text NOT NULL,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Primary Key
ALTER TABLE webhook_events ADD PRIMARY KEY (id);

-- Constraints
ALTER TABLE webhook_events ADD CONSTRAINT webhook_events_event_id_key 
  UNIQUE (event_id);

-- Indexes
CREATE UNIQUE INDEX webhook_events_pkey ON public.webhook_events USING btree (id);
CREATE UNIQUE INDEX webhook_events_event_id_key ON public.webhook_events USING btree (event_id);

-- RLS Policies (Service Role Only)
CREATE POLICY "webhook_events_service_role_insert" ON webhook_events FOR INSERT 
  TO service_role WITH CHECK (true);

CREATE POLICY "webhook_events_service_role_select" ON webhook_events FOR SELECT 
  TO service_role USING (true);

CREATE POLICY "webhook_events_service_role_update" ON webhook_events FOR UPDATE 
  TO service_role USING (true) WITH CHECK (true);
```

**Değerlendirme:** ✅ **GEREKLİ** - Webhook idempotency ve loglama için önemli.

---

### 9. `assets` - Dosya Varlıkları

```sql
CREATE TABLE public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  type text NOT NULL,
  role text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Primary Key
ALTER TABLE assets ADD PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE assets ADD CONSTRAINT assets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE assets ADD CONSTRAINT assets_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- Constraints
ALTER TABLE assets ADD CONSTRAINT assets_type_check 
  CHECK (type = ANY (ARRAY['image'::text, 'video'::text]));

ALTER TABLE assets ADD CONSTRAINT assets_role_check 
  CHECK (role = ANY (ARRAY['source'::text, 'result'::text]));

-- Indexes
CREATE UNIQUE INDEX assets_pkey ON public.assets USING btree (id);
CREATE INDEX idx_assets_user_id ON public.assets USING btree (user_id);
CREATE INDEX idx_assets_project_id ON public.assets USING btree (project_id);
CREATE INDEX idx_assets_role ON public.assets USING btree (role);

-- RLS Policies
CREATE POLICY "user owns assets" ON assets FOR ALL 
  USING (auth.uid() = user_id);
```

**Değerlendirme:** ✅ **GEREKLİ** - Dosya yönetimi için temel tablo.

---

### 10. `jobs` - İş Kuyruğu

```sql
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  jobid text NOT NULL,
  user_id uuid NOT NULL,
  project_id uuid,
  mode text NOT NULL,
  plan text DEFAULT 'free'::text,
  status text,
  options jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  type text
);

-- Primary Key
ALTER TABLE jobs ADD PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE jobs ADD CONSTRAINT jobs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE jobs ADD CONSTRAINT jobs_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- Constraints
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]));

ALTER TABLE jobs ADD CONSTRAINT jobs_jobid_key 
  UNIQUE (jobid);

-- Indexes
CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id);
CREATE UNIQUE INDEX jobs_jobid_key ON public.jobs USING btree (jobid);
CREATE INDEX idx_jobs_user_id ON public.jobs USING btree (user_id);
CREATE INDEX idx_jobs_project_id ON public.jobs USING btree (project_id);
CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);

-- RLS Policies
CREATE POLICY "user owns jobs" ON jobs FOR ALL 
  USING (auth.uid() = user_id);
```

**Değerlendirme:** ⚠️ **İKİLEM** - `renders` tablosu ile çakışıyor. Hangisi aktif kullanılıyor?

---

### 11. `job_assets` - İş-Varlık İlişkisi

```sql
CREATE TABLE public.job_assets (
  job_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  purpose text NOT NULL
);

-- Primary Key (Composite)
ALTER TABLE job_assets ADD PRIMARY KEY (job_id, asset_id);

-- Foreign Keys
ALTER TABLE job_assets ADD CONSTRAINT job_assets_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES public.jobs(id);

ALTER TABLE job_assets ADD CONSTRAINT job_assets_asset_id_fkey 
  FOREIGN KEY (asset_id) REFERENCES public.assets(id);

-- Constraints
ALTER TABLE job_assets ADD CONSTRAINT job_assets_purpose_check 
  CHECK (purpose = ANY (ARRAY['input'::text, 'output'::text]));

-- Indexes
CREATE UNIQUE INDEX job_assets_pkey ON public.job_assets USING btree (job_id, asset_id);
CREATE INDEX idx_job_assets_job_id ON public.job_assets USING btree (job_id);
CREATE INDEX idx_job_assets_asset_id ON public.job_assets USING btree (asset_id);

-- RLS Policies
-- ❌ RLS YOK
```

**Değerlendirme:** ⚠️ **KOŞULLU** - `jobs` tablosu kullanılıyorsa gerekli. RLS eklenmeli.

---

## 🔧 Functions

### 1. `handle_new_user()` - Yeni Kullanıcı Trigger Fonksiyonu

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, user_plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    'free'
  )
  on conflict (id) do nothing;

  insert into public.credits (user_id, amount, source, description)
  values (
    new.id,
    381000,
    'signup',
    'Welcome bonus - 381k credits'
  );

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;
```

**Değerlendirme:** ✅ **GEREKLİ** - Kullanıcı kaydı için otomatik profil ve kredi oluşturma.

---

### 2. `handle_updated_at()` - Updated At Trigger Fonksiyonu

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;
```

**Değerlendirme:** ✅ **GEREKLİ** - Otomatik timestamp güncelleme.

---

## 📦 Storage Buckets

**Mevcut Bucket'lar:** 0 (Storage bucket'ları boş görünüyor, ancak `storage.objects` tablosunda 14 satır var)

---

## 🔍 Migration Geçmişi

1. `20251212142406` - `add_full_name_to_profiles`
2. `20251213073756` - `create_webhook_events_table`

---

## ⚠️ Tespit Edilen Sorunlar

### 1. **Tablo Çakışması: `renders` vs `jobs`** ✅ ÇÖZÜLDÜ
- **Kod Analizi:** `jobs` tablosu aktif olarak kullanılıyor (`design-preview/page.tsx`)
- `renders`: 18 satır - **KULLANILMIYOR** (kodda referans yok)
- `jobs`: 13 satır - **AKTİF KULLANILIYOR**
- **Öneri:** `renders` tablosu kaldırılmalı veya eski veriler için arşivlenmeli

### 2. **RLS Eksiklikleri** ⚠️
- `modes` tablosunda RLS yok (public read olmalı)
- `jobs` tablosunda RLS var ✅
- `job_assets` tablosunda RLS yok ❌ (kodda RLS hatası bekleniyor)
- **Öneri:** 
  - `modes` için public SELECT policy ekle
  - `job_assets` için user-based RLS policy ekle

### 3. **Boş/Kullanılmayan Tablolar** ✅ ANALİZ EDİLDİ
- `results_video`: 0 satır - **KULLANILMIYOR** (kodda referans yok)
- `last_results_files`: 0 satır - **KULLANILMIYOR** (kodda referans yok)
- `job_assets`: 0 satır - **AKTİF KULLANILIYOR** (kodda kullanılıyor, henüz veri yok)
- **Öneri:** 
  - `results_video` ve `last_results_files` kaldırılmalı
  - `job_assets` RLS eklenmeli ve kullanılmaya devam edilmeli

### 4. **Veri Tutarlılığı** ✅
- `jobs` ve `job_assets` ilişkisi doğru kurulmuş ✅
- `assets` ve `job_assets` ilişkisi doğru kurulmuş ✅
- **Öneri:** `renders` tablosu kaldırıldıktan sonra ilişkiler temizlenecek

---

## 📊 Önerilen Yapı Değerlendirmesi

### ✅ Kesinlikle Gerekli Tablolar (Kodda Aktif Kullanılan)
1. **`profiles`** ✅ - Kullanıcı profilleri (auth trigger ile otomatik oluşturuluyor)
2. **`credits`** ✅ - Kredi sistemi (auth trigger ile otomatik oluşturuluyor)
3. **`projects`** ✅ - Proje yönetimi (kullanılıyor)
4. **`assets`** ✅ - Dosya varlıkları (aktif kullanılıyor - design-preview)
5. **`modes`** ✅ - AI mod referansları (12 mod mevcut)
6. **`webhook_events`** ✅ - Webhook idempotency (n8n webhook route'unda kullanılıyor)
7. **`jobs`** ✅ - İş kuyruğu (aktif kullanılıyor - design-preview)
8. **`job_assets`** ✅ - İş-varlık ilişkisi (aktif kullanılıyor - design-preview)

### ❌ Kaldırılması Gereken Tablolar (Kullanılmıyor)
1. **`renders`** ❌ - Eski sistem, `jobs` ile değiştirilmiş
2. **`results_video`** ❌ - Kullanılmıyor, 0 satır
3. **`last_results_files`** ❌ - Kullanılmıyor, 0 satır

### 🔧 Düzeltilmesi Gerekenler
1. **`modes`** - Public SELECT RLS policy ekle
2. **`job_assets`** - User-based RLS policy ekle
3. **`renders`** - Eski verileri migrate et veya kaldır

---

## 🎯 Sonraki Adımlar

### ✅ Tamamlananlar
1. ✅ Kod tabanında hangi tabloların kullanıldığını kontrol et
2. ✅ `renders` vs `jobs` kullanımını analiz et → `jobs` aktif, `renders` kullanılmıyor
3. ✅ Boş tabloların kullanımını kontrol et → `results_video` ve `last_results_files` kullanılmıyor

### 📋 Yapılacaklar
1. **RLS Politikalarını Tamamla**
   - `modes` tablosuna public SELECT policy ekle
   - `job_assets` tablosuna user-based RLS policy ekle

2. **Gereksiz Tabloları Kaldır**
   - `renders` tablosunu kaldır (eski veriler varsa önce migrate et)
   - `results_video` tablosunu kaldır
   - `last_results_files` tablosunu kaldır

3. **Migration Hazırla**
   - RLS policy migration'ları
   - Tablo kaldırma migration'ları

4. **Veri Temizliği**
   - `renders` tablosundaki 18 satırı `jobs` tablosuna migrate et (gerekirse)
   - Foreign key constraint'leri temizle

