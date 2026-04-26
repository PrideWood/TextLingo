import { clearAccessGrant, getStoredAccessCode } from './access';
import type { ApiResponse } from '../../src/types';

export class AccessUnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AccessUnauthorizedError';
  }
}

export function isAccessUnauthorizedError(error: unknown): error is AccessUnauthorizedError {
  return error instanceof AccessUnauthorizedError;
}

export async function fetchWithAccess(input: string | URL, init: globalThis.RequestInit = {}) {
  const headers = new Headers(init.headers);
  const accessCode = getStoredAccessCode();

  if (accessCode) {
    headers.set('x-textlingo-access-code', accessCode);
  }

  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      headers,
    });
  } catch {
    throw new Error('服务连接失败，请确认本地开发服务器正在运行，然后重试。');
  }

  if (response.status === 401) {
    clearAccessGrant();
    throw new AccessUnauthorizedError('访问码无效或已失效，请重新输入。');
  }

  return response;
}

export async function readApiResponse<T>(response: Response, fallbackMessage = '服务请求失败'): Promise<ApiResponse<T>> {
  const text = await response.text().catch(() => '');
  const trimmed = text.trim();

  if (trimmed) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;

      if (parsed && typeof parsed === 'object' && typeof (parsed as ApiResponse<T>).ok === 'boolean') {
        return parsed as ApiResponse<T>;
      }

      if (parsed && typeof parsed === 'object') {
        const raw = parsed as { error?: unknown; message?: unknown };
        const message = typeof raw.error === 'string' ? raw.error : typeof raw.message === 'string' ? raw.message : '';
        return { ok: false, error: message || buildResponseError(response, fallbackMessage) };
      }
    } catch {
      return { ok: false, error: buildNonJsonResponseError(response, fallbackMessage, trimmed) };
    }
  }

  return { ok: false, error: buildResponseError(response, fallbackMessage, '响应为空') };
}

export function shouldRetryApiResponse(response: Response) {
  return response.status === 408 || response.status === 429 || response.status >= 500;
}

export function shouldRetryApiError(error: string) {
  return error.includes('错误页面') || error.includes('无法解析') || error.includes('响应为空');
}

function buildNonJsonResponseError(response: Response, fallbackMessage: string, body: string) {
  if (looksLikeHtml(body)) {
    return buildResponseError(response, fallbackMessage, '服务临时返回了错误页面，可能是请求超时或开发服务器正在重载');
  }

  return buildResponseError(response, fallbackMessage, '服务返回了无法解析的响应');
}

function buildResponseError(response: Response, fallbackMessage: string, detail?: string) {
  const statusText = response.status ? `HTTP ${response.status}` : '网络响应异常';
  return `${fallbackMessage}（${statusText}${detail ? `，${detail}` : ''}）`;
}

function looksLikeHtml(value: string) {
  return /^<!doctype html/i.test(value) || /^<html[\s>]/i.test(value);
}
