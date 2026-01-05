# Frontend'de Assets-Jobs-Job_Assets Durumu

## ✅ KURULU MU? EVET!

Frontend'de bu üç tablo **aktif olarak kullanılıyor**. İşte kanıtlar:

---

## 📍 Kullanım Yerleri

### 1. **`assets` Tablosu** ✅

#### Kullanım 1: Dosya Yükleme Sonrası Kayıt
**Dosya:** `design-preview/page.tsx:222`
```typescript
const { data: assetData, error: assetError } = await supabase
  .from('assets')
  .insert({
    user_id: currentUser.id,
    type: 'image',
    role: 'source',
    url: data.key,
  })
  .select()
  .single();

if (assetData && assetData.id) {
  setCurrentAssetId(assetData.id);  // ✅ State'e kaydediliyor
}
```

#### Kullanım 2: SessionStorage'dan Asset ID Bulma
**Dosya:** `design-preview/page.tsx:99`
```typescript
const { data: assetData } = await supabase
  .from('assets')
  .select('id')
  .eq('url', uploadedImageKey)
  .eq('user_id', user.id)
  .eq('role', 'source')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

if (assetData && assetData.id) {
  setCurrentAssetId(assetData.id);  // ✅ State'e kaydediliyor
}
```

#### Kullanım 3: n8n Webhook için Asset Bilgisi Çekme
**Dosya:** `design-preview/page.tsx:508`
```typescript
const { data: assetData, error: assetError } = await supabase
  .from('assets')
  .select('url, type')
  .eq('id', currentAssetId)
  .single();

const assetUrl = `${WORKER_URL}/${assetData.url}`;
// n8n webhook'una gönderiliyor
```

#### Kullanım 4: QuickUploadSection'da Kayıt
**Dosya:** `QuickUploadSection.tsx:352`
```typescript
await supabase.from('assets').insert({
  user_id: user.id,
  project_id: null,
  type: 'image',
  role: 'source',
  url: data.key,
});
```

---

### 2. **`jobs` Tablosu** ✅

#### Kullanım: Generate Butonuna Basıldığında Job Oluşturma
**Dosya:** `design-preview/page.tsx:441`
```typescript
const { data: jobData, error: jobError } = await supabase
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

if (jobData && jobData.jobid) {
  setCurrentJobId(jobData.jobid);  // ✅ State'e kaydediliyor
}
```

---

### 3. **`job_assets` Tablosu** ✅

#### Kullanım: Asset ve Job'u Bağlama
**Dosya:** `design-preview/page.tsx:483`
```typescript
const { error: jobAssetError } = await supabase
  .from('job_assets')
  .insert({
    job_id: createdJobId,
    asset_id: currentAssetId,
    purpose: 'input',  // ✅ Input asset olarak işaretleniyor
  });
```

---

## 🔄 State Yönetimi

### State Tanımları
**Dosya:** `design-preview/page.tsx:80-81`
```typescript
const [currentJobId, setCurrentJobId] = useState<string | null>(null);
const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
```

### State Kullanımları
- ✅ `currentAssetId` → Asset yüklendiğinde set ediliyor
- ✅ `currentJobId` → Job oluşturulduğunda set ediliyor
- ✅ `job_assets` insert'te her ikisi de kullanılıyor
- ✅ Asset bilgisi çekilirken `currentAssetId` kullanılıyor

---

## 📊 İş Akışı Frontend'de

```
1. Kullanıcı Fotoğraf Yükler
   ✅ assets.insert() → currentAssetId set edilir

2. Kullanıcı "Generate" Butonuna Basar
   ✅ jobs.insert() → currentJobId set edilir

3. Asset ve Job Bağlanır
   ✅ job_assets.insert() → İkisi birleştirilir

4. n8n Webhook'a Gönderilir
   ✅ assets.select() → Asset bilgisi çekilir
   ✅ Webhook'a job_id + asset_url gönderilir
```

---

## ⚠️ Eksiklikler / İyileştirme Gerekenler

### 1. **Job Durumu Takibi Yok**
- ❌ Job oluşturulduktan sonra durumu kontrol edilmiyor
- ❌ `pending` → `processing` → `completed` geçişi frontend'de yok
- ✅ **Öneri:** Polling veya WebSocket ile job durumu takip edilmeli

### 2. **Result Asset Kaydı Yok**
- ❌ n8n işlemi tamamlandığında result asset kaydedilmiyor
- ❌ `job_assets`'e `output` purpose ile eklenmiyor
- ✅ **Öneri:** n8n webhook receiver'da result asset kaydedilmeli

### 3. **Hata Durumları**
- ⚠️ RLS policy hataları console'a yazılıyor ama kullanıcıya gösterilmiyor
- ✅ **Öneri:** Kullanıcıya hata mesajı gösterilmeli

### 4. **Job Geçmişi Gösterimi Yok**
- ❌ Kullanıcının geçmiş job'ları gösterilmiyor
- ❌ Dashboard'da job listesi yok
- ✅ **Öneri:** Dashboard'da jobs tablosundan geçmiş işler çekilmeli

---

## ✅ Sonuç

**Frontend'de kurulu mu?** → **EVET ✅**

**Kullanılan yerler:**
- ✅ `assets` → 4 yerde kullanılıyor
- ✅ `jobs` → 1 yerde kullanılıyor (insert)
- ✅ `job_assets` → 1 yerde kullanılıyor (insert)

**State yönetimi:**
- ✅ `currentAssetId` ve `currentJobId` state'leri var
- ✅ İş akışı doğru çalışıyor

**Eksikler:**
- ⚠️ Job durumu takibi yok
- ⚠️ Result asset kaydı yok
- ⚠️ Job geçmişi gösterimi yok

**Genel Durum:** Temel yapı kurulu ve çalışıyor, ancak tam bir iş akışı için eksikler var.

