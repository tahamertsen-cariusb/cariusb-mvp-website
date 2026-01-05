'use client';

import { useEffect, useRef } from 'react';
import styles from './CursorGlow.module.css';

interface CursorGlowProps {
  isVideoMode?: boolean;
}

export function CursorGlow({ isVideoMode = false }: CursorGlowProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
        glowRef.current.classList.add(styles.active);
        
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Hide after 2 seconds of no movement
        timeoutRef.current = setTimeout(() => {
          if (glowRef.current) {
            glowRef.current.classList.remove(styles.active);
          }
        }, 2000);
      }
    };

    const handleMouseLeave = () => {
      if (glowRef.current) {
        glowRef.current.classList.remove(styles.active);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={glowRef} 
      className={`${styles.cursorGlow} ${isVideoMode ? styles.videoMode : ''}`}
    />
  );
}

