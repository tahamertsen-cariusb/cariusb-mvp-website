import Link from 'next/link';
import styles from './GallerySection.module.css';

type GalleryPost = {
  id: string;
  image_url: string | null;
  tags: string | string[] | null;
  user_community_name: string | null;
};

type GalleryItem = {
  id: string;
  title: string;
  imageUrl: string | null;
};

const fallbackItems = [
  'Porsche GT3 RS',
  'Nissan R34 Skyline',
  'Ferrari 488 Pista',
  'Toyota Supra MK4',
  'Lamborghini Aventador',
  'BMW M3 GTR',
];

const normalizeTags = (tags: GalleryPost['tags']): string => {
  if (!tags) return '';
  if (Array.isArray(tags)) return tags.join(',');
  return tags;
};

const deriveTitle = (tags: string, userName: string | null): string => {
  const list = tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (list.length > 0) return list.slice(0, 2).join(' • ');
  if (userName && userName.trim().length > 0) return userName.trim();
  return 'Community Render';
};

export function GallerySection({ posts = [] }: { posts?: GalleryPost[] }) {
  const mappedItems: GalleryItem[] = (posts || [])
    .map((post) => {
      const tags = normalizeTags(post.tags);
      const imageUrl =
        post.image_url && post.image_url !== 'null' && post.image_url !== 'undefined'
          ? post.image_url
          : null;
      return {
        id: post.id,
        title: deriveTitle(tags, post.user_community_name),
        imageUrl,
      };
    })
    .filter((item) => item.imageUrl);

  const displayItems =
    mappedItems.length > 0
      ? mappedItems
      : fallbackItems.map((title, index) => ({
          id: `fallback-${index}`,
          title,
          imageUrl: null,
        }));

  // Duplicate items for seamless loop
  const allItems = [...displayItems, ...displayItems];

  return (
    <section className={styles.gallerySection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionBadge}>Gallery</span>
        <h2 className={styles.sectionTitle}>
          Made with <span className={styles.highlight}>CARI</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Join thousands of creators transforming their car photos into art.
        </p>
        <div className={styles.galleryCta}>
          <Link href="/community" className={styles.galleryCtaLink}>
            View Community
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>

      <div className={styles.marqueeContainer}>
        <div className={styles.marqueeTrack}>
          {allItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className={styles.marqueeItem}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className={styles.marqueeImage}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className={styles.marqueePlaceholder}>{item.title}</span>
              )}
              {item.title ? <span className={styles.marqueeTitle}>{item.title}</span> : null}
              <span className={styles.marqueeBadge}>Made with CARI</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

