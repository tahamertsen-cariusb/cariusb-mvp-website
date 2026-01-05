# n8n Webhook Payload Örnekleri

## 📸 Photo Mode Payload

**Event:** `studio.photo.mode.activated`

**Payload:**
```json
{
  "event": "studio.photo.mode.activated",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "metadata": {
    "jobId": "53f42a82-cdb9-4917-a45d-3c5f83bc25be",
    "userId": "user-uuid-123",
    "projectId": "project_1706358000000",
    "plan": "standard",
    "aspect_ratio": "auto",
    "resolution": "1024x1024"
  },
  "modes": [
    "paint",
    "rim",
    "bodykit",
    "livery",
    "tint",
    "environment",
    "insert_person",
    "multicars"
  ],
  "sourceImage": "https://broad-violet-3cb6.tahamertsen.workers.dev/worker-key-123",
  "images": {
    "paint": "https://example.com/paint-reference.jpg",
    "rim": "https://example.com/rim-reference.jpg",
    "bodykit": "https://example.com/bodykit-reference.jpg",
    "livery": "https://example.com/livery-reference.jpg",
    "insert_person": "https://example.com/person-photo.jpg",
    "multicars": [
      "https://example.com/car1.jpg",
      "https://example.com/car2.jpg"
    ]
  },
  "instructions": {
    "paint": "Change color to midnight blue",
    "bodykit": "Add aggressive front splitter",
    "tint": "35",
    "environment": "Urban street at night with neon lights",
    "insert_person": "Standing next to driver door"
  },
  "userId": "user-uuid-123",
  "userEmail": "user@example.com"
}
```

### Photo Mode Payload Açıklaması

| Alan | Tip | Açıklama |
|------|-----|----------|
| `metadata` | object | Metadata bilgileri |
| `metadata.jobId` | string | Job UUID (text format) |
| `metadata.userId` | string | Kullanıcı UUID |
| `metadata.projectId` | string | Proje ID |
| `metadata.plan` | string | Kullanıcı planı (standard/pro/studio) |
| `metadata.aspect_ratio` | string | Görüntü oranı (auto/16:9/4:3) |
| `metadata.resolution` | string | Çözünürlük (1024x1024/2048x2048) |
| `modes` | string[] | Aktif edilen modlar listesi |
| `sourceImage` | string | Kaynak görüntü URL'i |
| `images` | object | Referans görüntüler (boş string veya URL) |
| `images.paint` | string | Paint referans görüntüsü URL'i veya '' |
| `images.rim` | string | Rim referans görüntüsü URL'i veya '' |
| `images.bodykit` | string | Bodykit referans görüntüsü URL'i veya '' |
| `images.livery` | string | Livery referans görüntüsü URL'i veya '' |
| `images.insert_person` | string | Person referans görüntüsü URL'i veya '' |
| `images.multicars` | string[] | Multi-car referans görüntüleri array'i |
| `instructions` | object | Metin talimatları (boş string veya değer) |
| `instructions.paint` | string | Paint talimatı veya '' |
| `instructions.bodykit` | string | Bodykit talimatı veya '' |
| `instructions.tint` | string | Tint değeri veya '' |
| `instructions.environment` | string | Environment prompt'u veya '' |
| `instructions.insert_person` | string | Insert person prompt'u veya '' |

---

## 🎥 Video Mode Payload

**Event:** `studio.video.mode.activated`

**Payload:**
```json
{
  "event": "studio.video.mode.activated",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "job_id": "53f42a82-cdb9-4917-a45d-3c5f83bc25be",
  "user_id": "user-uuid-123",
  "user_email": "user@example.com",
  "project_id": "project_1706358000000",
  "plan": "standard",
  "source_image": {
    "url": "https://broad-violet-3cb6.tahamertsen.workers.dev/worker-key-123",
    "key": "worker-key-123",
    "type": "image"
  },
  "video_settings": {
    "prompt": "Car driving through neon-lit Tokyo streets at night, cinematic camera movement",
    "duration": 10,
    "scale": "1024x1024",
    "quality": "high"
  },
  "userId": "user-uuid-123",
  "userEmail": "user@example.com"
}
```

### Video Mode Payload Açıklaması

| Alan | Tip | Açıklama |
|------|-----|----------|
| `job_id` | string | Job UUID (text format) |
| `user_id` | string | Kullanıcı UUID |
| `user_email` | string | Kullanıcı email |
| `project_id` | string | Proje ID (opsiyonel) |
| `plan` | string | Kullanıcı planı (standard/pro/studio) |
| `source_image` | object | Kaynak görüntü/video bilgileri |
| `video_settings` | object | Video ayarları |
| `video_settings.prompt` | string | Video prompt açıklaması |
| `video_settings.duration` | number | Video süresi (saniye) |
| `video_settings.scale` | string | Video çözünürlüğü |
| `video_settings.quality` | string | Video kalitesi (low/standard/high) |

---

## 🔄 Payload Farkları

### Photo Mode
- ✅ `metadata` objesi var (userId, projectId, plan, aspect_ratio, resolution)
- ✅ `modes` array'i var (aktif feature'lar)
- ✅ `sourceImage` string var (URL)
- ✅ `images` objesi var (tüm alanlar, boş string veya URL)
- ✅ `instructions` objesi var (tüm alanlar, boş string veya değer)
- ❌ `video_settings` yok

### Video Mode
- ✅ `video_settings` objesi var
- ✅ `source_image` objesi var
- ❌ `metadata` objesi yok
- ❌ `modes` array'i yok
- ❌ `images` objesi yok
- ❌ `instructions` objesi yok

---

## 📋 n8n Workflow'unda Kullanım

### Photo Mode İçin
```javascript
// n8n workflow'unda
const payload = $json;

// Metadata'yı al
const jobId = payload.metadata.jobId;
const userId = payload.metadata.userId;
const projectId = payload.metadata.projectId;
const plan = payload.metadata.plan;
const resolution = payload.metadata.resolution;

// Source image URL'i al
const sourceImageUrl = payload.sourceImage;

// Aktif modları kontrol et
if (payload.modes.includes('paint')) {
  // Paint modu aktif
  const paintImage = payload.images.paint; // URL veya ''
  const paintInstruction = payload.instructions.paint; // Talimat veya ''
  
  if (paintImage) {
    // Referans görüntü var, kullan
  } else if (paintInstruction) {
    // Sadece talimat var, kullan
  }
}

// Modes array'ini kullanarak işlem yap
payload.modes.forEach(mode => {
  // Her mod için işlem yap
  // Mode'a göre doğru key'i kullan
  let imageUrl = '';
  let instruction = '';
  
  if (mode === 'paint') {
    imageUrl = payload.images.paint || '';
    instruction = payload.instructions.paint || '';
  } else if (mode === 'rim') {
    imageUrl = payload.images.rim || '';
  } else if (mode === 'bodykit') {
    imageUrl = payload.images.bodykit || '';
    instruction = payload.instructions.bodykit || '';
  }
  // ... diğer modlar
  
  if (imageUrl) {
    // Referans görüntü kullan
  } else if (instruction) {
    // Talimat kullan
  }
});
```

### Video Mode İçin
```javascript
// n8n workflow'unda
const payload = $json;

// Job ID'yi al
const jobId = payload.job_id;

// Source image URL'i al
const sourceImageUrl = payload.source_image.url;

// Video ayarlarını al
const prompt = payload.video_settings.prompt;
const duration = payload.video_settings.duration;
const scale = payload.video_settings.scale;
const quality = payload.video_settings.quality;

// Video generation işlemini başlat
```

---

## ✅ Test Payload'ları

### Minimal Photo Mode Payload
```json
{
  "event": "studio.photo.mode.activated",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "metadata": {
    "jobId": "test-job-123",
    "userId": "test-user-123",
    "projectId": "project_123",
    "plan": "standard",
    "aspect_ratio": "auto",
    "resolution": "1024x1024"
  },
  "modes": ["paint"],
  "sourceImage": "https://example.com/source.jpg",
  "images": {
    "paint": "",
    "rim": "",
    "bodykit": "",
    "livery": "",
    "insert_person": "",
    "multicars": []
  },
  "instructions": {
    "paint": "Change to red",
    "bodykit": "",
    "tint": "",
    "environment": "",
    "insert_person": ""
  }
}
```

### Full Photo Mode Payload (Tüm Modlar Aktif)
```json
{
  "event": "studio.photo.mode.activated",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "metadata": {
    "jobId": "53f42a82-cdb9-4917-a45d-3c5f83bc25be",
    "userId": "user-uuid-123",
    "projectId": "project_1706358000000",
    "plan": "pro",
    "aspect_ratio": "16:9",
    "resolution": "2048x2048"
  },
  "modes": [
    "paint",
    "rim",
    "bodykit",
    "livery",
    "tint",
    "environment",
    "insert_person",
    "multicars"
  ],
  "sourceImage": "https://broad-violet-3cb6.tahamertsen.workers.dev/source-key",
  "images": {
    "paint": "https://example.com/paint.jpg",
    "rim": "https://example.com/rim.jpg",
    "bodykit": "https://example.com/bodykit.jpg",
    "livery": "https://example.com/livery.jpg",
    "insert_person": "https://example.com/person.jpg",
    "multicars": [
      "https://example.com/car1.jpg",
      "https://example.com/car2.jpg"
    ]
  },
  "instructions": {
    "paint": "Midnight blue metallic",
    "bodykit": "Aggressive front splitter and side skirts",
    "tint": "35",
    "environment": "Urban street at night with neon lights",
    "insert_person": "Standing next to driver door, casual pose"
  }
}
```

### Minimal Video Mode Payload
```json
{
  "event": "studio.video.mode.activated",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "job_id": "test-job-123",
  "user_id": "test-user-123",
  "user_email": "test@example.com",
  "plan": "standard",
  "source_image": {
    "url": "https://example.com/source.jpg",
    "key": "source-key",
    "type": "image"
  },
  "video_settings": {
    "prompt": "Car driving through city",
    "duration": 5,
    "scale": "1024x1024",
    "quality": "standard"
  }
}
```

---

## 🎯 Önemli Notlar

1. **Photo Mode:**
   - `images` objesindeki tüm alanlar her zaman gönderilir (boş string veya URL)
   - `instructions` objesindeki tüm alanlar her zaman gönderilir (boş string veya değer)
   - `multicars` array'i boş olabilir `[]`
   - `modes` array'i sadece aktif olan modları içerir

2. **Video Mode:**
   - Format değişmedi, eski format korunuyor

3. **Metadata:**
   - Photo mode'da `metadata` objesi içinde tüm bilgiler toplanıyor
   - Daha organize ve temiz bir yapı

4. **Source Image:**
   - Photo mode'da `sourceImage` string (URL)
   - Video mode'da `source_image` object (url, key, type)
