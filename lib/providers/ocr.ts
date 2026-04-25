import type { OcrProvider } from '../../src/types';

type ChatContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>;

interface QwenVisionResponse {
  choices?: Array<{
    message?: {
      content?: ChatContent;
    };
  }>;
  error?: {
    message?: string;
  };
}

export interface OcrProviderInput {
  fileBuffer: Buffer;
  mimeType: string;
  provider?: OcrProvider | string;
  model?: string;
  baseUrl?: string;
}

interface OcrRuntimeConfig {
  apiKey: string | null;
  baseUrl: string;
  model: string;
  provider: string;
  endpoint: string;
}

const defaultBaseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const defaultModel = 'qwen-vl-ocr-latest';

export function hasOcrCredentials() {
  return Boolean(resolveOcrRuntimeConfig().apiKey);
}

export async function recognizeTextFromImage(input: OcrProviderInput): Promise<{ text: string }> {
  const provider = input.provider || process.env.OCR_PROVIDER || 'qwen-vl';

  if (provider !== 'qwen-vl' && provider !== 'openai' && provider !== 'custom') {
    throw new Error('当前 OCR provider 不支持图片输入，请在 Settings 中更换支持 vision 的 provider。');
  }

  return recognizeWithQwenVision({ ...input, provider });
}

export async function recognizeWithQwenVision(input: OcrProviderInput): Promise<{ text: string }> {
  const config = resolveOcrRuntimeConfig(input);

  if (!config.apiKey) {
    throw new Error('OCR API key 缺失，请在 .env.local 或部署环境变量中配置 OCR_API_KEY 或 QWEN_API_KEY。');
  }

  const dataUrl = buildImageDataUrl(input.fileBuffer, input.mimeType);

  if (process.env.NODE_ENV === 'development') {
    console.log('[provider:ocr] resolved runtime config', {
      provider: config.provider,
      hasKey: Boolean(config.apiKey),
      model: config.model,
      baseUrl: config.baseUrl,
      endpoint: config.endpoint,
      mimeType: input.mimeType,
      bytes: input.fileBuffer.byteLength,
    });
  }

  let response: Response;

  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
              {
                type: 'text',
                text: 'Extract all readable text from the image. Preserve line breaks and paragraph structure as much as possible. Do not translate. Do not summarize. Return only the recognized text.',
              },
            ],
          },
        ],
        stream: false,
      }),
    });
  } catch {
    throw new Error('OCR provider 请求失败');
  }

  const payload = (await response.json().catch(() => null)) as QwenVisionResponse | null;

  if (process.env.NODE_ENV === 'development') {
    console.log('[provider:ocr] response shape', {
      ok: response.ok,
      status: response.status,
      topLevelKeys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
      choiceCount: Array.isArray(payload?.choices) ? payload.choices.length : 0,
    });
  }

  if (!response.ok) {
    throw new Error(`OCR provider 请求失败（HTTP ${response.status}）`);
  }

  const text = extractTextFromQwenResponse(payload);
  if (!text) {
    throw new Error('未识别到文本');
  }

  return { text };
}

export function buildImageDataUrl(fileBuffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

export function extractTextFromQwenResponse(raw: QwenVisionResponse | null) {
  const content = raw?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (item.type === 'text' || typeof item.text === 'string' ? item.text?.trim() ?? '' : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
}

function resolveOcrRuntimeConfig(input?: Partial<OcrProviderInput>): OcrRuntimeConfig {
  const baseUrl = normalizeBaseUrl(input?.baseUrl || process.env.OCR_BASE_URL || process.env.QWEN_BASE_URL || defaultBaseUrl);
  const model = input?.model || process.env.OCR_MODEL || process.env.QWEN_VISION_MODEL || defaultModel;
  const provider = input?.provider || process.env.OCR_PROVIDER || 'qwen-vl';

  return {
    apiKey: process.env.OCR_API_KEY || process.env.QWEN_API_KEY || null,
    baseUrl,
    model,
    provider,
    endpoint: `${baseUrl}/chat/completions`,
  };
}

function normalizeBaseUrl(rawBaseUrl: string) {
  const trimmed = rawBaseUrl.trim() || defaultBaseUrl;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, '');
}
