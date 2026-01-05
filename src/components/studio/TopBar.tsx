'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCreditsShort } from '@/lib/credits/calculator';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import styles from './TopBar.module.css';

type ResolutionPreset = '1K' | '2K' | '4K';
type AspectRatioPreset = 'auto' | 'instagram_post' | 'instagram_story' | 'marketplace_website';

interface TopBarProps {
  currentMode: 'photo' | 'video';
  onModeChange: (mode: 'photo' | 'video') => void;
  disablePhotoSwitch?: boolean;
  videoScaleValue?: string;
  videoQualityValue?: string;
  onVideoScaleChange?: (value: '1:1' | '16:9' | '9:16') => void;
  onVideoQualityChange?: (value: 'draft' | 'standard' | 'high') => void;
  disableVideoControls?: boolean;
  resolutionPreset?: ResolutionPreset;
  onResolutionChange?: (preset: ResolutionPreset) => void;
  aspectRatioPreset?: AspectRatioPreset;
  onAspectRatioChange?: (preset: AspectRatioPreset) => void;
  credits?: number;
}

export default function TopBar({
  currentMode,
  onModeChange,
  disablePhotoSwitch = false,
  videoScaleValue = '',
  videoQualityValue = '',
  onVideoScaleChange,
  onVideoQualityChange,
  disableVideoControls = false,
  resolutionPreset = '1K',
  onResolutionChange,
  aspectRatioPreset = 'auto',
  onAspectRatioChange,
  credits = 1200,
}: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isResolutionOpen, setIsResolutionOpen] = useState(false);
  const [isAspectOpen, setIsAspectOpen] = useState(false);
  const [isVideoScaleOpen, setIsVideoScaleOpen] = useState(false);
  const [isVideoQualityOpen, setIsVideoQualityOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const resolutionRef = useRef<HTMLDivElement>(null);
  const aspectRef = useRef<HTMLDivElement>(null);
  const videoScaleRef = useRef<HTMLDivElement>(null);
  const videoQualityRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout: logoutStore } = useAuthStore();

  const aspectLabel = useMemo(() => {
    switch (aspectRatioPreset) {
      case 'auto':
        return 'Auto';
      case 'instagram_post':
        return '1:1';
      case 'instagram_story':
        return '9:16';
      case 'marketplace_website':
        return '16:9';
      default:
        return 'Auto';
    }
  }, [aspectRatioPreset]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (resolutionRef.current && !resolutionRef.current.contains(target)) {
        setIsResolutionOpen(false);
      }
      if (aspectRef.current && !aspectRef.current.contains(target)) {
        setIsAspectOpen(false);
      }
      if (videoScaleRef.current && !videoScaleRef.current.contains(target)) {
        setIsVideoScaleOpen(false);
      }
      if (videoQualityRef.current && !videoQualityRef.current.contains(target)) {
        setIsVideoQualityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const qualityLabel = useMemo(() => {
    switch (videoQualityValue) {
      case 'draft':
        return 'Draft';
      case 'standard':
        return 'Standard';
      case 'high':
        return 'High';
      default:
        return videoQualityValue || 'Select';
    }
  }, [videoQualityValue]);

  const handleLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    logoutStore();
  };

  return (
    <div className={styles.topBar}>
      {/* Sol Kanat */}
      <div className={styles.topLeft}>
        <button 
          className={styles.exitBtn} 
          title="Exit to Dashboard"
          onClick={() => router.push('/dashboard')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
        <span>CARIUSB</span>
      </div>

      {/* Orta Merkez: Mode Toggle */}
      <div className={styles.topCenter}>
        <div className={styles.centerControls}>
          {currentMode === 'video' ? (
            <div className={styles.controlDropdown} ref={videoScaleRef}>
              <button
                type="button"
                className={styles.controlTrigger}
                onClick={() => {
                  setIsVideoScaleOpen((v) => !v);
                  setIsVideoQualityOpen(false);
                  setIsResolutionOpen(false);
                  setIsAspectOpen(false);
                }}
                disabled={disableVideoControls || !onVideoScaleChange}
                aria-haspopup="listbox"
                aria-expanded={isVideoScaleOpen}
              >
                <span className={styles.controlLabel}>Scale</span>
                <span className={styles.controlValue}>{videoScaleValue || 'Select'}</span>
                <svg
                  className={styles.caret}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                className={`${styles.controlMenu} ${isVideoScaleOpen ? styles.open : ''}`}
                role="listbox"
                aria-label="Scale"
              >
                {(['16:9', '9:16', '1:1'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.controlItem} ${videoScaleValue === value ? styles.selected : ''}`}
                    onClick={() => {
                      onVideoScaleChange?.(value);
                      setIsVideoScaleOpen(false);
                    }}
                    role="option"
                    aria-selected={videoScaleValue === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {currentMode === 'photo' ? (
            <div className={styles.controlDropdown} ref={resolutionRef}>
              <button
                type="button"
                className={styles.controlTrigger}
                onClick={() => {
                  setIsResolutionOpen((v) => !v);
                  setIsAspectOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={isResolutionOpen}
              >
                <span className={styles.controlLabel}>Resolution</span>
                <span className={styles.controlValue}>{resolutionPreset}</span>
                <svg
                  className={styles.caret}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                className={`${styles.controlMenu} ${isResolutionOpen ? styles.open : ''}`}
                role="listbox"
                aria-label="Resolution"
              >
                {(['1K', '2K', '4K'] as ResolutionPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`${styles.controlItem} ${
                      preset === resolutionPreset ? styles.selected : ''
                    }`}
                    onClick={() => {
                      onResolutionChange?.(preset);
                      setIsResolutionOpen(false);
                    }}
                    role="option"
                    aria-selected={preset === resolutionPreset}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.modeToggle}>
            <button 
              className={`${styles.modeBtn} ${currentMode === 'photo' ? styles.active : ''}`}
              onClick={() => onModeChange('photo')}
              data-mode="photo"
              disabled={disablePhotoSwitch}
            >
              Photo
            </button>
            <button 
              className={`${styles.modeBtn} ${currentMode === 'video' ? styles.active : ''}`}
              onClick={() => onModeChange('video')}
              data-mode="video"
            >
              Video
            </button>
          </div>

          {currentMode === 'video' ? (
            <div className={styles.controlDropdown} ref={videoQualityRef}>
              <button
                type="button"
                className={`${styles.controlTrigger} ${styles.aspectTrigger}`}
                onClick={() => {
                  setIsVideoQualityOpen((v) => !v);
                  setIsVideoScaleOpen(false);
                  setIsResolutionOpen(false);
                  setIsAspectOpen(false);
                }}
                disabled={disableVideoControls || !onVideoQualityChange}
                aria-haspopup="listbox"
                aria-expanded={isVideoQualityOpen}
              >
                <span className={styles.controlLabel}>Quality</span>
                <span className={styles.controlValue}>{qualityLabel}</span>
                <svg
                  className={styles.caret}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                className={`${styles.controlMenu} ${styles.aspectMenu} ${isVideoQualityOpen ? styles.open : ''}`}
                role="listbox"
                aria-label="Quality"
              >
                {(
                  [
                    { value: 'draft', name: 'Draft', desc: 'Fast, lower quality' },
                    { value: 'standard', name: 'Standard', desc: 'Balanced' },
                    { value: 'high', name: 'High', desc: 'Best quality' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.controlItem} ${videoQualityValue === option.value ? styles.selected : ''}`}
                    onClick={() => {
                      onVideoQualityChange?.(option.value);
                      setIsVideoQualityOpen(false);
                    }}
                    role="option"
                    aria-selected={videoQualityValue === option.value}
                  >
                    {option.name} <span className={styles.controlHint}>{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {currentMode === 'photo' ? (
            <div className={styles.controlDropdown} ref={aspectRef}>
              <button
                type="button"
                className={`${styles.controlTrigger} ${styles.aspectTrigger}`}
                onClick={() => {
                  setIsAspectOpen((v) => !v);
                  setIsResolutionOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={isAspectOpen}
              >
                <span className={styles.controlLabel}>Aspect Ratio</span>
                <span className={styles.controlValue}>{aspectLabel}</span>
                <svg
                  className={styles.caret}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                className={`${styles.controlMenu} ${styles.aspectMenu} ${isAspectOpen ? styles.open : ''}`}
                role="listbox"
                aria-label="Aspect Ratio"
              >
                <button
                  type="button"
                  className={`${styles.controlItem} ${
                    aspectRatioPreset === 'auto' ? styles.selected : ''
                  }`}
                  onClick={() => {
                    onAspectRatioChange?.('auto');
                    setIsAspectOpen(false);
                  }}
                  role="option"
                  aria-selected={aspectRatioPreset === 'auto'}
                >
                  Auto <span className={styles.controlHint}>(match input)</span>
                </button>
                <button
                  type="button"
                  className={`${styles.controlItem} ${
                    aspectRatioPreset === 'instagram_post' ? styles.selected : ''
                  }`}
                  onClick={() => {
                    onAspectRatioChange?.('instagram_post');
                    setIsAspectOpen(false);
                  }}
                  role="option"
                  aria-selected={aspectRatioPreset === 'instagram_post'}
                >
                  Instagram Post <span className={styles.controlHint}>(1:1)</span>
                </button>
                <button
                  type="button"
                  className={`${styles.controlItem} ${
                    aspectRatioPreset === 'instagram_story' ? styles.selected : ''
                  }`}
                  onClick={() => {
                    onAspectRatioChange?.('instagram_story');
                    setIsAspectOpen(false);
                  }}
                  role="option"
                  aria-selected={aspectRatioPreset === 'instagram_story'}
                >
                  Instagram Story <span className={styles.controlHint}>(9:16)</span>
                </button>
                <button
                  type="button"
                  className={`${styles.controlItem} ${
                    aspectRatioPreset === 'marketplace_website' ? styles.selected : ''
                  }`}
                  onClick={() => {
                    onAspectRatioChange?.('marketplace_website');
                    setIsAspectOpen(false);
                  }}
                  role="option"
                  aria-selected={aspectRatioPreset === 'marketplace_website'}
                >
                  Marketplace / Website <span className={styles.controlHint}>(16:9)</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sağ Kanat */}
      <div className={styles.topRight}>
        <div className={styles.glassPill}>
          <span>{formatCreditsShort(credits)} Credits</span>
        </div>
        <div className={styles.profileIcon} ref={profileRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)}>A</button>
          {/* Profile Dropdown */}
          <div className={`${styles.profileDropdown} ${isProfileOpen ? styles.open : ''}`}>
            <Link href="/profile" className={styles.profileDropdownItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </Link>
            <Link href="/settings" className={styles.profileDropdownItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Settings
            </Link>
            <Link href="/billing" className={styles.profileDropdownItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Billing
            </Link>
            <div className={styles.profileDropdownDivider}></div>
            <button className={`${styles.profileDropdownItem} ${styles.danger}`} onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

