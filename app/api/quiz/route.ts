import { NextResponse } from 'next/server';
import { generateQuiz, hasQuizCredentials } from '../../../lib/providers/quiz';
import type { ApiResponse, QuizQuestion } from '../../../src/types';

function hasQuizKey() {
  return hasQuizCredentials();
}

function logRequest(body: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('[route:quiz] received request body', {
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
    data: { configured: hasQuizKey() },
  });
}

export async function POST(request: Request) {
  if (!hasQuizKey()) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '出题服务尚未配置' }, { status: 200 });
  }

  const body = await request.json().catch(() => null);
  logRequest(body ?? {});

  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '请提供需要出题的文本' }, { status: 200 });
  }

  try {
    const data = await generateQuiz({
      text: body.text,
      title: body.title,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
      questionTypes: body.options?.quizQuestionTypes,
    });

    return NextResponse.json<ApiResponse<QuizQuestion[]>>({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '出题服务请求失败';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 200 });
  }
}
