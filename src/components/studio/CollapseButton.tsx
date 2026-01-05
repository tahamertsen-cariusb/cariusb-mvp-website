'use client';

import styles from './CollapseButton.module.css';

interface CollapseButtonProps {
  isCollapsed: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export default function CollapseButton({ isCollapsed, isVisible, onToggle }: CollapseButtonProps) {
  return (
    <button
      className={`${styles.collapseButton} ${isVisible ? styles.visible : ''} ${isCollapsed ? styles.active : ''}`}
      onClick={onToggle}
      title={isCollapsed ? 'Show Toolbar' : 'Collapse Toolbar'}
    >
      {isCollapsed ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
      )}
    </button>
  );
}

