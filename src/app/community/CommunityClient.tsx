'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createSupabaseClient } from '@/lib/supabase';
import styles from './page.module.css';

export type CommunityPostRow = {
  id: string;
  user_id: string | null;
  image_url: string | null;
  tags: string | string[] | null;
  likes_count: number | null;
  user_community_name: string | null;
  avatar_url?: string | null;
  created_at: string | null;
};

export type CommunityViewer = {
  id: string;
  communityName: string;
  avatarUrl: string | null;
};

interface GalleryCard {
  id: string;
  category: string;
  title: string;
  prompt: string;
  user: string;
  likes: string;
  views: string;
  tags: string;
  timeAgo: string;
  trending?: boolean;
  aspectRatio: 'landscape' | 'portrait' | 'square' | 'wide';
  imageUrl: string | null;
  likeCount: number;
  avatarUrl: string | null;
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(value);
}

function formatTimeAgo(dateIso: string | null): string {
  if (!dateIso) return '';
  const now = Date.now();
  const date = new Date(dateIso).getTime();
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));
  const mins = Math.floor(diffSec / 60);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function normalizeTags(tags: CommunityPostRow['tags']): string {
  if (!tags) return '';
  if (Array.isArray(tags)) return tags.join(',');
  return tags;
}

function deriveCategory(tags: string): string {
  const first = tags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)[0];
  return first || 'all';
}

function deriveTitleDisplay(tags: string): string {
  const list = tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (list.length === 0) return 'Community Render';
  return list.slice(0, 2).join(' • ');
}

function deriveTitle(tags: string): string {
  const list = tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (list.length === 0) return 'Community Render';
  return list.slice(0, 2).join(' • ');
}

export default function CommunityClient({
  initialPosts,
  viewer = null,
  viewerPosts = [],
}: {
  initialPosts: CommunityPostRow[];
  viewer?: CommunityViewer | null;
  viewerPosts?: CommunityPostRow[];
}) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [view, setView] = useState<'feed' | 'search' | 'profileShare'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<GalleryCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [localLikes, setLocalLikes] = useState<Record<string, number>>(() => {
    const next: Record<string, number> = {};
    (initialPosts || []).forEach((post) => {
      next[post.id] = typeof post.likes_count === 'number' ? post.likes_count : 0;
    });
    (viewerPosts || []).forEach((post) => {
      next[post.id] = typeof post.likes_count === 'number' ? post.likes_count : 0;
    });
    return next;
  });
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  const cards: GalleryCard[] = useMemo(() => {
    return (initialPosts || []).map((post) => {
      const tags = normalizeTags(post.tags);
      const likeCount = typeof localLikes[post.id] === 'number' ? localLikes[post.id] : 0;
      const imageUrl = post.image_url && post.image_url !== 'null' && post.image_url !== 'undefined' ? post.image_url : null;
      return {
        id: post.id,
        category: deriveCategory(tags),
        title: deriveTitleDisplay(tags),
        prompt: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean).join(', ') : '',
        user: post.user_community_name || 'Anonymous',
        likes: formatCompactNumber(likeCount),
        views: '—',
        tags,
        timeAgo: formatTimeAgo(post.created_at),
        trending: likeCount >= 1000,
        aspectRatio: 'landscape',
        imageUrl,
        likeCount,
        avatarUrl: post.avatar_url || null,
      };
    });
  }, [initialPosts, localLikes]);

  const viewerCards: GalleryCard[] = useMemo(() => {
    return (viewerPosts || []).map((post) => {
      const tags = normalizeTags(post.tags);
      const likeCount = typeof localLikes[post.id] === 'number' ? localLikes[post.id] : 0;
      const imageUrl =
        post.image_url && post.image_url !== 'null' && post.image_url !== 'undefined' ? post.image_url : null;
      return {
        id: post.id,
        category: deriveCategory(tags),
        title: deriveTitleDisplay(tags),
        prompt: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean).join(', ') : '',
        user: post.user_community_name || viewer?.communityName || 'Anonymous',
        likes: formatCompactNumber(likeCount),
        views: '—',
        tags,
        timeAgo: formatTimeAgo(post.created_at),
        trending: likeCount >= 1000,
        aspectRatio: 'landscape',
        imageUrl,
        likeCount,
        avatarUrl: post.avatar_url || viewer?.avatarUrl || null,
      };
    });
  }, [viewerPosts, localLikes, viewer?.communityName, viewer?.avatarUrl]);

  const viewerLikesTotal = useMemo(() => {
    return viewerCards.reduce((sum, card) => sum + (card.likeCount || 0), 0);
  }, [viewerCards]);

  const handleLike = async (card: GalleryCard) => {
    if (likedIds.has(card.id)) return;

    setLikedIds((prev) => new Set(prev).add(card.id));
    setLocalLikes((prev) => ({ ...prev, [card.id]: (prev[card.id] ?? card.likeCount) + 1 }));

    const nextCount = (localLikes[card.id] ?? card.likeCount) + 1;

    const { error } = await supabase.from('posts').update({ likes_count: nextCount }).eq('id', card.id);
    if (error) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
      setLocalLikes((prev) => ({ ...prev, [card.id]: Math.max(0, (prev[card.id] ?? nextCount) - 1) }));
    }
  };

  const filteredCards =
    view === 'search'
      ? searchQuery.trim().length > 0
        ? cards.filter((card) => {
            const q = searchQuery.trim().toLowerCase();
            const tokens = q.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
            if (tokens.length === 0) return false;
            const haystack = card.tags.toLowerCase();
            return tokens.every((token) => haystack.includes(token));
          })
        : []
      : cards;

  const openModal = (card: GalleryCard) => {
    setSelectedCard(card);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    if (isModalOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  useEffect(() => {
    if (view !== 'feed' || isModalOpen) {
      setIsNavbarHidden(false);
      return;
    }

    lastScrollYRef.current = window.scrollY;
    const thresholdPx = 12;
    const minScrollToHidePx = 80;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const current = window.scrollY;
        const delta = current - lastScrollYRef.current;

        if (Math.abs(delta) >= thresholdPx) {
          if (delta > 0 && current > minScrollToHidePx) {
            setIsNavbarHidden(true);
          } else if (delta < 0) {
            setIsNavbarHidden(false);
          }
          lastScrollYRef.current = current;
        }

        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [view, isModalOpen]);

  return (
    <>
      <div className={`${styles.navbarShell} ${isNavbarHidden ? styles.navbarHidden : ''}`}>
        <Navbar />
      </div>

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <span className={styles.pageBadge}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            🔥 Endless Inspiration
          </span>
          <h1 className={styles.pageTitle}>
            Community <span className={styles.highlight}>Gallery</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Discover jaw-dropping car renders from creators worldwide. Get inspired, then create your own.
          </p>
        </div>

        {view === 'search' ? (
          <div className={styles.simpleSearchRow} role="search">
            <div className={styles.simpleSearch}>
              <svg
                className={styles.simpleSearchIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className={styles.simpleSearchInput}
                placeholder="Search community renders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className={styles.simpleSearchClear}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12"></path>
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {view === 'profileShare' ? (
          <div className={styles.profileShareCard} role="region" aria-label="Profile and sharing">
            {viewer ? (
              <>
                <div className={styles.profileHeaderRow}>
                  <div className={styles.profileAvatar}>
                    {viewer.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={viewer.avatarUrl}
                        alt={viewer.communityName}
                        className={styles.profileAvatarImg}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      viewer.communityName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className={styles.profileHeaderText}>
                    <h2 className={styles.profileShareTitle}>{viewer.communityName}</h2>
                    <p className={styles.profileShareText}>Your profile and the posts you shared to the community.</p>
                  </div>
                  <Link
                    href="/profile"
                    className={styles.profileEditBtn}
                    title="Change your profile photo and community nickname"
                    aria-label="Edit profile photo and community nickname"
                  >
                    Edit avatar &amp; nickname
                  </Link>
                </div>

                <div className={styles.profileStatsRow}>
                  <div className={styles.profileStatChip}>
                    <span className={styles.profileStatValue}>{viewerCards.length}</span>
                    <span className={styles.profileStatLabel}>Posts</span>
                  </div>
                  <div className={styles.profileStatChip}>
                    <span className={styles.profileStatValue}>{formatCompactNumber(viewerLikesTotal)}</span>
                    <span className={styles.profileStatLabel}>Likes</span>
                  </div>
                  <Link href="/dashboard" className={styles.profileShareBtn}>
                    Share a new post
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.profileShareTitle}>Your profile</h2>
                <p className={styles.profileShareText}>Sign in to view your community profile and your posts.</p>
                <Link href="/login" className={styles.profileShareBtn}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        ) : null}

        <div className={styles.masonryGrid} hidden={view !== 'profileShare'}>
          {viewer ? (
            viewerCards.length > 0 ? (
              viewerCards.map((card) => (
                <div
                  key={card.id}
                  className={styles.galleryCard}
                  data-category={card.category}
                  onClick={() => openModal(card)}
                >
                  {card.trending ? <span className={styles.trendingBadge}>🔥 Trending</span> : null}
                  <div className={styles.cardImage}>
                    {card.imageUrl && !brokenImageIds.has(card.id) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className={styles.cardImg}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImageIds((prev) => {
                            const next = new Set(prev);
                            next.add(card.id);
                            return next;
                          })
                        }
                      />
                    ) : (
                      <div className={styles.cardPlaceholder}>{card.title}</div>
                    )}
                  </div>
                  <div className={styles.cardOverlay}>
                    <div className={styles.cardActions}>
                      <div className={styles.cardUser}>
                        <div className={styles.userAvatar}>
                          {card.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={card.avatarUrl}
                              alt={card.user}
                              className={styles.userAvatarImg}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            card.user.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{card.user}</span>
                          <span className={styles.userTime}>{card.timeAgo}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`${styles.likeButton} ${likedIds.has(card.id) ? styles.likeButtonActive : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLike(card);
                        }}
                        aria-label="Like"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <span>{formatCompactNumber(localLikes[card.id] ?? card.likeCount)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.searchEmptyState} role="status">
                <h2 className={styles.searchEmptyTitle}>No posts yet</h2>
                <p className={styles.searchEmptyText}>
                  Share a project from <strong>My Garages</strong> to show it on your profile.
                </p>
              </div>
            )
          ) : null}
        </div>

        {view === 'search' && searchQuery.trim().length === 0 ? (
          <div className={styles.searchEmptyState} role="status" aria-live="polite">
            <h2 className={styles.searchEmptyTitle}>Search by tags</h2>
            <p className={styles.searchEmptyText}>
              Type one or more tags (e.g. <strong>car</strong>, <strong>cariusb</strong>) to find community posts.
            </p>
          </div>
        ) : null}

        <div
          className={styles.masonryGrid}
          hidden={view === 'profileShare' || (view === 'search' && searchQuery.trim().length === 0)}
        >
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className={styles.galleryCard}
              data-category={card.category}
              onClick={() => openModal(card)}
            >
              {card.trending ? <span className={styles.trendingBadge}>🔥 Trending</span> : null}
              <div className={styles.cardImage}>
                {card.imageUrl && !brokenImageIds.has(card.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className={styles.cardImg}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImageIds((prev) => {
                        const next = new Set(prev);
                        next.add(card.id);
                        return next;
                      })
                    }
                  />
              ) : (
                <div className={styles.cardPlaceholder}>{card.title}</div>
              )}
              </div>
              <div className={styles.cardOverlay}>
                <div className={styles.cardActions}>
                  <div className={styles.cardUser}>
                    <div className={styles.userAvatar}>
                      {card.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.avatarUrl}
                          alt={card.user}
                          className={styles.userAvatarImg}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        card.user.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{card.user}</span>
                      <span className={styles.userTime}>{card.timeAgo}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`${styles.likeButton} ${likedIds.has(card.id) ? styles.likeButtonActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleLike(card);
                    }}
                    aria-label="Like"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{formatCompactNumber(localLikes[card.id] ?? card.likeCount)}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* In-Feed CTA 1 */}
          <div className={styles.ctaCard} onClick={() => (window.location.href = '/design-preview')}>
            <div className={styles.ctaIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 className={styles.ctaTitle}>Your Turn to Shine</h3>
            <p className={styles.ctaText}>
              Join 50,000+ creators building epic car renders. Your masterpiece awaits!
            </p>
            <Link href="/design-preview" className={styles.ctaBtn}>
              Create Magic Now
            </Link>
          </div>

          {/* In-Feed CTA 2 */}
          <div className={styles.ctaCard} onClick={() => (window.location.href = '/pricing')}>
            <div className={styles.ctaIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                <circle cx="12" cy="8" r="2" />
                <circle cx="12" cy="16" r="2" />
              </svg>
            </div>
            <h3 className={styles.ctaTitle}>Unleash Pro Power</h3>
            <p className={styles.ctaText}>
              Unlimited renders, exclusive styles, priority generation. Join the elite creators!
            </p>
            <Link href="/pricing" className={styles.ctaBtn}>
              Upgrade Now
            </Link>
          </div>
        </div>

        <div className={styles.loadingIndicator}>
          <div className={styles.loader}></div>
        </div>

        <div className={styles.bottomDock} role="tablist" aria-label="Community view">
          <div className={styles.viewToggle}>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'feed'}
              className={`${styles.viewToggleButton} ${view === 'feed' ? styles.viewToggleActive : ''}`}
              onClick={() => setView('feed')}
            >
              <svg
                className={styles.viewToggleIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span className={styles.viewToggleText}>Feed</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'search'}
              className={`${styles.viewToggleButton} ${view === 'search' ? styles.viewToggleActive : ''}`}
              onClick={() => setView('search')}
            >
              <svg
                className={styles.viewToggleIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span className={styles.viewToggleText}>Search</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'profileShare'}
              className={`${styles.viewToggleButton} ${view === 'profileShare' ? styles.viewToggleActive : ''}`}
              onClick={() => setView('profileShare')}
            >
              <svg
                className={styles.viewToggleIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="3" />
                <path d="M18 8v6" />
                <path d="M21 11h-6" />
              </svg>
              <span className={styles.viewToggleText}>Profile &amp; Share</span>
            </button>
          </div>
        </div>
      </main>

      {isModalOpen && selectedCard ? (
        <div className={`${styles.modalOverlay} ${isModalOpen ? styles.active : ''}`} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalImageContainer}>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className={styles.modalImage}>
                {selectedCard.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedCard.imageUrl}
                    alt={selectedCard.title}
                    className={styles.modalImg}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImageIds((prev) => {
                        const next = new Set(prev);
                        next.add(selectedCard.id);
                        return next;
                      })
                    }
                  />
                ) : (
                  <span>{selectedCard.title}</span>
                )}
              </div>
            </div>
            <div className={styles.modalSidebar}>
              <div className={styles.modalUser}>
                <div className={styles.modalAvatar}>
                  {selectedCard.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedCard.avatarUrl}
                      alt={selectedCard.user}
                      className={styles.modalAvatarImg}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    selectedCard.user.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className={styles.modalUserInfo}>
                  <h3>{selectedCard.user}</h3>
                  <p>Community</p>
                </div>
              </div>

              <div className={styles.modalSection}>
                <span className={styles.modalSectionTitle}>Tags</span>
                <div className={styles.modalTags}>
                  {selectedCard.tags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className={styles.modalTag}>
                        {tag}
                      </span>
                    ))}
                </div>
              </div>

              <div className={styles.modalStats}>
                <div className={styles.modalStat}>
                  <span className={styles.modalStatValue}>{formatCompactNumber(selectedCard.likeCount)}</span>
                  <span className={styles.modalStatLabel}>Likes</span>
                </div>
                <div className={styles.modalStat}>
                  <span className={styles.modalStatValue}>{selectedCard.timeAgo || '—'}</span>
                  <span className={styles.modalStatLabel}>Posted</span>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.modalBtnSecondary} onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </>
  );
}
