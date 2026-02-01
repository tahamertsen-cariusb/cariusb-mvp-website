'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { createSupabaseClient } from '@/lib/supabase';
import { MobileMenu } from '@/components/ui/MobileMenu';
import styles from './Navbar.module.css';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, logout: logoutStore, setUser } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user?.avatar ?? null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarSrc(user?.avatar ?? null);
  }, [user?.avatar]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    let cancelled = false;
    const supabase = createSupabaseClient();

    void supabase
      .from('profiles')
      .select('avatar_url, display_name, full_name, email')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) return;

        const nextAvatar = data.avatar_url || undefined;
        const nextEmail = data.email || user.email;
        const nextName = data.display_name || data.full_name || user.name;

        if (nextAvatar === user.avatar && nextEmail === user.email && nextName === user.name) {
          return;
        }

        setUser({
          ...user,
          avatar: nextAvatar,
          email: nextEmail,
          name: nextName,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, setUser, user?.email, user?.id, user?.name, user?.avatar]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    logoutStore();
    router.replace('/');
  };

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Main navigation">
        <div className={styles.navLeft}>
          <Link href="/" className={styles.logo} aria-label="CARI Home">
            CARI<span>.</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className={styles.navCenter}>
        <Link 
          href="/features" 
          className={`${styles.navLink} ${pathname === '/features' ? styles.active : ''}`}
        >
          Features
        </Link>
        <Link 
          href="/community" 
          className={`${styles.navLink} ${pathname === '/community' ? styles.active : ''}`}
        >
          Community
        </Link>
        <Link 
          href="/pricing" 
          className={`${styles.navLink} ${pathname === '/pricing' ? styles.active : ''}`}
        >
          Pricing
        </Link>
      </div>

      <div className={styles.navRight}>
        {isLoggedIn && user ? (
          <>
            <Link href="/dashboard" className={`${styles.navLink} ${styles.navGarages}`}>
              My Garages
            </Link>
            <div className={styles.navAvatar} ref={dropdownRef}>
              <button
                className={styles.avatarButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {avatarSrc ? (
                  <Image
                    className={styles.avatarImage}
                    src={avatarSrc}
                    alt={`${user.name}'s profile`}
                    width={40}
                    height={40}
                    onError={() => setAvatarSrc(null)}
                  />
                ) : (
                  <span className={styles.avatarFallback} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2Z" />
                      <circle cx="7.5" cy="14" r="1.5" />
                      <circle cx="16.5" cy="14" r="1.5" />
                    </svg>
                  </span>
                )}
              </button>
              
              <div 
                className={`${styles.dropdownMenu} ${isDropdownOpen ? styles.open : ''}`}
                role="menu"
                aria-label="User menu"
              >
                <div className={styles.dropdownHeader}>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={styles.userEmail}>{user.email}</div>
                </div>
                <Link href="/profile" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>
                <Link href="/settings" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Settings
                </Link>
                <Link href="/billing" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  Billing
                </Link>
                <div className={styles.dropdownDivider} />
                <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.btnLogin}>
              Sign In
            </Link>
            <Link href="/signup" className={styles.btnCtaNav}>
              Try Free
            </Link>
          </>
        )}
      </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
}

