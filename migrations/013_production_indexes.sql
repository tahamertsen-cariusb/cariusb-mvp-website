-- Migration: 013_production_indexes.sql
-- Production performans için index optimizasyonları
-- Mevcut tablolarda eksik index'leri ekler (IF NOT EXISTS ile güvenli)

-- ============================================
-- Projects Table Indexes
-- ============================================

-- User'a göre proje sorguları için
CREATE INDEX IF NOT EXISTS idx_projects_user_id_created_at 
ON projects(user_id, created_at DESC);

-- Type'a göre filtreleme için
CREATE INDEX IF NOT EXISTS idx_projects_type 
ON projects(type) WHERE type IS NOT NULL;

-- Updated_at için sıralama
CREATE INDEX IF NOT EXISTS idx_projects_updated_at 
ON projects(updated_at DESC) WHERE updated_at IS NOT NULL;

-- ============================================
-- Assets Table Indexes
-- ============================================

-- Project ve role kombinasyonu için
CREATE INDEX IF NOT EXISTS idx_assets_project_role 
ON assets(project_id, role) WHERE project_id IS NOT NULL;

-- User'a göre asset sorguları için
CREATE INDEX IF NOT EXISTS idx_assets_user_id 
ON assets(user_id) WHERE user_id IS NOT NULL;

-- Type ve created_at kombinasyonu
CREATE INDEX IF NOT EXISTS idx_assets_type_created_at 
ON assets(type, created_at DESC) WHERE type IS NOT NULL;

-- ============================================
-- Jobs Table Indexes
-- ============================================

-- Status ve created_at kombinasyonu (job queue için)
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at 
ON jobs(status, created_at ASC) WHERE status IS NOT NULL;

-- User'a göre job sorguları için
CREATE INDEX IF NOT EXISTS idx_jobs_user_id_status 
ON jobs(user_id, status) WHERE user_id IS NOT NULL;

-- Project'e göre job sorguları için
CREATE INDEX IF NOT EXISTS idx_jobs_project_id 
ON jobs(project_id) WHERE project_id IS NOT NULL;

-- Type ve status kombinasyonu
CREATE INDEX IF NOT EXISTS idx_jobs_type_status 
ON jobs(type, status) WHERE type IS NOT NULL AND status IS NOT NULL;

-- ============================================
-- Job Assets Table Indexes
-- ============================================

-- Job'a göre asset sorguları için
CREATE INDEX IF NOT EXISTS idx_job_assets_job_id 
ON job_assets(job_id) WHERE job_id IS NOT NULL;

-- Asset'e göre job sorguları için
CREATE INDEX IF NOT EXISTS idx_job_assets_asset_id 
ON job_assets(asset_id) WHERE asset_id IS NOT NULL;

-- ============================================
-- Credits Table Indexes
-- ============================================

-- User'a göre credit sorguları için (zaten primary key var ama explicit index)
CREATE INDEX IF NOT EXISTS idx_credits_user_id 
ON credits(user_id);

-- Updated_at için sıralama
CREATE INDEX IF NOT EXISTS idx_credits_updated_at 
ON credits(updated_at DESC) WHERE updated_at IS NOT NULL;

-- ============================================
-- Profiles Table Indexes
-- ============================================

-- Email lookup için (eğer email field varsa)
-- CREATE INDEX IF NOT EXISTS idx_profiles_email 
-- ON profiles(email) WHERE email IS NOT NULL;

-- User plan'a göre filtreleme
CREATE INDEX IF NOT EXISTS idx_profiles_user_plan 
ON profiles(user_plan) WHERE user_plan IS NOT NULL;

-- ============================================
-- Webhook Events Table Indexes
-- ============================================

-- Event type'a göre sorgular için
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type 
ON webhook_events(event_type) WHERE event_type IS NOT NULL;

-- Created_at için sıralama
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at 
ON webhook_events(created_at DESC);

-- User'a göre webhook event sorguları için
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id 
ON webhook_events(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- Notes
-- ============================================
-- Bu index'ler production performansı için optimize edilmiştir.
-- Partial index'ler (WHERE clause) sadece NULL olmayan değerler için kullanılır,
-- bu sayede index boyutu küçültülür ve performans artırılır.
-- 
-- Index'ler IF NOT EXISTS ile oluşturulduğu için mevcut index'leri bozmaz.

-- Insert current migration
INSERT INTO schema_migrations (version, filename, success)
VALUES ('013', '013_production_indexes.sql', true)
ON CONFLICT (version) DO NOTHING;

