import type { AnalysisResult, Language } from '../../src/types';
import type { RecentStudyRecord } from '../../src/types/recent';

const recentStorageKey = 'textlingo-recent-studies';
const maxRecentRecords = 10;

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `study-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeExcerpt(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function readRecentStudies(): RecentStudyRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(recentStorageKey);
    const records = saved ? (JSON.parse(saved) as RecentStudyRecord[]) : [];
    return Array.isArray(records) ? records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  } catch {
    return [];
  }
}

export function writeRecentStudies(records: RecentStudyRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(recentStorageKey, JSON.stringify(records.slice(0, maxRecentRecords)));
  } catch {
    // Keep the app usable if localStorage is unavailable or quota is exceeded.
  }
}

export function saveRecentStudy(input: {
  sourceText: string;
  result: AnalysisResult;
  sourceLanguage: Language;
  targetLanguage: Language;
}) {
  const now = new Date().toISOString();
  const records = readRecentStudies();
  const title = input.result.title?.trim() || 'Untitled Language Note';
  const existingIndex = records.findIndex((record) => record.sourceText === input.sourceText && record.title === title);
  const existing = existingIndex >= 0 ? records[existingIndex] : null;
  const record: RecentStudyRecord = {
    id: existing?.id || makeId(),
    title,
    sourceText: input.sourceText,
    result: input.result,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    excerpt: makeExcerpt(input.sourceText),
    textLength: input.sourceText.length,
  };

  const next = [record, ...records.filter((item) => item.id !== record.id)];
  writeRecentStudies(next);
  return record;
}

export function deleteRecentStudy(id: string) {
  writeRecentStudies(readRecentStudies().filter((record) => record.id !== id));
}

export function clearRecentStudies() {
  writeRecentStudies([]);
}
