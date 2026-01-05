'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { createSupabaseClient } from '@/lib/supabase';
import styles from './MobileMenu.module.css';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { isLoggedIn, user, logout: logoutStore } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus first link for keyboard navigation
      firstFocusableRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    onClose();
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    logoutStore();
  };

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={styles.overlay} 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu */}
      <nav 
        ref={menuRef}
        className={styles.menu}
        role="navigation"
        aria-label="Mobile navigation menu"
      >
        <div className={styles.menuHeader}>
          <h2 className={styles.menuTitle}>Menu</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.menuContent}>
          {/* Navigation Links */}
          <div className={styles.menuSection}>
            <Link 
              href="/features" 
              className={`${styles.menuLink} ${pathname === '/features' ? styles.active : ''}`}
              onClick={handleLinkClick}
              ref={firstFocusableRef}
            >
              Features
            </Link>
            <Link 
              href="/community" 
              className={`${styles.menuLink} ${pathname === '/community' ? styles.active : ''}`}
              onClick={handleLinkClick}
            >
              Community
            </Link>
            <Link 
              href="/pricing" 
              className={`${styles.menuLink} ${pathname === '/pricing' ? styles.active : ''}`}
              onClick={handleLinkClick}
            >
              Pricing
            </Link>
          </div>

          {isLoggedIn && user ? (
            <>
              <div className={styles.menuDivider} />
              <div className={styles.menuSection}>
                <Link 
                  href="/dashboard" 
                  className={styles.menuLink}
                  onClick={handleLinkClick}
                >
                  My Garages
                </Link>
                <Link 
                  href="/profile" 
                  className={styles.menuLink}
                  onClick={handleLinkClick}
                >
                  Profile
                </Link>
                <Link 
                  href="/settings" 
                  className={styles.menuLink}
                  onClick={handleLinkClick}
                >
                  Settings
                </Link>
                <Link 
                  href="/billing" 
                  className={styles.menuLink}
                  onClick={handleLinkClick}
                >
                  Billing
                </Link>
              </div>
              <div className={styles.menuDivider} />
              <div className={styles.menuSection}>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={styles.userEmail}>{user.email}</div>
                </div>
                <button 
                  className={`${styles.menuLink} ${styles.logoutButton}`}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.menuDivider} />
              <div className={styles.menuSection}>
                <Link 
                  href="/login" 
                  className={`${styles.menuLink} ${styles.loginLink}`}
                  onClick={handleLinkClick}
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className={`${styles.menuLink} ${styles.ctaLink}`}
                  onClick={handleLinkClick}
                >
                  Try Free
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

