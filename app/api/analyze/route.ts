import { NextResponse } from 'next/server';
import { analyzeText, hasAnalyzeCredentials } from '../../../lib/providers/analyze';
import type { AnalysisResult, ApiResponse } from '../../../src/types';

export async function GET() {
  return NextResponse.json<ApiResponse<{ configured: boolean }>>({
    ok: true,
    data: { configured: hasAnalyzeCredentials() },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '请提供需要分析的文本' }, { status: 200 });
  }

  if (!hasAnalyzeCredentials(body.options)) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '分析服务尚未完整配置' }, { status: 200 });
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('analyze request options:', {
        textLength: body.text.length,
        sourceLanguage: body.sourceLanguage,
        targetLanguage: body.targetLanguage,
        options: body.options,
      });
    }

    const data = await analyzeText({
      text: body.text,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
      options: body.options,
    });

    const result: ApiResponse<AnalysisResult> = { ok: true, data };

    if (process.env.NODE_ENV === 'development') {
      console.log('analyze response shape:', {
        ok: result.ok,
        hasData: Boolean(result.data),
        dataKeys: Object.keys(result.data),
        hasDifficulty: Boolean(result.data.difficulty),
        knowledgeKeys: Object.keys(result.data.knowledge),
        quizCount: result.data.quiz.length,
      });
    }

    return NextResponse.json<ApiResponse<AnalysisResult>>(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '分析服务请求失败';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 200 });
  }
}
