import type { AppPreferences } from '../../src/types';

const preferencesStorageKey = 'textlingo-preferences';

export const defaultPreferences: AppPreferences = {
  sourceLanguage: 'English',
  targetLanguage: 'Chinese',
  autoGenerateTitle: true,
  autoGenerateTranslation: true,
  autoGenerateKnowledge: true,
  autoGenerateQuiz: true,
  recordHistory: true,
  markdownExportStyle: 'obsidian',
  enableDifficultyRating: true,
  knowledgeDetailLevel: 'medium',
  quizQuestionTypes: {
    single: true,
    multiple: true,
  },
};

export function readPreferences(): AppPreferences {
  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const saved = localStorage.getItem(preferencesStorageKey);
    return normalizePreferences(saved ? JSON.parse(saved) : null);
  } catch {
    return defaultPreferences;
  }
}

export function writePreferences(value: AppPreferences) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(preferencesStorageKey, JSON.stringify(normalizePreferences(value)));
}

export function normalizePreferences(value: unknown): AppPreferences {
  if (!value || typeof value !== 'object') return defaultPreferences;

  const raw = value as Partial<AppPreferences>;
  const quizQuestionTypes = {
    ...defaultPreferences.quizQuestionTypes,
    ...(raw.quizQuestionTypes ?? {}),
  };

  if (!quizQuestionTypes.single && !quizQuestionTypes.multiple) {
    quizQuestionTypes.single = true;
  }

  return {
    ...defaultPreferences,
    ...raw,
    quizQuestionTypes,
    knowledgeDetailLevel:
      raw.knowledgeDetailLevel === 'basic' || raw.knowledgeDetailLevel === 'advanced'
        ? raw.knowledgeDetailLevel
        : 'medium',
  };
}
