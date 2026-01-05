'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './WowShowcase.module.css';

const features = [
  { icon: 'paint', label: 'Paint' },
  { icon: 'rims', label: 'Rims' },
  { icon: 'bodykit', label: 'Bodykit' },
  { icon: 'background', label: 'Background' },
  { icon: 'video', label: 'AI Video' },
];

export function WowShowcase() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoSlideDirection = useRef<1 | -1>(1);
  const lastInteractionAt = useRef<number>(Date.now());

  const updateSlider = (clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    let percentage = ((clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    if (isDragging || isHoveringSlider) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

    const startDelayMs = 1200;
    const tickMs = 50;
    const step = 0.25;
    const min = 40;
    const max = 60;

    let intervalId: number | null = null;

    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        if (Date.now() - lastInteractionAt.current < startDelayMs) return;

        setSliderPosition((prev) => {
          let next = prev + autoSlideDirection.current * step;
          if (next >= max) {
            next = max;
            autoSlideDirection.current = -1;
          } else if (next <= min) {
            next = min;
            autoSlideDirection.current = 1;
          }
          return next;
        });
      }, tickMs);
    }, startDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [isDragging, isHoveringSlider]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSlider(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      lastInteractionAt.current = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        updateSlider(e.touches[0].clientX);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastInteractionAt.current = Date.now();
    updateSlider(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    lastInteractionAt.current = Date.now();
    updateSlider(e.touches[0].clientX);
  };

  const renderFeatureIcon = (icon: string) => {
    switch (icon) {
      case 'paint':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        );
      case 'rims':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
        );
      case 'bodykit':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        );
      case 'background':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        );
      case 'video':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className={styles.wowSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionBadge}>The Magic</span>
        <h2 className={styles.sectionTitle}>
          See the <span className={styles.highlight}>Transformation</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Photo editing meets AI video generation. Two powerful modes, one creative studio.
        </p>
      </div>

      {/* Feature Icons Row */}
      <div className={styles.featureIconsRow}>
        {features.map((feature) => (
          <div key={feature.icon} className={styles.featureIconItem}>
            {renderFeatureIcon(feature.icon)}
            <span>{feature.label}</span>
          </div>
        ))}
      </div>

      {/* Showcase Grid */}
      <div className={styles.wowShowcase}>
        {/* Left: Phone with AI Video */}
        <div className={styles.phoneMockup}>
          <div className={styles.phoneFrame}>
            <div className={styles.phoneNotch}></div>
            <div className={styles.phoneScreen}>
              <video
                className={styles.phoneVideo}
                src="https://media-gateway-cariusb.tahamertsen.workers.dev/image/cloudflareupload/final.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
            <div className={styles.phoneLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
              Video Mode
            </div>
          </div>
        </div>

        {/* Right: Before/After Slider */}
        <div 
          ref={sliderRef}
          className={styles.sliderContainer}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onMouseEnter={() => setIsHoveringSlider(true)}
          onMouseLeave={() => setIsHoveringSlider(false)}
        >
          {/* After Image - Background Layer (Full Width) */}
          <div className={`${styles.sliderImage} ${styles.after}`}>
            <img 
              src="https://zhfoygasvpjtsngebahn.supabase.co/storage/v1/object/public/website-items/image.png"
              alt="After"
              className={styles.sliderImageContent}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
          {/* Before Image - Foreground Layer (Clipped with clip-path) */}
          <div 
            className={`${styles.sliderImage} ${styles.before}`}
            style={{ 
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
            }}
          >
            <img 
              src="https://zhfoygasvpjtsngebahn.supabase.co/storage/v1/object/public/website-items/ChatGPT%20Image%204%20Oca%202026%2010_54_21.png"
              alt="Before"
              className={styles.sliderImageContent}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
          <div 
            className={styles.sliderHandle}
            style={{ left: `${sliderPosition}%` }}
          >
            <div className={styles.sliderArrows}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
          <span className={`${styles.sliderLabel} ${styles.beforeLabel}`}>Before</span>
          <span className={`${styles.sliderLabel} ${styles.afterLabel}`}>After</span>
        </div>
      </div>

      <div className={styles.featuresCta}>
        <Link href="/features" className={styles.featuresCtaLink}>
          Explore All Features
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>
    </section>
  );
}

