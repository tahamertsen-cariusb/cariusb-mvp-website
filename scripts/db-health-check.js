#!/usr/bin/env node

/**
 * Database Health Check Script
 * 
 * Production veritabanı sağlık kontrolleri
 * Connection, table existence, index health, vb.
 */

const { execSync } = require('child_process');

// Environment variables
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Database bağlantısını test et
 */
function checkConnection() {
  if (!SUPABASE_DB_URL) {
    error('Database bağlantı bilgisi bulunamadı!');
    error('Lütfen SUPABASE_DB_URL environment variable\'ını ayarlayın.');
    return false;
  }

  try {
    const query = 'SELECT 1;';
    execSync(`psql "${SUPABASE_DB_URL}" -t -c "${query}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    success('Database bağlantısı başarılı');
    return true;
  } catch (err) {
    error(`Database bağlantısı başarısız: ${err.message}`);
    return false;
  }
}

/**
 * Kritik tabloların varlığını kontrol et
 */
function checkTables() {
  const criticalTables = [
    'profiles',
    'credits',
    'projects',
    'assets',
    'jobs',
    'job_assets',
    'modes',
    'webhook_events',
    'schema_migrations',
  ];

  log('\n📊 Tablo Kontrolleri:\n', 'cyan');

  let allTablesExist = true;

  for (const tableName of criticalTables) {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `;

      const exists = execSync(
        `psql "${SUPABASE_DB_URL}" -t -c "${query}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();

      if (exists === 't') {
        success(`  ${tableName}`);
      } else {
        error(`  ${tableName} - TABLO BULUNAMADI`);
        allTablesExist = false;
      }
    } catch (err) {
      error(`  ${tableName} - KONTROL EDİLEMEDİ: ${err.message}`);
      allTablesExist = false;
    }
  }

  return allTablesExist;
}

/**
 * Index sağlığını kontrol et
 */
function checkIndexes() {
  log('\n🔍 Index Kontrolleri:\n', 'cyan');

  const criticalIndexes = [
    'idx_projects_user_id_created_at',
    'idx_jobs_status_created_at',
    'idx_assets_project_role',
  ];

  let allIndexesExist = true;

  for (const indexName of criticalIndexes) {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = '${indexName}'
        );
      `;

      const exists = execSync(
        `psql "${SUPABASE_DB_URL}" -t -c "${query}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();

      if (exists === 't') {
        success(`  ${indexName}`);
      } else {
        warning(`  ${indexName} - Index bulunamadı (opsiyonel)`);
      }
    } catch (err) {
      warning(`  ${indexName} - Kontrol edilemedi: ${err.message}`);
    }
  }

  return true;
}

/**
 * RLS policy'lerini kontrol et
 */
function checkRLS() {
  log('\n🔒 RLS Policy Kontrolleri:\n', 'cyan');

  const tablesWithRLS = [
    'profiles',
    'credits',
    'projects',
    'assets',
    'jobs',
  ];

  let allRLSEnabled = true;

  for (const tableName of tablesWithRLS) {
    try {
      const query = `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = '${tableName}';
      `;

      const result = execSync(
        `psql "${SUPABASE_DB_URL}" -t -A -F'|' -c "${query}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();

      if (result) {
        const [, rowSecurity] = result.split('|');
        if (rowSecurity === 't') {
          success(`  ${tableName} - RLS aktif`);
        } else {
          warning(`  ${tableName} - RLS aktif değil`);
          allRLSEnabled = false;
        }
      } else {
        warning(`  ${tableName} - Tablo bulunamadı`);
      }
    } catch (err) {
      warning(`  ${tableName} - Kontrol edilemedi: ${err.message}`);
    }
  }

  return allRLSEnabled;
}

/**
 * Ana health check fonksiyonu
 */
async function main() {
  log('\n🏥 Database Health Check Başlatılıyor...\n', 'bright');

  const results = {
    connection: false,
    tables: false,
    indexes: true,
    rls: true,
  };

  // Connection check
  results.connection = checkConnection();
  if (!results.connection) {
    error('\n❌ Database bağlantısı başarısız! Diğer kontroller atlanıyor.');
    process.exit(1);
  }

  // Table checks
  results.tables = checkTables();

  // Index checks
  results.indexes = checkIndexes();

  // RLS checks
  results.rls = checkRLS();

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 SAĞLIK RAPORU', 'bright');
  log('='.repeat(60), 'cyan');
  log(`Bağlantı: ${results.connection ? '✅' : '❌'}`, results.connection ? 'green' : 'red');
  log(`Tablolar: ${results.tables ? '✅' : '❌'}`, results.tables ? 'green' : 'red');
  log(`Index'ler: ${results.indexes ? '✅' : '⚠️'}`, results.indexes ? 'green' : 'yellow');
  log(`RLS: ${results.rls ? '✅' : '⚠️'}`, results.rls ? 'green' : 'yellow');

  const isHealthy = results.connection && results.tables;
  
  if (isHealthy) {
    success('\n✅ Database sağlıklı görünüyor!');
    process.exit(0);
  } else {
    error('\n❌ Database sağlık sorunları tespit edildi!');
    process.exit(1);
  }
}

// Run
main().catch(err => {
  error(`\n💥 Beklenmeyen hata: ${err.message}`);
  console.error(err);
  process.exit(1);
});

