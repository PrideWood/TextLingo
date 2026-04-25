import { clearAccessGrant, getStoredAccessCode } from './access';

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

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearAccessGrant();
    throw new AccessUnauthorizedError('访问码无效或已失效，请重新输入。');
  }

  return response;
}
