'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CursorGlow } from '@/components/layout/CursorGlow';
import {
  StudioBackground,
  TopBar,
  UploadCard,
  FeatureTab,
  ControlPanel,
  GenerateWrapper,
  BeforeAfterToggle,
  ActionButtons,
  CollapseButton,
  FeaturePreviewPanel,
  type FeatureType,
} from '@/components/studio';
import styles from './page.module.css';
import { createSupabaseClient } from '@/lib/supabase';
import { VideoPlayer } from '@/components/ui/VideoPlayer';

type DemoFeature = {
  id: string;
  title: string;
  type: FeatureType;
  summary: string;
  imageUrl?: string;
  imageUrls?: string[];
  instruction?: string;
  prompt?: string;
  height?: string;
  tintValue?: number;
  duration?: number;
  scale?: string;
  quality?: string;
};

type Gallery = {
  before: string;
  after: string;
};

type Asset = {
  id: string;
  url: string;
  role: string;
  type: string;
  created_at: string;
};

type DesignPreviewClientProps = {
  initialUser?: { id?: string; email?: string; user_metadata?: Record<string, any> };
  initialCredits?: number;
  initialProject?: { id?: string; title?: string; thumbnail_url?: string };
  initialGallery?: Gallery;
  initialAssets?: Asset[];
  initialMode?: 'photo' | 'video';
};

const PHOTO_FEATURE_IDS = [
  'paint',
  'bodykit',
  'rims',
  'height',
  'livery',
  'window',
  'background',
  'addPerson',
  'multicar',
] as const;

const VIDEO_FEATURE_IDS = ['videoPrompt', 'videoDuration', 'videoScale', 'videoQuality'] as const;

const FEATURE_MAP: Record<string, DemoFeature> = {
  paint: {
    id: 'paint',
    title: 'Color',
    type: 'paint',
    summary: '',
  },
  bodykit: {
    id: 'bodykit',
    title: 'Bodykit',
    type: 'bodykit',
    summary: '',
  },
  rims: {
    id: 'rims',
    title: 'Rims',
    type: 'rims',
    summary: '',
  },
  height: {
    id: 'height',
    title: 'Height',
    type: 'height',
    summary: '',
  },
  livery: {
    id: 'livery',
    title: 'Livery',
    type: 'livery',
    summary: '',
  },
  window: {
    id: 'window',
    title: 'Tint',
    type: 'window',
    summary: '',
  },
  background: {
    id: 'background',
    title: 'Background',
    type: 'background',
    summary: '',
  },
  addPerson: {
    id: 'addPerson',
    title: 'Add Person',
    type: 'addPerson',
    summary: '',
  },
  multicar: {
    id: 'multicar',
    title: 'Add Car',
    type: 'multicar',
    summary: '',
  },
  videoPrompt: {
    id: 'videoPrompt',
    title: 'Prompt',
    type: 'videoPrompt',
    summary: '',
  },
  videoDuration: {
    id: 'videoDuration',
    title: 'Duration',
    type: 'videoDuration',
    summary: '',
  },
  videoScale: {
    id: 'videoScale',
    title: 'Scale',
    type: 'videoScale',
    summary: '',
  },
  videoQuality: {
    id: 'videoQuality',
    title: 'Quality',
    type: 'videoQuality',
    summary: '',
  },
};

const cloneFeatureMapFor = (ids: readonly string[]): Record<string, DemoFeature> =>
  Object.fromEntries(
    ids.map((id) => {
      const feature = FEATURE_MAP[id];
      return [
        id,
        {
          ...feature,
          imageUrls: feature.imageUrls ? [...feature.imageUrls] : undefined,
        },
      ];
    })
  );

const clonePhotoFeatures = () => cloneFeatureMapFor(PHOTO_FEATURE_IDS);

const cloneVideoFeatures = () => {
  const initial = cloneFeatureMapFor(VIDEO_FEATURE_IDS);
  initial.videoScale = { ...initial.videoScale, scale: '16:9', instruction: '16:9' };
  initial.videoQuality = { ...initial.videoQuality, quality: 'standard', instruction: 'standard' };
  return initial;
};

export default function DesignPreviewClient({
  initialCredits = 0,
  initialProject,
  initialGallery,
  initialUser,
  initialAssets = [],
  initialMode = 'photo',
}: DesignPreviewClientProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const projectId = initialProject?.id || null;
  const userId = initialUser?.id || null;
  const assetBaseUrl = 'https://media-gateway-cariusb.tahamertsen.workers.dev';
  const startInVideo = initialMode === 'video';
  const [mode, setMode] = useState<'photo' | 'video'>(() => (startInVideo ? 'video' : 'photo'));
  const [resolutionPreset, setResolutionPreset] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatioPreset, setAspectRatioPreset] = useState<
    'auto' | 'instagram_post' | 'instagram_story' | 'marketplace_website'
  >('auto');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [featureTab, setFeatureTab] = useState<string | null>(null);
  const initialSource = initialAssets.find((asset) => asset.role === 'source')?.url;
  const initialResult = initialAssets.find((asset) => asset.role === 'result')?.url;
  const resolveAssetUrl = useCallback(
    (value?: string | null) => {
      if (!value) return null;
      if (value === 'null' || value === 'undefined') return null;
      if (value.startsWith('http://') || value.startsWith('https://')) return value;
      return `${assetBaseUrl}/${value}`;
    },
    [assetBaseUrl]
  );

  const initialBefore =
    resolveAssetUrl(initialGallery?.before) ||
    resolveAssetUrl(initialSource) ||
    resolveAssetUrl(initialProject?.thumbnail_url) ||
    '';
  const initialAfter = resolveAssetUrl(initialGallery?.after) || resolveAssetUrl(initialResult) || '';

  const [currentView, setCurrentView] = useState<'before' | 'after'>(() =>
    initialAfter ? 'after' : 'before'
  );
  const [gallery, setGallery] = useState<Gallery>({
    before: initialBefore,
    after: initialAfter,
  });
  const [photoSourceImage, setPhotoSourceImage] = useState<string>(() => initialAfter || initialBefore);
  const [videoSourceImage, setVideoSourceImage] = useState<string>(() => initialBefore);
  const [videoResultUrl, setVideoResultUrl] = useState<string>('');
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [photoFeatures, setPhotoFeatures] = useState<Record<string, DemoFeature>>(() => clonePhotoFeatures());
  const [videoFeatures, setVideoFeatures] = useState<Record<string, DemoFeature>>(() => cloneVideoFeatures());
  const [creditCost, setCreditCost] = useState(18);
  const [isGenerating, setIsGenerating] = useState(false);
  const [upscaleGate, setUpscaleGate] = useState<'initial' | 'wentToBefore' | 'unlocked'>('initial');
  const [autoAspectRatioPreset, setAutoAspectRatioPreset] = useState<
    'instagram_post' | 'instagram_story' | 'marketplace_website' | null
  >(null);
  const [generateOverlay, setGenerateOverlay] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'timeout'; message: string }
  >({ status: 'idle' });
  const imageRetryRef = useRef<Map<string, number>>(new Map());
  const pendingPhotoBeforeRef = useRef<string | null>(null);
  // Source upload is handled via the main center UploadCard only.

  const currentFeatures = mode === 'photo' ? photoFeatures : videoFeatures;
  const setCurrentFeatures = mode === 'photo' ? setPhotoFeatures : setVideoFeatures;
  const activeFeature = featureTab ? currentFeatures[featureTab] : null;
  const isToolbarCollapsed = isCollapsed || Boolean(featureTab);
  const showResultControls = mode === 'video' ? Boolean(videoResultUrl) : Boolean(gallery.after);
  const shouldApplyCollapsedMode = Boolean(isCollapsed && !featureTab);

  useEffect(() => {
    document.body.classList.toggle('collapsed-mode', shouldApplyCollapsedMode);
    return () => {
      document.body.classList.remove('collapsed-mode');
    };
  }, [shouldApplyCollapsedMode]);

  const toolbarItems = useMemo(() => {
    const photoOrder = [...PHOTO_FEATURE_IDS];
    const videoOrder = ['videoPrompt', 'videoDuration'];
    const order = mode === 'photo' ? photoOrder : videoOrder;
    return order.map((id) => {
      const feature = currentFeatures[id];
      const isCompleted =
        id === 'addPerson'
          ? Boolean(
              feature?.imageUrl &&
                feature.imageUrl.trim().length > 0 &&
                feature?.instruction &&
                feature.instruction.trim().length > 0
            )
          : Boolean(feature?.imageUrl || feature?.instruction);
      const state: 'normal' | 'active' | 'completed' =
        featureTab === id ? 'active' : isCompleted ? 'completed' : 'normal';
      return {
        id,
        label: feature?.title || id,
        tooltip: feature?.summary || '',
        icon: undefined,
        state,
      };
    });
  }, [currentFeatures, mode, featureTab]);

  const featurePreviews = useMemo(
    () =>
      Object.values(photoFeatures)
        .filter((f) => f.imageUrl || f.instruction)
        .map((f) => ({
          id: f.id,
          label: f.title,
          imageUrl: f.imageUrl,
          instruction: f.instruction,
        })),
    [photoFeatures]
  );

  const handleViewChange = (view: 'before' | 'after') => {
    setCurrentView(view);
    setUpscaleGate((prev) => {
      if (prev === 'unlocked') return prev;
      if (view === 'before') return 'wentToBefore';
      if (view === 'after' && prev === 'wentToBefore') return 'unlocked';
      return prev;
    });
  };

  useEffect(() => {
    if (mode !== 'photo' || aspectRatioPreset !== 'auto') return;
    if (!gallery.before) {
      setAutoAspectRatioPreset(null);
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (!w || !h) {
        setAutoAspectRatioPreset(null);
        return;
      }
      const ratio = w / h;
      if (Math.abs(ratio - 1) < 0.12) {
        setAutoAspectRatioPreset('instagram_post');
      } else if (ratio < 1) {
        setAutoAspectRatioPreset('instagram_story');
      } else {
        setAutoAspectRatioPreset('marketplace_website');
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      setAutoAspectRatioPreset(null);
    };

    img.src = gallery.before;

    return () => {
      cancelled = true;
    };
  }, [aspectRatioPreset, gallery.before, mode]);

  const persistResultAsset = async (rawUrlOrKey: string) => {
    if (!userId || !projectId) return;
    const trimmed = rawUrlOrKey.trim();
    if (!trimmed) return;

    const { error } = await supabase.from('assets').insert({
      user_id: userId,
      project_id: projectId,
      type: mode === 'video' ? 'video' : 'image',
      role: 'result',
      url: trimmed,
    });

    if (error) {
      console.error('Failed to persist result asset', error);
    }
  };

  const fetchLatestAssets = useCallback(async () => {
    if (!userId || !projectId) return null;

    const { data, error } = await supabase
      .from('assets')
      .select('url, role, created_at, type')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) {
      console.error('fetchLatestAssets failed', error);
      return null;
    }

    const rows = data || [];
    const latestSourceKey = rows.find((asset) => asset.role === 'source')?.url ?? null;
    const latestResultKey = rows.find((asset) => asset.role === 'result')?.url ?? null;
    const latestVideo =
      rows.find((asset) => asset.type === 'video' || asset.role === 'video' || asset.role === 'video_result')?.url ??
      null;

    return {
      beforeKey: latestSourceKey,
      afterKey: latestResultKey,
      beforeUrl: latestSourceKey ? resolveAssetUrl(latestSourceKey) : null,
      afterUrl: latestResultKey ? resolveAssetUrl(latestResultKey) : null,
      videoUrl: latestVideo ? resolveAssetUrl(latestVideo) : null,
    };
  }, [projectId, resolveAssetUrl, supabase, userId]);

  const fetchLatestAssetsWithRetry = useCallback(
    async (targetMode: 'photo' | 'video') => {
      const attempts = targetMode === 'video' ? 300 : 40;
      const delayMs = targetMode === 'video' ? 2000 : 800;
      for (let i = 0; i < attempts; i++) {
        const latest = await fetchLatestAssets();
        if (!latest) return null;
        if (targetMode === 'video') {
          if (latest.videoUrl) return latest;
        } else {
          if (latest.afterUrl) return latest;
        }
        if (i < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      return fetchLatestAssets();
    },
    [fetchLatestAssets]
  );

  const updateProjectThumbnail = useCallback(
    async (rawUrlOrKey: string) => {
      if (!userId || !projectId) return;
      const trimmed = rawUrlOrKey.trim();
      if (!trimmed) return;

      const { error } = await supabase
        .from('projects')
        .update({ thumbnail_url: trimmed, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to update project thumbnail', error);
      }
    },
    [projectId, supabase, userId]
  );

  const updateProjectType = useCallback(
    async (nextType: 'photo' | 'video') => {
      if (!userId || !projectId) return;
      const { error } = await supabase
        .from('projects')
        .update({ type: nextType, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to update project type', error);
      }
    },
    [projectId, supabase, userId]
  );

  const syncMainFromSupabase = useCallback(
    async (targetMode: 'photo' | 'video') => {
      const latest = await fetchLatestAssetsWithRetry(targetMode);
      if (!latest) return;

      setGallery((prev) => ({
        before: latest.beforeUrl || prev.before,
        after: targetMode === 'photo' ? latest.afterUrl || '' : prev.after,
      }));

      if (targetMode === 'photo') {
        setCurrentView(latest.afterUrl ? 'after' : 'before');
        setPhotoSourceImage((prev) => latest.afterUrl || latest.beforeUrl || prev);
        if (latest.afterKey) {
          void updateProjectThumbnail(latest.afterKey);
        }
      } else {
        setVideoResultUrl(latest.videoUrl || '');
        setVideoGenerated(Boolean(latest.videoUrl));
        setVideoSourceImage((prev) => latest.afterUrl || latest.beforeUrl || prev);
      }

      return latest;
    },
    [fetchLatestAssetsWithRetry, updateProjectThumbnail]
  );

  useEffect(() => {
    if (!startInVideo) return;
    setVideoSourceImage(initialAfter || initialBefore);
    void syncMainFromSupabase('video');
  }, [initialAfter, initialBefore, startInVideo, syncMainFromSupabase]);

  const resetToolbarSelections = () => {
    setFeatureTab(null);
    if (mode === 'photo') {
      setPhotoFeatures(clonePhotoFeatures());
    } else {
      setVideoFeatures(cloneVideoFeatures());
    }
  };

  const handleFeatureSelection = (hasSelection: boolean, data?: any) => {
    if (!activeFeature) return;
    setCurrentFeatures((prev: Record<string, DemoFeature>) => {
      if (!hasSelection) {
        return { ...prev, [activeFeature.id]: { ...FEATURE_MAP[activeFeature.id] } };
      }

      const next: DemoFeature = {
        ...prev[activeFeature.id],
        ...(data || {}),
      };

      const maybePrompt = (data?.prompt ?? next.prompt) as string | undefined;
      if (typeof maybePrompt === 'string' && maybePrompt.trim().length > 0) {
        next.instruction = maybePrompt.trim();
      }

      if (typeof data?.height === 'string' && data.height.trim().length > 0) {
        next.height = data.height.trim();
        if (activeFeature.id === 'height') {
          next.instruction = undefined;
        }
      }

      if (typeof data?.tintValue === 'number') {
        next.instruction = String(data.tintValue);
      }

      if (typeof data?.duration === 'number') {
        next.instruction = String(data.duration);
      }

      if (typeof data?.scale === 'string' && data.scale.trim().length > 0) {
        next.instruction = data.scale.trim();
      }

      if (typeof data?.quality === 'string' && data.quality.trim().length > 0) {
        next.instruction = data.quality.trim();
      }

      if (Array.isArray(data?.imageUrls) && data.imageUrls.length > 0) {
        next.imageUrls = data.imageUrls;
        next.imageUrl = data.imageUrls[data.imageUrls.length - 1];
      }

      return { ...prev, [activeFeature.id]: next };
    });
  };

  const retryImageLoad = (url: string, update: (nextUrl: string) => void) => {
    const baseUrl = url.split('?')[0];
    const attempts = imageRetryRef.current.get(baseUrl) ?? 0;
    if (attempts >= 2) return;
    const nextAttempts = attempts + 1;
    imageRetryRef.current.set(baseUrl, nextAttempts);
    update(`${baseUrl}?retry=${nextAttempts}`);
  };

  const isFeatureSelected = (featureId: string) => {
    const f = currentFeatures[featureId];
    if (!f) return false;
    if (featureId === 'addPerson') {
      return Boolean(
        (f.imageUrl && f.imageUrl.trim().length > 0) &&
          (f.instruction && f.instruction.trim().length > 0)
      );
    }
    return Boolean(
      (f.imageUrl && f.imageUrl.trim().length > 0) ||
        (f.instruction && f.instruction.trim().length > 0) ||
        (f.imageUrls && f.imageUrls.length > 0) ||
        (typeof f.tintValue === 'number') ||
        (f.height && f.height.trim().length > 0) ||
        (typeof f.duration === 'number') ||
        (f.scale && f.scale.trim().length > 0) ||
        (f.quality && f.quality.trim().length > 0)
    );
  };

  const countSelectedFeatures = () => {
    const photoOrder = [
      'paint',
      'bodykit',
      'rims',
      'livery',
      'window',
      'height',
      'background',
      'multicar',
    ];
    const videoOrder = [...VIDEO_FEATURE_IDS];
    const order = mode === 'photo' ? photoOrder : videoOrder;
    return order.filter((id) => isFeatureSelected(id)).length;
  };

  const handleToolbarItemClick = (id: string) => {
    if (!currentFeatures[id]) return;
    if (
      mode === 'photo' &&
      id !== 'addPerson' &&
      !isFeatureSelected(id) &&
      countSelectedFeatures() >= 3
    ) {
      alert('You can select up to 3 features.');
      return;
    }
    setFeatureTab(id);
  };

  const canDeleteActiveFeature = Boolean(
    activeFeature &&
      ((activeFeature as any).imageUrl ||
        (activeFeature as any).instruction ||
        (activeFeature as any).prompt ||
        (activeFeature as any).height ||
        (activeFeature as any).tintValue !== undefined ||
        (activeFeature as any).duration !== undefined ||
        (activeFeature as any).scale ||
        (activeFeature as any).quality ||
        (Array.isArray((activeFeature as any).multicarUrls) &&
          (activeFeature as any).multicarUrls.length > 0))
  );

  const buildWebhookPayload = (jobId: string) => {
    const payloadFeatures = mode === 'photo' ? photoFeatures : videoFeatures;
    const instructions: Record<string, string> = {};
    const images: Record<string, string | string[]> = {};
    const modes: string[] = [];

    const keyFor: Record<string, string> = {
      paint: 'paint',
      bodykit: 'bodykit',
      rims: 'rim',
      livery: 'livery',
      window: 'tint',
      background: 'environment',
      addPerson: 'insert_person',
      multicar: 'multicars',
      videoPrompt: 'prompt',
      videoDuration: 'duration',
      videoScale: 'scale',
      videoQuality: 'quality',
    };

    const addSelected = (id: string) => {
      if (!isFeatureSelected(id)) return;
      const mapped = keyFor[id] || id;
      if (!modes.includes(mapped)) modes.push(mapped);
    };

    const maybeText = (id: string) => {
      const f = payloadFeatures[id];
      const mapped = keyFor[id] || id;
      if (f?.instruction && f.instruction.trim().length > 0) {
        instructions[mapped] = f.instruction.trim();
        addSelected(id);
      }
    };

    const maybeImage = (id: string) => {
      const f = payloadFeatures[id];
      const mapped = keyFor[id] || id;
      if (f?.imageUrl && f.imageUrl.trim().length > 0) {
        images[mapped] = f.imageUrl.trim();
        addSelected(id);
      }
    };

    maybeText('paint');
    maybeImage('paint');
    maybeText('bodykit');
    maybeImage('bodykit');
    maybeImage('rims');
    maybeImage('livery');
    maybeText('background');
    maybeImage('background');
    maybeText('addPerson');
    maybeImage('addPerson');

    if (payloadFeatures.multicar?.imageUrls && payloadFeatures.multicar.imageUrls.length > 0) {
      images[keyFor.multicar] = payloadFeatures.multicar.imageUrls;
      addSelected('multicar');
    }

    if (payloadFeatures.height?.height) {
      const heightModeMap: Record<string, string> = {
        'extra-low': 'height_extreme_low',
        low: 'height_low',
        high: 'height_high',
        'extra-high': 'height_extreme_high',
      };
      const mapped = heightModeMap[payloadFeatures.height.height] || null;
      if (mapped && !modes.includes(mapped)) {
        modes.push(mapped);
      }
    }

    const windowFeature = payloadFeatures['window'];
    if (typeof windowFeature?.tintValue === 'number') {
      instructions[keyFor.window] = String(windowFeature.tintValue);
      addSelected('window');
    }

    if (mode === 'video') {
      const promptValue =
        (payloadFeatures.videoPrompt as any)?.prompt ||
        payloadFeatures.videoPrompt?.instruction ||
        '';
      const durationValue =
        typeof (payloadFeatures.videoDuration as any)?.duration === 'number'
          ? String((payloadFeatures.videoDuration as any).duration)
          : payloadFeatures.videoDuration?.instruction || '';
      const aspectRatioValue = (payloadFeatures.videoScale as any)?.scale || '16:9';
      const qualityValue =
        (payloadFeatures.videoQuality as any)?.quality || payloadFeatures.videoQuality?.instruction || '';

      const planValue = (() => {
        const q = String(qualityValue).toLowerCase();
        if (q === 'draft') return 'Draft';
        if (q === 'standard') return 'Standard';
        if (q === 'high') return 'High';
        return 'Draft';
      })();

      return {
        source_image: videoSourceImage || gallery.before,
        prompt: String(promptValue),
        duration: String(durationValue),
        plan: planValue,
        metadata: {
          job_id: jobId,
          user_id: userId,
          project_id: projectId,
          aspect_ratio: aspectRatioValue,
        },
      };
    }

    const plan =
      (initialUser?.user_metadata as Record<string, unknown>)?.plan ||
      (initialUser?.user_metadata as Record<string, unknown>)?.user_plan ||
      'free';

    let aspectRatio = (() => {
      const preset =
        aspectRatioPreset === 'auto'
          ? autoAspectRatioPreset ?? 'instagram_post'
          : aspectRatioPreset;
      switch (preset) {
        case 'instagram_post':
          return '1:1';
        case 'instagram_story':
          return '9:16';
        case 'marketplace_website':
          return '16:9';
        default:
          return '1:1';
      }
    })();

    let resolution = (() => {
      const base = resolutionPreset === '4K' ? 4096 : resolutionPreset === '2K' ? 2048 : 1024;
      const preset =
        aspectRatioPreset === 'auto'
          ? autoAspectRatioPreset ?? 'instagram_post'
          : aspectRatioPreset;
      if (preset === 'instagram_post') return `${base}x${base}`;
      if (preset === 'marketplace_website') {
        const width = base;
        const height = Math.max(1, Math.round((base * 9) / 16));
        return `${width}x${height}`;
      }
      const height = base;
      const width = Math.max(1, Math.round((base * 9) / 16));
      return `${width}x${height}`;
    })();

    return {
      event: `studio.${mode}.mode.activated`,
      timestamp: new Date().toISOString(),
      source_image: photoSourceImage || gallery.before,
      modes,
      instructions,
      images,
      metadata: {
        job_id: jobId,
        user_id: userId,
        project_id: projectId,
        plan,
        aspect_ratio: aspectRatio,
        resolution,
      },
    };
  };

  const createJobId = () => {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return `job_${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  };

  const handleGenerate = async () => {
    const requiredVideoFeatures = ['videoPrompt', 'videoDuration', 'videoScale', 'videoQuality'] as const;
    const allVideoSelected = requiredVideoFeatures.every((id) => isFeatureSelected(id));

    if (mode === 'video' && !allVideoSelected) {
      setGenerateOverlay({
        status: 'error',
        message: 'Select Prompt, Duration, Scale, and Quality to generate a video.',
      });
      return;
    }

    if (mode === 'photo') {
      pendingPhotoBeforeRef.current = gallery.after || null;
    }

    const jobId = createJobId();

    setIsGenerating(true);
    setGenerateOverlay({ status: 'loading' });

    if (projectId) {
      const { error } = await supabase.rpc('create_job', {
        p_jobid: jobId,
        p_project_id: projectId,
        p_mode: mode,
      });
      if (error) {
        console.error('create_job rpc failed', error);
        setGenerateOverlay({ status: 'error', message: 'Failed to create job. Please try again.' });
        setIsGenerating(false);
        return;
      }
    } else {
      console.warn('Missing projectId for create_job rpc');
      setGenerateOverlay({ status: 'error', message: 'Missing project context. Please refresh and try again.' });
      setIsGenerating(false);
      return;
    }

    type StudioWebhookResponse = Record<string, unknown> & {
      success?: boolean;
      beforeImage?: string;
      afterImage?: string;
      before_image?: string;
      after_image?: string;
      result_url?: string;
      resultUrl?: string;
      output_url?: string;
      video_result_url?: string;
      videoResultUrl?: string;
    };

    const extractString = (value: unknown): string | null => {
      if (typeof value === 'string' && value.trim().length > 0) return value.trim();
      return null;
    };

    const normalizeWebhookResponse = (raw: StudioWebhookResponse | null) => {
      const response = raw ?? {};
      const nested = (response.data ?? response.result ?? response.output ?? null) as
        | Record<string, unknown>
        | null;

      const beforeRaw =
        extractString(response.beforeImage) ||
        extractString(response.before_image) ||
        extractString(nested?.['beforeImage']) ||
        extractString(nested?.['before_image']) ||
        null;

      const afterRaw =
        extractString(response.afterImage) ||
        extractString(response.after_image) ||
        extractString(response.result_url) ||
        extractString(response.resultUrl) ||
        extractString(response.output_url) ||
        extractString(nested?.['afterImage']) ||
        extractString(nested?.['after_image']) ||
        extractString(nested?.['result_url']) ||
        extractString(nested?.['resultUrl']) ||
        extractString(nested?.['output_url']) ||
        null;

      const videoRaw =
        extractString(response.video_result_url) ||
        extractString(response.videoResultUrl) ||
        extractString(nested?.['video_result_url']) ||
        extractString(nested?.['videoResultUrl']) ||
        null;

      const successField = typeof response.success === 'boolean' ? response.success : null;
      const hasErrorField = typeof (response as any)?.error === 'string' || Boolean((response as any)?.error);
      const success = successField ?? !hasErrorField;

      return {
        success,
        beforeRaw,
        afterRaw,
        videoRaw,
        beforeUrl: beforeRaw ? resolveAssetUrl(beforeRaw) : null,
        afterUrl: afterRaw ? resolveAssetUrl(afterRaw) : null,
        videoUrl: videoRaw ? resolveAssetUrl(videoRaw) : null,
      };
    };

    let webhookResponse: StudioWebhookResponse | null = null;

    try {
      const payload = buildWebhookPayload(jobId);
      const controller = new AbortController();
      const timeoutMs = 35_000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch('/api/n8n/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, payload }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      webhookResponse = (await response.json()) as StudioWebhookResponse;

      if (!response.ok) {
        console.warn('n8n webhook responded with non-OK status', {
          status: response.status,
          body: webhookResponse,
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn('n8n webhook request timed out; continuing via Supabase sync');
      } else {
        console.error('n8n webhook error; continuing via Supabase sync', error);
      }
    }

    const normalized = normalizeWebhookResponse(webhookResponse);

    if (!normalized.success) {
      setGenerateOverlay({ status: 'error', message: 'Render failed. Please try again.' });
      setIsGenerating(false);
      return;
    }

    if (mode === 'video') {
      if (normalized.videoRaw) await persistResultAsset(normalized.videoRaw);
      if (normalized.videoUrl) setVideoResultUrl(normalized.videoUrl);
      setMode('video');
      void updateProjectType('video');
      const latest = await syncMainFromSupabase('video');
      if (!latest?.videoUrl && !normalized.videoUrl) {
        setGenerateOverlay({
          status: 'timeout',
          message: 'Video render is still processing. Please try again in a few minutes.',
        });
        setIsGenerating(false);
        return;
      }
      resetToolbarSelections();
    } else {
      if (normalized.afterRaw) await persistResultAsset(normalized.afterRaw);
      if (normalized.afterRaw) await updateProjectThumbnail(normalized.afterRaw);
      const latest = await syncMainFromSupabase('photo');
      if (latest?.afterUrl) {
        const previousAfter = pendingPhotoBeforeRef.current;
        if (previousAfter) {
          setGallery((prev) => ({ ...prev, before: previousAfter, after: latest.afterUrl || prev.after }));
        } else {
          setGallery((prev) => ({ ...prev, after: latest.afterUrl || prev.after }));
        }
        setCurrentView('after');
        setPhotoSourceImage(latest.afterUrl);
      }
      if (!latest?.afterUrl && !normalized.afterUrl) {
        setGenerateOverlay({
          status: 'timeout',
          message: 'Render is still processing. Please try again in a few minutes.',
        });
        setIsGenerating(false);
        return;
      }
      resetToolbarSelections();
    }

    const { error } = await supabase.rpc('mark_job_completed_all', { p_jobid: jobId });
    if (error) {
      console.error('mark_job_completed_all rpc failed', error);
    }

    setCreditCost((cost) => Math.max(8, cost - 1));
    setIsGenerating(false);
    setGenerateOverlay({ status: 'idle' });
  };

  useEffect(() => {
    setUpscaleGate('initial');
  }, [gallery.after]);

  const uploadToWorker = async (file: File) => {
    if (!userId || !projectId) {
      alert('Missing user or project context');
      return null;
    }
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return null;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large');
      return null;
    }

    const res = await fetch(`${assetBaseUrl}/upload/image`, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-user-id': userId,
        'x-project-id': projectId,
      },
      body: file,
    });

    const data = await res.json();
    console.log('Uploaded:', data);
    const keyOrUrl = data?.key || data?.url || null;
    const resolvedUrl = keyOrUrl
      ? keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')
        ? keyOrUrl
        : `${assetBaseUrl}/${keyOrUrl}`
      : null;

    if (keyOrUrl) {
      await supabase.from('assets').insert({
        user_id: userId,
        project_id: projectId,
        type: 'image',
        role: 'source',
        url: keyOrUrl,
      });
    }

    return resolvedUrl;
  };

  const handleUpload = async (file: File) => {
    const uploadedUrl = await uploadToWorker(file);
    if (uploadedUrl) {
      setFeatureTab(null);
      setGallery({ before: uploadedUrl, after: '' });
      setPhotoSourceImage(uploadedUrl);
      setVideoSourceImage(uploadedUrl);
      setVideoResultUrl('');
      setVideoGenerated(false);
      setUpscaleGate('initial');
      setPhotoFeatures(clonePhotoFeatures());
      setVideoFeatures(cloneVideoFeatures());
      handleViewChange('before');
    }
  };

  const handleUrlImport = (url: string) => {
    setFeatureTab(null);
    setGallery({ before: url, after: '' });
    setPhotoSourceImage(url);
    setVideoSourceImage(url);
    setVideoResultUrl('');
    setVideoGenerated(false);
    setUpscaleGate('initial');
    setPhotoFeatures(clonePhotoFeatures());
    setVideoFeatures(cloneVideoFeatures());
    handleViewChange('before');
  };

  const hasGenerateInput =
    mode === 'photo'
      ? featurePreviews.length > 0
      : (['videoPrompt', 'videoDuration', 'videoScale', 'videoQuality'] as const).every((id) =>
          isFeatureSelected(id)
        );

  const shouldShowGenerate = !featureTab && hasGenerateInput;
  const shouldShowUpscale =
    mode === 'photo' && upscaleGate === 'unlocked' && Boolean(gallery.after);
  const shouldShowGenerateUi = shouldShowGenerate && !isCollapsed;
  const shouldShowUpscaleUi = shouldShowUpscale && !isCollapsed;
  const videoPreviewImage = gallery.after || videoSourceImage || gallery.before;
  const isPhotoSwitchLocked = videoGenerated || (isGenerating && mode === 'video');
  const videoScaleValue =
    (videoFeatures.videoScale as any)?.scale || videoFeatures.videoScale?.instruction || '';
  const videoQualityValue =
    (videoFeatures.videoQuality as any)?.quality || videoFeatures.videoQuality?.instruction || '';

  return (
    <>
      <CursorGlow />
      <StudioBackground />
      <main className={styles.studioPage}>
        {generateOverlay.status !== 'idle' ? (
          <div className={styles.fullScreenLoadingOverlay}>
            <div className={styles.watermarkPattern} />
            <div className={styles.fullScreenLoadingContent}>
              {generateOverlay.status === 'loading' ? (
                <>
                  <div className={styles.progressBar}>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill}></div>
                    </div>
                    <div className={styles.carIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 13l2-5h14l2 5"></path>
                        <path d="M5 13h14v6H5z"></path>
                        <circle cx="7.5" cy="17.5" r="1.5"></circle>
                        <circle cx="16.5" cy="17.5" r="1.5"></circle>
                      </svg>
                    </div>
                  </div>
                  <p className={styles.loadingText}>Render in progress…</p>
                </>
              ) : (
                <div className={styles.modalContent}>
                  <h3 className={styles.modalTitle}>
                    {generateOverlay.status === 'timeout' ? 'Timed out' : 'Something went wrong'}
                  </h3>
                  <p className={styles.modalMessage}>{generateOverlay.message}</p>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={`${styles.modalButton} ${styles.modalSecondary}`}
                      onClick={() => {
                        setIsGenerating(false);
                        setGenerateOverlay({ status: 'idle' });
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className={`${styles.modalButton} ${styles.modalPrimary}`}
                      onClick={() => void handleGenerate()}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <TopBar
          currentMode={mode}
          onModeChange={(nextMode) => {
            if (isGenerating) return;
            if (isPhotoSwitchLocked && nextMode === 'photo') return;
            setFeatureTab(null);
            if (nextMode === 'video') {
              setPhotoFeatures(clonePhotoFeatures());
              setUpscaleGate('initial');
              setVideoSourceImage(gallery.after || gallery.before);
            } else {
              setVideoFeatures(cloneVideoFeatures());
              setVideoResultUrl('');
              setVideoGenerated(false);
              setCurrentView(gallery.after ? 'after' : 'before');
            }
            setMode(nextMode);
            void syncMainFromSupabase(nextMode);
          }}
          disablePhotoSwitch={isPhotoSwitchLocked}
          videoScaleValue={String(videoScaleValue)}
          videoQualityValue={String(videoQualityValue)}
          onVideoScaleChange={(value) => {
            setVideoFeatures((prev) => ({
              ...prev,
              videoScale: {
                ...prev.videoScale,
                scale: value,
                instruction: value,
              },
            }));
          }}
          onVideoQualityChange={(value) => {
            setVideoFeatures((prev) => ({
              ...prev,
              videoQuality: {
                ...prev.videoQuality,
                quality: value,
                instruction: value,
              },
            }));
          }}
          disableVideoControls={isGenerating}
          resolutionPreset={resolutionPreset}
          onResolutionChange={setResolutionPreset}
          aspectRatioPreset={aspectRatioPreset}
          onAspectRatioChange={setAspectRatioPreset}
          credits={initialCredits}
        />

        <ActionButtons
          isVisible={showResultControls}
          isDisabled={!showResultControls}
          onDownload={() => handleViewChange('after')}
          onShare={() => handleViewChange('after')}
        />

        <BeforeAfterToggle
          isVisible={mode === 'photo' && showResultControls}
          isDisabled={false}
          currentView={currentView}
          onViewChange={handleViewChange}
        />

        <div className={styles.imagePreview}>
          {mode === 'video' ? (
            videoResultUrl ? (
              <VideoPlayer key={videoResultUrl} src={videoResultUrl} className={styles.sourceVideo} fit="contain" />
            ) : videoPreviewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={videoPreviewImage}
                alt={initialProject?.title || 'Source'}
                className={styles.sourceImage}
                onError={() => {
                  const currentUrl = videoPreviewImage;
                  if (!currentUrl) return;
                  retryImageLoad(currentUrl, (nextUrl) => {
                    if (currentUrl === videoSourceImage) setVideoSourceImage(nextUrl);
                    if (currentUrl === gallery.before) {
                      setGallery((prev) => ({ ...prev, before: nextUrl }));
                    }
                  });
                }}
              />
            ) : null
          ) : currentView === 'after' ? (
            gallery.after ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery.after}
                alt={initialProject?.title || 'Render'}
                className={styles.sourceImage}
                onError={() => {
                  if (gallery.after) {
                    retryImageLoad(gallery.after, (nextUrl) =>
                      setGallery((prev) => ({ ...prev, after: nextUrl }))
                    );
                  }
                }}
              />
            ) : null
          ) : gallery.before ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gallery.before}
              alt={initialProject?.title || 'Source'}
              className={styles.sourceImage}
              onError={() => {
                if (gallery.before) {
                  retryImageLoad(gallery.before, (nextUrl) =>
                    setGallery((prev) => ({ ...prev, before: nextUrl }))
                  );
                }
              }}
            />
          ) : null}

          {/* Intentionally no inline "Upload photo" box here. */}
        </div>

        <CollapseButton
          isVisible={showResultControls}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((v) => !v)}
        />

        <ControlPanel
          mode={mode}
          isCollapsed={isToolbarCollapsed}
          items={toolbarItems}
          onItemClick={(id) => handleToolbarItemClick(id)}
        />
        <div className={styles.toolbarHint} aria-live="polite">
          {mode === 'photo'
            ? 'You can select up to 3 features at the same time.'
            : 'Select Prompt, Duration, Scale, and Quality to generate a video.'}
        </div>

        <GenerateWrapper
          isVisible={shouldShowGenerateUi || shouldShowUpscaleUi}
          showGenerate={shouldShowGenerateUi}
          isGenerateDisabled={!hasGenerateInput}
          onGenerate={handleGenerate}
          creditCost={creditCost}
          showUpscale={shouldShowUpscaleUi}
          onUpscale={() => handleViewChange('after')}
        />

        {mode === 'photo' ? <FeaturePreviewPanel features={featurePreviews} /> : null}

        <div className={styles.loadingOverlay} style={{ opacity: isGenerating ? 1 : 0, pointerEvents: isGenerating ? 'auto' : 'none' }}>
          <div className={styles.loadingContent}>
            <div className={styles.progressBar}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill}></div>
              </div>
              <div className={styles.carIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 13l2-5h14l2 5"></path>
                  <path d="M5 13h14v6H5z"></path>
                  <circle cx="7.5" cy="17.5" r="1.5"></circle>
                  <circle cx="16.5" cy="17.5" r="1.5"></circle>
                </svg>
              </div>
            </div>
            <p className={styles.loadingText}>Simulated render in progress…</p>
          </div>
        </div>

        {!gallery.before ? <UploadCard onFileUpload={handleUpload} onUrlImport={handleUrlImport} /> : null}

        {activeFeature && (
          <FeatureTab
            isOpen
            featureType={activeFeature.type}
            title={activeFeature.title}
            onClose={() => setFeatureTab(null)}
            onSelection={(hasSelection, featureData) => handleFeatureSelection(hasSelection, featureData)}
            onDelete={
              canDeleteActiveFeature
                ? () => {
                    setCurrentFeatures((prev: Record<string, DemoFeature>) => ({
                      ...prev,
                      [activeFeature.id]: { ...FEATURE_MAP[activeFeature.id] },
                    }));
                    setFeatureTab(null);
                  }
                : undefined
            }
            initialValues={activeFeature}
            uploadContext={{
              userId: userId || '',
              projectId: projectId || '',
            }}
          />
        )}
      </main>
    </>
  );
}
