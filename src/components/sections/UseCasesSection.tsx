import styles from './UseCasesSection.module.css';

const useCases = [
  {
    icon: 'creators',
    title: 'For Creators',
    description: 'Create scroll-stopping content for TikTok, Reels, and YouTube. Generate viral car transformations that break engagement records.',
  },
  {
    icon: 'enthusiasts',
    title: 'For Enthusiasts',
    description: "Visualize your dream build before spending a dime. Create the perfect wallpaper featuring your car in any configuration imaginable.",
  },
  {
    icon: 'shops',
    title: 'For Mod Shops',
    description: 'Show customers their car with new wheels or a widebody kit before they commit. Close more deals with powerful visualization.',
  },
];

export function UseCasesSection() {
  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'creators':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        );
      case 'enthusiasts':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      case 'shops':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className={styles.usecasesSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionBadge}>Use Cases</span>
        <h2 className={styles.sectionTitle}>
          Built for <span className={styles.highlight}>Everyone</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Whether you&apos;re a content creator, car enthusiast, or business owner.
        </p>
      </div>

      <div className={styles.usecasesGrid}>
        {useCases.map((useCase) => (
          <div key={useCase.icon} className={styles.usecaseCard}>
            <div className={styles.usecaseIcon}>
              {renderIcon(useCase.icon)}
            </div>
            <h3 className={styles.usecaseTitle}>{useCase.title}</h3>
            <p className={styles.usecaseDescription}>{useCase.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

