-- =====================================================
-- 010_rls_policies.sql
-- Row Level Security (RLS) Policies
-- =====================================================
-- Bağımlılık: Tüm tablolar hazır olmalı
-- =====================================================
-- NOT: Bu migration'ı çalıştırmadan önce tüm tablolar oluşturulmuş olmalı
-- =====================================================

-- =====================================================
-- 1. PROFILES - Kullanıcılar sadece kendi profillerini görebilir
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri temizle
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Yeni policy'leri oluştur
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- 2. CREDITS - Kullanıcılar sadece kendi kredilerini görebilir
-- =====================================================
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credits_insert_own" ON public.credits;
DROP POLICY IF EXISTS "credits_select_own" ON public.credits;
DROP POLICY IF EXISTS "credits_update_own" ON public.credits;

CREATE POLICY "credits_insert_own" ON public.credits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credits_select_own" ON public.credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- UPDATE ve DELETE yok - krediler immutable (sadece yeni kayıt eklenir)

-- =====================================================
-- 3. PROJECTS - Kullanıcılar sadece kendi projelerini görebilir
-- =====================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;

CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. ASSETS - Kullanıcılar sadece kendi asset'lerini görebilir
-- =====================================================
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user owns assets" ON public.assets;
DROP POLICY IF EXISTS "assets_select_own" ON public.assets;
DROP POLICY IF EXISTS "assets_insert_own" ON public.assets;
DROP POLICY IF EXISTS "assets_update_own" ON public.assets;
DROP POLICY IF EXISTS "assets_delete_own" ON public.assets;

-- Tüm işlemler için tek policy (daha basit)
CREATE POLICY "user owns assets" ON public.assets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. JOBS - Kullanıcılar sadece kendi işlerini görebilir
-- =====================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "user owns jobs" ON public.jobs;

-- Tüm işlemler için tek policy
CREATE POLICY "user owns jobs" ON public.jobs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. JOB_ASSETS - Kullanıcılar sadece kendi job'larının asset'lerini görebilir
-- =====================================================
ALTER TABLE public.job_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own job_assets" ON public.job_assets;
DROP POLICY IF EXISTS "Users can view their own job_assets" ON public.job_assets;
DROP POLICY IF EXISTS "Users can update their own job_assets" ON public.job_assets;
DROP POLICY IF EXISTS "Users can delete their own job_assets" ON public.job_assets;

-- Job sahibi kontrolü (jobs tablosu üzerinden)
CREATE POLICY "Users can insert their own job_assets" ON public.job_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_assets.job_id
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own job_assets" ON public.job_assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_assets.job_id
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own job_assets" ON public.job_assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_assets.job_id
      AND jobs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_assets.job_id
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own job_assets" ON public.job_assets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_assets.job_id
      AND jobs.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. MODES - Public read (herkes mod listesini görebilmeli)
-- =====================================================
ALTER TABLE public.modes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modes_public_read" ON public.modes;

-- Herkes okuyabilir, sadece service_role yazabilir
CREATE POLICY "modes_public_read" ON public.modes
  FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- 8. WEBHOOK_EVENTS - Sadece service_role erişebilir
-- =====================================================
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_events_service_role_insert" ON public.webhook_events;
DROP POLICY IF EXISTS "webhook_events_service_role_select" ON public.webhook_events;
DROP POLICY IF EXISTS "webhook_events_service_role_update" ON public.webhook_events;

CREATE POLICY "webhook_events_service_role_insert" ON public.webhook_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "webhook_events_service_role_select" ON public.webhook_events
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "webhook_events_service_role_update" ON public.webhook_events
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Migration Tamamlandı: RLS Policies
-- =====================================================

