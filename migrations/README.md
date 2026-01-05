# Database Migrations

Bu klasör, veritabanı migration dosyalarını içerir. Migration'lar **sıralı ve katmanlı** bir yapıda düzenlenmiştir.

## 📋 Migration Sırası

Migration'lar bağımlılık sırasına göre numaralandırılmıştır:

| # | Dosya | Açıklama | Bağımlılıklar |
|---|-------|----------|---------------|
| 001 | `001_functions.sql` | Database fonksiyonları | Yok (en temel) |
| 002 | `002_profiles.sql` | Kullanıcı profilleri | `auth.users` |
| 003 | `003_credits.sql` | Kredi sistemi | `auth.users` |
| 004 | `004_projects.sql` | Projeler | `auth.users` |
| 005 | `005_assets.sql` | Dosya varlıkları | `auth.users`, `projects` |
| 006 | `006_jobs.sql` | İş kuyruğu | `auth.users`, `projects` |
| 007 | `007_job_assets.sql` | İş-varlık ilişkisi | `jobs`, `assets` |
| 008 | `008_modes.sql` | AI mod referansları | Yok (bağımsız) |
| 009 | `009_webhook_events.sql` | Webhook logları | Yok (bağımsız) |
| 010 | `010_rls_policies.sql` | Row Level Security | Tüm tablolar |
| 011 | `011_auth_trigger.sql` | Auth trigger | `profiles`, `credits`, `handle_new_user()` |
| 012 | `012_schema_migrations.sql` | Migration tracking | Yok (bağımsız) |
| 013 | `013_production_indexes.sql` | Production indexes | Tüm tablolar |

## 🔄 Bağımlılık Grafiği

```
auth.users (Supabase built-in)
    ↓
├── profiles (002)
├── credits (003)
└── projects (004)
    ↓
├── assets (005)
└── jobs (006)
    ↓
└── job_assets (007) ← jobs + assets

modes (008) ← bağımsız
webhook_events (009) ← bağımsız

functions (001) ← tüm trigger'lar buna bağlı
```

## 🚀 Migration Çalıştırma

### Yöntem 1: Migration Script (Önerilen)

```bash
# Tüm migration'ları çalıştır
node scripts/migrate.js

# Dry run (sadece test, değişiklik yapmaz)
node scripts/migrate.js --dry-run

# Belirli bir migration'dan başla
node scripts/migrate.js --from=5

# Belirli bir aralık
node scripts/migrate.js --from=5 --to=7
```

**Gereksinimler:**
- `SUPABASE_DB_URL` environment variable (PostgreSQL connection string)
- veya `psql` komut satırı aracı

### Yöntem 2: Supabase Dashboard

1. Supabase Dashboard'a gidin
2. SQL Editor'ü açın
3. Migration dosyalarını sırayla kopyalayıp çalıştırın

### Yöntem 3: psql Komut Satırı

```bash
# Tek bir migration
psql "postgresql://user:pass@host:port/db" -f migrations/001_functions.sql

# Tüm migration'lar (sırayla)
for file in migrations/*.sql; do
  psql "postgresql://user:pass@host:port/db" -f "$file"
done
```

## ⚠️ Önemli Notlar

### 1. Sıralama Kritik!

Migration'ları **mutlaka sırayla** çalıştırın. Bağımlılıklar nedeniyle sıra önemlidir.

### 2. İlk Kurulum

Yeni bir veritabanı için tüm migration'ları sırayla çalıştırın:

```bash
node scripts/migrate.js
```

### 3. Mevcut Veritabanı

Eğer veritabanınız zaten varsa:
- Migration'ları kontrol edin (hangi tablolar zaten var?)
- Eksik migration'ları sırayla çalıştırın
- `IF NOT EXISTS` kontrolleri migration'larda mevcut

### 4. Rollback

Rollback script'leri henüz eklenmedi. Production'da dikkatli olun!

## 📊 Tablo Özeti

| Tablo | Açıklama | RLS | Kullanım |
|-------|----------|-----|----------|
| `profiles` | Kullanıcı profilleri | ✅ | Auth trigger ile otomatik |
| `credits` | Kredi sistemi | ✅ | Auth trigger ile otomatik |
| `projects` | Projeler | ✅ | Dashboard'da kullanılıyor |
| `assets` | Dosya varlıkları | ✅ | Aktif kullanılıyor |
| `jobs` | İş kuyruğu | ✅ | Aktif kullanılıyor |
| `job_assets` | İş-varlık ilişkisi | ✅ | Aktif kullanılıyor |
| `modes` | AI mod referansları | ✅ (public read) | Referans tablosu |
| `webhook_events` | Webhook logları | ✅ (service_role) | n8n webhook'ları için |

## 🔧 Sorun Giderme

### Migration Başarısız Oldu

1. Hata mesajını okuyun
2. Hangi migration'da hata oldu?
3. Bağımlılıkları kontrol edin (önceki migration'lar çalıştı mı?)
4. Tablolar zaten var mı? (`IF NOT EXISTS` kontrolleri var)

### Foreign Key Hatası

- Önce bağımlı tabloların oluşturulduğundan emin olun
- Migration sırasını kontrol edin

### RLS Policy Hatası

- `010_rls_policies.sql` migration'ını çalıştırdınız mı?
- Tüm tablolar önce oluşturulmuş olmalı

## 📝 Yeni Migration Ekleme

1. Dosya adını numaralandırın: `012_yeni_migration.sql`
2. Bağımlılıkları kontrol edin
3. `IF NOT EXISTS` kontrolleri ekleyin
4. Migration'ı test edin
5. README'yi güncelleyin

## 🔗 İlgili Dosyalar

- `scripts/migrate.js` - Migration runner script
- `SUPABASE_SCHEMA_EXPORT.md` - Detaylı şema dokümantasyonu
- `TABLO_KULLANIM_ANALIZI.md` - Tablo kullanım analizi

