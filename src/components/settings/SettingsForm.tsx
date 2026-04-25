'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readPreferences, writePreferences } from '../../../lib/storage/preferences';
import { writeThemeState } from '../../../lib/storage/workspace';
import type { AppPreferences, Language } from '../../types';

const languages: Language[] = ['English', 'Japanese', 'French', 'Chinese'];

export function SettingsForm() {
  const [preferences, setPreferences] = useState<AppPreferences>(readPreferences);

  useEffect(() => {
    writePreferences(preferences);
    const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark =
      preferences.appearanceMode === 'dark' ||
      (preferences.appearanceMode === 'system' && systemQuery.matches);
    document.documentElement.classList.toggle('dark', isDark);
    writeThemeState(isDark);
  }, [preferences]);

  return (
    <div className="min-h-screen bg-cloud text-ink dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-black/10 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="eyebrow">Settings</p>
            <h1 className="section-title">把偏好移到这里，主页面只保留分析动作</h1>
          </div>
          <Link className="btn-secondary" href="/">
            返回工作台
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <section className="panel space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="field-label">界面语言 / Interface language</span>
              <select
                className="input"
                value={preferences.uiLanguage}
                onChange={(event) => setPreferences({ ...preferences, uiLanguage: event.target.value as AppPreferences['uiLanguage'] })}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>
              <span className="field-label">外观颜色 / Appearance</span>
              <select
                className="input"
                value={preferences.appearanceMode}
                onChange={(event) => setPreferences({ ...preferences, appearanceMode: event.target.value as AppPreferences['appearanceMode'] })}
              >
                <option value="light">浅色 / Light</option>
                <option value="dark">深色 / Dark</option>
                <option value="system">跟随系统 / System</option>
              </select>
            </label>
            <label>
              <span className="field-label">默认原文语言</span>
              <select
                className="input"
                value={preferences.sourceLanguage}
                onChange={(event) => setPreferences({ ...preferences, sourceLanguage: event.target.value as Language })}
              >
                {languages.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">默认目标语言</span>
              <select
                className="input"
                value={preferences.targetLanguage}
                onChange={(event) => setPreferences({ ...preferences, targetLanguage: event.target.value as Language })}
              >
                {languages.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <ToggleRow
              label="自动生成标题"
              checked={preferences.autoGenerateTitle}
              onChange={(checked) => setPreferences({ ...preferences, autoGenerateTitle: checked })}
            />
            <ToggleRow
              label="自动生成译文"
              checked={preferences.autoGenerateTranslation}
              onChange={(checked) => setPreferences({ ...preferences, autoGenerateTranslation: checked })}
            />
            <ToggleRow
              label="自动提取知识点"
              checked={preferences.autoGenerateKnowledge}
              onChange={(checked) => setPreferences({ ...preferences, autoGenerateKnowledge: checked })}
            />
            <ToggleRow
              label="自动生成练习题"
              checked={preferences.autoGenerateQuiz}
              onChange={(checked) => setPreferences({ ...preferences, autoGenerateQuiz: checked })}
            />
            <ToggleRow
              label="记录学习历史"
              checked={preferences.recordHistory}
              onChange={(checked) => setPreferences({ ...preferences, recordHistory: checked })}
            />
            <ToggleRow
              label="启用文章难度评级"
              checked={preferences.enableDifficultyRating}
              onChange={(checked) => setPreferences({ ...preferences, enableDifficultyRating: checked })}
            />
          </div>

          <label>
            <span className="field-label">Knowledge detail level</span>
            <select
              className="input"
              value={preferences.knowledgeDetailLevel}
              onChange={(event) =>
                setPreferences({ ...preferences, knowledgeDetailLevel: event.target.value as AppPreferences['knowledgeDetailLevel'] })
              }
            >
              <option value="basic">Basic - more detailed, broader coverage</option>
              <option value="medium">Medium - balanced learning points</option>
              <option value="advanced">Advanced - fewer, more selective points</option>
            </select>
          </label>

          <div>
            <span className="field-label">Quiz question types</span>
            <div className="grid gap-3 md:grid-cols-2">
              <ToggleRow
                label="Generate single-choice questions"
                checked={preferences.quizQuestionTypes.single}
                onChange={(checked) =>
                  setPreferences(ensureQuestionType({ ...preferences, quizQuestionTypes: { ...preferences.quizQuestionTypes, single: checked } }))
                }
              />
              <ToggleRow
                label="Generate multiple-choice questions"
                checked={preferences.quizQuestionTypes.multiple}
                onChange={(checked) =>
                  setPreferences(ensureQuestionType({ ...preferences, quizQuestionTypes: { ...preferences.quizQuestionTypes, multiple: checked } }))
                }
              />
            </div>
          </div>

          <div className="rounded-md border border-black/10 bg-zinc-50 p-4 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            设置会自动保存到 localStorage。主页面会读取这里的默认语言和自动分析偏好，尽量把重复设置从日常流程里拿掉。
          </div>
        </section>
      </main>
    </div>
  );
}

function ensureQuestionType(preferences: AppPreferences): AppPreferences {
  if (preferences.quizQuestionTypes.single || preferences.quizQuestionTypes.multiple) {
    return preferences;
  }

  return {
    ...preferences,
    quizQuestionTypes: {
      single: true,
      multiple: false,
    },
  };
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="option-card items-center">
      <input type="checkbox" className="h-4 w-4 accent-mint" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="font-medium text-zinc-900 dark:text-white">{label}</span>
    </label>
  );
}
