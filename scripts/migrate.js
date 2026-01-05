#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * Bu script, migrations/ klasöründeki SQL dosyalarını sırayla çalıştırır.
 * 
 * Kullanım:
 *   node scripts/migrate.js [--dry-run] [--from=N] [--to=N]
 * 
 * Örnekler:
 *   node scripts/migrate.js                    # Tüm migration'ları çalıştır
 *   node scripts/migrate.js --dry-run          # Sadece test et, çalıştırma
 *   node scripts/migrate.js --from=5           # 5'ten itibaren çalıştır
 *   node scripts/migrate.js --from=5 --to=7   # Sadece 5, 6, 7'yi çalıştır
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fromArg = args.find(arg => arg.startsWith('--from='));
const toArg = args.find(arg => arg.startsWith('--to='));

const from = fromArg ? parseInt(fromArg.split('=')[1]) : null;
const to = toArg ? parseInt(toArg.split('=')[1]) : null;

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

// Get migration files in order
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    error(`Migrations klasörü bulunamadı: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort alphabetically (001, 002, 003...)

  if (files.length === 0) {
    error('Migration dosyası bulunamadı!');
    process.exit(1);
  }

  return files.map(file => ({
    name: file,
    path: path.join(migrationsDir, file),
    number: parseInt(file.split('_')[0]) || 0,
  })).filter(migration => {
    if (from !== null && migration.number < from) return false;
    if (to !== null && migration.number > to) return false;
    return true;
  });
}

// Check database connection
function checkDatabaseConnection() {
  if (!SUPABASE_DB_URL && !SUPABASE_SERVICE_KEY) {
    error('Database bağlantı bilgileri bulunamadı!');
    error('Lütfen şu environment variable\'larından birini ayarlayın:');
    error('  - SUPABASE_DB_URL (PostgreSQL connection string)');
    error('  - veya SUPABASE_SERVICE_ROLE_KEY (Supabase service role key)');
    process.exit(1);
  }
}

// Check if migration has already been applied
function isMigrationApplied(version) {
  if (!SUPABASE_DB_URL) return false;
  
  try {
    const query = `SELECT migration_applied('${version}');`;
    const result = execSync(
      `psql "${SUPABASE_DB_URL}" -t -c "${query}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    
    return result === 't';
  } catch (err) {
    // If schema_migrations table doesn't exist, migration is not applied
    return false;
  }
}

// Record migration in tracking table
function recordMigration(version, filename, execTimeMs, success, errorMsg) {
  if (!SUPABASE_DB_URL) return;
  
  try {
    const versionEscaped = version.replace(/'/g, "''");
    const filenameEscaped = filename.replace(/'/g, "''");
    const errorEscaped = errorMsg ? errorMsg.replace(/'/g, "''") : 'NULL';
    const execTime = execTimeMs !== null ? execTimeMs : 'NULL';
    
    const query = `
      SELECT record_migration(
        '${versionEscaped}',
        '${filenameEscaped}',
        ${execTime},
        ${success},
        ${errorEscaped ? `'${errorEscaped}'` : 'NULL'},
        NULL
      );
    `;
    
    execSync(
      `psql "${SUPABASE_DB_URL}" -t -c "${query}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch (err) {
    // If recording fails, just warn but don't fail the migration
    warning(`Migration kaydı yapılamadı: ${err.message}`);
  }
}

// Run migration using psql or Supabase CLI
async function runMigration(migration) {
  const { name, path: filePath, number } = migration;
  const version = number.toString().padStart(3, '0');
  
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Migration ${number}: ${name}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');

  // Check if migration already applied (skip if dry-run)
  if (!dryRun && isMigrationApplied(version)) {
    info(`Migration ${version} zaten uygulanmış, atlanıyor...`);
    return { success: true, skipped: true, reason: 'already_applied' };
  }

  if (dryRun) {
    info(`[DRY RUN] Migration dosyası okunuyor: ${name}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    info(`Dosya ${lines} satır içeriyor`);
    if (isMigrationApplied(version)) {
      info(`  (Not: Bu migration zaten uygulanmış)`);
    } else {
      info(`  (Not: Bu migration henüz uygulanmamış)`);
    }
    return { success: true, skipped: true };
  }

  const startTime = Date.now();
  let execTimeMs = null;
  let errorMsg = null;

  try {
    // Try psql first (if SUPABASE_DB_URL is set)
    if (SUPABASE_DB_URL) {
      info('psql ile çalıştırılıyor...');
      execSync(`psql "${SUPABASE_DB_URL}" -f "${filePath}"`, {
        stdio: 'inherit',
        encoding: 'utf8',
      });
      execTimeMs = Date.now() - startTime;
    } 
    // Fallback: Supabase CLI (if service key is set)
    else if (SUPABASE_SERVICE_KEY && SUPABASE_URL) {
      warning('Supabase CLI kullanılıyor (psql önerilir)');
      // Note: Supabase CLI migration komutu farklı olabilir
      // Bu durumda kullanıcıya manuel çalıştırması söylenir
      error('Supabase CLI migration desteği henüz eklenmedi.');
      error('Lütfen migration\'ı manuel olarak Supabase Dashboard\'dan çalıştırın.');
      return { success: false, error: 'CLI not implemented' };
    } else {
      error('Database bağlantı bilgisi bulunamadı!');
      return { success: false, error: 'No connection' };
    }

    // Record successful migration
    recordMigration(version, name, execTimeMs, true, null);
    
    success(`Migration ${number} başarıyla tamamlandı: ${name} (${execTimeMs}ms)`);
    return { success: true, execTimeMs };
  } catch (err) {
    execTimeMs = Date.now() - startTime;
    errorMsg = err.message;
    
    // Record failed migration
    recordMigration(version, name, execTimeMs, false, errorMsg);
    
    error(`Migration ${number} başarısız: ${name}`);
    error(`Hata: ${errorMsg}`);
    return { success: false, error: errorMsg, execTimeMs };
  }
}

// Main function
async function main() {
  log('\n🚀 Migration Runner Başlatılıyor...\n', 'bright');

  // Check database connection
  if (!dryRun) {
    checkDatabaseConnection();
  }

  // Get migration files
  const migrations = getMigrationFiles();

  if (migrations.length === 0) {
    warning('Çalıştırılacak migration dosyası bulunamadı!');
    if (from !== null || to !== null) {
      info(`Filtre: from=${from || 'null'}, to=${to || 'null'}`);
    }
    process.exit(0);
  }

  info(`Toplam ${migrations.length} migration dosyası bulundu:`);
  migrations.forEach(m => {
    log(`  ${m.number.toString().padStart(3, '0')}: ${m.name}`, 'cyan');
  });

  if (dryRun) {
    log('\n🔍 DRY RUN MODU - Hiçbir değişiklik yapılmayacak\n', 'yellow');
  } else {
    log('\n⚠️  Gerçek migration başlatılıyor...\n', 'yellow');
    log('Devam etmek için 5 saniye bekleniyor (Ctrl+C ile iptal edebilirsiniz)...\n');
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Run migrations
  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const result = await runMigration(migration);
    
    if (result.success) {
      if (!result.skipped) {
        successCount++;
      }
    } else {
      failCount++;
      error(`\n❌ Migration ${migration.number} başarısız oldu!`);
      error('Sonraki migration\'lar çalıştırılmayacak.');
      break;
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 ÖZET', 'bright');
  log('='.repeat(60), 'cyan');
  log(`Toplam: ${migrations.length} migration`);
  log(`✅ Başarılı: ${successCount}`, 'green');
  log(`❌ Başarısız: ${failCount}`, failCount > 0 ? 'red' : 'reset');
  
  if (dryRun) {
    log(`\n🔍 DRY RUN tamamlandı - Hiçbir değişiklik yapılmadı`, 'yellow');
  }

  if (failCount > 0) {
    process.exit(1);
  }
}

// Run
main().catch(err => {
  error(`\n💥 Beklenmeyen hata: ${err.message}`);
  console.error(err);
  process.exit(1);
});

