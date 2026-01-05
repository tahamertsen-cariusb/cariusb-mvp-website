'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/stores/authStore';
import { createSupabaseClient } from '@/lib/supabase';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import styles from './page.module.css';

export default function ProfilePage() {
  const { isLoggedIn, user } = useAuthStore();
  const communityNameInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    communityName: '',
    email: '',
    bio: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { toasts, success, error: toastError, removeToast } = useToast();

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchProfile();
    }
  }, [isLoggedIn, user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Profile yoksa default değerlerle devam et
        setFormData({
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || '',
          communityName: user.name || '',
          email: user.email || '',
          bio: '',
        });
        setLoading(false);
        return;
      }

      if (profile) {
        const nameParts = (profile.full_name || profile.display_name || '').split(' ') || [];
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          communityName: profile.display_name || profile.full_name || user.name || '',
          email: profile.email || user.email || '',
          bio: '', // profiles tablosunda bio field yok, gerekirse eklenebilir
        });
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const extractAvatarPath = (url: string): string | null => {
    const marker = '/storage/v1/object/public/avatars/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const raw = url.slice(idx + marker.length).split('?')[0]?.split('#')[0] ?? '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  };

  const handleAvatarFileSelected = async (file: File) => {
    if (!user?.id) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please select an image file.');
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toastError('Please choose an image smaller than 5MB.');
      return;
    }

    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const previousPath = avatarUrl ? extractAvatarPath(avatarUrl) : null;
      if (previousPath) {
        const { error: removeError } = await supabase.storage.from('avatars').remove([previousPath]);
        if (removeError) {
          console.error('Avatar remove failed', removeError);
        }
      }

      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error('Avatar upload failed', uploadError);
        toastError('Avatar upload failed. Please try again.');
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data?.publicUrl || null;
      if (!publicUrl) {
        toastError('Could not resolve avatar URL. Please try again.');
        return;
      }

      const { error: rpcError } = await supabase.rpc('set_profile_avatar_url', {
        p_avatar_url: publicUrl,
      });

      if (rpcError) {
        console.error('set_profile_avatar_url failed', rpcError);
        toastError('Could not save avatar. Please try again.');
        return;
      }

      setAvatarUrl(publicUrl);
      useAuthStore.getState().setUser({
        ...(user || { name: 'User', email: formData.email, credits: 1200 }),
        avatar: publicUrl,
      });
      success('Avatar updated.');
    } catch (err) {
      console.error('Avatar upload error', err);
      toastError('Avatar upload failed. Please try again.');
    } finally {
      setSaving(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const currentUrl = avatarUrl;
      const path = currentUrl ? extractAvatarPath(currentUrl) : null;

      if (path) {
        const { error: removeError } = await supabase.storage.from('avatars').remove([path]);
        if (removeError) {
          console.error('Avatar remove failed', removeError);
        }
      }

      const { error: rpcError } = await supabase.rpc('clear_profile_avatar_url');
      if (rpcError) {
        console.error('clear_profile_avatar_url failed', rpcError);
        toastError('Could not remove avatar. Please try again.');
        return;
      }

      setAvatarUrl(null);
      useAuthStore.getState().setUser({
        ...(user || { name: 'User', email: formData.email, credits: 1200 }),
        avatar: undefined,
      });
      success('Avatar removed.');
    } catch (err) {
      console.error('Avatar remove error', err);
      toastError('Could not remove avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const communityName = (formData.communityName || fullName || user.name || 'Anonymous').trim();

      const { error: rpcError } = await supabase.rpc('set_profile_names', {
        p_full_name: fullName || null,
        p_community_user_name: communityName || null,
      });

      if (rpcError) {
        console.error('Error saving profile names:', rpcError);
        toastError('Failed to save profile. Please try again.');
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: formData.email,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        );

      if (profileError) {
        console.error('Error saving profile:', profileError);
        toastError('Failed to save profile. Please try again.');
        return;
      }

      // Auth store'u güncelle
      useAuthStore.getState().setUser({
        ...user,
        name: fullName,
        email: formData.email,
        avatar: avatarUrl || undefined,
      });

      success('Profile saved successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      toastError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Delete account logic here
      console.log('Deleting account');
    }
  };

  return (
    <>
      <Navbar />
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <main className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Account Settings</h1>
          <p className={styles.pageSubtitle}>Manage your profile and preferences</p>
        </div>

        {/* Settings Navigation */}
        <div className={styles.settingsNav}>
          <Link href="/profile" className={`${styles.settingsNavItem} ${styles.active}`}>
            Profile
          </Link>
          <Link href="/settings" className={styles.settingsNavItem}>
            Settings
          </Link>
          <Link href="/billing" className={styles.settingsNavItem}>
            Billing
          </Link>
        </div>

        {/* Profile Section */}
        <div className={styles.profileSection}>
          <h2 className={styles.sectionTitle}>Profile Information</h2>
          
          <div className={styles.avatarSection}>
            <div className={styles.largeAvatar}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={formData.communityName || user?.name || 'Avatar'}
                  className={styles.largeAvatarImg}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (formData.communityName || user?.name || 'A').charAt(0)
              )}
            </div>
            <div className={styles.avatarInfo}>
              <h3>{formData.communityName || user?.name || 'Anonymous'}</h3>
              <p>Member since December 2025</p>
              <div className={styles.avatarActions}>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={saving}
                >
                  Upload Photo
                </button>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => {
                    communityNameInputRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                    communityNameInputRef.current?.focus();
                  }}
                  disabled={saving}
                >
                  Edit community name
                </button>
                <button
                  type="button"
                  className={styles.btnText}
                  onClick={() => void handleRemoveAvatar()}
                  disabled={saving || !avatarUrl}
                >
                  Remove
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) void handleAvatarFileSelected(file);
                }}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="communityName" className={styles.formLabel}>Community Name</label>
              <input
                ref={communityNameInputRef}
                id="communityName"
                type="text"
                className={styles.formInput}
                value={formData.communityName}
                onChange={(e) => handleInputChange('communityName', e.target.value)}
                placeholder="Enter your community nickname"
                aria-required="false"
                autoComplete="nickname"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.formLabel}>First Name</label>
              <input
                id="firstName"
                type="text"
                className={styles.formInput}
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter first name"
                aria-required="false"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.formLabel}>Last Name</label>
              <input
                id="lastName"
                type="text"
                className={styles.formInput}
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter last name"
                aria-required="false"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="email" className={styles.formLabel}>Email Address</label>
              <input
                id="email"
                type="email"
                className={styles.formInput}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email"
                aria-required="true"
                autoComplete="email"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="bio" className={styles.formLabel}>Bio</label>
              <textarea
                id="bio"
                className={styles.formInput}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                aria-required="false"
                rows={4}
              />
            </div>
          </div>

          <div className={styles.saveSection}>
            <button 
              className={styles.btnSecondary} 
              onClick={() => fetchProfile()}
              aria-label="Cancel and revert changes"
            >
              Cancel
            </button>
            <button 
              className={styles.btnPrimary} 
              onClick={handleSave} 
              disabled={saving}
              aria-label={saving ? 'Saving profile changes' : 'Save profile changes'}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={styles.dangerZone}>
          <h2 className={styles.sectionTitle}>Danger Zone</h2>
          <p>Once you delete your account, there is no going back. Please be certain.</p>
          <button className={styles.btnDanger} onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
