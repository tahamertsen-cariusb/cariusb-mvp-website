import { NextResponse } from 'next/server';
import { sendWebhookToN8n } from '@/lib/n8n/webhook';

type RequestBody = {
  event?: string;
  userId?: string;
  userEmail?: string;
  [key: string]: any;
};

export async function POST(request: Request) {
  let body: RequestBody | null = null;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.event) {
    return NextResponse.json({ success: false, error: 'Missing event.' }, { status: 400 });
  }

  const { event, userId, userEmail, ...data } = body;
  const result = await sendWebhookToN8n(event, data, userId, userEmail);

  const status =
    result.success || result.code === 'not_configured' ? 200 : 500;

  return NextResponse.json(result, { status });
}
