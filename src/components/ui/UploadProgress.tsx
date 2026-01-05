'use client';

import styles from './UploadProgress.module.css';

interface UploadProgressProps {
  isVisible: boolean;
  progress: number;
  message?: string;
}

export default function UploadProgress({ isVisible, progress, message = 'Yükleniyor...' }: UploadProgressProps) {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 className={styles.title}>{message}</h3>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

