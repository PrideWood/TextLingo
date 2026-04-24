import { NextResponse } from 'next/server';
import { getTranslateRuntimeConfig, hasTranslateCredentials, translateText } from '../../../lib/providers/translate';
import type { ApiResponse, TranslationResult } from '../../../src/types';

function hasTranslateKey() {
  return hasTranslateCredentials();
}

export async function GET() {
  return NextResponse.json<ApiResponse<{ configured: boolean }>>({
    ok: true,
    data: { configured: hasTranslateKey() },
  });
}

function logRequest(body: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return;

  const config = getTranslateRuntimeConfig();

  console.log('[route:translate] received request body', {
    hasKey: Boolean(config.apiKey),
    baseUrl: config.baseUrl,
    endpoint: config.endpoint,
    sourceLanguage: body.sourceLanguage,
    targetLanguage: body.targetLanguage,
    textLength: typeof body.text === 'string' ? body.text.length : 0,
    enteringRealProvider: true,
  });
}

export async function POST(request: Request) {
  if (!hasTranslateKey()) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '翻译服务尚未配置' }, { status: 200 });
  }

  const body = await request.json().catch(() => null);
  logRequest(body ?? {});

  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '请提供需要翻译的文本' }, { status: 200 });
  }

  try {
    const data = await translateText({
      text: body.text,
      title: body.title,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
    });

    return NextResponse.json<ApiResponse<TranslationResult>>({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '翻译服务请求失败';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 200 });
  }
}
