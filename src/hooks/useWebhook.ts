/**
 * Webhook Hook
 * Client-side: forwards events to our server route which then calls n8n.
 *
 * Important: Webhooks are telemetry/side-effects and must not break UX.
 */

import { useCallback } from 'react';
import { WebhookEvent } from '@/lib/n8n/events';

type SendWebhookResult =
  | { success: true; result: any }
  | { success: false; error: string; code?: string; attempts?: number };

export function useWebhook() {
  const sendWebhook = useCallback(
    async (
      event: WebhookEvent | string,
      data: Record<string, any>,
      userId?: string,
      userEmail?: string
    ): Promise<SendWebhookResult> => {
      try {
        const response = await fetch('/api/webhooks/n8n/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            ...data,
            // Back-compat: server route does not trust these, but keeping them avoids breaking callers.
            userId,
            userEmail,
          }),
        });

        const result = await response
          .json()
          .catch(() => ({ success: false, error: 'Invalid JSON response' }));

        if (!response.ok) {
          console.error('Webhook send failed:', result);
          return {
            success: false,
            code: result?.code,
            attempts: result?.attempts,
            error: result?.error || 'Webhook send failed',
          };
        }

        if (result?.success === false) {
          if (result?.code !== 'not_configured') {
            console.error('Webhook send failed:', result);
          }
          return {
            success: false,
            code: result?.code,
            attempts: result?.attempts,
            error: result?.error || 'Webhook send failed',
          };
        }

        return { success: true, result };
      } catch (error) {
        console.error('Webhook send failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    []
  );

  return { sendWebhook };
}

