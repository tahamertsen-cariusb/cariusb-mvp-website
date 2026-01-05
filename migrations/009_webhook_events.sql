-- =====================================================
-- 009_webhook_events.sql
-- Webhook Event Logları Tablosu
-- =====================================================
-- Bağımlılık: Yok (bağımsız log tablosu)
-- =====================================================

-- Webhook_events tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_pkey ON public.webhook_events USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_event_id_key ON public.webhook_events USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON public.webhook_events USING btree (provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events USING btree (status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events USING btree (created_at DESC);

-- Comments
COMMENT ON TABLE public.webhook_events IS 'Webhook event logları - idempotency için';
COMMENT ON COLUMN public.webhook_events.provider IS 'Webhook sağlayıcı: n8n, stripe, vb.';
COMMENT ON COLUMN public.webhook_events.event_id IS 'Unique event identifier (idempotency için)';
COMMENT ON COLUMN public.webhook_events.status IS 'Event durumu: pending, processed, failed';

-- NOT: RLS bu tabloda service_role için - 010_rls_policies.sql'de eklenir

-- =====================================================
-- Migration Tamamlandı: Webhook_Events
-- =====================================================

