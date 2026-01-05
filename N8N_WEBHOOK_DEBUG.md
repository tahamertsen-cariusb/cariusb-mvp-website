# n8n Webhook Debug Rehberi

## 🔴 Sorun

**Hata Mesajı:**
```
Webhook gönderimi başarısız: 500 - {"code":0,"message":"There was a problem executing the workflow"}
```

**Durum:** Webhook n8n'e ulaşıyor ama workflow çalışmıyor.

---

## 🔍 Sorun Analizi

### 1. Webhook Gönderiliyor mu? ✅
- Evet, webhook n8n'e ulaşıyor
- HTTP 500 hatası alınıyor (workflow hatası)

### 2. Workflow Neden Çalışmıyor?
n8n workflow'unda şu sorunlar olabilir:
- ❌ Workflow aktif değil
- ❌ Webhook node'u yanlış yapılandırılmış
- ❌ Header authentication hatası
- ❌ Workflow içinde bir node hatası var
- ❌ Payload formatı yanlış

---

## 📋 Gönderilen Payload

**Event:** `studio.photo.mode.activated`

**Payload Formatı:**
```json
{
  "event": "studio.photo.mode.activated",
  "timestamp": "2025-01-27T...",
  "job_id": "53f42a82-cdb9-4917-a45d-3c5f83bc25be",
  "user_id": "user-uuid",
  "input": {
    "asset_url": "https://broad-violet-3cb6.tahamertsen.workers.dev/worker-key",
    "asset_key": "worker-key",
    "type": "image"
  },
  "userId": "user-uuid",
  "userEmail": "user@example.com"
}
```

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: your-secret-key
```

---

## ✅ Çözüm Adımları

### 1. n8n Workflow'unu Kontrol Et

#### A. Workflow Aktif mi?
- n8n'de workflow'un **"Active"** olduğundan emin ol
- Workflow listesinde yeşil nokta görünmeli

#### B. Webhook Node Yapılandırması
1. **Webhook Node**'u aç
2. **HTTP Method:** `POST` olmalı
3. **Path:** `/webhook/studio-photo` (veya ne ayarladıysanız)
4. **Response Mode:** `Respond to Webhook` veya `Last Node`
5. **Authentication:** `Header Auth` seçili olmalı
   - **Header Name:** `X-Webhook-Signature`
   - **Header Value:** `.env.local`'deki `N8N_STUDIO_PHOTO_SECRET` değeri

#### C. Environment Variable Kontrolü
`.env.local` dosyasında şunlar olmalı:
```env
N8N_STUDIO_PHOTO_WEBHOOK_URL=https://your-n8n-instance.com/webhook/studio-photo/your-id
N8N_STUDIO_PHOTO_SECRET=your-secret-key-here
```

**Önemli:** 
- `N8N_STUDIO_PHOTO_SECRET` değeri n8n'deki Header Value ile **tamamen aynı** olmalı
- Boşluk, büyük/küçük harf farkı olmamalı

---

### 2. n8n Workflow'unda Debug

#### A. Webhook Node'u Test Et
1. n8n'de workflow'u aç
2. Webhook node'una sağ tık → **"Test workflow"**
3. Manuel bir payload gönder:
```json
{
  "event": "studio.photo.mode.activated",
  "job_id": "test-123",
  "user_id": "test-user",
  "input": {
    "asset_url": "https://example.com/test.jpg",
    "asset_key": "test-key",
    "type": "image"
  }
}
```

#### B. Execution Log'larını Kontrol Et
1. n8n'de **"Executions"** sekmesine git
2. Son execution'ı aç
3. Hangi node'da hata aldığını kontrol et
4. Error mesajını oku

#### C. Workflow İçindeki Node'ları Kontrol Et
- Her node'un doğru yapılandırıldığından emin ol
- Özellikle ilk node'lardan birinde hata olabilir

---

### 3. Frontend'de Debug

#### A. Console Log'larını Kontrol Et
Browser console'da şunları kontrol et:
```javascript
// design-preview/page.tsx:521'de
console.log('n8n webhook gönderiliyor:', {
  event: WebhookEvent.STUDIO_PHOTO_MODE_ACTIVATED,
  payload: {
    job_id: createdJobId,
    user_id: currentUser.id,
    input: {
      asset_url: assetUrl,
      asset_key: assetKey,
      type: assetType,
    },
  }
});
```

#### B. Network Tab'ını Kontrol Et
1. Browser DevTools → **Network** tab
2. `n8n` veya webhook URL'ini filtrele
3. Request'i aç ve kontrol et:
   - **Request URL:** Doğru mu?
   - **Request Headers:** `X-Webhook-Signature` var mı?
   - **Request Payload:** Doğru mu?
   - **Response:** n8n'den ne dönüyor?

---

### 4. Yaygın Hatalar ve Çözümleri

#### Hata 1: "There was a problem executing the workflow"
**Neden:** Workflow içinde bir node hatası var
**Çözüm:**
- n8n execution log'larını kontrol et
- Hangi node'da hata aldığını bul
- O node'u düzelt

#### Hata 2: "401 Unauthorized"
**Neden:** Header authentication hatası
**Çözüm:**
- `.env.local`'deki `N8N_STUDIO_PHOTO_SECRET` değerini kontrol et
- n8n'deki Header Value ile karşılaştır
- Tamamen aynı olduğundan emin ol

#### Hata 3: "404 Not Found"
**Neden:** Webhook URL'i yanlış
**Çözüm:**
- `.env.local`'deki `N8N_STUDIO_PHOTO_WEBHOOK_URL` değerini kontrol et
- n8n'deki webhook URL'i ile karşılaştır
- Path doğru mu kontrol et

#### Hata 4: "Workflow not active"
**Neden:** Workflow aktif değil
**Çözüm:**
- n8n'de workflow'u aktif et
- Yeşil nokta görünmeli

---

## 🧪 Test Senaryoları

### Test 1: Basit Payload Gönder
```bash
curl -X POST http://localhost:3459/api/webhooks/n8n/test \
  -H "Content-Type: application/json" \
  -d '{
    "event": "studio.photo.mode.activated",
    "job_id": "test-123",
    "user_id": "test-user"
  }'
```

### Test 2: n8n Webhook'u Direkt Test Et
```bash
curl -X POST https://your-n8n-instance.com/webhook/studio-photo/your-id \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: your-secret-key" \
  -d '{
    "event": "studio.photo.mode.activated",
    "job_id": "test-123",
    "user_id": "test-user",
    "input": {
      "asset_url": "https://example.com/test.jpg",
      "asset_key": "test-key",
      "type": "image"
    }
  }'
```

---

## 📝 Checklist

- [ ] `.env.local` dosyasında `N8N_STUDIO_PHOTO_WEBHOOK_URL` var mı?
- [ ] `.env.local` dosyasında `N8N_STUDIO_PHOTO_SECRET` var mı?
- [ ] n8n workflow'u aktif mi?
- [ ] n8n webhook node'u doğru yapılandırılmış mı?
- [ ] Header authentication doğru mu?
- [ ] n8n execution log'larında hata var mı?
- [ ] Workflow içindeki node'lar doğru mu?

---

## 🎯 Sonraki Adımlar

1. **n8n execution log'larını kontrol et** - En önemli adım
2. **Workflow'u basitleştir** - Sadece webhook node'u olsun, test et
3. **Manuel test yap** - curl ile direkt n8n'e gönder
4. **Payload formatını kontrol et** - n8n'in beklediği format ne?

Hangi adımda takıldığınızı söylerseniz daha spesifik yardım edebilirim.

