'use client';

import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  lines?: number; // For text variant
}

export function Skeleton({ 
  width, 
  height, 
  borderRadius, 
  className = '', 
  variant = 'rectangular',
  lines = 1
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '100%' : '100%'),
    height: height || (variant === 'circular' ? '100%' : '1rem'),
    borderRadius: borderRadius || (
      variant === 'circular' ? '50%' : 
      variant === 'card' ? '22px' : 
      '8px'
    ),
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${styles.skeleton} ${styles[variant]}`}
            style={{
              ...style,
              width: index === lines - 1 ? '80%' : '100%',
              marginBottom: index < lines - 1 ? '0.5rem' : 0,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Predefined skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <Skeleton variant="rectangular" height={200} borderRadius="22px 22px 0 0" />
      <div className={styles.skeletonCardContent}>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={16} lines={2} />
      </div>
    </div>
  );
}

export function SkeletonAvatar() {
  return <Skeleton variant="circular" width={40} height={40} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return <Skeleton variant="text" lines={lines} />;
}

