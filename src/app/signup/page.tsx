'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useWebhook } from '@/hooks/useWebhook';
import { WebhookEvent } from '@/lib/n8n/events';
import styles from '../login/page.module.css';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const { login } = useAuthStore();
  const { sendWebhook } = useWebhook();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Update auth store with user data
        login({
          name: name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || email,
          avatar: data.user.user_metadata?.avatar_url,
          credits: 1200, // You can fetch this from your database
          id: data.user.id,
        });

        // n8n webhook gönder
        await sendWebhook(
          WebhookEvent.USER_SIGNUP,
          {
            name: name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || email,
            credits: 1200,
          },
          data.user.id,
          data.user.email || email
        );

        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <Link href="/" className={styles.backLink}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Home
      </Link>

      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <Link href="/" className={styles.authLogo}>
            CARI<span>.</span>
          </Link>
          <h1 className={styles.authTitle}>Create your account</h1>
          <p className={styles.authSubtitle}>Start transforming your car photos today</p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Full name</label>
            <input 
              type="text" 
              className={styles.formInput} 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email address</label>
            <input 
              type="email" 
              className={styles.formInput} 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password</label>
            <input 
              type="password" 
              className={styles.formInput} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="terms" 
              className={styles.checkboxInput}
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              required
            />
            <label htmlFor="terms" className={styles.checkboxLabel}>
              I agree to the <Link href="/terms" className={styles.forgotLink}>Terms of Service</Link> and <Link href="/privacy" className={styles.forgotLink}>Privacy Policy</Link>
            </label>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded">
              {error}
            </div>
          )}
          <button type="submit" className={styles.authBtn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>or continue with</span>
            <div className={styles.dividerLine}></div>
          </div>

          <div className={styles.socialButtons}>
            <button
              type="button"
              className={styles.socialBtn}
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                if (error) setError(error.message);
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>
        </form>

        <div className={styles.authFooter}>
          <p className={styles.authFooterText}>
            Already have an account? <Link href="/login" className={styles.authFooterLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

