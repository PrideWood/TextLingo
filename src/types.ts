export type Language = 'English' | 'Japanese' | 'French' | 'Chinese';

export type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

export type MarkdownExportStyle = 'obsidian';

export type OcrProvider = 'qwen-vl' | 'openai' | 'custom';
export type UiLanguage = 'zh' | 'en';
export type AppearanceMode = 'light' | 'dark' | 'system';

export interface AnalysisRequest {
  text: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  options?: AnalysisOptions;
}

export interface KnowledgeItem {
  id?: string;
  term: string;
  explanation: string;
  sourceSnippet: string;
  note?: string;
  name?: string;
  sourceExcerpt?: string;
  tip?: string;
}

export interface KnowledgeSection {
  title: string;
  intro: string;
  items: KnowledgeItem[];
}

export interface KnowledgeResult {
  vocabulary: KnowledgeItem[];
  expressions: KnowledgeItem[];
  grammar: KnowledgeItem[];
}

export type QuizType = 'single' | 'multiple';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options: string[];
  answer: string[];
  explanation: string;
}

export interface TtsResult {
  model: string;
  voice: string;
  speed: string;
  audioUrl: string | null;
  message: string;
}

export interface TitleResult {
  title: string;
}

export interface TranslationResult {
  translation: string;
}

export type KnowledgeDetailLevel = 'basic' | 'medium' | 'advanced';

export interface QuizQuestionTypes {
  single: boolean;
  multiple: boolean;
}

export interface AnalysisOptions {
  generateTitle: boolean;
  generateTranslation: boolean;
  extractKnowledge: boolean;
  generateQuiz: boolean;
  enableDifficultyRating: boolean;
  knowledgeDetailLevel: KnowledgeDetailLevel;
  quizQuestionTypes: QuizQuestionTypes;
}

export interface DifficultyRating {
  stars: 1 | 2 | 3 | 4 | 5;
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  label: string;
  reason: string;
}

export interface AnalysisResult {
  title: string;
  originalText: string;
  translation: string;
  difficulty?: DifficultyRating | null;
  knowledge: KnowledgeResult;
  quiz: QuizQuestion[];
  tts?: TtsResult;
}

export interface AnalysisState {
  status: RequestStatus;
  data: Partial<AnalysisResult>;
  error: string;
}

export interface ServiceStatuses {
  title: boolean;
  translation: boolean;
  knowledge: boolean;
  quiz: boolean;
  tts: boolean;
}

export interface ApiConfigGroup {
  provider: string;
  apiKey: string;
  model?: string;
  voice?: string;
}

export interface ApiSettings {
  translation: ApiConfigGroup;
  tts: ApiConfigGroup;
  quiz: ApiConfigGroup;
}

export interface AppPreferences {
  sourceLanguage: Language;
  targetLanguage: Language;
  autoGenerateTitle: boolean;
  autoGenerateTranslation: boolean;
  autoGenerateKnowledge: boolean;
  autoGenerateQuiz: boolean;
  recordHistory: boolean;
  markdownExportStyle: MarkdownExportStyle;
  uiLanguage: UiLanguage;
  appearanceMode: AppearanceMode;
  enableDifficultyRating: boolean;
  knowledgeDetailLevel: KnowledgeDetailLevel;
  quizQuestionTypes: QuizQuestionTypes;
  obsidian: ObsidianPreferences;
  ocr: OcrPreferences;
}

export interface ObsidianPreferences {
  enableObsidianExport: boolean;
  vault: string;
  folder: string;
  fileNameTemplate: string;
  openAfterCreate: boolean;
}

export interface OcrPreferences {
  enableOcr: boolean;
  provider: OcrProvider;
  model: string;
  baseUrl?: string;
}

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export interface LearningHistory {
  entriesByDate: Record<string, number>;
  lastActiveDate?: string;
}

export interface LearningSummary {
  totalCount: number;
  todayCount: number;
  recent7DaysCount: number;
  streakCount: number;
  heatmap: Array<{ date: string; count: number }>;
}
