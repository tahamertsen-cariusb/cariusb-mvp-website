'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useWebhook } from '@/hooks/useWebhook';
import { WebhookEvent } from '@/lib/n8n/events';
import { useSupabaseClient } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';
import styles from './page.module.css';

// Worker URL from environment variable or fallback
const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  'https://media-gateway-cariusb.tahamertsen.workers.dev';

export interface Project {
  id: string;
  project_id: string;
  title: string;
  thumbnail_url: string | null;
  type: string;
  has_video?: boolean;
  created_at: string;
  updated_at: string;
}

const getThumbnailUrl = (thumbnailUrl: string | null): string | null => {
  if (!thumbnailUrl) return null;
  if (thumbnailUrl === 'null' || thumbnailUrl === 'undefined') return null;
  if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
    return thumbnailUrl;
  }
  return `${WORKER_URL}/${thumbnailUrl}`;
};

export default function DashboardClient({
  initialProjects,
  userId,
  userEmail,
}: {
  initialProjects: Project[];
  userId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const { sendWebhook } = useWebhook();
  const supabase = useSupabaseClient();

  const [projects, setProjects] = useState<Project[]>(() => initialProjects);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deleteDialogProjectId, setDeleteDialogProjectId] = useState<string | null>(
    null
  );
  const [previewProjectId, setPreviewProjectId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [brokenThumbnailIds, setBrokenThumbnailIds] = useState<Set<string>>(
    () => new Set()
  );
  const projectsRef = useRef<Project[]>(projects);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const withVideoFlags = useCallback(
    async (rows: Project[]) => {
      if (rows.length === 0) return rows;
      const ids = rows.map((p) => p.id);
      const { data, error } = await supabase
        .from('assets')
        .select('project_id')
        .eq('user_id', userId)
        .eq('type', 'video')
        .in('project_id', ids);

      if (error) {
        return rows;
      }

      const set = new Set((data || []).map((row) => (row as any).project_id as string));
      return rows.map((p) => ({ ...p, has_video: Boolean(p.has_video) || set.has(p.id) }));
    },
    [supabase, userId]
  );

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, project_id, title, thumbnail_url, type, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMessage('Failed to load projects. Please try again.');
        return;
      }

      const uniqueProjects = new Map<string, Project>();
      (data || []).forEach((project) => uniqueProjects.set(project.id, project));
      const nextProjects = await withVideoFlags(Array.from(uniqueProjects.values()));
      setProjects(nextProjects);
      setBrokenThumbnailIds((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        const projectIds = new Set(nextProjects.map((project) => project.project_id));
        Array.from(next).forEach((projectId) => {
          if (!projectIds.has(projectId)) next.delete(projectId);
        });
        return next;
      });
    } catch {
      setErrorMessage('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router, withVideoFlags]);

  useEffect(() => {
    const handleFocus = () => {
      if (!loading) fetchProjects();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProjects, loading]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`dashboard-assets-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assets',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const asset = payload.new as
            | {
                project_id?: string | null;
                role?: string | null;
                url?: string | null;
              }
            | undefined;

          if (!asset) return;
          if (asset.role !== 'result') return;
          if (!asset.project_id || !asset.url) return;

          const nextThumbnailUrl = asset.url;
          const nextUpdatedAt = new Date().toISOString();

          setProjects((prev) =>
            prev.map((project) =>
              project.id === asset.project_id
                ? { ...project, thumbnail_url: nextThumbnailUrl, updated_at: nextUpdatedAt }
                : project
            )
          );

          const updatedProject = projectsRef.current.find(
            (project) => project.id === asset.project_id
          );
          if (updatedProject) {
            setBrokenThumbnailIds((prev) => {
              if (!prev.has(updatedProject.project_id)) return prev;
              const next = new Set(prev);
              next.delete(updatedProject.project_id);
              return next;
            });
          }

          const { error } = await supabase
            .from('projects')
            .update({ thumbnail_url: nextThumbnailUrl })
            .eq('id', asset.project_id);
          if (error) {
            console.error('Failed to persist project thumbnail', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const handleCreateProject = async () => {
    if (creatingProject) return;

    setCreatingProject(true);
    setErrorMessage(null);
    let holdOverlayUntilRouteChange = false;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        holdOverlayUntilRouteChange = true;
        router.push('/login');
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setErrorMessage('Missing Supabase configuration. Please try again.');
        return;
      }

      const generatedProjectId = nanoid(12);
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/create_project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ p_project_id: generatedProjectId }),
      });

      if (res.status === 401 || res.status === 403) {
        holdOverlayUntilRouteChange = true;
        router.push('/login');
        return;
      }

      if (!res.ok) {
        setErrorMessage('Failed to create project. Please try again.');
        return;
      }

      const rawBody = await res.text();
      let data: unknown = null;
      if (rawBody) {
        try {
          data = JSON.parse(rawBody) as unknown;
        } catch {
          data = null;
        }
      }
      let createdProject: Partial<Project> | null = null;

      if (Array.isArray(data)) {
        createdProject = (data[0] as Partial<Project>) || null;
      } else if (data && typeof data === 'object' && 'project' in (data as any)) {
        createdProject = ((data as { project?: Partial<Project> }).project as Partial<Project>) || null;
      } else {
        createdProject = (data as Partial<Project>) || null;
      }

      let projectId = createdProject?.id || null;
      const publicProjectId = createdProject?.project_id || generatedProjectId || null;

      if (!projectId) {
        if (publicProjectId) {
          const { data: idRow, error } = await supabase
            .from('projects')
            .select('id')
            .eq('project_id', publicProjectId)
            .order('created_at', { ascending: false })
            .maybeSingle();

          if (!error) {
            projectId = idRow?.id || null;
          }
        }

        if (!projectId) {
          const { data: idRow, error } = await supabase
            .from('projects')
            .select('id, project_id')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error) {
            projectId = idRow?.id || null;
          }
        }
      }

      if (!projectId) {
        setErrorMessage('Failed to create project. Please try again.');
        return;
      }

      holdOverlayUntilRouteChange = true;
      router.push(`/design-preview?project=${projectId}`);
    } catch {
      setErrorMessage('Failed to create project. Please try again.');
    } finally {
      if (!holdOverlayUntilRouteChange) {
        setCreatingProject(false);
      }
    }
  };

  const handleProjectClick = (projectId: string) => {
    setPreviewProjectId(projectId);
    setShareFeedback(null);
    setRenamingProjectId(null);
  };

  const handlePreviewDownload = (thumbnailUrl: string | null, fallbackName: string) => {
    const resolvedUrl = getThumbnailUrl(thumbnailUrl);
    if (!resolvedUrl) return;
    const safeName = fallbackName.trim() || 'project';
    const anchor = document.createElement('a');
    anchor.href = resolvedUrl;
    anchor.download = `${safeName.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    anchor.rel = 'noopener';
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleErrorAction = () => {
    fetchProjects();
  };

  const performDeleteProject = async (projectId: string) => {
    setDeletingProjectId(projectId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        alert('Missing Supabase configuration. Please try again.');
        return;
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/delete_project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ p_project_id: projectId }),
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        alert('Failed to delete project. Please try again.');
        return;
      }

      const deletedProject = projects.find((p) => p.project_id === projectId);
      if (deletedProject) {
        await sendWebhook(
          WebhookEvent.PROJECT_DELETED,
          {
            projectId,
            projectName: deletedProject.title,
            timestamp: new Date().toISOString(),
          },
          userId,
          userEmail
        );
      }

      setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
      setBrokenThumbnailIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    } catch {
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeleteDialogProjectId(projectId);
  };

  const closeDeleteDialog = () => setDeleteDialogProjectId(null);

  const closePreviewDialog = () => {
    setPreviewProjectId(null);
    setShareFeedback(null);
    setRenamingProjectId(null);
  };

  const handleCommunityShare = async () => {
    if (!previewProject) return;

    const thumbnailUrl = getThumbnailUrl(previewProject.thumbnail_url);

    void sendWebhook(
      WebhookEvent.COMMUNITY_POST_SHARED,
      {
        projectId: previewProject.project_id,
        projectName: previewProject.title,
        thumbnailUrl,
        timestamp: new Date().toISOString(),
      },
      userId,
      userEmail
    );

    router.push('/community');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareFeedback('Link copied to clipboard.');
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setShareFeedback('Link copied to clipboard.');
      } catch {
        setShareFeedback('Could not copy link. Please copy it manually.');
      }
    }
  };

  useEffect(() => {
    if (!shareFeedback) return;
    const timeout = window.setTimeout(() => setShareFeedback(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [shareFeedback]);

  useEffect(() => {
    if (!deleteDialogProjectId && !previewProjectId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteDialogProjectId) closeDeleteDialog();
        if (previewProjectId) closePreviewDialog();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteDialogProjectId, previewProjectId]);

  const formatDate = useMemo(
    () => (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    },
    []
  );

  const formatTimeAgo = useMemo(
    () => (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `Edited ${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `Edited ${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `Edited ${Math.floor(diffInSeconds / 86400)}d ago`;
      return formatDate(dateString);
    },
    [formatDate]
  );

  const deleteDialogProject = deleteDialogProjectId
    ? projects.find((project) => project.project_id === deleteDialogProjectId) || null
    : null;

  const previewProject = previewProjectId
    ? projects.find((project) => project.id === previewProjectId) || null
    : null;

  const getDesignPreviewUrl = (project: Project) => {
    const hasVideo = project.type === 'video' || Boolean(project.has_video);
    return hasVideo ? `/design-preview?project=${project.id}&mode=video` : `/design-preview?project=${project.id}`;
  };

  return (
    <>
      <Navbar />
      <main className={styles.dashboardContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>My Garages</h1>
              <p className={styles.pageSubtitle}>
                Manage your vehicle collections and create stunning visuals
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                onClick={handleCreateProject}
                disabled={creatingProject}
                className={styles.createHeaderButton}
              >
                {creatingProject ? (
                  <svg
                    className={styles.spinner}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                      <animate
                        attributeName="stroke-dasharray"
                        dur="2s"
                        values="0 32;16 16;0 32;0 32"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-dashoffset"
                        dur="2s"
                        values="0;-16;-32;-32"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
                <span>{creatingProject ? 'Creating...' : 'New Project'}</span>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`${styles.garagesGrid} ${
            !loading && !errorMessage && projects.length === 0 ? styles.garagesGridEmpty : ''
          }`}
        >
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.garageCardSkeleton}>
                  <div className={styles.skeletonThumbnail}></div>
                  <div className={styles.skeletonInfo}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonMeta}>
                      <div className={styles.skeletonMetaItem}></div>
                      <div className={styles.skeletonMetaItem}></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && !errorMessage && projects.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>Let’s create your first project</h2>
              <p className={styles.emptyMessage}>Start your first garage in seconds—upload a photo and generate your first render.</p>
              <button onClick={handleCreateProject} className={styles.emptyCta} disabled={creatingProject}>
                {creatingProject ? 'Creating…' : 'Create Project'}
              </button>
            </div>
          )}

          {!loading && errorMessage && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 7v6" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>Couldn&apos;t load projects</h2>
              <p className={styles.emptyMessage}>{errorMessage}</p>
              <button onClick={handleErrorAction} className={styles.emptyCta}>
                Retry
              </button>
            </div>
          )}

          {!loading &&
            !errorMessage &&
            projects.length > 0 &&
            (
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={creatingProject}
                className={`${styles.garageCard} ${styles.createGarageCard}`}
              >
                <div
                  className={`${styles.garageThumbnailContainer} ${styles.createGarageThumbnailContainer}`}
                  aria-hidden="true"
                >
                  <div className={styles.createGarageIcon}>
                    {creatingProject ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                          <animate
                            attributeName="stroke-dasharray"
                            dur="2s"
                            values="0 32;16 16;0 32;0 32"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="stroke-dashoffset"
                            dur="2s"
                            values="0;-16;-32;-32"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className={`${styles.garageInfo} ${styles.createGarageInfo}`}>
                  <h3 className={styles.garageName}>
                    {creatingProject ? 'Creating project…' : 'Create a New Project'}
                  </h3>
                  <p className={styles.createGarageCta}>
                    {creatingProject
                      ? 'Preparing your garage…'
                      : 'Try a new style, upload a new ride, and keep experimenting.'}
                  </p>
                </div>
              </button>
            )}

          {!loading &&
            !errorMessage &&
            projects.length > 0 &&
            projects.map((project) => (
              <div
                key={project.id}
                className={styles.garageCard}
                onClick={() => handleProjectClick(project.id)}
              >
                <div className={styles.garageThumbnailContainer}>
                  {getThumbnailUrl(project.thumbnail_url) &&
                  !brokenThumbnailIds.has(project.project_id) ? (
                    <img
                      src={getThumbnailUrl(project.thumbnail_url)!}
                      alt={project.title}
                      className={styles.garageThumbnail}
                      loading="lazy"
                      decoding="async"
                      onError={() => {
                        setBrokenThumbnailIds((prev) => {
                          const next = new Set(prev);
                          next.add(project.project_id);
                          return next;
                        });
                      }}
                    />
                  ) : (
                    <div className={styles.garageThumbnailPlaceholder}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                        <circle cx="7" cy="17" r="2" />
                        <circle cx="17" cy="17" r="2" />
                      </svg>
                    </div>
                  )}
                  {(project.type === 'video' || project.has_video) && <span className={styles.videoBadge}>Video</span>}
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteProject(e, project.project_id)}
                    disabled={deletingProjectId === project.project_id}
                    title="Delete project"
                  >
                    {deletingProjectId === project.project_id ? (
                      <svg
                        className={styles.deleteSpinner}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                          <animate
                            attributeName="stroke-dasharray"
                            dur="2s"
                            values="0 32;16 16;0 32;0 32"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="stroke-dashoffset"
                            dur="2s"
                            values="0;-16;-32;-32"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className={styles.garageInfo}>
                  <h3 className={styles.garageName}>{project.title || 'Untitled Project'}</h3>
                  <div className={styles.garageMeta}>
                    <span className={styles.garageMetaItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {formatDate(project.created_at)}
                    </span>
                    <span className={styles.garageMetaItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      {formatTimeAgo(project.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          {previewProject ? (
            <div
              className={styles.previewOverlay}
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-preview-title"
              onClick={closePreviewDialog}
            >
              <div
                className={styles.previewModal}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.previewClose}
                  onClick={closePreviewDialog}
                  aria-label="Close preview"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12"></path>
                  </svg>
                </button>

                <div className={styles.previewBody}>
                  <div className={styles.previewMedia}>
                    {getThumbnailUrl(previewProject.thumbnail_url) &&
                    !brokenThumbnailIds.has(previewProject.project_id) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getThumbnailUrl(previewProject.thumbnail_url)!}
                        alt={previewProject.title}
                        className={styles.previewImage}
                        onError={() => {
                          setBrokenThumbnailIds((prev) => {
                            const next = new Set(prev);
                            next.add(previewProject.project_id);
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <div className={styles.previewPlaceholder} aria-label="No thumbnail available">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                          <circle cx="7" cy="17" r="2" />
                          <circle cx="17" cy="17" r="2" />
                        </svg>
                      </div>
                    )}

                    {previewProject.type === 'video' ? (
                      <span className={styles.previewVideoBadge}>Video</span>
                    ) : null}
                  </div>

                  <aside className={styles.previewPanel} aria-label="Project actions">
                    <div className={styles.previewPanelStack}>
                      <div className={styles.previewHeader}>
                        <div className={styles.previewTitleRow}>
                          <h3 className={styles.previewTitle} id="project-preview-title">
                            {previewProject.title || 'Untitled Project'}
                          </h3>
                        </div>
                      </div>

                      {shareFeedback ? (
                        <div className={styles.previewHint} role="status">
                          {shareFeedback}
                        </div>
                      ) : null}

                      {renamingProjectId === previewProject.id ? (
                        <div className={styles.previewRenameRow}>
                          <div className={styles.editNameContainer}>
                            <input
                              className={styles.editNameInput}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              placeholder="Project name"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key !== 'Enter') return;
                                (e.currentTarget
                                  .closest(`.${styles.editNameContainer}`)
                                  ?.querySelector(`.${styles.saveBtn}`) as HTMLButtonElement | null)?.click();
                              }}
                            />
                            <div className={styles.editActions}>
                              <button
                                type="button"
                                className={styles.saveBtn}
                                onClick={async () => {
                                  const nextTitle = renameValue.trim();
                                  if (!nextTitle) return;

                                  const {
                                    data: { session },
                                  } = await supabase.auth.getSession();

                                  if (!session?.access_token) {
                                    router.push('/login');
                                    return;
                                  }

                                  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                                  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

                                  if (!supabaseUrl || !supabaseAnonKey) {
                                    alert('Missing Supabase configuration. Please try again.');
                                    return;
                                  }

                                  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/change_project_title`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      apikey: supabaseAnonKey,
                                      Authorization: `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({
                                      p_project_id: previewProject.project_id,
                                      p_new_title: nextTitle,
                                    }),
                                  });

                                  if (res.status === 401 || res.status === 403) {
                                    router.push('/login');
                                    return;
                                  }

                                  if (!res.ok) {
                                    alert('Failed to rename project. Please try again.');
                                    return;
                                  }
                                  setProjects((prev) =>
                                    prev.map((p) =>
                                      p.project_id === previewProject.project_id ? { ...p, title: nextTitle } : p
                                    )
                                  );
                                  setRenamingProjectId(null);
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                              </button>
                              <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={() => setRenamingProjectId(null)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6 6 18M6 6l12 12"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className={styles.previewActions}>
                        <button
                          type="button"
                          className={`${styles.previewTile} ${styles.previewTileWide} ${styles.previewTileStudio}`}
                          onClick={() => router.push(getDesignPreviewUrl(previewProject))}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                          <div className={styles.previewTileText}>
                            <span className={styles.previewTileLabel}>Open</span>
                            <span className={styles.previewTileDesc}>Continue editing in Studio</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={`${styles.previewTile} ${styles.previewTileNeutral}`}
                          onClick={() => {
                            setRenamingProjectId(previewProject.id);
                            setRenameValue(previewProject.title || '');
                          }}
                          disabled={renamingProjectId === previewProject.id}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                          <div className={styles.previewTileText}>
                            <span className={styles.previewTileLabel}>Rename</span>
                            <span className={styles.previewTileDesc}>Change project title</span>
                          </div>
                        </button>
                          <button
                            type="button"
                            className={`${styles.previewTile} ${styles.previewTileOrange}`}
                            onClick={() =>
                            void copyToClipboard(`${window.location.origin}${getDesignPreviewUrl(previewProject)}`)
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                          <div className={styles.previewTileText}>
                            <span className={styles.previewTileLabel}>Share</span>
                            <span className={styles.previewTileDesc}>Copy Studio link</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className={`${styles.previewTile} ${styles.previewTileOrange}`}
                          onClick={handleCommunityShare}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          <div className={styles.previewTileText}>
                            <span className={styles.previewTileLabel}>Community</span>
                            <span className={styles.previewTileDesc}>Open community feed</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className={`${styles.previewTile} ${styles.previewTileDanger}`}
                          onClick={() => {
                            closePreviewDialog();
                            setDeleteDialogProjectId(previewProject.project_id);
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          </svg>
                          <div className={styles.previewTileText}>
                            <span className={styles.previewTileLabel}>Delete</span>
                            <span className={styles.previewTileDesc}>Remove permanently</span>
                          </div>
                        </button>
                      </div>

                      <button
                        type="button"
                        className={`${styles.previewTile} ${styles.previewTileWide} ${styles.previewTileDownload}`}
                        onClick={() =>
                          handlePreviewDownload(previewProject.thumbnail_url, previewProject.title || 'project')
                        }
                        disabled={!getThumbnailUrl(previewProject.thumbnail_url)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <div className={styles.previewTileText}>
                          <span className={styles.previewTileLabel}>Download</span>
                          <span className={styles.previewTileDesc}>Save the thumbnail</span>
                        </div>
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          ) : null}

          {deleteDialogProjectId ? (
            <div
              className={styles.deleteModalOverlay}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-project-title"
              aria-describedby="delete-project-desc"
              tabIndex={-1}
              onClick={closeDeleteDialog}
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeDeleteDialog();
              }}
            >
              <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.deleteModalHeader}>
                  <div className={styles.deleteModalIcon} aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </div>
                  <h3 className={styles.deleteModalTitle} id="delete-project-title">
                    Delete project?
                  </h3>
                </div>

                <p className={styles.deleteModalDesc} id="delete-project-desc">
                  Are you sure? This action is permanent and cannot be undone. The project and its associated assets will be removed.
                  {deleteDialogProject?.title ? (
                    <span className={styles.deleteModalProjectName}>
                      <br />
                      <strong>{deleteDialogProject.title}</strong>
                    </span>
                  ) : null}
                </p>

                <div className={styles.deleteModalActions}>
                  <button
                    type="button"
                    className={styles.deleteModalCancel}
                    onClick={closeDeleteDialog}
                    disabled={Boolean(deletingProjectId)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.deleteModalConfirm}
                    onClick={async () => {
                      const projectId = deleteDialogProjectId;
                      closeDeleteDialog();
                      await performDeleteProject(projectId);
                    }}
                    disabled={Boolean(deletingProjectId)}
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      {creatingProject ? (
        <div className={styles.loadingOverlay} role="status" aria-live="polite" aria-busy="true">
          <div className={styles.loadingCard}>
            <svg className={`${styles.loadingSpinner} ${styles.spinner}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                <animate
                  attributeName="stroke-dasharray"
                  dur="2s"
                  values="0 32;16 16;0 32;0 32"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-dashoffset"
                  dur="2s"
                  values="0;-16;-32;-32"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            <h3 className={styles.loadingTitle}>Creating project</h3>
            <p className={styles.loadingMessage}>Preparing your garage and opening Studio…</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
