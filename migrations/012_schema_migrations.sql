-- Migration: 012_schema_migrations.sql
-- Migration tracking tablosu
-- Bu tablo hangi migration'ların çalıştırıldığını takip eder

-- Migration tracking tablosu
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  checksum VARCHAR(64), -- SHA-256 hash of migration content (optional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at DESC);

-- RLS Policy: Only authenticated users with service_role can access
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Service role can access all (for migrations)
CREATE POLICY IF NOT EXISTS "Service role can manage migrations"
  ON schema_migrations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Regular users cannot access migration tracking
CREATE POLICY IF NOT EXISTS "Users cannot access migrations"
  ON schema_migrations
  FOR SELECT
  USING (false);

-- Function to check if a migration has been applied
CREATE OR REPLACE FUNCTION migration_applied(migration_version VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM schema_migrations 
    WHERE version = migration_version AND success = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a migration
CREATE OR REPLACE FUNCTION record_migration(
  migration_version VARCHAR(50),
  migration_filename VARCHAR(255),
  exec_time_ms INTEGER DEFAULT NULL,
  migration_success BOOLEAN DEFAULT true,
  migration_error TEXT DEFAULT NULL,
  migration_checksum VARCHAR(64) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  migration_id INTEGER;
BEGIN
  INSERT INTO schema_migrations (
    version,
    filename,
    execution_time_ms,
    success,
    error_message,
    checksum
  ) VALUES (
    migration_version,
    migration_filename,
    exec_time_ms,
    migration_success,
    migration_error,
    migration_checksum
  )
  ON CONFLICT (version) DO UPDATE SET
    applied_at = NOW(),
    execution_time_ms = record_migration.exec_time_ms,
    success = record_migration.migration_success,
    error_message = record_migration.migration_error,
    checksum = record_migration.migration_checksum
  RETURNING id INTO migration_id;
  
  RETURN migration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert current migration
INSERT INTO schema_migrations (version, filename, success)
VALUES ('012', '012_schema_migrations.sql', true)
ON CONFLICT (version) DO NOTHING;

