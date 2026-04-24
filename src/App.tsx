'use client';

import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { recordLearningActivity } from '../lib/storage/progress';
import { readPreferences, writePreferences } from '../lib/storage/preferences';
import { clearRecentStudies, deleteRecentStudy, readRecentStudies, saveRecentStudy } from '../lib/storage/recent';
import { clearWorkspaceStorage, readThemeState, readWorkspaceAnalysis, readWorkspaceText, writeThemeState, writeWorkspaceAnalysis, writeWorkspaceText } from '../lib/storage/workspace';
import { HomeView } from './components/home/HomeView';
import { LoadingView } from './components/home/LoadingView';
import { StudyWorkspace } from './components/study/StudyWorkspace';
import type {
  AnalysisRequest,
  AnalysisResult,
  AnalysisState,
  ApiResponse,
} from './types';
import type { RecentStudyRecord } from './types/recent';

type AppView = 'start' | 'loading' | 'study';

interface CurrentStudyContext {
  sourceText: string;
  sourceLanguage: AnalysisRequest['sourceLanguage'];
  targetLanguage: AnalysisRequest['targetLanguage'];
}

async function postApi<T>(endpoint: string, payload: AnalysisRequest): Promise<T> {
  let response: Response;

  if (process.env.NODE_ENV === 'development') {
    console.log('[client:analyze] sending payload', {
      endpoint,
      sourceLanguage: payload.sourceLanguage,
      targetLanguage: payload.targetLanguage,
      options: payload.options,
      textLength: payload.text.length,
      textPreview: payload.text.replace(/\s+/g, ' ').trim().slice(0, 120),
    });
  }

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('服务请求失败');
  }

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (process.env.NODE_ENV === 'development') {
    console.log('[client:analyze] received response shape', {
      endpoint,
      status: response.status,
      ok: json?.ok,
      hasData: Boolean(json && 'data' in json && json.data),
      dataKeys: json && 'data' in json && json.data && typeof json.data === 'object' ? Object.keys(json.data) : [],
      error: json && 'error' in json ? json.error : undefined,
    });
  }

  if (!json || typeof json !== 'object' || typeof json.ok !== 'boolean') {
    throw new Error(`服务返回了非标准 JSON 结构（${endpoint}）`);
  }

  if (!json.ok) {
    throw new Error(json.error || '服务请求失败');
  }

  return json.data;
}

export default function App() {
  const [text, setText] = useState(readWorkspaceText);
  const [preferences, setPreferences] = useState(readPreferences);
  const [isDark] = useState(readThemeState);
  const [analysis, setAnalysis] = useState<AnalysisState>(readWorkspaceAnalysis);
  const [view, setView] = useState<AppView>(() => {
    const saved = readWorkspaceAnalysis();
    return saved.status === 'success' && isCompleteAnalysisResult(saved.data) ? 'study' : 'start';
  });
  const [currentStudy, setCurrentStudy] = useState<CurrentStudyContext>(() => ({
    sourceText: readWorkspaceText(),
    sourceLanguage: readPreferences().sourceLanguage,
    targetLanguage: readPreferences().targetLanguage,
  }));
  const [recentRecords, setRecentRecords] = useState<RecentStudyRecord[]>([]);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    writeThemeState(isDark);
  }, [isDark]);

  useEffect(() => {
    writeWorkspaceText(text);
  }, [text]);

  useEffect(() => {
    writeWorkspaceAnalysis(analysis);
  }, [analysis]);

  useEffect(() => {
    setRecentRecords(readRecentStudies());
  }, []);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setInputError('先粘贴一段想学习的原文，再开始分析。');
      setAnalysis({ status: 'empty', data: {}, error: '' });
      setView('start');
      return;
    }

    setInputError('');
    setAnalysis({ status: 'loading', data: {}, error: '' });
    setView('loading');

    const payload: AnalysisRequest = {
      text,
      sourceLanguage: preferences.sourceLanguage,
      targetLanguage: preferences.targetLanguage,
      options: {
        generateTitle: preferences.autoGenerateTitle,
        generateTranslation: preferences.autoGenerateTranslation,
        extractKnowledge: preferences.autoGenerateKnowledge,
        generateQuiz: preferences.autoGenerateQuiz,
        enableDifficultyRating: preferences.enableDifficultyRating,
        knowledgeDetailLevel: preferences.knowledgeDetailLevel,
        quizQuestionTypes: preferences.quizQuestionTypes,
      },
    };

    try {
      const data = await postApi<AnalysisResult>('/api/analyze', payload);
      const sourceText = text.trim();
      setAnalysis({ status: 'success', data, error: '' });
      setCurrentStudy({
        sourceText,
        sourceLanguage: preferences.sourceLanguage,
        targetLanguage: preferences.targetLanguage,
      });
      saveRecentStudy({
        sourceText,
        result: data,
        sourceLanguage: preferences.sourceLanguage,
        targetLanguage: preferences.targetLanguage,
      });
      setRecentRecords(readRecentStudies());
      setView('study');

      if (preferences.recordHistory) {
        recordLearningActivity();
        setProgressRefreshKey((value) => value + 1);
      }
    } catch (error) {
      setAnalysis({
        status: 'error',
        data: {},
        error: error instanceof Error ? error.message : '服务请求失败',
      });
      setView('start');
    }
  };

  const handleClear = () => {
    setText('');
    setInputError('');
    setAnalysis({ status: 'empty', data: {}, error: '' });
    setView('start');
    clearWorkspaceStorage();
  };

  const handleBackToStart = () => {
    setView('start');
  };

  const handleOpenRecent = (record: RecentStudyRecord) => {
    setText(record.sourceText);
    setCurrentStudy({
      sourceText: record.sourceText,
      sourceLanguage: record.sourceLanguage,
      targetLanguage: record.targetLanguage,
    });
    setAnalysis({ status: 'success', data: record.result, error: '' });
    setInputError('');
    setView('study');
  };

  const handleDeleteRecent = (id: string) => {
    deleteRecentStudy(id);
    setRecentRecords(readRecentStudies());
  };

  const handleClearRecent = () => {
    clearRecentStudies();
    setRecentRecords([]);
  };

  const handlePreferencesChange = (nextPreferences: typeof preferences) => {
    setPreferences(nextPreferences);
    writePreferences(nextPreferences);
  };

  return (
    <div className="min-h-screen bg-cloud text-ink transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <div className="view-transition">
        {view === 'start' ? (
          <HomeView
            text={text}
            setText={setText}
            inputError={inputError}
            requestError={analysis.status === 'error' ? analysis.error : ''}
            sourceLanguage={preferences.sourceLanguage}
            targetLanguage={preferences.targetLanguage}
            preferences={preferences}
            recentRecords={recentRecords}
            progressRefreshKey={progressRefreshKey}
            onPreferencesChange={handlePreferencesChange}
            onAnalyze={handleAnalyze}
            onClearText={handleClear}
            onOpenRecent={handleOpenRecent}
            onDeleteRecent={handleDeleteRecent}
            onClearRecent={handleClearRecent}
          />
        ) : null}

        {view === 'loading' ? <LoadingView /> : null}

        {view === 'study' && analysis.status === 'success' && isCompleteAnalysisResult(analysis.data) ? (
          <main className="mx-auto max-w-7xl space-y-4 px-5 py-6">
            <button className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white" onClick={handleBackToStart}>
              <ArrowLeft size={16} />
              返回首页
            </button>
            <StudyWorkspace
              sourceText={currentStudy.sourceText.trim() || '暂无原文'}
              result={analysis.data}
              sourceLanguage={currentStudy.sourceLanguage}
              targetLanguage={currentStudy.targetLanguage}
            />
          </main>
        ) : null}
      </div>
    </div>
  );
}

function isCompleteAnalysisResult(value: Partial<AnalysisResult>): value is AnalysisResult {
  return (
    typeof value.title === 'string' &&
    typeof value.originalText === 'string' &&
    typeof value.translation === 'string' &&
    Boolean(value.knowledge) &&
    Array.isArray(value.knowledge?.vocabulary) &&
    Array.isArray(value.knowledge?.expressions) &&
    Array.isArray(value.knowledge?.grammar) &&
    Array.isArray(value.quiz)
  );
}
