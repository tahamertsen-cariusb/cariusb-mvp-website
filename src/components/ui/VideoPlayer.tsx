'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './VideoPlayer.module.css';

type VideoPlayerSize = 'sm' | 'md';
type VideoFit = 'cover' | 'contain';

type VideoPlayerProps = {
  src: string;
  ariaLabel?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  aspectRatio?: string;
  fill?: boolean;
  fit?: VideoFit;
  rounded?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: 'metadata' | 'auto' | 'none';
  size?: VideoPlayerSize;
  className?: string;
  videoClassName?: string;
};

function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoPlayer({
  src,
  ariaLabel = 'Video player',
  overlayTitle,
  overlaySubtitle,
  aspectRatio,
  fill = false,
  fit = 'cover',
  rounded = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = 'metadata',
  size = 'md',
  className,
  videoClassName,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsSeeking(false);
  }, [src]);

  const togglePlayback = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const rootClassName = useMemo(() => {
    const base = [
      styles.root,
      styles.default,
      rounded ? '' : styles.noRadius,
      fill ? styles.fill : aspectRatio ? styles.ratio : '',
      size === 'sm' ? styles.sm : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');
    return base;
  }, [aspectRatio, className, fill, rounded, size]);

  return (
    <div className={rootClassName} style={aspectRatio && !fill ? ({ ['--vp-aspect' as any]: aspectRatio } as any) : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <video
        ref={videoRef}
        className={[styles.video, fit === 'contain' ? styles.contain : styles.cover, videoClassName || ''].filter(Boolean).join(' ')}
        src={src}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setDuration(Number.isFinite(el.duration) ? el.duration : 0);
        }}
        onTimeUpdate={(e) => {
          if (isSeeking) return;
          const el = e.currentTarget;
          setCurrentTime(Number.isFinite(el.currentTime) ? el.currentTime : 0);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlayback}
        aria-label={ariaLabel}
      />

      {!isPlaying ? (
        <button type="button" className={styles.overlay} onClick={togglePlayback} aria-label="Play video">
          <div className={styles.playButton} aria-hidden="true">
            <span className={styles.pulseRing} />
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          {overlayTitle || overlaySubtitle ? (
            <div className={styles.overlayText} aria-hidden="true">
              {overlayTitle ? <span className={styles.title}>{overlayTitle}</span> : null}
              {overlaySubtitle ? <span className={styles.subtitle}>{overlaySubtitle}</span> : null}
            </div>
          ) : null}
        </button>
      ) : null}

      <div className={styles.controls} role="group" aria-label="Video controls">
        <button
          type="button"
          className={styles.controlBtn}
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div className={styles.seekRow}>
          <input
            className={styles.seek}
            type="range"
            min={0}
            max={Math.max(0.01, duration)}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onPointerDown={() => setIsSeeking(true)}
            onPointerUp={() => setIsSeeking(false)}
            onChange={(e) => {
              const el = videoRef.current;
              if (!el) return;
              const next = Number(e.target.value);
              el.currentTime = Number.isFinite(next) ? next : 0;
              setCurrentTime(el.currentTime);
            }}
            aria-label="Seek"
          />
          <div className={styles.time} aria-label="Time">
            {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
