/**
 * n8n Webhook Events
 * Uygulamada kullanılan webhook event tipleri
 */

export enum WebhookEvent {
  // Kullanıcı eventleri
  USER_SIGNUP = 'user.signup',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_UPDATE = 'user.update',
  
  // Proje eventleri
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  
  // İşlem eventleri
  CREDITS_UPDATED = 'credits.updated',
  GENERATION_STARTED = 'generation.started',
  GENERATION_COMPLETED = 'generation.completed',
  
  // Community eventleri
  COMMUNITY_POST_SHARED = 'community.post.shared',
  
  // Studio eventleri
  STUDIO_PHOTO_MODE_ACTIVATED = 'studio.photo.mode.activated',
  STUDIO_VIDEO_MODE_ACTIVATED = 'studio.video.mode.activated',
  STUDIO_MODE_CHANGED = 'studio.mode.changed',
  
  // Sistem eventleri
  ERROR_OCCURRED = 'error.occurred',
}

/**
 * Event payload tipleri
 */
export interface UserSignupPayload {
  userId: string;
  email: string;
  name: string;
  timestamp: string;
}

export interface ProjectCreatedPayload {
  projectId: string;
  projectName: string;
  userId: string;
  timestamp: string;
}

export interface CreditsUpdatedPayload {
  userId: string;
  oldCredits: number;
  newCredits: number;
  reason: string;
  timestamp: string;
}

export interface CommunityPostSharedPayload {
  postId: string;
  title: string;
  author: string;
  userId: string;
  category?: string;
  timestamp: string;
}

export interface StudioModeActivatedPayload {
  mode: 'photo' | 'video';
  userId: string;
  timestamp: string;
  features?: string[];
}

export interface PhotoModePayload {
  metadata: {
    job_id: string;
    user_id: string;
    project_id: string;
    plan: string;
    aspect_ratio: 'auto' | string;
    resolution: string;
  };
  modes: string[];
  source_image: string;
  images: {
    paint?: string;
    rim?: string;
    bodykit?: string;
    livery?: string;
    insert_person?: string;
    multicars?: string[];
  };
  instructions: {
    paint?: string;
    bodykit?: string;
    tint?: string;
    environment?: string;
    insert_person?: string;
  };
}

export interface VideoModePayload {
  metadata: {
    job_id: string;
    user_id: string;
    project_id?: string;
    plan: string;
    aspect_ratio: 'auto' | string;
    resolution: string;
  };
  source_image: string;
  prompt?: string;
  duration?: number;
}

export interface StudioModeChangedPayload {
  projectId: string;
  userId: string;
  previousMode: 'photo' | 'video';
  newMode: 'photo' | 'video';
  timestamp: string;
}

