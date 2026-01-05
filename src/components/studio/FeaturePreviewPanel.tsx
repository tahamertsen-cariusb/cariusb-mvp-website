'use client';

import styles from './FeaturePreviewPanel.module.css';

interface FeaturePreview {
  id: string;
  label: string;
  imageUrl?: string;
  instruction?: string;
}

interface FeaturePreviewPanelProps {
  features: FeaturePreview[];
}

export default function FeaturePreviewPanel({ features }: FeaturePreviewPanelProps) {
  // Sadece imageUrl veya instruction olan feature'ları göster
  const previewFeatures = features.filter(
    (f) => f.imageUrl || f.instruction
  );

  if (previewFeatures.length === 0) return null;

  return (
    <div className={styles.previewPanel}>
      {previewFeatures.map((feature) => (
        <div key={feature.id} className={styles.previewItem}>
          <div className={styles.previewLabel}>{feature.label}</div>
          {feature.imageUrl ? (
            <div className={styles.previewImageWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feature.imageUrl}
                alt={feature.label}
                className={styles.previewImage}
              />
            </div>
          ) : feature.instruction ? (
            <div className={styles.previewText}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span className={styles.previewTextContent}>{feature.instruction}</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

