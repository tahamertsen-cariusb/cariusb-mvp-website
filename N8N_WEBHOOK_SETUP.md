# n8n Webhook Entegrasyonu Kurulum Rehberi

Bu proje n8n webhook entegrasyonu ile hazırlanmıştır. Bu rehber, n8n webhook'larını nasıl bağlayacağınızı açıklar.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [n8n Kurulumu](#n8n-kurulumu)
3. [Environment Variables](#environment-variables)
4. [Webhook Endpoint'leri](#webhook-endpointleri)
5. [Kullanım Örnekleri](#kullanım-örnekleri)
6. [Test Etme](#test-etme)

## 🔧 Gereksinimler

- n8n kurulumu (self-hosted veya cloud)
- Next.js projesi çalışıyor olmalı

## 🚀 n8n Kurulumu

### 1. n8n'de Webhook Trigger Oluşturma

Her webhook için ayrı workflow oluşturmanız önerilir:

#### Community Post Webhook

1. n8n'de yeni bir workflow oluşturun: "Community Post Handler"
2. **Webhook** node'u ekleyin
3. Webhook ayarlarını yapın:
   - **HTTP Method**: POST
   - **Path**: `/webhook/community-post` (veya istediğiniz path)
   - **Response Mode**: "Respond to Webhook" seçin
   - **Authentication**: "Header Auth" seçin
   - **Header Name**: `X-Webhook-Signature`
   - **Header Value**: Secret key'inizi buraya girin (örn: `your-community-post-secret-key`)
4. Webhook URL'ini kopyalayın ve `.env.local` dosyasına `N8N_COMMUNITY_POST_WEBHOOK_URL` olarak ekleyin
5. Secret key'i kopyalayın ve `.env.local` dosyasına `N8N_COMMUNITY_POST_SECRET` olarak ekleyin (Header Value ile aynı olmalı)

#### Studio Photo Mode Webhook

1. n8n'de yeni bir workflow oluşturun: "Studio Photo Mode Handler"
2. **Webhook** node'u ekleyin
3. Webhook ayarlarını yapın:
   - **HTTP Method**: POST
   - **Path**: `/webhook/studio-photo`
   - **Response Mode**: "Respond to Webhook" seçin
   - **Authentication**: "Header Auth" seçin
   - **Header Name**: `X-Webhook-Signature`
   - **Header Value**: Secret key'inizi buraya girin (örn: `your-studio-photo-secret-key`)
4. Webhook URL'ini kopyalayın ve `.env.local` dosyasına `N8N_STUDIO_PHOTO_WEBHOOK_URL` olarak ekleyin
5. Secret key'i kopyalayın ve `.env.local` dosyasına `N8N_STUDIO_PHOTO_SECRET` olarak ekleyin (Header Value ile aynı olmalı)

#### Studio Video Mode Webhook

1. n8n'de yeni bir workflow oluşturun: "Studio Video Mode Handler"
2. **Webhook** node'u ekleyin
3. Webhook ayarlarını yapın:
   - **HTTP Method**: POST
   - **Path**: `/webhook/studio-video`
   - **Response Mode**: "Respond to Webhook" seçin
   - **Authentication**: "Header Auth" seçin
   - **Header Name**: `X-Webhook-Signature`
   - **Header Value**: Secret key'inizi buraya girin (örn: `your-studio-video-secret-key`)
4. Webhook URL'ini kopyalayın ve `.env.local` dosyasına `N8N_STUDIO_VIDEO_WEBHOOK_URL` olarak ekleyin
5. Secret key'i kopyalayın ve `.env.local` dosyasına `N8N_STUDIO_VIDEO_SECRET` olarak ekleyin (Header Value ile aynı olmalı)

### 2. n8n'de HTTP Request Node Oluşturma (Uygulamanıza Webhook Göndermek İçin)

Eğer n8n'den uygulamanıza webhook göndermek istiyorsanız:

1. Workflow'unuza bir **HTTP Request** node'u ekleyin
2. Ayarları yapın:
   - **Method**: POST
   - **URL**: `https://your-app-domain.com/api/webhooks/n8n`
   - **Body**: JSON formatında veri gönderin

## 🔐 Environment Variables

Proje root dizininde `.env.local` dosyası oluşturun:

```env
# n8n'den webhook almak için (n8n workflow'unuzun webhook URL'i)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

# Genel webhook URL (fallback - her webhook için ayrı URL tanımlanmazsa kullanılır)
N8N_INCOMING_WEBHOOK_URL=https://your-n8n-instance.com/webhook/incoming/your-webhook-id
N8N_WEBHOOK_SECRET=your-general-secret-key-here

# ============================================
# Her Webhook İçin Ayrı URL ve Secret (Önerilen)
# ============================================

# Community Post Paylaşma Webhook
N8N_COMMUNITY_POST_WEBHOOK_URL=https://your-n8n-instance.com/webhook/community-post/your-id
N8N_COMMUNITY_POST_SECRET=your-community-post-secret-key

# Studio Photo Mode Webhook
N8N_STUDIO_PHOTO_WEBHOOK_URL=https://your-n8n-instance.com/webhook/studio-photo/your-id
N8N_STUDIO_PHOTO_SECRET=your-studio-photo-secret-key

# Studio Video Mode Webhook
N8N_STUDIO_VIDEO_WEBHOOK_URL=https://your-n8n-instance.com/webhook/studio-video/your-id
N8N_STUDIO_VIDEO_SECRET=your-studio-video-secret-key

# n8n API Key (opsiyonel, API çağrıları için)
N8N_API_KEY=your-api-key-here
```

### Webhook Yapılandırma Seçenekleri

**Seçenek 1: Her webhook için ayrı URL ve secret (Önerilen)**
- Her webhook için ayrı güvenlik ve yönetim
- Daha iyi izolasyon ve güvenlik
- Örnek: `N8N_COMMUNITY_POST_WEBHOOK_URL` ve `N8N_COMMUNITY_POST_SECRET`

**Seçenek 2: Genel webhook URL (Fallback)**
- Tüm webhook'lar için tek URL
- Daha basit yapılandırma
- Örnek: `N8N_INCOMING_WEBHOOK_URL` ve `N8N_WEBHOOK_SECRET`

**Not:** Eğer bir webhook için özel URL tanımlanmışsa, o webhook için genel URL kullanılmaz. Özel URL'ler önceliklidir.

### n8n Header Auth Ayarları

n8n'de Header Auth kullanırken:
- **Header Name**: `X-Webhook-Signature` (sabit - tüm webhook'lar için aynı)
- **Header Value**: Environment variable'daki secret key'iniz (örn: `N8N_COMMUNITY_POST_SECRET` değeri)

Uygulama, webhook gönderirken secret key'i `X-Webhook-Signature` header'ına direkt olarak ekler. n8n bu header'ı kontrol ederek doğrulama yapar.

**Örnek:**
- `.env.local` dosyasında: `N8N_COMMUNITY_POST_SECRET=my-secret-key-123`
- n8n Header Auth'da:
  - Header Name: `X-Webhook-Signature`
  - Header Value: `my-secret-key-123`

## 📡 Webhook Endpoint'leri

### 1. n8n'den Webhook Almak

**Endpoint**: `POST /api/webhooks/n8n`

Bu endpoint, n8n'den gelen webhook'ları alır ve işler.

**Örnek Request**:
```json
{
  "event": "workflow.triggered",
  "data": {
    "message": "Hello from n8n"
  }
}
```

**Örnek Response**:
```json
{
  "success": true,
  "message": "Webhook başarıyla işlendi",
  "received": {
    "event": "workflow.triggered",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. n8n'e Webhook Göndermek

**Endpoint**: `POST /api/webhooks/n8n/test`

Bu endpoint, test amaçlı n8n'e webhook gönderir.

**Örnek Request**:
```json
{
  "event": "user.signup",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## 🎯 Kullanım Örnekleri

### Kullanıcı Kaydı (Signup)

Kullanıcı kayıt olduğunda otomatik olarak n8n'e webhook gönderilir:

```typescript
import { useWebhook } from '@/hooks/useWebhook';
import { WebhookEvent } from '@/lib/n8n/events';

const { sendWebhook } = useWebhook();

await sendWebhook(
  WebhookEvent.USER_SIGNUP,
  {
    name: 'John Doe',
    email: 'john@example.com',
    credits: 1200,
  },
  'john@example.com',
  'john@example.com'
);
```

### Proje Oluşturma

Proje oluşturulduğunda:

```typescript
await sendWebhook(
  WebhookEvent.PROJECT_CREATED,
  {
    projectId: '123',
    projectName: 'My Project',
  },
  userId,
  userEmail
);
```

### Proje Silme

Proje silindiğinde:

```typescript
await sendWebhook(
  WebhookEvent.PROJECT_DELETED,
  {
    projectId: '123',
    projectName: 'My Project',
  },
  userId,
  userEmail
);
```

### Community Post Paylaşma

Community sayfasında post paylaşıldığında:

```typescript
await sendWebhook(
  WebhookEvent.COMMUNITY_POST_SHARED,
  {
    postId: 'post_123',
    title: 'Nissan R34 - Tokyo Midnight',
    author: 'JDM_King',
    category: 'JDM',
  },
  userId,
  userEmail
);
```

### Studio Photo Mode Aktivasyonu

Studio'da photo modu aktif edildiğinde:

```typescript
await sendWebhook(
  WebhookEvent.STUDIO_PHOTO_MODE_ACTIVATED,
  {
    mode: 'photo',
    previousMode: 'video',
    features: ['paint', 'bodykit', 'rims'],
  },
  userId,
  userEmail
);
```

### Studio Video Mode Aktivasyonu

Studio'da video modu aktif edildiğinde:

```typescript
await sendWebhook(
  WebhookEvent.STUDIO_VIDEO_MODE_ACTIVATED,
  {
    mode: 'video',
    previousMode: 'photo',
    features: [],
  },
  userId,
  userEmail
);
```

## 🧪 Test Etme

### 1. Webhook Durumunu Kontrol Etme

```bash
curl http://localhost:3000/api/webhooks/n8n
```

### 2. Test Webhook Gönderme

```bash
curl -X POST http://localhost:3000/api/webhooks/n8n/test \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.signup",
    "data": {
      "name": "Test User",
      "email": "test@example.com"
    }
  }'
```

### 3. n8n'den Webhook Gönderme

n8n workflow'unuzdan uygulamanıza webhook göndermek için:

```json
{
  "event": "workflow.completed",
  "data": {
    "workflowId": "123",
    "status": "success"
  }
}
```

## 📝 Mevcut Webhook Event'leri

### Kullanıcı Event'leri
- `user.signup` - Kullanıcı kaydı
- `user.login` - Kullanıcı girişi
- `user.logout` - Kullanıcı çıkışı
- `user.update` - Kullanıcı güncelleme

### Proje Event'leri
- `project.created` - Proje oluşturma
- `project.updated` - Proje güncelleme
- `project.deleted` - Proje silme

### Community Event'leri
- `community.post.shared` - Community'de post paylaşma

### Studio Event'leri
- `studio.photo.mode.activated` - Studio'da photo modu aktif edildi
- `studio.video.mode.activated` - Studio'da video modu aktif edildi

### İşlem Event'leri
- `credits.updated` - Kredi güncelleme
- `generation.started` - Üretim başladı
- `generation.completed` - Üretim tamamlandı

### Sistem Event'leri
- `error.occurred` - Hata oluştu

## 🔒 Güvenlik

- Webhook secret key kullanarak imza doğrulaması yapılır
- HTTPS kullanılması önerilir
- Environment variables'ları asla commit etmeyin

## 📚 Daha Fazla Bilgi

- [n8n Dokümantasyonu](https://docs.n8n.io/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

