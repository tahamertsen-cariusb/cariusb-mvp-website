'use client';

import styles from './ActionButtons.module.css';

interface ActionButtonsProps {
  isVisible: boolean;
  isDisabled: boolean;
  onDownload: () => void;
  onShare: () => void;
}

export default function ActionButtons({ isVisible, isDisabled, onDownload, onShare }: ActionButtonsProps) {
  return (
    <div className={`${styles.actionButtons} ${isVisible ? styles.visible : ''} ${isDisabled ? styles.disabled : ''}`}>
      <button
        type="button"
        className={styles.actionBtn}
        title={isDisabled ? 'Önce bir sonuç üret' : 'Download'}
        aria-label={isDisabled ? 'Download disabled - Generate a result first' : 'Download generated image'}
        onClick={onDownload}
        disabled={isDisabled}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
      <button
        type="button"
        className={styles.actionBtn}
        title={isDisabled ? 'Önce bir sonuç üret' : 'Share'}
        aria-label={isDisabled ? 'Share disabled - Generate a result first' : 'Share generated image'}
        onClick={onShare}
        disabled={isDisabled}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
    </div>
  );
}

