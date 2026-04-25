'use client';

import type { AppPreferences, UiLanguage } from '../../types';
import type { RecentStudyRecord } from '../../types/recent';
import { HeroInput } from './HeroInput';
import { HomeHeatmapCard } from './HomeHeatmapCard';
import { RecentList } from './RecentList';

interface HomeViewProps {
  text: string;
  setText: (value: string) => void;
  inputError: string;
  requestError: string;
  sourceLanguage: string;
  targetLanguage: string;
  uiLanguage: UiLanguage;
  preferences: AppPreferences;
  recentRecords: RecentStudyRecord[];
  progressRefreshKey: number;
  onPreferencesChange: (preferences: AppPreferences) => void;
  onAnalyze: (text?: string) => void;
  onClearText: () => void;
  onAccessExpired: (message: string) => void;
  onOpenRecent: (record: RecentStudyRecord) => void;
  onDeleteRecent: (id: string) => void;
  onClearRecent: () => void;
}

export function HomeView({
  text,
  setText,
  inputError,
  requestError,
  sourceLanguage,
  targetLanguage,
  uiLanguage,
  preferences,
  recentRecords,
  progressRefreshKey,
  onPreferencesChange,
  onAnalyze,
  onClearText,
  onAccessExpired,
  onOpenRecent,
  onDeleteRecent,
  onClearRecent,
}: HomeViewProps) {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-10">
      <HeroInput
        text={text}
        setText={setText}
        inputError={inputError}
        requestError={requestError}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        uiLanguage={uiLanguage}
        preferences={preferences}
        onPreferencesChange={onPreferencesChange}
        onAnalyze={onAnalyze}
        onClear={onClearText}
        onAccessExpired={onAccessExpired}
      />

      <section className="mt-7 grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
        <RecentList records={recentRecords} onOpen={onOpenRecent} onDelete={onDeleteRecent} onClear={onClearRecent} uiLanguage={uiLanguage} />
        <HomeHeatmapCard refreshKey={progressRefreshKey} uiLanguage={uiLanguage} />
      </section>
    </main>
  );
}
