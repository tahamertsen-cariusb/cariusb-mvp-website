'use client';

import styles from './ControlPanel.module.css';

export type ToolbarItemState = 'normal' | 'active' | 'completed' | 'locked';

interface ToolbarItem {
  id: string;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
  state?: ToolbarItemState;
  onClick?: () => void;
  shortcut?: string;
}

interface ControlPanelProps {
  mode: 'photo' | 'video';
  isCollapsed: boolean;
  items: ToolbarItem[];
  onItemClick: (itemId: string) => void;
}

export default function ControlPanel({ mode, isCollapsed, items, onItemClick }: ControlPanelProps) {
  const photoItems: ToolbarItem[] = [
    {
      id: 'paint',
      label: 'Color',
      tooltip: 'Change car color - Upload a reference photo or describe with text',
      shortcut: 'P',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Spray can */}
          <path d="M9 4h6"></path>
          <path d="M10 4v2"></path>
          <path d="M14 4v2"></path>
          <path d="M9 8h6"></path>
          <path d="M8.5 8h7A2.5 2.5 0 0 1 18 10.5V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7.5A3.5 3.5 0 0 1 8.5 8z"></path>
          <path d="M16.5 11.5h2"></path>
          <path d="M17.2 10.6l1.4-.8"></path>
          <path d="M17.2 12.4l1.4.8"></path>
          <circle cx="20.5" cy="11.5" r="0.6" fill="currentColor" stroke="none"></circle>
          <circle cx="21.5" cy="10.2" r="0.55" fill="currentColor" stroke="none"></circle>
          <circle cx="21.5" cy="12.8" r="0.55" fill="currentColor" stroke="none"></circle>
        </svg>
      )
    },
    {
      id: 'bodykit',
      label: 'Bodykit',
      tooltip: 'Modify body style - Upload reference photo or describe with text',
      shortcut: 'B',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H12c-.6 0-1.2.2-1.7.5L3 14v1c0 .6.4 1 1 1h1"></path>
          <circle cx="6.5" cy="17.5" r="2.5"></circle>
          <circle cx="17.5" cy="17.5" r="2.5"></circle>
        </svg>
      )
    },
    {
      id: 'rims',
      label: 'Rims',
      tooltip: 'Change wheel design - Upload a reference photo of your desired rims',
      shortcut: 'R',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Rim / wheel */}
          <circle cx="12" cy="12" r="9"></circle>
          <circle cx="12" cy="12" r="2.2"></circle>
          <path d="M12 4.2v5"></path>
          <path d="M12 14.8v5"></path>
          <path d="M4.2 12h5"></path>
          <path d="M14.8 12h5"></path>
          <path d="M6.2 6.2l3.5 3.5"></path>
          <path d="M14.3 14.3l3.5 3.5"></path>
          <path d="M17.8 6.2l-3.5 3.5"></path>
          <path d="M9.7 14.3l-3.5 3.5"></path>
          <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none"></circle>
        </svg>
      )
    },
    {
      id: 'height',
      label: 'Height',
      tooltip: 'Adjust ride height - Choose from extra-low to extra-high',
      shortcut: 'H',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Suspension / ride height */}
          <path d="M8 4h8"></path>
          <path d="M10.5 4v3"></path>
          <path d="M13.5 4v3"></path>
          <path d="M9.5 7.5c1-1 4-1 5 0"></path>
          <path d="M9.5 9.5c1-1 4-1 5 0"></path>
          <path d="M9.5 11.5c1-1 4-1 5 0"></path>
          <path d="M9.5 13.5c1-1 4-1 5 0"></path>
          <path d="M10.5 14.5v2.5"></path>
          <path d="M13.5 14.5v2.5"></path>
          <path d="M8 18h8"></path>
          <path d="M6.5 8.5v7"></path>
          <path d="M6.5 6.8 5.5 7.8"></path>
          <path d="M6.5 6.8 7.5 7.8"></path>
          <path d="M6.5 17.2 5.5 16.2"></path>
          <path d="M6.5 17.2 7.5 16.2"></path>
        </svg>
      )
    },
    {
      id: 'livery',
      label: 'Livery',
      tooltip: 'Apply custom livery - Upload a reference photo of your design',
      shortcut: 'L',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Vinyl wrap / decal */}
          <path d="M7 3h8l2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
          <path d="M15 3v4h4"></path>
          <path d="M7.5 9.5l9-3"></path>
          <path d="M7.5 13l9-3"></path>
          <path d="M7.5 16.5l6-2"></path>
          <path d="M13.8 15.7l2.3 2.3"></path>
          <path d="M16.1 15.7l-2.3 2.3"></path>
        </svg>
      )
    },
    {
      id: 'window',
      label: 'Window',
      tooltip: 'Set window tint - Adjust darkness level from light to dark',
      shortcut: 'W',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      )
    },
    {
      id: 'background',
      label: 'Background',
      tooltip: 'Change background scene - Describe your desired environment',
      shortcut: 'G',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      )
    },
    {
      id: 'addPerson',
      label: 'Add Person',
      tooltip: 'Add person to scene - Describe or upload reference photo',
      shortcut: 'A',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      )
    },
    {
      id: 'multicar',
      label: 'Add Car',
      tooltip: 'Add another vehicle - Upload reference photos of additional cars',
      shortcut: 'M',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Two cars side-by-side */}
          <path d="M3.5 13.5h7.5a1.5 1.5 0 0 0 1.5-1.5v-1.2c0-.6-.3-1.1-.8-1.4l-1.3-.8-1.2-2.1A2 2 0 0 0 7.5 5.5H5.3a2 2 0 0 0-1.8 1.1L2.6 8.7c-.4.7-.6 1.4-.6 2.2v1.1a1.5 1.5 0 0 0 1.5 1.5z"></path>
          <circle cx="4.8" cy="14.8" r="1.2"></circle>
          <circle cx="9.4" cy="14.8" r="1.2"></circle>
          <path d="M13 13.5h7.5a1.5 1.5 0 0 0 1.5-1.5v-1.2c0-.6-.3-1.1-.8-1.4l-1.3-.8-1.2-2.1a2 2 0 0 0-1.7-1h-2.2a2 2 0 0 0-1.8 1.1l-.9 2.1c-.4.7-.6 1.4-.6 2.2v1.1a1.5 1.5 0 0 0 1.5 1.5z"></path>
          <circle cx="14.3" cy="14.8" r="1.2"></circle>
          <circle cx="18.9" cy="14.8" r="1.2"></circle>
        </svg>
      )
    }
  ];

  const videoItems: ToolbarItem[] = [
    {
      id: 'videoPrompt',
      label: 'Prompt',
      tooltip: 'Describe your video',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      id: 'videoDuration',
      label: 'Duration',
      tooltip: 'Set video length',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      id: 'videoScale',
      label: 'Scale',
      tooltip: 'Choose resolution',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8"></path>
          <path d="M3 16.2V21m0 0h4.8M3 21l6-6"></path>
          <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"></path>
          <path d="M3 7.8V3m0 0h4.8M3 3l6 6"></path>
        </svg>
      )
    },
    {
      id: 'videoQuality',
      label: 'Quality',
      tooltip: 'Set render quality',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path>
        </svg>
      )
    },
    {
      id: 'storyboard',
      label: 'Storyboard',
      tooltip: 'Coming Soon',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      state: 'locked'
    }
  ];

  const currentItems = mode === 'photo' ? photoItems : videoItems;
  const displayItems = items.length > 0 
    ? items.map(item => {
        const baseItem = currentItems.find(ci => ci.id === item.id);
        return {
          ...item,
          icon: item.icon || baseItem?.icon,
          tooltip: item.tooltip || baseItem?.tooltip || '',
        };
      })
    : currentItems;

  return (
    <div className={`controlPanel ${styles.controlPanel} ${isCollapsed ? styles.collapsed : ''} ${mode === 'video' ? styles.videoToolbar : ''}`}>
      {displayItems.map((item) => {
        const itemState = item.state || 'normal';
        const isLocked = itemState === 'locked';
        
        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onItemClick(item.id);
          }
        };

        return (
          <button
            key={item.id}
            type="button"
            disabled={isLocked}
            className={`${styles.toolbarItem} ${styles[itemState]} ${isLocked ? styles.locked : ''}`}
            title={item.shortcut ? `${item.tooltip} (${item.shortcut})` : item.tooltip}
            aria-label={item.shortcut ? `${item.label}: ${item.tooltip} (Shortcut: ${item.shortcut})` : `${item.label}: ${item.tooltip}`}
            aria-disabled={isLocked}
            onClick={() => !isLocked && onItemClick(item.id)}
            onKeyDown={handleKeyDown}
          >
            <div className={styles.iconBox}>
              {item.icon}
            </div>
            <span className={styles.toolbarLabel}>{item.label}</span>
            {itemState === 'completed' && (
              <div className={styles.completedBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
            {isLocked && (
              <div className={styles.lockedBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z"/>
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

