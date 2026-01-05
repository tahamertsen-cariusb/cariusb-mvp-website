import Link from 'next/link';
import styles from './FinalCTA.module.css';

export function FinalCTA() {
  return (
    <section className={styles.finalCtaSection}>
      <h2 className={styles.finalTitle}>
        Your Garage is <span className={styles.highlight}>Waiting.</span>
      </h2>
      <p className={styles.finalSubtitle}>
        Join thousands of creators already transforming their cars with AI.
      </p>
      <Link href="/design-preview" className={styles.finalBtn}>
        Start Creating
      </Link>
    </section>
  );
}

