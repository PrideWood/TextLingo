import { NextResponse } from 'next/server';
import { isAccessConfigured, verifyAccessCode } from '../../../../lib/server/access';
import type { ApiResponse } from '../../../../src/types';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!isAccessConfigured() && process.env.NODE_ENV === 'production') {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: 'Access code is not configured.' },
      { status: 200 },
    );
  }

  if (!verifyAccessCode(code)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[route:access] invalid access attempt', {
        codeLength: code.length,
        codePreview: code ? `${code.slice(0, 2)}***` : '',
      });
    }

    return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Invalid access code' }, { status: 200 });
  }

  return NextResponse.json<ApiResponse<{ granted: true }>>({ ok: true, data: { granted: true } });
}
