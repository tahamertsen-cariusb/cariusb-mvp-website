#!/usr/bin/env node

/**
 * Migration Status Checker
 * 
 * Mevcut veritabanında hangi migration'ların çalıştırıldığını kontrol eder.
 * Mevcut DB için güvenli migration stratejisi geliştirmek için kullanılır.
 * 
 * Kullanım:
 *   node scripts/check-migration-status.js
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

// Check if schema_migrations table exists
async function checkMigrationTable() {
  if (!SUPABASE_DB_URL) {
    error('Database bağlantı bilgisi bulunamadı!');
    error('Lütfen SUPABASE_DB_URL environment variable\'ını ayarlayın.');
    process.exit(1);
  }

  try {
    log('\n🔍 Migration durumu kontrol ediliyor...\n', 'bright');

    // Check if schema_migrations table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `;

    const tableExists = execSync(
      `psql "${SUPABASE_DB_URL}" -t -c "${checkTableQuery}"`,
      { encoding: 'utf8' }
    ).trim();

    if (tableExists === 't') {
      success('schema_migrations tablosu mevcut');
    } else {
      warning('schema_migrations tablosu bulunamadı');
      info('012_schema_migrations.sql migration\'ını çalıştırmanız gerekiyor');
      return;
    }

    // Get applied migrations
    const getMigrationsQuery = `
      SELECT version, filename, applied_at, success, execution_time_ms
      FROM schema_migrations
      ORDER BY version::INTEGER;
    `;

    const migrationsResult = execSync(
      `psql "${SUPABASE_DB_URL}" -c "${getMigrationsQuery}"`,
      { encoding: 'utf8' }
    );

    log('\n📊 Uygulanmış Migration\'lar:\n', 'cyan');
    console.log(migrationsResult);

    // Get all migration files
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .map(file => {
        const match = file.match(/^(\d+)_/);
        return match ? { version: match[1], filename: file } : null;
      })
      .filter(Boolean);

    // Check which migrations are missing
    const getAppliedVersionsQuery = `
      SELECT version FROM schema_migrations WHERE success = true;
    `;

    const appliedVersions = execSync(
      `psql "${SUPABASE_DB_URL}" -t -c "${getAppliedVersionsQuery}"`,
      { encoding: 'utf8' }
    )
      .trim()
      .split('\n')
      .map(v => v.trim())
      .filter(Boolean);

    log('\n📋 Migration Dosyaları vs Veritabanı:\n', 'cyan');
    
    const missingMigrations = [];
    const failedMigrations = [];

    for (const { version, filename } of migrationFiles) {
      if (appliedVersions.includes(version)) {
        success(`  ${version}: ${filename} ✓`);
      } else {
        missingMigrations.push({ version, filename });
        warning(`  ${version}: ${filename} ✗ (uygulanmamış)`);
      }
    }

    // Check for failed migrations
    const getFailedMigrationsQuery = `
      SELECT version, filename, error_message 
      FROM schema_migrations 
      WHERE success = false
      ORDER BY version::INTEGER;
    `;

    try {
      const failedResult = execSync(
        `psql "${SUPABASE_DB_URL}" -t -A -F'|' -c "${getFailedMigrationsQuery}"`,
        { encoding: 'utf8' }
      ).trim();

      if (failedResult) {
        log('\n⚠️  Başarısız Migration\'lar:\n', 'yellow');
        failedResult.split('\n').forEach(line => {
          const [version, filename, error] = line.split('|');
          error(`  ${version}: ${filename}`);
          if (error) {
            log(`     Hata: ${error}`, 'red');
          }
        });
      }
    } catch (err) {
      // No failed migrations
    }

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 ÖZET', 'bright');
    log('='.repeat(60), 'cyan');
    log(`Toplam migration dosyası: ${migrationFiles.length}`);
    log(`Uygulanmış: ${appliedVersions.length}`, 'green');
    log(`Eksik: ${missingMigrations.length}`, missingMigrations.length > 0 ? 'yellow' : 'reset');
    
    if (missingMigrations.length > 0) {
      log('\n⚠️  Uygulanmamış migration\'lar:', 'yellow');
      missingMigrations.forEach(({ version, filename }) => {
        log(`  - ${version}: ${filename}`, 'yellow');
      });
      log('\n💡 Bu migration\'ları çalıştırmak için:', 'blue');
      log(`   node scripts/migrate.js --from=${missingMigrations[0].version}`, 'cyan');
    } else {
      success('\n✅ Tüm migration\'lar uygulanmış!');
    }

  } catch (err) {
    error(`Migration durumu kontrol edilemedi: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run
checkMigrationStatus().catch(err => {
  error(`\n💥 Beklenmeyen hata: ${err.message}`);
  console.error(err);
  process.exit(1);
});

// Fix async function call
async function checkMigrationStatus() {
  return checkMigrationTable();
}

