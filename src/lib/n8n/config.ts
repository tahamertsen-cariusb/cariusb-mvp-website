/**
 * n8n Webhook Configuration
 * Centralizes env-based configuration and event -> endpoint mapping.
 */

export interface WebhookEndpoint {
  url: string;
  secret: string;
}

export interface N8nWebhookConfig {
  webhookUrl?: string;
  incomingWebhookUrl?: string;
  secret?: string;
  apiKey?: string;
  // Per-event endpoints
  communityPost?: WebhookEndpoint;
  studioPhotoMode?: WebhookEndpoint;
  studioVideoMode?: WebhookEndpoint;
  studioModeChanged?: WebhookEndpoint;
  projectCreated?: WebhookEndpoint;
}

/**
 * Reads n8n webhook configuration from environment variables.
 */
export function getN8nConfig(): N8nWebhookConfig {
  const config: N8nWebhookConfig = {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
    incomingWebhookUrl: process.env.N8N_INCOMING_WEBHOOK_URL,
    secret: process.env.N8N_WEBHOOK_SECRET,
    apiKey: process.env.N8N_API_KEY,
  };

  if (process.env.N8N_COMMUNITY_POST_WEBHOOK_URL && process.env.N8N_COMMUNITY_POST_SECRET) {
    config.communityPost = {
      url: process.env.N8N_COMMUNITY_POST_WEBHOOK_URL,
      secret: process.env.N8N_COMMUNITY_POST_SECRET,
    };
  }

  if (process.env.N8N_STUDIO_PHOTO_WEBHOOK_URL && process.env.N8N_STUDIO_PHOTO_SECRET) {
    config.studioPhotoMode = {
      url: process.env.N8N_STUDIO_PHOTO_WEBHOOK_URL,
      secret: process.env.N8N_STUDIO_PHOTO_SECRET,
    };
  }

  if (process.env.N8N_STUDIO_VIDEO_WEBHOOK_URL && process.env.N8N_STUDIO_VIDEO_SECRET) {
    config.studioVideoMode = {
      url: process.env.N8N_STUDIO_VIDEO_WEBHOOK_URL,
      secret: process.env.N8N_STUDIO_VIDEO_SECRET,
    };
  }

  if (
    process.env.N8N_STUDIO_MODE_CHANGED_WEBHOOK_URL &&
    process.env.N8N_STUDIO_MODE_CHANGED_SECRET
  ) {
    config.studioModeChanged = {
      url: process.env.N8N_STUDIO_MODE_CHANGED_WEBHOOK_URL,
      secret: process.env.N8N_STUDIO_MODE_CHANGED_SECRET,
    };
  }

  if (process.env.N8N_PROJECT_CREATED_WEBHOOK_URL && process.env.N8N_PROJECT_CREATED_SECRET) {
    config.projectCreated = {
      url: process.env.N8N_PROJECT_CREATED_WEBHOOK_URL,
      secret: process.env.N8N_PROJECT_CREATED_SECRET,
    };
  }

  return config;
}

/**
 * Maps an application event to an n8n webhook endpoint.
 */
export function getWebhookEndpointForEvent(event: string): WebhookEndpoint | null {
  const config = getN8nConfig();

  if (event === 'community.post.shared' && config.communityPost) return config.communityPost;
  if (event === 'studio.photo.mode.activated' && config.studioPhotoMode) return config.studioPhotoMode;
  if (event === 'studio.video.mode.activated' && config.studioVideoMode) return config.studioVideoMode;
  if (event === 'studio.mode.changed' && config.studioModeChanged) return config.studioModeChanged;
  if (event === 'project.created' && config.projectCreated) return config.projectCreated;

  // Fallback to the generic endpoint (incoming preferred).
  const fallbackUrl = config.incomingWebhookUrl || config.webhookUrl;
  if (fallbackUrl) {
    return { url: fallbackUrl, secret: config.secret || '' };
  }

  return null;
}

/**
 * True if any outgoing webhook endpoint is configured.
 */
export function isN8nConfigured(): boolean {
  const config = getN8nConfig();
  return !!(
    config.webhookUrl ||
    config.incomingWebhookUrl ||
    config.communityPost ||
    config.studioPhotoMode ||
    config.studioVideoMode ||
    config.studioModeChanged ||
    config.projectCreated
  );
}

