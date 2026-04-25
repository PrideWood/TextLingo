import { NextResponse } from 'next/server';
import { hasOcrCredentials, recognizeTextFromImage } from '../../../lib/providers/ocr';
import { requireAccess } from '../../../lib/server/access';
import type { ApiResponse } from '../../../src/types';

const maxImageSize = 10 * 1024 * 1024;
const supportedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json<ApiResponse<{ configured: boolean }>>({
    ok: true,
    data: { configured: hasOcrCredentials() },
  });
}

export async function POST(request: Request) {
  const accessError = requireAccess(request);
  if (accessError) return accessError;

  const formData = await request.formData().catch(() => null);
  const image = formData?.get('image');

  if (!(image instanceof File)) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '请上传需要识别的图片' }, { status: 200 });
  }

  if (!supportedMimeTypes.has(image.type)) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '图片格式不支持，请上传 png、jpg、jpeg 或 webp' }, { status: 200 });
  }

  if (image.size > maxImageSize) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '图片不能超过 10MB' }, { status: 200 });
  }

  try {
    const buffer = Buffer.from(await image.arrayBuffer());

    if (process.env.NODE_ENV === 'development') {
      console.log('[route:ocr] received image', {
        mimeType: image.type,
        bytes: image.size,
        provider: formData?.get('provider'),
        model: formData?.get('model'),
        hasBaseUrl: Boolean(String(formData?.get('baseUrl') || '').trim()),
      });
    }

    const data = await recognizeTextFromImage({
      fileBuffer: buffer,
      mimeType: image.type,
      provider: String(formData?.get('provider') || ''),
      model: String(formData?.get('model') || ''),
      baseUrl: String(formData?.get('baseUrl') || ''),
    });

    return NextResponse.json<ApiResponse<{ text: string }>>({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR 识别失败';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 200 });
  }
}
