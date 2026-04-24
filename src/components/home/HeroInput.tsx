'use client';

import { Settings, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { AppPreferences } from '../../types';
import { SettingsModal } from './SettingsModal';

interface HeroInputProps {
  text: string;
  setText: (value: string) => void;
  inputError: string;
  requestError: string;
  sourceLanguage: string;
  targetLanguage: string;
  preferences: AppPreferences;
  onPreferencesChange: (preferences: AppPreferences) => void;
  onAnalyze: () => void;
  onClear: () => void;
}

export function HeroInput({
  text,
  setText,
  inputError,
  requestError,
  sourceLanguage,
  targetLanguage,
  preferences,
  onPreferencesChange,
  onAnalyze,
  onClear,
}: HeroInputProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <section className="pt-8 text-center md:pt-14">
      <div className="mx-auto flex justify-center">
        <img src="/textlingo-logo.png" alt="TextLingo logo" className="h-auto w-full max-w-[360px] md:max-w-[460px]" />
      </div>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        粘贴真实语言素材，自动生成译文、知识点、练习题和可复制的 Markdown 笔记。
      </p>

      <div className="mt-8 rounded-2xl border border-black/10 bg-white p-3 text-left shadow-soft dark:border-white/10 dark:bg-zinc-900">
        <textarea
          className="min-h-[240px] w-full resize-y rounded-xl border-0 bg-transparent px-4 py-4 text-base leading-8 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500"
          placeholder="Paste a paragraph, article excerpt, or dialogue here..."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex flex-col gap-3 border-t border-black/10 px-2 pb-1 pt-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={() => setSettingsOpen(true)}
              aria-label="打开学习设置"
              title="打开学习设置"
              type="button"
            >
              <Settings size={17} />
            </button>
            <p className="min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">{sourceLanguage} → {targetLanguage}</p>
          </div>
          <div className="flex justify-end gap-2 sm:ml-auto">
            <button className="btn-secondary min-h-10 px-4 py-2" onClick={onClear} title="清空输入">
              <Trash2 size={16} />
              清空
            </button>
            <button className="btn-primary min-h-10 px-4 py-2" onClick={onAnalyze} disabled={!text.trim()}>
              <Sparkles size={16} />
              Analyze
            </button>
          </div>
        </div>
      </div>

      {inputError ? <p className="mt-3 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">{inputError}</p> : null}
      {requestError ? <p className="mt-3 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">{requestError}</p> : null}
      <SettingsModal
        open={settingsOpen}
        preferences={preferences}
        onSave={onPreferencesChange}
        onClose={() => setSettingsOpen(false)}
      />
    </section>
  );
}
