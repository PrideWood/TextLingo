import type { AnalysisState } from '../../src/types';

const textStorageKey = 'textlingo-workspace-text';
const analysisStorageKey = 'textlingo-workspace-analysis';
const themeStorageKey = 'textlingo-theme';

export function readWorkspaceText() {
  if (typeof window === 'undefined') return '';

  try {
    return localStorage.getItem(textStorageKey) || '';
  } catch {
    return '';
  }
}

export function writeWorkspaceText(value: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(textStorageKey, value);
}

export function readWorkspaceAnalysis(): AnalysisState {
  if (typeof window === 'undefined') return { status: 'empty', data: {}, error: '' };

  try {
    const saved = localStorage.getItem(analysisStorageKey);
    if (!saved) return { status: 'empty', data: {}, error: '' };
    const parsed = JSON.parse(saved) as AnalysisState;
    const status =
      parsed.status === 'loading'
        ? parsed.data && Object.keys(parsed.data).length > 0
          ? 'success'
          : 'empty'
        : parsed.status ?? 'empty';

    return {
      status,
      data: parsed.data ?? {},
      error: parsed.error ?? '',
    };
  } catch {
    return { status: 'empty', data: {}, error: '' };
  }
}

export function writeWorkspaceAnalysis(value: AnalysisState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(analysisStorageKey, JSON.stringify(value));
}

export function clearWorkspaceStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(textStorageKey);
  localStorage.removeItem(analysisStorageKey);
}

export function readThemeState() {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(themeStorageKey) === 'dark';
  } catch {
    return false;
  }
}

export function writeThemeState(isDark: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(themeStorageKey, isDark ? 'dark' : 'light');
}
