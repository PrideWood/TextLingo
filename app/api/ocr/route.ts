import { NextResponse } from 'next/server';
import { hasOcrCredentials, recognizeTextFromImage } from '../../../lib/providers/ocr';
import { requireAccess } from '../../../lib/server/access';
import type { ApiResponse } from '../../../src/types';

const maxImageSize = 10 * 1024 * 1024;
const maxImageCount = 10;
const supportedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export const maxDuration = 60;

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
  const images = getUploadedImages(formData);

  if (!images.length) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '请上传需要识别的图片' }, { status: 200 });
  }

  if (images.length > maxImageCount) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: `一次最多上传 ${maxImageCount} 张图片` }, { status: 200 });
  }

  const unsupportedImage = images.find((image) => !supportedMimeTypes.has(image.type));
  if (unsupportedImage) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '图片格式不支持，请上传 png、jpg、jpeg 或 webp' }, { status: 200 });
  }

  const oversizedImage = images.find((image) => image.size > maxImageSize);
  if (oversizedImage) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: '图片不能超过 10MB' }, { status: 200 });
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[route:ocr] received images', {
        count: images.length,
        totalBytes: images.reduce((total, image) => total + image.size, 0),
        provider: formData?.get('provider'),
        model: formData?.get('model'),
        sourceLanguage: formData?.get('sourceLanguage'),
        hasBaseUrl: Boolean(String(formData?.get('baseUrl') || '').trim()),
      });
    }

    const texts: string[] = [];

    for (const image of images) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const data = await recognizeTextFromImage({
        fileBuffer: buffer,
        mimeType: image.type,
        provider: String(formData?.get('provider') || ''),
        model: String(formData?.get('model') || ''),
        baseUrl: String(formData?.get('baseUrl') || ''),
        sourceLanguage: String(formData?.get('sourceLanguage') || ''),
      });
      texts.push(data.text);
    }

    return NextResponse.json<ApiResponse<{ text: string }>>({ ok: true, data: { text: mergeOcrTexts(texts) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR 识别失败';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 200 });
  }
}

function getUploadedImages(formData: FormData | null) {
  if (!formData) return [];

  const images = formData.getAll('images').filter((value): value is File => value instanceof File);
  const legacyImage = formData.get('image');

  if (legacyImage instanceof File) {
    images.push(legacyImage);
  }

  return images;
}

function mergeOcrTexts(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .join('\n\n');
}
