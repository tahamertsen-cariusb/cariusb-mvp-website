/**
 * Sentry Error Tracking Configuration
 * 
 * Production error tracking için Sentry hazırlık dosyası
 * Sentry entegrasyonu aktif etmek için:
 * 1. @sentry/nextjs paketini yükleyin: npm install @sentry/nextjs
 * 2. SENTRY_DSN environment variable'ını ayarlayın
 * 3. sentry.client.config.ts ve sentry.server.config.ts dosyalarını oluşturun
 */

// Sentry DSN from environment
const SENTRY_DSN = process.env.SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sentry'nin yapılandırılıp yapılandırılmadığını kontrol eder
 */
export function isSentryConfigured(): boolean {
  return !!SENTRY_DSN && isProduction;
}

/**
 * Sentry'ye error gönder (eğer yapılandırılmışsa)
 * 
 * Şu an için placeholder. Sentry kurulumu yapıldığında aktif edilecek.
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!isSentryConfigured()) {
    // Development'ta veya Sentry yapılandırılmamışsa console'a yaz
    console.error('Error (Sentry not configured):', error);
    if (context) {
      console.error('Context:', context);
    }
    return;
  }

  // TODO: Sentry kurulumu yapıldığında aktif edilecek
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureException(error, { contexts: { custom: context } });
}

/**
 * Sentry'ye message gönder (eğer yapılandırılmışsa)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  context?: Record<string, any>
): void {
  if (!isSentryConfigured()) {
    // Development'ta veya Sentry yapılandırılmamışsa console'a yaz
    console[level]('Message (Sentry not configured):', message);
    if (context) {
      console[level]('Context:', context);
    }
    return;
  }

  // TODO: Sentry kurulumu yapıldığında aktif edilecek
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureMessage(message, { level, contexts: { custom: context } });
}

/**
 * Sentry breadcrumb ekle
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warn' | 'error' = 'info',
  data?: Record<string, any>
): void {
  if (!isSentryConfigured()) {
    return;
  }

  // TODO: Sentry kurulumu yapıldığında aktif edilecek
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.addBreadcrumb({ message, category, level, data });
}

