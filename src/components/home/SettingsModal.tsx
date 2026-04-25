'use client';

import { X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
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

  const isZh = draft.uiLanguage === 'zh';
  const label = {
    settings: isZh ? '设置' : 'Settings',
    learning: isZh ? '学习设置' : 'Learning settings',
    interface: isZh ? '界面与外观' : 'Interface & appearance',
    language: isZh ? '界面语言' : 'Interface language',
    darkMode: isZh ? '夜间模式' : 'Dark mode',
    sourceLanguage: isZh ? '默认原文语言' : 'Default source language',
    targetLanguage: isZh ? '默认目标语言' : 'Default target language',
    generation: isZh ? '语言与生成' : 'Language & generation',
    autoTitle: isZh ? '自动生成标题' : 'Auto-generate title',
    autoTranslation: isZh ? '自动生成译文' : 'Generate translation',
    autoKnowledge: isZh ? '自动提取知识点' : 'Extract learning points',
    autoQuiz: isZh ? '自动生成练习题' : 'Generate quiz',
    recordHistory: isZh ? '记录学习历史' : 'Record learning history',
    difficulty: isZh ? '启用文章难度评级' : 'Enable difficulty rating',
    detailLevel: isZh ? '知识点详细程度' : 'Knowledge detail level',
    quizTypes: isZh ? '练习题类型' : 'Quiz question types',
    single: isZh ? '生成单选题' : 'Single choice',
    multiple: isZh ? '生成多选题' : 'Multiple choice',
    obsidian: isZh ? 'Obsidian 导出' : 'Obsidian Export',
    obsidianHint: isZh
      ? '需要本机已安装 Obsidian，并且 vault 名称填写正确。'
      : 'Requires Obsidian installed locally and a correct vault name.',
    enableObsidian: isZh ? '启用 Obsidian 导出' : 'Enable Obsidian export',
    openAfterCreate: isZh ? '创建后打开' : 'Open after create',
    vault: isZh ? 'Vault 名称' : 'Vault name',
    folder: isZh ? '文件夹' : 'Folder',
    fileTemplate: isZh ? '文件名模板' : 'File name template',
    ocr: isZh ? 'OCR / 图片识别' : 'OCR / Image recognition',
    ocrHint: isZh
      ? 'API key 只通过 .env.local 或部署环境变量配置，不会保存在前端。'
      : 'API keys are configured through .env.local or deployment variables only.',
    enableOcr: isZh ? '启用 OCR' : 'Enable OCR',
    ocrProvider: isZh ? 'OCR 服务' : 'OCR provider',
    ocrModel: isZh ? 'OCR 模型' : 'OCR model',
    ocrBaseUrl: isZh ? 'OCR Base URL' : 'OCR base URL',
    close: isZh ? '关闭' : 'Close',
    save: isZh ? '保存设置' : 'Save settings',
  };

  const save = () => {
    if (!draft.quizQuestionTypes.single && !draft.quizQuestionTypes.multiple) {
      setDraft(ensureQuestionType(draft));
      setQuizTypeError(isZh ? '至少需要保留一种题型，已自动保留单选题。' : 'At least one question type is required. Single choice was restored.');
      return;
    }

    writePreferences(draft);
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8" onMouseDown={onClose}>
      <section
        className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{label.settings}</p>
            <h2 className="section-title">{label.learning}</h2>
          </div>
          <button
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label={label.close}
            title={label.close}
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <SettingsGroup title={label.interface}>
          <SettingRow label={label.language}>
            <select
              className="input h-9 w-[180px] py-1.5"
              value={draft.uiLanguage}
              onChange={(event) => setDraft({ ...draft, uiLanguage: event.target.value as AppPreferences['uiLanguage'] })}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </SettingRow>
          <SettingRow label={label.darkMode}>
            <Switch checked={draft.darkMode} onChange={(checked) => setDraft({ ...draft, darkMode: checked })} />
          </SettingRow>
        </SettingsGroup>

        <SettingsGroup title={label.generation}>
          <SettingRow label={label.sourceLanguage}>
            <select
              className="input h-9 w-[180px] py-1.5"
              value={draft.sourceLanguage}
              onChange={(event) => setDraft({ ...draft, sourceLanguage: event.target.value as Language })}
            >
              {languages.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label={label.targetLanguage}>
            <select
              className="input h-9 w-[180px] py-1.5"
              value={draft.targetLanguage}
              onChange={(event) => setDraft({ ...draft, targetLanguage: event.target.value as Language })}
            >
              {languages.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label={label.autoTitle}>
            <Switch checked={draft.autoGenerateTitle} onChange={(checked) => setDraft({ ...draft, autoGenerateTitle: checked })} />
          </SettingRow>
          <SettingRow label={label.autoTranslation}>
            <Switch checked={draft.autoGenerateTranslation} onChange={(checked) => setDraft({ ...draft, autoGenerateTranslation: checked })} />
          </SettingRow>
          <SettingRow label={label.autoKnowledge}>
            <Switch checked={draft.autoGenerateKnowledge} onChange={(checked) => setDraft({ ...draft, autoGenerateKnowledge: checked })} />
          </SettingRow>
          <SettingRow label={label.autoQuiz}>
            <Switch checked={draft.autoGenerateQuiz} onChange={(checked) => setDraft({ ...draft, autoGenerateQuiz: checked })} />
          </SettingRow>
          <SettingRow label={label.recordHistory}>
            <Switch checked={draft.recordHistory} onChange={(checked) => setDraft({ ...draft, recordHistory: checked })} />
          </SettingRow>
          <SettingRow label={label.difficulty}>
            <Switch checked={draft.enableDifficultyRating} onChange={(checked) => setDraft({ ...draft, enableDifficultyRating: checked })} />
          </SettingRow>
          <SettingRow label={label.detailLevel}>
            <select
              className="input h-9 w-[260px] py-1.5"
              value={draft.knowledgeDetailLevel}
              onChange={(event) => setDraft({ ...draft, knowledgeDetailLevel: event.target.value as AppPreferences['knowledgeDetailLevel'] })}
            >
              <option value="basic">Basic - detailed</option>
              <option value="medium">Medium - balanced</option>
              <option value="advanced">Advanced - selective</option>
            </select>
          </SettingRow>
          <SettingRow label={label.quizTypes}>
            <div className="flex flex-wrap justify-end gap-3">
              <InlineCheck label={label.single} checked={draft.quizQuestionTypes.single} onChange={(checked) => setDraft({ ...draft, quizQuestionTypes: { ...draft.quizQuestionTypes, single: checked } })} />
              <InlineCheck label={label.multiple} checked={draft.quizQuestionTypes.multiple} onChange={(checked) => setDraft({ ...draft, quizQuestionTypes: { ...draft.quizQuestionTypes, multiple: checked } })} />
            </div>
          </SettingRow>
          {quizTypeError ? <p className="px-1 text-xs text-coral">{quizTypeError}</p> : null}
        </SettingsGroup>

        <SettingsGroup title={label.obsidian} description={label.obsidianHint}>
          <SettingRow label={label.enableObsidian}>
            <Switch checked={draft.obsidian.enableObsidianExport} onChange={(checked) => setDraft({ ...draft, obsidian: { ...draft.obsidian, enableObsidianExport: checked } })} />
          </SettingRow>
          <SettingRow label={label.openAfterCreate}>
            <Switch checked={draft.obsidian.openAfterCreate} onChange={(checked) => setDraft({ ...draft, obsidian: { ...draft.obsidian, openAfterCreate: checked } })} />
          </SettingRow>
          <SettingRow label={label.vault}>
            <input className="input h-9 w-[260px] py-1.5" value={draft.obsidian.vault} placeholder="My Vault" onChange={(event) => setDraft({ ...draft, obsidian: { ...draft.obsidian, vault: event.target.value } })} />
          </SettingRow>
          <SettingRow label={label.folder}>
            <input className="input h-9 w-[260px] py-1.5" value={draft.obsidian.folder} placeholder="TextLingo" onChange={(event) => setDraft({ ...draft, obsidian: { ...draft.obsidian, folder: event.target.value } })} />
          </SettingRow>
          <SettingRow label={label.fileTemplate}>
            <input className="input h-9 w-[300px] py-1.5" value={draft.obsidian.fileNameTemplate} placeholder="{{date}} - {{title}}" onChange={(event) => setDraft({ ...draft, obsidian: { ...draft.obsidian, fileNameTemplate: event.target.value } })} />
          </SettingRow>
        </SettingsGroup>

        <SettingsGroup title={label.ocr} description={label.ocrHint}>
          <SettingRow label={label.enableOcr}>
            <Switch checked={draft.ocr.enableOcr} onChange={(checked) => setDraft({ ...draft, ocr: { ...draft.ocr, enableOcr: checked } })} />
          </SettingRow>
          <SettingRow label={label.ocrProvider}>
            <select className="input h-9 w-[260px] py-1.5" value={draft.ocr.provider} onChange={(event) => setDraft({ ...draft, ocr: { ...draft.ocr, provider: event.target.value as AppPreferences['ocr']['provider'] } })}>
              <option value="qwen-vl">Qwen OCR / Qwen-VL</option>
              <option value="openai">OpenAI-compatible vision</option>
              <option value="custom">Custom vision endpoint</option>
            </select>
          </SettingRow>
          <SettingRow label={label.ocrModel}>
            <input className="input h-9 w-[260px] py-1.5" value={draft.ocr.model} placeholder="qwen-vl-ocr-latest" onChange={(event) => setDraft({ ...draft, ocr: { ...draft.ocr, model: event.target.value } })} />
          </SettingRow>
          <SettingRow label={label.ocrBaseUrl}>
            <input className="input h-9 w-[300px] py-1.5" value={draft.ocr.baseUrl ?? ''} placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1" onChange={(event) => setDraft({ ...draft, ocr: { ...draft.ocr, baseUrl: event.target.value } })} />
          </SettingRow>
        </SettingsGroup>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" type="button" onClick={onClose}>
            {label.close}
          </button>
          <button className="btn-primary" type="button" onClick={save}>
            {label.save}
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

function SettingsGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      {description ? <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p> : null}
      <div className="mt-2 divide-y divide-black/10 dark:divide-white/10">{children}</div>
    </section>
  );
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-12 items-center justify-between gap-4 px-1">
      <span className="min-w-0 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
      <div className="flex h-full shrink-0 items-center justify-end">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-mint' : 'bg-zinc-300 dark:bg-zinc-700'}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

function InlineCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
      <input type="checkbox" className="h-4 w-4 accent-mint" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
