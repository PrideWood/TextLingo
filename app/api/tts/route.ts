import { NextResponse } from 'next/server';
import { generateSpeech } from '../../../lib/providers/tts';
import type { ApiResponse, TtsResult } from '../../../src/types';

function hasTtsKey() {
  return Boolean(process.env.TTS_API_KEY);
}

function logRequest(body: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('[route:tts] received request body', {
    sourceLanguage: body.sourceLanguage,
    voice: body.voice,
    speed: body.speed,
    features: body.features,
    textLength: typeof body.text === 'string' ? body.text.length : 0,
    textPreview: typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim().slice(0, 120) : '',
  });
}

export async function GET() {
  return NextResponse.json<ApiResponse<{ configured: boolean }>>({
    ok: true,
    data: { configured: hasTtsKey() },
  });
}

export async function POST(request: Request) {
  if (!hasTtsKey()) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'TTS 服务尚未配置' }, { status: 200 });
  }

  const body = await request.json().catch(() => null);
  logRequest(body ?? {});

  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '请提供需要生成语音的文本' }, { status: 200 });
  }

  const data = await generateSpeech({
    text: body.text,
    sourceLanguage: body.sourceLanguage,
    voice: body.voice,
    speed: body.speed,
  });

  return NextResponse.json<ApiResponse<TtsResult>>({ ok: true, data });
}
