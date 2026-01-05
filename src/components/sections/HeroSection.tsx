'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

const SLIDE_DURATION_MS = 4000;

const slides = [
  { 
    id: 0, 
    label: 'Before', 
    title: 'Before Transformation', 
    imageUrl: 'https://broad-violet-3cb6.tahamertsen.workers.dev/uploads/before.png'
  },
  { 
    id: 1, 
    label: 'After', 
    title: 'After Transformation', 
    imageUrl: 'https://media-gateway-cariusb.tahamertsen.workers.dev/image/2fb1a324-37e0-4bf6-aa80-25eccfb3dec0'
  },
  { 
    id: 2, 
    label: 'Hero', 
    title: 'Hero Transformation', 
    imageUrl: 'https://media-gateway-cariusb.tahamertsen.workers.dev/image/cloudflareupload/7cd13e860665222c19496f094c6bfe2d_1765292366.png'
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(nextSlide, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  const handleDotKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDotClick(index);
    }
  };


  return (
    <section className={styles.heroSection}>
      {/* Left: Content */}
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          AI-Powered Car Visualization
        </div>

        <h1 className={styles.heroTitle}>
          Transform Your Car<br/>with <span className={styles.highlight}>AI Magic</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Turn ordinary car photos into viral masterpieces. Change rims, paint, bodykits, 
          and even generate cinematic AI videos — all in seconds.
        </p>

        <div className={styles.heroButtons}>
          <Link href="/design-preview" className={styles.btnPrimary}>
            Start Creating
          </Link>
          <Link href="/community" className={styles.btnSecondary}>
            View Gallery
          </Link>
        </div>
      </div>

      {/* Right: Image Slider */}
      <div 
        className={styles.heroSlider}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((slide) => (
          <div 
            key={slide.id}
            className={`${styles.heroSlide} ${currentSlide === slide.id ? styles.active : ''}`}
          >
            <img 
              src={slide.imageUrl} 
              alt={slide.title}
              className={styles.heroSlideImage}
              loading="lazy"
            />
            <div className={styles.heroSlideOverlay} />
            <span className={styles.heroSlideLabel}>{slide.label}</span>
          </div>
        ))}
        <div className={styles.heroSliderDots} role="tablist" aria-label="Carousel navigation">
          {slides.map((slide) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={currentSlide === slide.id}
              aria-label={`Go to slide ${slide.id + 1}: ${slide.label}`}
              className={`${styles.sliderDot} ${currentSlide === slide.id ? styles.active : ''}`}
              onClick={() => handleDotClick(slide.id)}
              onKeyDown={(e) => handleDotKeyDown(e, slide.id)}
            />
          ))}
        </div>

        <div className={styles.heroSliderProgress} aria-hidden="true">
          <div
            key={currentSlide}
            className={`${styles.heroSliderProgressFill} ${isPaused ? styles.paused : ''}`}
            style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
          />
        </div>
      </div>
    </section>
  );
}

