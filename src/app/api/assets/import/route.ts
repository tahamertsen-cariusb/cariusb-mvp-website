import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const WORKER_URL = 'https://media-gateway-cariusb.tahamertsen.workers.dev';
const MAX_BYTES = 50 * 1024 * 1024;

type Body = {
  url?: string;
  projectId?: string;
};

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Body | null = null;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const url = (body?.url || '').trim();
  const projectId = (body?.projectId || '').trim();

  if (!url || !projectId) {
    return NextResponse.json({ error: 'Missing url or projectId.' }, { status: 400 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Failed to fetch URL.' }, { status: 400 });
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'URL is not an image.' }, { status: 400 });
  }

  const arrayBuffer = await upstream.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large.' }, { status: 413 });
  }

  const workerResponse = await fetch(`${WORKER_URL}/upload/image`, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-user-id': user.id,
      'x-project-id': projectId,
    },
    body: arrayBuffer,
  });

  const workerText = await workerResponse.text();
  let workerJson: any = null;

  try {
    workerJson = workerText ? JSON.parse(workerText) : {};
  } catch {
    return NextResponse.json({ error: 'Worker returned invalid JSON.' }, { status: 502 });
  }

  const keyOrUrl = workerJson?.key || workerJson?.url || null;
  if (!keyOrUrl) {
    return NextResponse.json({ error: 'Worker upload failed.' }, { status: 502 });
  }

  const resolvedUrl =
    typeof keyOrUrl === 'string' && (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://'))
      ? keyOrUrl
      : `${WORKER_URL}/${keyOrUrl}`;

  return NextResponse.json({ url: resolvedUrl, key: keyOrUrl }, { status: 200 });
}

