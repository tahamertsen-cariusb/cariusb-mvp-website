# Tablo Kullanım Analizi - Gerçek Durum

## 📊 Kod Tabanında Kullanım Durumu

### ✅ **GERÇEKTEN GEREKLİ TABLOLAR**

#### 1. **`assets`** ✅ AKTİF KULLANILIYOR
- **Kullanım:** `design-preview/page.tsx` (3 yerde), `QuickUploadSection.tsx`
- **İşlev:** Dosya yükleme ve kayıt
- **Durum:** Kritik - Dosya yönetimi için gerekli

#### 2. **`jobs`** ✅ AKTİF KULLANILIYOR
- **Kullanım:** `design-preview/page.tsx` (job oluşturma)
- **İşlev:** İş kuyruğu yönetimi
- **Durum:** Kritik - AI işlemleri için gerekli

#### 3. **`job_assets`** ✅ AKTİF KULLANILIYOR
- **Kullanım:** `design-preview/page.tsx` (job-asset ilişkisi)
- **İşlev:** İş ve varlık bağlantısı
- **Durum:** Kritik - İş takibi için gerekli

---

### ⚠️ **TRIGGER İÇİN GEREKLİ AMA KODDA KULLANILMIYOR**

#### 4. **`profiles`** ⚠️ SADECE TRIGGER İÇİN
- **Kullanım:** `handle_new_user()` trigger fonksiyonu ile otomatik oluşturuluyor
- **Kod Kullanımı:** ❌ Hiçbir yerde query edilmiyor
- **Durum:** Auth trigger için gerekli ama kodda kullanılmıyor
- **Öneri:** 
  - Eğer profil bilgilerini göstermek istiyorsanız → Kullanılmalı
  - Sadece auth için → Trigger yeterli, tablo kalabilir

#### 5. **`credits`** ⚠️ SADECE TRIGGER İÇİN
- **Kullanım:** `handle_new_user()` trigger fonksiyonu ile otomatik oluşturuluyor
- **Kod Kullanımı:** ❌ Hiçbir yerde query edilmiyor
- **Durum:** Tüm yerlerde **hardcoded `1200`** kullanılıyor
- **Öneri:** 
  - Eğer gerçek kredi sistemi istiyorsanız → Kullanılmalı
  - Şu an hardcoded → Tablo gereksiz, trigger'ı kaldır

**Hardcoded Credits Kullanılan Yerler:**
- `dashboard/page.tsx` - `user?.credits || 0`
- `profile/page.tsx` - `user.credits`
- `billing/page.tsx` - `user?.credits?.toLocaleString() || '1,200'`
- `login/page.tsx` - `credits: 1200`
- `signup/page.tsx` - `credits: 1200`
- `TopBar.tsx` - `credits = 1200`
- `authStore.ts` - `credits: 1200`

---

### ❌ **KULLANILMAYAN TABLOLAR**

#### 6. **`projects`** ❌ KULLANILMIYOR
- **Kod Kullanımı:** ❌ Hiçbir yerde query edilmiyor
- **Durum:** Dashboard'da **hardcoded `sampleProjects`** kullanılıyor
- **Öneri:** 
  - Eğer proje yönetimi istiyorsanız → Kullanılmalı
  - Şu an hardcoded → Tablo gereksiz

**Hardcoded Projects:**
- `dashboard/page.tsx` - `sampleProjects` array'i
- `profile/page.tsx` - `recentProjects` array'i

#### 7. **`modes`** ❌ KULLANILMIYOR
- **Kod Kullanımı:** ❌ Hiçbir yerde query edilmiyor
- **Durum:** AI modları **hardcoded** olarak `design-preview/page.tsx` içinde tanımlı
- **Öneri:** 
  - Eğer mod yönetimini DB'den yapmak istiyorsanız → Kullanılmalı
  - Şu an hardcoded → Tablo gereksiz

**Hardcoded Modes:**
- `design-preview/page.tsx` - `PHOTO_FEATURES` ve `VIDEO_FEATURES` objeleri

---

## 🎯 ÖNERİLER

### Senaryo 1: Minimal Yapı (Sadece Çalışan Özellikler)
**Kaldırılabilir:**
- ❌ `profiles` (trigger'ı kaldır)
- ❌ `credits` (trigger'ı kaldır)
- ❌ `projects`
- ❌ `modes`

**Kalacak:**
- ✅ `assets`
- ✅ `jobs`
- ✅ `job_assets`

### Senaryo 2: Gelecek İçin Hazırlık (Önerilen)
**Kalacak ama şu an kullanılmayan:**
- ⚠️ `profiles` - Profil sayfası için hazır
- ⚠️ `credits` - Kredi sistemi için hazır
- ⚠️ `projects` - Proje yönetimi için hazır
- ⚠️ `modes` - Mod yönetimi için hazır

**Kodda kullanılmalı:**
- `profiles` → Profile sayfasında DB'den çekilmeli
- `credits` → Tüm hardcoded değerler DB'den çekilmeli
- `projects` → Dashboard'da DB'den çekilmeli
- `modes` → Design preview'da DB'den çekilmeli

---

## 📋 SONUÇ

### Şu An İçin Gerçekten Gerekli:
1. ✅ `assets` - Aktif kullanılıyor
2. ✅ `jobs` - Aktif kullanılıyor
3. ✅ `job_assets` - Aktif kullanılıyor

### Trigger İçin Gerekli (Ama Kodda Kullanılmıyor):
4. ⚠️ `profiles` - Trigger için gerekli
5. ⚠️ `credits` - Trigger için gerekli

### Kullanılmayan:
6. ❌ `projects` - Hardcoded veriler kullanılıyor
7. ❌ `modes` - Hardcoded veriler kullanılıyor

### Zaten Kaldırılan:
- ❌ `webhook_events` - Kullanılmıyordu, kaldırıldı
- ❌ `renders` - Eski sistem
- ❌ `results_video` - Kullanılmıyor
- ❌ `last_results_files` - Kullanılmıyor

---

## 🔧 YAPILACAKLAR

### Seçenek A: Minimal Yapı
1. `profiles` ve `credits` trigger'larını kaldır
2. `projects` ve `modes` tablolarını kaldır
3. Sadece `assets`, `jobs`, `job_assets` kalır

### Seçenek B: Gelecek İçin Hazırlık (Önerilen)
1. `profiles` tablosunu kullan - Profile sayfasında DB'den çek
2. `credits` tablosunu kullan - Tüm hardcoded değerleri DB'den çek
3. `projects` tablosunu kullan - Dashboard'da DB'den çek
4. `modes` tablosunu kullan - Design preview'da DB'den çek

Hangi senaryoyu tercih edersiniz?

