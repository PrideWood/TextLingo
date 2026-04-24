interface ResponsesApiOutputTextContent {
  type?: string;
  text?: string;
}

interface ResponsesApiOutputItem {
  type?: string;
  content?: ResponsesApiOutputTextContent[];
}

interface ResponsesApiResponse {
  output_text?: string;
  output?: ResponsesApiOutputItem[];
  error?: {
    message?: string;
  };
}

interface ChatCompletionsResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

export interface LlmRuntimeConfig {
  apiKey: string | null;
  model: string;
  baseUrl: string;
  endpoint: string;
  apiStyle: 'responses' | 'chat_completions';
}

function normalizeBaseUrl(rawBaseUrl?: string | null) {
  const defaultBaseUrl = 'https://api.openai.com/v1';

  if (!rawBaseUrl?.trim()) {
    return defaultBaseUrl;
  }

  const trimmed = rawBaseUrl.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, '');
}

export function getLlmRuntimeConfig(prefixes: string[], fallbackModel = 'gpt-4.1-mini'): LlmRuntimeConfig {
  const keys = prefixes.map((prefix) => prefix.toUpperCase());
  const apiKey =
    keys.map((key) => process.env[`${key}_API_KEY`]).find(Boolean) ||
    process.env.OPENAI_API_KEY ||
    null;
  const model =
    keys.map((key) => process.env[`${key}_MODEL`]).find(Boolean) ||
    process.env.OPENAI_MODEL ||
    fallbackModel;
  const baseUrl = normalizeBaseUrl(
    keys.map((key) => process.env[`${key}_BASE_URL`]).find(Boolean) || process.env.OPENAI_BASE_URL,
  );
  const apiStyle =
    /deepseek/i.test(baseUrl) || /^deepseek-/i.test(model) ? 'chat_completions' : 'responses';
  const endpoint = `${baseUrl}/${apiStyle === 'chat_completions' ? 'chat/completions' : 'responses'}`;

  return {
    apiKey,
    model,
    baseUrl,
    endpoint,
    apiStyle,
  };
}

export function hasLlmCredentials(prefixes: string[]) {
  return Boolean(getLlmRuntimeConfig(prefixes).apiKey);
}

function extractResponsesText(payload: ResponsesApiResponse): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const contentTexts =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((content) => content.type === 'output_text' || typeof content.text === 'string')
      .map((content) => content.text?.trim() ?? '')
      .filter(Boolean) ?? [];

  if (contentTexts.length > 0) {
    return contentTexts.join('\n').trim();
  }

  throw new Error('模型结果解析失败');
}

function extractChatCompletionText(payload: ChatCompletionsResponse): string {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => item.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
      .trim();

    if (text) return text;
  }

  throw new Error('模型结果解析失败');
}

export function extractJson<T>(rawText: string): T {
  const trimmed = rawText.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate) as T;
}

export async function requestLlmText(params: {
  prefixes: string[];
  feature: string;
  systemPrompt: string;
  userPrompt: string;
  fallbackModel?: string;
  expectJson?: boolean;
}): Promise<string> {
  const { prefixes, feature, systemPrompt, userPrompt, fallbackModel, expectJson = false } = params;
  const config = getLlmRuntimeConfig(prefixes, fallbackModel);

  if (!config.apiKey) {
    throw new Error(`${feature}服务尚未配置`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[provider:${feature}] resolved runtime config`, {
      hasKey: Boolean(config.apiKey),
      model: config.model,
      baseUrl: config.baseUrl,
      endpoint: config.endpoint,
      apiStyle: config.apiStyle,
      promptLength: userPrompt.length,
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
      body: JSON.stringify(
        config.apiStyle === 'chat_completions'
          ? {
              model: config.model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              stream: false,
              response_format: expectJson ? { type: 'json_object' } : undefined,
            }
          : {
              model: config.model,
              input: [
                {
                  role: 'system',
                  content: [{ type: 'input_text', text: systemPrompt }],
                },
                {
                  role: 'user',
                  content: [{ type: 'input_text', text: userPrompt }],
                },
              ],
            },
      ),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[provider:${feature}] fetch failed before response`, {
        endpoint: config.endpoint,
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
    throw new Error(`${feature}服务网络请求失败`);
  }

  const payload = (await response.json().catch(() => null)) as
    | ResponsesApiResponse
    | ChatCompletionsResponse
    | null;

  if (process.env.NODE_ENV === 'development') {
    const responsePayload = payload as ResponsesApiResponse | null;
    const chatPayload = payload as ChatCompletionsResponse | null;
    console.log(`[provider:${feature}] response shape`, {
      ok: response.ok,
      status: response.status,
      endpoint: config.endpoint,
      apiStyle: config.apiStyle,
      topLevelKeys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
      hasOutputText: typeof responsePayload?.output_text === 'string',
      outputItemCount: Array.isArray(responsePayload?.output) ? responsePayload.output.length : 0,
      choiceCount: Array.isArray(chatPayload?.choices) ? chatPayload.choices.length : 0,
    });
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error?.message
        ? payload.error.message
        : `${feature}服务请求失败`;
    throw new Error(message);
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error(`${feature}服务返回格式异常`);
  }

  const text =
    config.apiStyle === 'chat_completions'
      ? extractChatCompletionText(payload as ChatCompletionsResponse)
      : extractResponsesText(payload as ResponsesApiResponse);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[provider:${feature}] extracted text preview`, text.slice(0, 100));
  }

  return text;
}
