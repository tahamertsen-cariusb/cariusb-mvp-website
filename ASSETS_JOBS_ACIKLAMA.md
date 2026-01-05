# Assets, Jobs ve Job_Assets Tabloları - Neden Var?

## 🎯 Genel Amaç

Bu üç tablo, **AI işlem sürecini** (fotoğraf/video düzenleme) takip etmek için tasarlanmış bir **iş akışı sistemi** oluşturuyor.

---

## 📊 Tabloların Rolleri

### 1. **`assets`** - Dosya Varlıkları
**Ne işe yarıyor?**
- Kullanıcının yüklediği tüm dosyaları (resim/video) saklar
- Her dosyanın metadata'sını tutar (kim yükledi, ne zaman, hangi projeye ait)

**Örnek Veri:**
```json
{
  "id": "uuid-123",
  "user_id": "user-456",
  "type": "image",
  "role": "source",  // veya "result"
  "url": "cloudflare-worker-key-789",
  "created_at": "2025-01-27T10:00:00Z"
}
```

**Kodda Kullanım:**
- ✅ Dosya yüklendiğinde kaydediliyor (`design-preview/page.tsx:222`)
- ✅ SessionStorage'dan asset ID bulunuyor (`design-preview/page.tsx:99`)
- ✅ Job oluşturulurken asset bilgisi çekiliyor (`design-preview/page.tsx:508`)

---

### 2. **`jobs`** - İş Kuyruğu
**Ne işe yarıyor?**
- Her AI işlemini (fotoğraf düzenleme, video oluşturma) bir "job" olarak takip eder
- İş durumunu saklar: `pending` → `processing` → `completed` / `failed`
- n8n workflow'una gönderilecek iş bilgilerini tutar

**Örnek Veri:**
```json
{
  "id": "uuid-789",
  "jobid": "job-abc-123",
  "user_id": "user-456",
  "type": "image_edit",  // veya "video_generation"
  "mode": "photo",  // veya "video"
  "status": "pending",
  "options": { "paint": "red", "rims": "..." },
  "created_at": "2025-01-27T10:05:00Z"
}
```

**Kodda Kullanım:**
- ✅ "Generate" butonuna basıldığında job oluşturuluyor (`design-preview/page.tsx:441`)
- ✅ Job ID n8n webhook'una gönderiliyor (`design-preview/page.tsx:524`)
- ✅ İş durumu takip ediliyor (pending → processing → completed)

---

### 3. **`job_assets`** - İş-Varlık İlişkisi
**Ne işe yarıyor?**
- Bir job'un hangi asset'leri kullandığını bağlar
- **Input** (girdi) ve **Output** (çıktı) asset'lerini ayırt eder
- Bir job'un birden fazla asset kullanmasına izin verir

**Örnek Veri:**
```json
{
  "job_id": "uuid-789",
  "asset_id": "uuid-123",
  "purpose": "input"  // veya "output"
}
```

**Kodda Kullanım:**
- ✅ Job oluşturulduktan sonra source asset bağlanıyor (`design-preview/page.tsx:483`)
- ✅ n8n'e gönderilmeden önce asset bilgisi çekiliyor (`design-preview/page.tsx:508`)

---

## 🔄 İş Akışı (Workflow)

### Senaryo: Kullanıcı Fotoğraf Yükleyip AI İşlemi Başlatıyor

```
1. Kullanıcı Fotoğraf Yükler
   ↓
   [assets] tablosuna kayıt
   {
     id: "asset-123",
     user_id: "user-456",
     type: "image",
     role: "source",
     url: "worker-key-789"
   }
   ↓
   currentAssetId = "asset-123" (state'de saklanır)

2. Kullanıcı "Generate" Butonuna Basar
   ↓
   [jobs] tablosuna kayıt
   {
     id: "job-456",
     jobid: "job-abc-123",
     user_id: "user-456",
     status: "pending",
     type: "image_edit",
     mode: "photo"
   }
   ↓
   currentJobId = "job-abc-123" (state'de saklanır)

3. Asset ve Job Bağlanır
   ↓
   [job_assets] tablosuna kayıt
   {
     job_id: "job-456",
     asset_id: "asset-123",
     purpose: "input"
   }

4. n8n Webhook'a Gönderilir
   ↓
   {
     job_id: "job-abc-123",
     user_id: "user-456",
     input: {
       asset_url: "https://worker.../worker-key-789",
       asset_key: "worker-key-789",
       type: "image"
     }
   }

5. n8n İşlemi Tamamlar
   ↓
   [jobs] tablosu güncellenir
   {
     status: "completed",
     result_url: "https://worker.../result-key-999"
   }
   ↓
   [assets] tablosuna yeni kayıt (result)
   {
     id: "asset-999",
     user_id: "user-456",
     type: "image",
     role: "result",
     url: "result-key-999"
   }
   ↓
   [job_assets] tablosuna yeni kayıt
   {
     job_id: "job-456",
     asset_id: "asset-999",
     purpose: "output"
   }
```

---

## 💡 Neden Bu Yapı?

### 1. **Ayrıştırılmış Sorumluluklar**
- `assets` → Dosya yönetimi
- `jobs` → İş yönetimi
- `job_assets` → İlişki yönetimi

### 2. **Esneklik**
- Bir job birden fazla asset kullanabilir (input + output)
- Bir asset birden fazla job'da kullanılabilir
- Asset'ler projeler arasında paylaşılabilir

### 3. **Takip Edilebilirlik**
- Hangi dosya hangi işte kullanıldı?
- Hangi iş hangi dosyaları üretti?
- Kullanıcının tüm iş geçmişi

### 4. **n8n Entegrasyonu**
- Job ID ile iş takibi
- Asset URL'leri ile dosya erişimi
- Webhook payload'larında gerekli bilgiler

---

## 🔍 Gerçek Kod Örnekleri

### 1. Asset Yükleme ve Kaydetme
```typescript
// design-preview/page.tsx:221
const { data: assetData } = await supabase
  .from('assets')
  .insert({
    user_id: currentUser.id,
    type: 'image',
    role: 'source',
    url: data.key,  // Cloudflare Worker key
  })
  .select()
  .single();

setCurrentAssetId(assetData.id);  // Sonraki adımda kullanmak için
```

### 2. Job Oluşturma
```typescript
// design-preview/page.tsx:441
const { data: jobData } = await supabase
  .from('jobs')
  .insert({
    jobid: jobId,  // UUID
    user_id: currentUser.id,
    status: 'pending',
    type: jobType,  // 'image_edit' veya 'video_generation'
    mode: mode,  // 'photo' veya 'video'
  })
  .select()
  .single();

setCurrentJobId(jobData.jobid);
```

### 3. Asset-Job Bağlama
```typescript
// design-preview/page.tsx:483
await supabase
  .from('job_assets')
  .insert({
    job_id: createdJobId,
    asset_id: currentAssetId,
    purpose: 'input',  // Bu asset job'un girdisi
  });
```

### 4. Asset Bilgisini Çekme (n8n için)
```typescript
// design-preview/page.tsx:508
const { data: assetData } = await supabase
  .from('assets')
  .select('url, type')
  .eq('id', currentAssetId)
  .single();

const assetUrl = `${WORKER_URL}/${assetData.url}`;
// n8n webhook'una gönderilir
```

---

## ❓ Neden Ayrı Tablolar?

### Tek Tablo Olsaydı?
```sql
-- Kötü tasarım örneği
CREATE TABLE jobs_with_assets (
  job_id uuid,
  asset_id uuid,  -- Sadece bir asset?
  asset_url text,  -- Asset bilgisi tekrarlanıyor
  ...
);
```

**Sorunlar:**
- ❌ Bir job birden fazla asset kullanamaz
- ❌ Asset bilgisi tekrarlanır (normalizasyon yok)
- ❌ Input/Output ayrımı yapılamaz
- ❌ Asset'ler bağımsız yönetilemez

### Şu Anki Yapı (İyi Tasarım)
```sql
-- assets: Dosya yönetimi
-- jobs: İş yönetimi  
-- job_assets: İlişki yönetimi (many-to-many)
```

**Avantajlar:**
- ✅ Bir job birden fazla asset kullanabilir
- ✅ Asset bilgisi tek yerde (normalizasyon)
- ✅ Input/Output ayrımı yapılabilir
- ✅ Asset'ler bağımsız yönetilebilir
- ✅ Esnek ve ölçeklenebilir

---

## 📈 Gelecek Senaryolar

### Senaryo 1: Birden Fazla Input Asset
```typescript
// Kullanıcı 3 fotoğraf yükleyip birleştiriyor
job_assets: [
  { job_id: "job-1", asset_id: "asset-1", purpose: "input" },
  { job_id: "job-1", asset_id: "asset-2", purpose: "input" },
  { job_id: "job-1", asset_id: "asset-3", purpose: "input" },
  { job_id: "job-1", asset_id: "asset-result", purpose: "output" }
]
```

### Senaryo 2: Job Geçmişi
```sql
-- Kullanıcının tüm işlerini göster
SELECT j.*, COUNT(ja.asset_id) as asset_count
FROM jobs j
LEFT JOIN job_assets ja ON j.id = ja.job_id
WHERE j.user_id = 'user-123'
GROUP BY j.id
ORDER BY j.created_at DESC;
```

### Senaryo 3: Asset Kullanım İstatistikleri
```sql
-- Hangi asset kaç job'da kullanılmış?
SELECT a.url, COUNT(ja.job_id) as usage_count
FROM assets a
JOIN job_assets ja ON a.id = ja.asset_id
WHERE a.user_id = 'user-123'
GROUP BY a.id
ORDER BY usage_count DESC;
```

---

## ✅ Sonuç

Bu üç tablo **birlikte çalışan bir sistem** oluşturuyor:

1. **`assets`** → Dosyaları saklar ve yönetir
2. **`jobs`** → İşleri takip eder ve durumları saklar
3. **`job_assets`** → İkisini birbirine bağlar

**Neden Gerekli?**
- ✅ AI işlem sürecini takip etmek için
- ✅ n8n workflow entegrasyonu için
- ✅ Kullanıcı geçmişini saklamak için
- ✅ Esnek ve ölçeklenebilir yapı için

**Basitleştirilebilir mi?**
- ❌ Hayır, her tablonun kendine özgü sorumluluğu var
- ❌ Birleştirmek esnekliği kaybettirir
- ✅ Şu anki yapı optimal

