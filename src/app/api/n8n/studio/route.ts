import { NextResponse } from 'next/server';

type Mode = 'photo' | 'video';

type RequestBody = {
  mode: Mode;
  payload: Record<string, unknown>;
};

const UPSTREAM_REQUEST_TIMEOUT_MS = 25_000;

const getWebhookConfig = (mode: Mode) => {
  if (mode === 'photo') {
    return {
      url: process.env.N8N_STUDIO_PHOTO_WEBHOOK_URL,
      secret: process.env.N8N_STUDIO_PHOTO_SECRET,
    };
  }

  return {
    url: process.env.N8N_STUDIO_VIDEO_WEBHOOK_URL,
    secret: process.env.N8N_STUDIO_VIDEO_SECRET,
  };
};

export async function POST(request: Request) {
  let body: RequestBody | null = null;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || (body.mode !== 'photo' && body.mode !== 'video')) {
    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });
  }

  const { url, secret } = getWebhookConfig(body.mode);

  if (!url || !secret) {
    return NextResponse.json({ error: 'Webhook configuration missing.' }, { status: 500 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': secret,
      },
      body: JSON.stringify(body.payload ?? {}),
      signal: controller.signal,
    });

    const raw = await response.text();

    if (response.status === 524) {
      return NextResponse.json(
        { status: 'accepted', upstreamStatus: response.status, reason: 'cloudflare_timeout' },
        { status: 202 }
      );
    }

    let parsed: unknown = raw;
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { raw };
    }

    return NextResponse.json(parsed, { status: response.status });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        { status: 'accepted', upstreamStatus: null, reason: 'upstream_timeout' },
        { status: 202 }
      );
    }
    return NextResponse.json({ error: 'Failed to reach upstream webhook.' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
