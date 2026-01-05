# 🚀 Migration Rehberi - Sıralı ve Katmanlı Yapı

Bu proje artık **sıralı ve katmanlı** bir migration sistemi kullanmaktadır. Bu sayede bir şeyi yaparken başka bir şeyi bozma sorunu çözülmüştür.

## 📋 Yapılan Değişiklikler

### ✅ Yeni Migration Sistemi

1. **Sıralı Numaralandırma**: Migration'lar `001_`, `002_`, `003_` şeklinde numaralandırıldı
2. **Bağımlılık Yönetimi**: Her migration bağımlılıklarını açıkça belirtiyor
3. **Güvenli Kontroller**: `IF NOT EXISTS` kontrolleri ile mevcut veritabanlarında güvenli çalışma
4. **Migration Runner**: Otomatik migration çalıştırma script'i eklendi
5. **Dokümantasyon**: Her migration'ın ne yaptığı ve bağımlılıkları dokümante edildi

### 📁 Yeni Klasör Yapısı

```
cari-nextjs/
├── migrations/              # YENİ: Sıralı migration dosyaları
│   ├── 001_functions.sql
│   ├── 002_profiles.sql
│   ├── 003_credits.sql
│   ├── 004_projects.sql
│   ├── 005_assets.sql
│   ├── 006_jobs.sql
│   ├── 007_job_assets.sql
│   ├── 008_modes.sql
│   ├── 009_webhook_events.sql
│   ├── 010_rls_policies.sql
│   ├── 011_auth_trigger.sql
│   ├── README.md           # Detaylı dokümantasyon
│   └── archive/             # Eski migration dosyaları (referans için)
├── scripts/
│   └── migrate.js           # YENİ: Migration runner script
└── MIGRATION_GUIDE.md       # Bu dosya
```

## 🎯 Migration Sırası ve Bağımlılıklar

### Katman 1: Temel Fonksiyonlar
- **001_functions.sql** - Database fonksiyonları (en temel, diğer her şey buna bağlı)

### Katman 2: Kullanıcı Tabloları
- **002_profiles.sql** - Kullanıcı profilleri (bağımlı: `auth.users`)
- **003_credits.sql** - Kredi sistemi (bağımlı: `auth.users`)

### Katman 3: Proje Tabloları
- **004_projects.sql** - Projeler (bağımlı: `auth.users`)

### Katman 4: İş ve Varlık Tabloları
- **005_assets.sql** - Dosya varlıkları (bağımlı: `auth.users`, `projects`)
- **006_jobs.sql** - İş kuyruğu (bağımlı: `auth.users`, `projects`)

### Katman 5: İlişki Tabloları
- **007_job_assets.sql** - İş-varlık ilişkisi (bağımlı: `jobs`, `assets`)

### Katman 6: Referans Tabloları
- **008_modes.sql** - AI mod referansları (bağımsız)
- **009_webhook_events.sql** - Webhook logları (bağımsız)

### Katman 7: Güvenlik ve Trigger'lar
- **010_rls_policies.sql** - Row Level Security (bağımlı: tüm tablolar)
- **011_auth_trigger.sql** - Auth trigger (bağımlı: `profiles`, `credits`, `handle_new_user()`)

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
    ↓
auth_trigger (011) ← profiles + credits + functions
```

## 🚀 Kullanım

### Yeni Veritabanı Kurulumu

```bash
# Tüm migration'ları sırayla çalıştır
node scripts/migrate.js
```

### Mevcut Veritabanına Migration Ekleme

Eğer veritabanınız zaten varsa ve sadece yeni migration'ları eklemek istiyorsanız:

```bash
# Belirli bir migration'dan başla
node scripts/migrate.js --from=5

# Belirli bir aralık
node scripts/migrate.js --from=5 --to=7
```

### Dry Run (Test)

Değişiklik yapmadan test etmek için:

```bash
node scripts/migrate.js --dry-run
```

## ⚙️ Environment Variables

Migration script'i şu environment variable'ları kullanır:

```env
# PostgreSQL connection string (önerilen)
SUPABASE_DB_URL=postgresql://user:password@host:port/database

# veya Supabase service role key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co
```

## 📊 Migration Özellikleri

### ✅ Güvenli Kontroller

Her migration `IF NOT EXISTS` kontrolleri içerir, bu sayede:
- Mevcut tabloları bozmaz
- Tekrar çalıştırılabilir (idempotent)
- Kısmi migration'lar güvenli

### ✅ Bağımlılık Yönetimi

Her migration dosyası:
- Bağımlılıklarını açıkça belirtir
- Foreign key'leri doğru sırada ekler
- RLS policy'leri tüm tablolar hazır olduktan sonra ekler

### ✅ Dokümantasyon

Her migration dosyası:
- Ne yaptığını açıklar
- Bağımlılıklarını listeler
- Comments ile tablo/kolon açıklamaları içerir

## 🔧 Sorun Giderme

### Migration Başarısız Oldu

1. **Hangi migration'da hata oldu?**
   - Hata mesajını kontrol edin
   - Migration numarasını not edin

2. **Bağımlılıkları kontrol edin**
   - Önceki migration'lar çalıştı mı?
   - Gerekli tablolar var mı?

3. **Mevcut veritabanı durumu**
   - Hangi tablolar zaten var?
   - `IF NOT EXISTS` kontrolleri çalıştı mı?

### Foreign Key Hatası

- Önce bağımlı tabloların oluşturulduğundan emin olun
- Migration sırasını kontrol edin (001, 002, 003...)

### RLS Policy Hatası

- `010_rls_policies.sql` migration'ını çalıştırdınız mı?
- Tüm tablolar önce oluşturulmuş olmalı

## 📝 Yeni Migration Ekleme

Yeni bir migration eklerken:

1. **Dosya adını numaralandırın**: `012_yeni_migration.sql`
2. **Bağımlılıkları belirleyin**: Hangi tablolara/fonksiyonlara bağlı?
3. **IF NOT EXISTS ekleyin**: Güvenli çalıştırma için
4. **Dokümante edin**: Ne yaptığını açıklayın
5. **Test edin**: Dry run ile test edin
6. **README güncelleyin**: `migrations/README.md` dosyasını güncelleyin

## 🎯 Avantajlar

### ✅ Sıralı Yapı
- Migration'lar her zaman doğru sırada çalışır
- Bağımlılık hataları önlenir

### ✅ Katmanlı Mimari
- Her katman net bir şekilde ayrılmış
- Bağımlılıklar açıkça görülüyor

### ✅ Güvenli
- `IF NOT EXISTS` kontrolleri
- Mevcut veritabanlarını bozmaz
- Tekrar çalıştırılabilir

### ✅ Dokümante
- Her migration ne yaptığını açıklıyor
- Bağımlılıklar listelenmiş
- README ile detaylı rehber

## 📚 İlgili Dosyalar

- `migrations/README.md` - Detaylı migration dokümantasyonu
- `scripts/migrate.js` - Migration runner script
- `SUPABASE_SCHEMA_EXPORT.md` - Veritabanı şema dokümantasyonu
- `TABLO_KULLANIM_ANALIZI.md` - Tablo kullanım analizi

## 🔄 Eski Sistemden Geçiş

Eski migration dosyaları `migrations/archive/` klasörüne taşındı. Yeni sistemde:

- ✅ Sıralı numaralandırma
- ✅ Bağımlılık yönetimi
- ✅ Güvenli kontroller
- ✅ Otomatik runner

Artık bir şeyi yaparken başka bir şeyi bozma sorunu çözülmüştür! 🎉

