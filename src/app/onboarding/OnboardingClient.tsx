'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import styles from './page.module.css';

export default function OnboardingClient({
  userId,
  userEmail,
  initialFullName,
  initialCommunityName,
  nextPath,
}: {
  userId: string;
  userEmail: string;
  initialFullName: string;
  initialCommunityName: string;
  nextPath: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const existingUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(initialFullName);
  const [communityName, setCommunityName] = useState(initialCommunityName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    const nextFullName = fullName.trim();
    const nextCommunityName = communityName.trim();
    if (!nextFullName && !nextCommunityName) {
      setError('Enter your name, your community name, or both.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('set_profile_names', {
        p_full_name: nextFullName || null,
        p_community_user_name: nextCommunityName || null,
      });

      if (rpcError) {
        setError('Could not save your profile. Please try again.');
        return;
      }

      setUser({
        ...(existingUser || {
          credits: 1200,
          name: nextFullName || nextCommunityName || 'User',
          email: userEmail,
        }),
        id: userId,
        name: nextFullName || nextCommunityName || 'User',
        email: userEmail,
      });

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card} role="region" aria-label="Profile setup">
        <div className={styles.header}>
          <Link href="/" className={styles.brand}>
            CARI<span>.</span>
          </Link>
          <h1 className={styles.title}>Set up your profile</h1>
          <p className={styles.subtitle}>
            Choose how your name appears across the app and in the community.
          </p>
        </div>

        <div className={styles.form}>
          <label className={styles.label} htmlFor="fullName">
            Your name
          </label>
          <input
            id="fullName"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Taha Mert Şen"
            autoComplete="name"
          />

          <label className={styles.label} htmlFor="communityName">
            Community name (nickname)
          </label>
          <input
            id="communityName"
            className={styles.input}
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            placeholder="e.g. dominic_toretto"
            autoComplete="nickname"
          />

          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => void handleContinue()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>

          <p className={styles.hint}>
            You can change these later in <Link href="/profile">Profile</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
