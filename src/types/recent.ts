import type { AnalysisResult, Language } from '../types';

export interface RecentStudyRecord {
  id: string;
  title: string;
  sourceText: string;
  result: AnalysisResult;
  sourceLanguage: Language;
  targetLanguage: Language;
  createdAt: string;
  updatedAt: string;
  excerpt: string;
  textLength: number;
}
