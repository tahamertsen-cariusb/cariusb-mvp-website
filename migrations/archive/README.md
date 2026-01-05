# Eski Migration Dosyaları (Arşiv)

Bu klasör, eski migration dosyalarını içerir. Bu dosyalar artık kullanılmıyor ve yeni sıralı migration sistemi ile değiştirilmiştir.

## 📦 Arşivlenen Dosyalar

- `fix_jobs_rls.sql` → `010_rls_policies.sql` içinde birleştirildi
- `fix_job_assets_rls.sql` → `010_rls_policies.sql` içinde birleştirildi
- `fix_jobs_mode_nullable.sql` → `006_jobs.sql` içinde birleştirildi
- `fix_jobs_table_jobid.sql` → `006_jobs.sql` içinde birleştirildi
- `supabase_migration_add_type_to_jobs.sql` → `006_jobs.sql` içinde birleştirildi
- `projects_table_migration.sql` → `004_projects.sql` olarak yeniden düzenlendi

## 🔄 Yeni Sistem

Yeni migration sistemi:
- ✅ Sıralı ve numaralandırılmış (`001_`, `002_`, ...)
- ✅ Bağımlılık sırasına göre düzenlenmiş
- ✅ `IF NOT EXISTS` kontrolleri ile güvenli
- ✅ Detaylı dokümantasyon

Yeni migration dosyaları `migrations/` klasöründe bulunmaktadır.

## ⚠️ Uyarı

Bu dosyaları **SİLMEYİN** - referans için saklanıyorlar. Ancak yeni migration'lar için kullanmayın.

