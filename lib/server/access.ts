import { NextResponse } from 'next/server';
import type { ApiResponse } from '../../src/types';

const accessHeaderName = 'x-textlingo-access-code';

export function getAllowedAccessCodes() {
  const single = process.env.TEXTLINGO_ACCESS_CODE;
  const multiple = process.env.TEXTLINGO_ACCESS_CODES;
  const codes = [single, ...(multiple?.split(',') ?? [])]
    .map((code) => code?.trim())
    .filter((code): code is string => Boolean(code));

  return Array.from(new Set(codes));
}

export function isAccessConfigured() {
  return getAllowedAccessCodes().length > 0;
}

export function verifyAccessCode(code: string | null | undefined): boolean {
  const allowedCodes = getAllowedAccessCodes();

  if (allowedCodes.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }

  const candidate = code?.trim();
  if (!candidate) return false;

  return allowedCodes.includes(candidate);
}

export function getAccessCodeFromRequest(request: Request) {
  return request.headers.get(accessHeaderName);
}

export function requireAccess(request: Request) {
  if (verifyAccessCode(getAccessCodeFromRequest(request))) {
    return null;
  }

  return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Unauthorized' }, { status: 401 });
}
