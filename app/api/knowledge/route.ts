import { NextResponse } from 'next/server';
import { extractKnowledge, hasKnowledgeCredentials } from '../../../lib/providers/knowledge';
import type { ApiResponse, KnowledgeSection } from '../../../src/types';

function hasKnowledgeKey() {
  return hasKnowledgeCredentials();
}

function logRequest(body: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('[route:knowledge] received request body', {
    title: body.title,
    sourceLanguage: body.sourceLanguage,
    targetLanguage: body.targetLanguage,
    features: body.features,
    textLength: typeof body.text === 'string' ? body.text.length : 0,
    textPreview: typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim().slice(0, 120) : '',
  });
}

export async function GET() {
  return NextResponse.json<ApiResponse<{ configured: boolean }>>({
    ok: true,
    data: { configured: hasKnowledgeKey() },
  });
}

export async function POST(request: Request) {
  if (!hasKnowledgeKey()) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '知识点服务尚未配置' }, { status: 200 });
  }

  const body = await request.json().catch(() => null);
  logRequest(body ?? {});

  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '请提供需要提取知识点的文本' }, { status: 200 });
  }

  try {
    const data = await extractKnowledge({
      text: body.text,
      title: body.title,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
      detailLevel: body.options?.knowledgeDetailLevel,
    });

    return NextResponse.json<ApiResponse<KnowledgeSection[]>>({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '知识点服务请求失败';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 200 });
  }
}
