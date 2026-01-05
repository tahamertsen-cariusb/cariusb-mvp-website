'use client';

import styles from './BeforeAfterToggle.module.css';

interface BeforeAfterToggleProps {
  isVisible: boolean;
  isDisabled: boolean;
  currentView: 'before' | 'after';
  onViewChange: (view: 'before' | 'after') => void;
}

export default function BeforeAfterToggle({ isVisible, isDisabled, currentView, onViewChange }: BeforeAfterToggleProps) {
  return (
    <div className={`${styles.beforeAfterToggle} ${isVisible ? styles.visible : ''} ${isDisabled ? styles.disabled : ''}`}>
      <button
        type="button"
        className={`${styles.toggleBtn} ${currentView === 'before' ? styles.active : ''}`}
        onClick={() => !isDisabled && onViewChange('before')}
        data-view="before"
        disabled={isDisabled}
      >
        Before
      </button>
      <button
        type="button"
        className={`${styles.toggleBtn} ${currentView === 'after' ? styles.active : ''}`}
        onClick={() => !isDisabled && onViewChange('after')}
        data-view="after"
        disabled={isDisabled}
      >
        After
      </button>
    </div>
  );
}

