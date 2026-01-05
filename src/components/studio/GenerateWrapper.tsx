'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCreditsShort } from '@/lib/credits/calculator';
import styles from './GenerateWrapper.module.css';

interface GenerateWrapperProps {
  isVisible: boolean;
  showGenerate?: boolean;
  isGenerateDisabled?: boolean;
  onGenerate: () => void;
  onUpscale?: () => void;
  showUpscale?: boolean;
  resolution?: '1K' | '2K' | '4K';
  onResolutionChange?: (resolution: '1K' | '2K' | '4K') => void;
  creditCost?: number; // ROI dahil kredi maliyeti
}

export default function GenerateWrapper({ 
  isVisible, 
  showGenerate = true,
  isGenerateDisabled = false,
  onGenerate, 
  onUpscale, 
  showUpscale = false,
  resolution = '1K',
  onResolutionChange,
  creditCost
}: GenerateWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpscaleLoading, setIsUpscaleLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [model, setModel] = useState('fast');
  const [outputSize, setOutputSize] = useState('1536');
  const [creativity, setCreativity] = useState(50);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const settingsIconRef = useRef<HTMLSpanElement>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout>();
  const [isGenerateHintVisible, setIsGenerateHintVisible] = useState(false);
  const [isGenerateHintPinned, setIsGenerateHintPinned] = useState(false);

  const handleGenerate = () => {
    setIsLoading(true);
    onGenerate();
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleUpscale = () => {
    if (onUpscale) {
      setIsUpscaleLoading(true);
      onUpscale();
      setTimeout(() => setIsUpscaleLoading(false), 2000);
    }
  };

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (settingsPanelRef.current?.contains(target)) return;
      if (settingsIconRef.current?.contains(target)) return;

      setIsSettingsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!isVisible || !showGenerate) {
      setIsGenerateHintVisible(false);
      setIsGenerateHintPinned(false);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      return;
    }

    setIsGenerateHintVisible(true);
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => {
      if (!isGenerateHintPinned) setIsGenerateHintVisible(false);
    }, 2500);

    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [isVisible, showGenerate, isGenerateHintPinned]);

  const isOnlyUpscale = !showGenerate && showUpscale;

  return (
    <div
      className={`generateWrapper ${styles.generateWrapper} ${isVisible ? styles.visible : ''}`}
      style={{ zIndex: 99 }}
    >
      {/* Generate Actions Row */}
      <div
        className={`${styles.generateActions} ${showGenerate && showUpscale ? styles.withUpscale : ''}`}
        style={isOnlyUpscale ? { transform: 'translateX(-50%)' } : undefined}
      >
        {showGenerate ? (
          <div
            className={styles.generateButtonWrap}
            onMouseEnter={() => {
              setIsGenerateHintPinned(true);
              setIsGenerateHintVisible(true);
              if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
            }}
            onMouseLeave={() => {
              setIsGenerateHintPinned(false);
              setIsGenerateHintVisible(false);
            }}
          >
            <div className={`${styles.generateHint} ${isGenerateHintVisible ? styles.visible : ''}`}>
              Click Generate to render
            </div>
            <button
              type="button"
              className={`${styles.toolbarGenerate} ${isLoading ? styles.loading : ''}`}
              onClick={handleGenerate}
              disabled={isLoading || isGenerateDisabled}
              title={isGenerateDisabled ? 'Select features to generate' : undefined}
            >
              <span className={styles.btnText}>
                Generate
                {creditCost !== undefined && creditCost > 0 && (
                  <>
                    <span className={styles.creditSeparator}>|</span>
                    <span className={styles.creditCost}>{formatCreditsShort(creditCost)}</span>
                  </>
                )}
              </span>
              <svg
                className={styles.btnStar}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
              </svg>
              <div className={styles.spinner}></div>
            </button>
          </div>
        ) : null}

        {/* Upscale Button */}
        <button
          type="button"
          className={`${styles.upscaleButton} ${showUpscale ? styles.visible : ''} ${isUpscaleLoading ? styles.loading : ''}`}
          onClick={handleUpscale}
          disabled={isUpscaleLoading || !showUpscale || !onUpscale}
        >
          <span className={styles.btnText}>Upscale</span>
          <svg className={styles.btnText} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
          <div className={styles.spinner}></div>
        </button>
      </div>

      {/* Settings Panel */}
      <div ref={settingsPanelRef} className={`${styles.settingsPanel} ${isSettingsOpen ? styles.open : ''}`}>
        <div className={styles.settingsHeader}>
          <span>Generation Settings</span>
          <button type="button" className={styles.settingsClose} onClick={() => setIsSettingsOpen(false)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className={styles.settingsContent}>
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Model</label>
            <div className={styles.settingOptions}>
              {['fast', 'balanced', 'quality'].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.settingOption} ${model === value ? styles.selected : ''}`}
                  onClick={() => setModel(value)}
                  data-value={value}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Resolution</label>
            <div className={styles.settingOptions}>
              {(['1K', '2K', '4K'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.settingOption} ${resolution === value ? styles.selected : ''}`}
                  onClick={() => onResolutionChange?.(value)}
                  data-value={value}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Output Size</label>
            <div className={styles.settingOptions}>
              {['1024', '1536', '2048'].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.settingOption} ${outputSize === value ? styles.selected : ''}`}
                  onClick={() => setOutputSize(value)}
                  data-value={value}
                >
                  {value}px
                </button>
              ))}
            </div>
          </div>
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Creativity</label>
            <div className={styles.settingSlider}>
              <input
                type="range"
                className={styles.creativitySlider}
                min="0"
                max="100"
                value={creativity}
                onChange={(e) => setCreativity(Number(e.target.value))}
              />
              <span className={styles.sliderVal}>{creativity}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
