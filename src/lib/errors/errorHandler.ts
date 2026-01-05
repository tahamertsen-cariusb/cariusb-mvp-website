/**
 * Comprehensive Error Handling Utilities
 * Production-ready error handling with categorization and user-friendly messages
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  UPLOAD = 'UPLOAD',
  WEBHOOK = 'WEBHOOK',
  CREDIT = 'CREDIT',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorContext {
  operation?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface HandledError {
  message: string;
  category: ErrorCategory;
  userMessage: string;
  originalError: Error;
  context?: ErrorContext;
  retryable: boolean;
}

/**
 * Categorize error based on error type and message
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!(error instanceof Error)) {
    return ErrorCategory.UNKNOWN;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors
  if (
    name.includes('network') ||
    name.includes('fetch') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('connection')
  ) {
    return ErrorCategory.NETWORK;
  }

  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('login') ||
    message.includes('auth')
  ) {
    return ErrorCategory.AUTHENTICATION;
  }

  // Authorization errors
  if (
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('access denied') ||
    message.includes('rls') ||
    message.includes('42501')
  ) {
    return ErrorCategory.AUTHORIZATION;
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('sql') ||
    message.includes('query') ||
    message.includes('constraint') ||
    message.includes('foreign key')
  ) {
    return ErrorCategory.DATABASE;
  }

  // Upload errors
  if (
    message.includes('upload') ||
    message.includes('file') ||
    message.includes('size') ||
    message.includes('format')
  ) {
    return ErrorCategory.UPLOAD;
  }

  // Webhook errors
  if (message.includes('webhook') || message.includes('n8n')) {
    return ErrorCategory.WEBHOOK;
  }

  // Credit errors
  if (message.includes('credit') || message.includes('balance') || message.includes('insufficient')) {
    return ErrorCategory.CREDIT;
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('missing')
  ) {
    return ErrorCategory.VALIDATION;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: HandledError): boolean {
  if (!error.retryable) return false;

  switch (error.category) {
    case ErrorCategory.NETWORK:
      return true;
    case ErrorCategory.WEBHOOK:
      return true;
    case ErrorCategory.UPLOAD:
      // Only retry certain upload errors
      return error.message.includes('timeout') || error.message.includes('network');
    case ErrorCategory.DATABASE:
      // Retry transient database errors
      return error.message.includes('connection') || error.message.includes('timeout');
    default:
      return false;
  }
}

/**
 * Generate user-friendly error message based on category
 */
export function getUserFriendlyMessage(category: ErrorCategory, message: string, originalError: Error): string {

  const msg = message.toLowerCase();

  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';

    case ErrorCategory.AUTHENTICATION:
      return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';

    case ErrorCategory.AUTHORIZATION:
      return 'Bu işlem için yetkiniz bulunmamaktadır.';

    case ErrorCategory.DATABASE:
      return 'Veritabanı hatası oluştu. Lütfen daha sonra tekrar deneyin.';

    case ErrorCategory.UPLOAD:
      if (msg.includes('size')) {
        return 'Dosya boyutu çok büyük. Lütfen daha küçük bir dosya seçin.';
      }
      if (msg.includes('format') || msg.includes('type')) {
        return 'Geçersiz dosya formatı. Lütfen desteklenen bir format seçin.';
      }
      return 'Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';

    case ErrorCategory.WEBHOOK:
      return 'İşlem başlatılırken bir hata oluştu. Lütfen tekrar deneyin.';

    case ErrorCategory.CREDIT:
      if (msg.includes('insufficient') || msg.includes('yetersiz')) {
        return 'Yetersiz kredi bakiyesi. Lütfen kredi satın alın.';
      }
      return 'Kredi işlemi sırasında bir hata oluştu.';

    case ErrorCategory.VALIDATION:
      return 'Geçersiz veri. Lütfen girdiğiniz bilgileri kontrol edin.';

    default:
      // Try to use original error message if it's user-friendly
      const originalMsg = originalError.message;
      if (originalMsg && originalMsg.length < 100 && !originalMsg.includes('Error:')) {
        return originalMsg;
      }
      return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
  }
}

/**
 * Handle and normalize error
 */
export function handleError(
  error: unknown,
  context?: ErrorContext
): HandledError {
  const originalError = error instanceof Error ? error : new Error(String(error));
  const category = categorizeError(originalError);
  const userMessage = getUserFriendlyMessage(category, originalError.message, originalError);
  const retryable = category === ErrorCategory.NETWORK || category === ErrorCategory.WEBHOOK;

  const handledError: HandledError = {
    message: originalError.message,
    category,
    userMessage,
    originalError,
    context,
    retryable: isRetryableError({
      message: originalError.message,
      category,
      userMessage,
      originalError,
      context,
      retryable,
    }),
  };

  return handledError;
}

/**
 * Log error for monitoring (production-ready)
 */
export function logError(handledError: HandledError, additionalContext?: Record<string, any>) {
  const errorInfo = {
    message: handledError.message,
    category: handledError.category,
    stack: handledError.originalError.stack,
    context: handledError.context,
    ...additionalContext,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error handled:', errorInfo);
  }

  // In production, send to error tracking service
  // TODO: Integrate with Sentry/LogRocket/etc.
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(handledError.originalError, { extra: errorInfo });
  }
}

/**
 * Handle async operation with comprehensive error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<{ data: T | null; error: HandledError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const handledError = handleError(error, context);
    logError(handledError);
    return { data: null, error: handledError };
  }
}

