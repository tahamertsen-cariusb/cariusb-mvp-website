import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main-content" className={styles.main}>
        <section className={styles.card} aria-label="Page not found">
          <div className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2Z" />
              <circle cx="7.5" cy="14" r="1.5" />
              <circle cx="16.5" cy="14" r="1.5" />
            </svg>
          </div>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>Page not found</h1>
          <p className={styles.subtitle}>The page you’re looking for doesn’t exist or may have moved.</p>
          <div className={styles.actions}>
            <Link href="/" className={styles.primary}>
              Go home
            </Link>
            <Link href="/features" className={styles.secondary}>
              Explore features
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

