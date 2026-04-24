'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { writePreferences } from '../../../lib/storage/preferences';
import type { AppPreferences, Language } from '../../types';

const languages: Language[] = ['English', 'Japanese', 'French', 'Chinese'];

interface SettingsModalProps {
  open: boolean;
  preferences: AppPreferences;
  onSave: (preferences: AppPreferences) => void;
  onClose: () => void;
}

export function SettingsModal({ open, preferences, onSave, onClose }: SettingsModalProps) {
  const [draft, setDraft] = useState(preferences);
  const [quizTypeError, setQuizTypeError] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(preferences);
      setQuizTypeError('');
    }
  }, [open, preferences]);

  if (!open) return null;

  const save = () => {
    if (!draft.quizQuestionTypes.single && !draft.quizQuestionTypes.multiple) {
      const normalizedDraft = ensureQuestionType(draft);
      setDraft(normalizedDraft);
      setQuizTypeError('At least one question type is required. 已自动保留单选题。');
      return;
    }
    writePreferences(draft);
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8" onMouseDown={onClose}>
      <section
        className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Settings</p>
            <h2 className="section-title">学习设置</h2>
          </div>
          <button
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="关闭设置"
            title="关闭设置"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">默认原文语言</span>
            <select
              className="input"
              value={draft.sourceLanguage}
              onChange={(event) => setDraft({ ...draft, sourceLanguage: event.target.value as Language })}
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
              value={draft.targetLanguage}
              onChange={(event) => setDraft({ ...draft, targetLanguage: event.target.value as Language })}
            >
              {languages.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ToggleRow label="自动生成标题" checked={draft.autoGenerateTitle} onChange={(checked) => setDraft({ ...draft, autoGenerateTitle: checked })} />
          <ToggleRow label="自动生成译文" checked={draft.autoGenerateTranslation} onChange={(checked) => setDraft({ ...draft, autoGenerateTranslation: checked })} />
          <ToggleRow label="自动提取知识点" checked={draft.autoGenerateKnowledge} onChange={(checked) => setDraft({ ...draft, autoGenerateKnowledge: checked })} />
          <ToggleRow label="自动生成练习题" checked={draft.autoGenerateQuiz} onChange={(checked) => setDraft({ ...draft, autoGenerateQuiz: checked })} />
          <ToggleRow label="记录学习历史" checked={draft.recordHistory} onChange={(checked) => setDraft({ ...draft, recordHistory: checked })} />
          <ToggleRow
            label="启用文章难度评级"
            checked={draft.enableDifficultyRating}
            onChange={(checked) => setDraft({ ...draft, enableDifficultyRating: checked })}
          />
        </div>

        <label className="mt-5 block">
          <span className="field-label">Knowledge detail level</span>
          <select
            className="input"
            value={draft.knowledgeDetailLevel}
            onChange={(event) =>
              setDraft({ ...draft, knowledgeDetailLevel: event.target.value as AppPreferences['knowledgeDetailLevel'] })
            }
          >
            <option value="basic">Basic - more detailed, broader coverage</option>
            <option value="medium">Medium - balanced learning points</option>
            <option value="advanced">Advanced - fewer, more selective points</option>
          </select>
        </label>

        <div className="mt-5">
          <span className="field-label">Quiz question types</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleRow
              label="Generate single-choice questions"
              checked={draft.quizQuestionTypes.single}
              onChange={(checked) =>
                setDraft({ ...draft, quizQuestionTypes: { ...draft.quizQuestionTypes, single: checked } })
              }
            />
            <ToggleRow
              label="Generate multiple-choice questions"
              checked={draft.quizQuestionTypes.multiple}
              onChange={(checked) =>
                setDraft({ ...draft, quizQuestionTypes: { ...draft.quizQuestionTypes, multiple: checked } })
              }
            />
          </div>
          {quizTypeError ? <p className="mt-2 text-xs text-coral">{quizTypeError}</p> : null}
        </div>

        <label className="mt-5 block">
          <span className="field-label">Markdown 导出偏好</span>
          <select
            className="input"
            value={draft.markdownExportStyle}
            onChange={(event) => setDraft({ ...draft, markdownExportStyle: event.target.value as AppPreferences['markdownExportStyle'] })}
          >
            <option value="obsidian">Obsidian Friendly</option>
          </select>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" type="button" onClick={onClose}>
            关闭
          </button>
          <button className="btn-primary" type="button" onClick={save}>
            保存设置
          </button>
        </div>
      </section>
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
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-black/10 bg-zinc-50 px-4 py-3 transition hover:border-mint/50 dark:border-white/10 dark:bg-zinc-950">
      <input type="checkbox" className="h-4 w-4 accent-mint" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="text-sm font-medium text-zinc-900 dark:text-white">{label}</span>
    </label>
  );
}
