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
  uiLanguage: 'zh',
  darkMode: false,
  enableDifficultyRating: true,
  knowledgeDetailLevel: 'medium',
  quizQuestionTypes: {
    single: true,
    multiple: true,
  },
  obsidian: {
    enableObsidianExport: false,
    vault: '',
    folder: 'TextLingo',
    fileNameTemplate: '{{date}} - {{title}}',
    openAfterCreate: true,
  },
  ocr: {
    enableOcr: false,
    provider: 'qwen-vl',
    model: 'qwen-vl-ocr-latest',
    baseUrl: '',
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
  try {
    localStorage.setItem(preferencesStorageKey, JSON.stringify(normalizePreferences(value)));
  } catch {
    // localStorage may be unavailable or full; keep the in-memory UI state usable.
  }
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
    uiLanguage: raw.uiLanguage === 'en' ? 'en' : 'zh',
    darkMode: Boolean(raw.darkMode),
    quizQuestionTypes,
    obsidian: {
      ...defaultPreferences.obsidian,
      ...(raw.obsidian ?? {}),
    },
    ocr: {
      ...defaultPreferences.ocr,
      ...(raw.ocr ?? {}),
      provider:
        raw.ocr?.provider === 'openai' || raw.ocr?.provider === 'custom'
          ? raw.ocr.provider
          : 'qwen-vl',
    },
    knowledgeDetailLevel:
      raw.knowledgeDetailLevel === 'basic' || raw.knowledgeDetailLevel === 'advanced'
        ? raw.knowledgeDetailLevel
        : 'medium',
  };
}
