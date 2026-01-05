/**
 * Logger Service
 * 
 * Production-ready structured logging system.
 * Development'ta console'a yazar, production'da sadece error'ları loglar.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  error?: Error;
}

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log entry'yi formatlar
 */
function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, metadata, error } = entry;
  
  const parts = [
    `[${timestamp}]`,
    level.toUpperCase().padEnd(5),
    message,
  ];

  if (metadata && Object.keys(metadata).length > 0) {
    parts.push('\n', JSON.stringify(metadata, null, 2));
  }

  if (error) {
    parts.push('\n', error.stack || error.message);
  }

  return parts.join(' ');
}

/**
 * Log entry'yi konsola yazar
 */
function writeLog(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);

  // Production'da sadece error ve warn loglanır
  if (isProduction) {
    if (entry.level === 'error') {
      console.error(formatted);
    } else if (entry.level === 'warn') {
      console.warn(formatted);
    }
    return;
  }

  // Development'ta tüm loglar gösterilir
  switch (entry.level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

/**
 * Logger instance
 */
export const logger = {
  /**
   * Debug log (sadece development)
   */
  debug: (message: string, metadata?: Record<string, any>): void => {
    if (!isDevelopment) return;
    
    writeLog({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  },

  /**
   * Info log
   */
  info: (message: string, metadata?: Record<string, any>): void => {
    writeLog({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  },

  /**
   * Warning log
   */
  warn: (message: string, metadata?: Record<string, any>): void => {
    writeLog({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });
  },

  /**
   * Error log
   */
  error: (
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, any>
  ): void => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    writeLog({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: errorObj,
      metadata,
    });

    // TODO: Sentry entegrasyonu aktif edildiğinde buraya ekle
    // if (isProduction) {
    //   captureException(errorObj, metadata);
    // }
  },

  /**
   * Webhook event log
   */
  webhook: (event: string, payload: Record<string, any>, success: boolean): void => {
    const level = success ? 'info' : 'error';
    writeLog({
      level,
      message: `Webhook ${event} ${success ? 'sent' : 'failed'}`,
      timestamp: new Date().toISOString(),
      metadata: {
        event,
        success,
        payload: isDevelopment ? payload : undefined, // Production'da payload loglanmaz (güvenlik)
      },
    });
  },

  /**
   * API request log
   */
  api: (method: string, path: string, statusCode: number, metadata?: Record<string, any>): void => {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    
    writeLog({
      level,
      message: `${method} ${path} ${statusCode}`,
      timestamp: new Date().toISOString(),
      metadata: {
        method,
        path,
        statusCode,
        ...metadata,
      },
    });
  },
};

/**
 * Log level kontrolü (gelecekte dinamik log level için)
 */
export function setLogLevel(level: LogLevel): void {
  // TODO: Implement dynamic log level filtering
  logger.warn('Dynamic log level not yet implemented');
}

