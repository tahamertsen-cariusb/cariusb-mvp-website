# Environment Variables Example

Bu dosyayı `.env.local` olarak kopyalayın ve değerleri doldurun.

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_DB_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Cloudflare Worker URL (REQUIRED)
NEXT_PUBLIC_WORKER_URL=https://broad-violet-3cb6.tahamertsen.workers.dev
WORKER_URL=https://broad-violet-3cb6.tahamertsen.workers.dev

# n8n Webhook Configuration (Optional but recommended)
N8N_STUDIO_PHOTO_WEBHOOK_URL=https://your-n8n-instance.com/webhook/studio-photo/your-id
N8N_STUDIO_PHOTO_SECRET=your-studio-photo-secret-key
N8N_STUDIO_VIDEO_WEBHOOK_URL=https://your-n8n-instance.com/webhook/studio-video/your-id
N8N_STUDIO_VIDEO_SECRET=your-studio-video-secret-key
N8N_COMMUNITY_POST_WEBHOOK_URL=https://your-n8n-instance.com/webhook/community-post/your-id
N8N_COMMUNITY_POST_SECRET=your-community-post-secret-key
N8N_PROJECT_CREATED_WEBHOOK_URL=https://your-n8n-instance.com/webhook/project-created/your-id
N8N_PROJECT_CREATED_SECRET=your-project-created-secret-key

# General n8n (Fallback)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
N8N_INCOMING_WEBHOOK_URL=https://your-n8n-instance.com/webhook/incoming/your-webhook-id
N8N_WEBHOOK_SECRET=your-general-webhook-secret-key
N8N_API_KEY=your-n8n-api-key-here

# Node Environment
NODE_ENV=development
```

**Vercel'de:** Dashboard > Project > Settings > Environment Variables bölümünden ekleyin.

