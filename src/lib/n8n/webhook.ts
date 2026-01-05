/**
 * n8n Webhook Service
 * Sends outgoing webhooks to n8n with optional per-event endpoints and retry.
 */

import { getWebhookEndpointForEvent } from './config';
import { logger } from '@/lib/logger';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  [key: string]: any;
}

export interface WebhookRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  retryableStatusCodes?: number[];
}

export type WebhookResultCode = 'not_configured' | 'send_failed';

export interface WebhookSendResult {
  success: boolean;
  code?: WebhookResultCode;
  error?: string;
  response?: any;
  attempts?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<WebhookRetryOptions> = {
  maxRetries: 0,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

function calculateDelay(attempt: number, options: Required<WebhookRetryOptions>): number {
  const delay = Math.min(options.initialDelayMs * Math.pow(2, attempt), options.maxDelayMs);
  const jitter = delay * 0.2 * Math.random();
  return Math.floor(delay + jitter);
}

async function sendWithRetry(
  endpoint: { url: string; secret?: string },
  payload: WebhookPayload,
  options: Required<WebhookRetryOptions>
): Promise<WebhookSendResult> {
  let lastError: Error | null = null;
  let lastResponse: any = null;
  let attempts = 0;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    attempts = attempt + 1;
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };

      // Optional signature header (customizable for n8n "Header Auth" / signature patterns).
      const signatureHeaderName = process.env.N8N_WEBHOOK_SIGNATURE_HEADER || 'X-Webhook-Signature';
      if (endpoint.secret) headers[signatureHeaderName] = endpoint.secret;

      // Optional authorization/header auth for n8n webhooks.
      // - N8N_WEBHOOK_AUTHORIZATION: full Authorization header value (e.g. "Bearer xxx" or any custom string)
      // - N8N_WEBHOOK_BASIC_USER/PASS: builds "Basic base64(user:pass)"
      // - N8N_WEBHOOK_AUTH_HEADER_NAME/VALUE: arbitrary header auth
      if (process.env.N8N_WEBHOOK_AUTHORIZATION) {
        headers['Authorization'] = process.env.N8N_WEBHOOK_AUTHORIZATION;
      } else if (process.env.N8N_WEBHOOK_BASIC_USER && process.env.N8N_WEBHOOK_BASIC_PASS) {
        const encoded = Buffer.from(
          `${process.env.N8N_WEBHOOK_BASIC_USER}:${process.env.N8N_WEBHOOK_BASIC_PASS}`,
          'utf8'
        ).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      } else if (process.env.N8N_WEBHOOK_AUTH_HEADER_NAME && process.env.N8N_WEBHOOK_AUTH_HEADER_VALUE) {
        headers[process.env.N8N_WEBHOOK_AUTH_HEADER_NAME] = process.env.N8N_WEBHOOK_AUTH_HEADER_VALUE;
      } else if (endpoint.secret) {
        // Common n8n pattern: "Header Auth" using Authorization header.
        headers['Authorization'] = endpoint.secret;
      }

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      try {
        if (contentType.includes('application/json')) {
          lastResponse = await response.json();
        } else {
          const text = await response.text();
          lastResponse = text ? { message: text } : null;
        }
      } catch (parseError) {
        logger.warn('Webhook response body parse edilemedi', { parseError });
      }

      if (response.ok) {
        logger.webhook(payload.event, payload, true);
        return { success: true, response: lastResponse, attempts };
      }

      const isRetryable =
        options.retryableStatusCodes.includes(response.status) && attempt < options.maxRetries;
      if (isRetryable) {
        const delay = calculateDelay(attempt, options);
        logger.warn(
          `Webhook gonderimi basarisiz (${response.status}), ${delay}ms sonra tekrar denenecek (attempt ${attempt + 1}/${options.maxRetries + 1})`,
          { status: response.status, event: payload.event, attempt: attempt + 1 }
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        lastError = new Error(
          `HTTP ${response.status}: ${lastResponse?.message || 'Server error'}`
        );
        continue;
      }

      throw new Error(
        `Webhook gonderimi basarisiz: ${response.status} - ${lastResponse?.message || 'Unknown error'}`
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < options.maxRetries) {
        const delay = calculateDelay(attempt, options);
        logger.warn(
          `Webhook gonderimi hatasi, ${delay}ms sonra tekrar denenecek (attempt ${attempt + 1}/${options.maxRetries + 1})`,
          { error: lastError.message, event: payload.event, attempt: attempt + 1 }
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      logger.error(`Webhook gonderimi basarisiz oldu (${attempts} deneme)`, lastError, {
        event: payload.event,
        endpoint: endpoint.url,
        attempts,
      });
      return { success: false, error: lastError.message, response: lastResponse, attempts };
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    response: lastResponse,
    attempts,
  };
}

/**
 * Sends an event payload to n8n.
 * - Selects endpoint by event (or falls back to generic env vars)
 * - Adds simple header secret
 * - Retries on transient failures
 */
export async function sendWebhookToN8n(
  event: string,
  data: Record<string, any>,
  userId?: string,
  userEmail?: string,
  retryOptions?: WebhookRetryOptions
): Promise<WebhookSendResult> {
  const endpoint = getWebhookEndpointForEvent(event);
  if (!endpoint?.url) {
    logger.warn(`Webhook URL yapılandırılmamış için event: ${event}`);
    return { success: false, code: 'not_configured', error: `Webhook URL yapılandırılmamış: ${event}` };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
    userId,
    userEmail,
  };

  try {
    JSON.stringify(payload);
  } catch {
    logger.error('JSON stringify error (circular reference)', undefined, { event });
    const seen = new WeakSet();
    const safeData = JSON.parse(
      JSON.stringify(data, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      })
    );
    Object.assign(payload, safeData);
  }

  const options: Required<WebhookRetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOptions,
    retryableStatusCodes:
      retryOptions?.retryableStatusCodes || DEFAULT_RETRY_OPTIONS.retryableStatusCodes,
  };

  const result = await sendWithRetry(endpoint, payload, options);
  if (!result.success) return { ...result, code: 'send_failed' };
  return result;
}
