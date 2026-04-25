import { NextResponse } from 'next/server';
import { generateTitle, hasTitleCredentials } from '../../../lib/providers/title';
import { requireAccess } from '../../../lib/server/access';
import type { ApiResponse, TitleResult } from '../../../src/types';

function logRequest(body: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('[route:title] received request body', {
    sourceLanguage: body.sourceLanguage,
    targetLanguage: body.targetLanguage,
    textLength: typeof body.text === 'string' ? body.text.length : 0,
  });
}

export async function GET() {
  return NextResponse.json<ApiResponse<{ configured: boolean }>>({
    ok: true,
    data: { configured: hasTitleCredentials() },
  });
}

export async function POST(request: Request) {
  const accessError = requireAccess(request);
  if (accessError) return accessError;

  if (!hasTitleCredentials()) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '标题服务尚未配置' }, { status: 200 });
  }

  const body = await request.json().catch(() => null);
  logRequest(body ?? {});

  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '请提供需要生成标题的文本' }, { status: 200 });
  }

  try {
    const data = await generateTitle({
      text: body.text,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
    });

    return NextResponse.json<ApiResponse<TitleResult>>({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '标题服务请求失败';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 200 });
  }
}
