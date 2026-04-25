'use client';

import { ClipboardCopy, Copy, FileSymlink } from 'lucide-react';
import { useState } from 'react';
import { copyTextToClipboard } from '../../../lib/clipboard';
import {
  applyObsidianFileNameTemplate,
  buildObsidianNewNoteUri,
  openObsidianUri,
} from '../../../lib/integrations/obsidian';
import { readPreferences } from '../../../lib/storage/preferences';
import type { KnowledgeResult, QuizQuestion, UiLanguage } from '../../types';
import { buildKnowledgeMarkdown, buildQuizMarkdown } from './studyUtils';

interface ExportPageProps {
  title: string;
  markdown: string;
  translation?: string;
  knowledge: KnowledgeResult;
  quiz: QuizQuestion[];
  uiLanguage: UiLanguage;
}

export function ExportPage({ title, markdown, translation, knowledge, quiz, uiLanguage }: ExportPageProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState('');
  const [obsidianStatus, setObsidianStatus] = useState('');
  const [obsidianError, setObsidianError] = useState('');
  const preferences = readPreferences();
  const label = {
    copied: uiLanguage === 'zh' ? '已复制' : 'Copied',
    copyAll: uiLanguage === 'zh' ? '复制全部 Markdown' : 'Copy Markdown',
    copyTranslation: uiLanguage === 'zh' ? '复制译文' : 'Copy translation',
    copyKnowledge: uiLanguage === 'zh' ? '复制知识点' : 'Copy learning points',
    copyQuiz: uiLanguage === 'zh' ? '复制练习题' : 'Copy quiz',
    obsidian: uiLanguage === 'zh' ? '发送到 Obsidian' : 'Send to Obsidian',
  };

  const copy = async (key: string, value: string) => {
    setCopyError('');
    const copied = await copyTextToClipboard(value);
    if (!copied) {
      setCopyError(uiLanguage === 'zh' ? '复制失败，请手动选择文本复制。' : 'Copy failed. Please select and copy manually.');
      return;
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  const sendToObsidian = () => {
    setObsidianError('');
    setObsidianStatus('');

    if (!preferences.obsidian.enableObsidianExport) {
      setObsidianError(uiLanguage === 'zh' ? '请先在设置中开启 Obsidian 导出。' : 'Enable Obsidian export in Settings first.');
      return;
    }

    if (!preferences.obsidian.vault.trim()) {
      setObsidianError(uiLanguage === 'zh' ? '请先在设置中填写 Obsidian vault 名称。' : 'Add your Obsidian vault name in Settings first.');
      return;
    }

    const fileName = applyObsidianFileNameTemplate(preferences.obsidian.fileNameTemplate, { title });
    const uri = buildObsidianNewNoteUri({
      vault: preferences.obsidian.vault.trim(),
      folder: preferences.obsidian.folder,
      fileName,
      content: markdown,
    });

    if (uri.length > 1800) {
      setObsidianStatus(uiLanguage === 'zh' ? '当前内容较长，Obsidian URI 可能失败；复制 Markdown 是更稳定的备选。' : 'This note is long; Obsidian URI may fail. Copy Markdown is the safer fallback.');
    } else {
      setObsidianStatus(uiLanguage === 'zh' ? '已尝试打开 Obsidian。' : 'Tried to open Obsidian.');
    }

    openObsidianUri(uri, preferences.obsidian.openAfterCreate);
  };

  return (
    <div className="grid h-full min-h-[460px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <CopyButton label={label.copyAll} copiedLabel={label.copied} copied={copiedKey === 'all'} onClick={() => copy('all', markdown)} primary />
        <button
          className="btn-secondary w-full"
          onClick={sendToObsidian}
          title={preferences.obsidian.enableObsidianExport ? label.obsidian : uiLanguage === 'zh' ? '请先在设置中开启 Obsidian 导出' : 'Enable Obsidian export in Settings'}
        >
          <FileSymlink size={16} />
          {label.obsidian}
        </button>
        {obsidianStatus ? <p className="rounded-md bg-mint/10 px-3 py-2 text-xs leading-5 text-mint">{obsidianStatus}</p> : null}
        {obsidianError ? <p className="rounded-md bg-coral/10 px-3 py-2 text-xs leading-5 text-coral">{obsidianError}</p> : null}
        {copyError ? <p className="rounded-md bg-coral/10 px-3 py-2 text-xs leading-5 text-coral">{copyError}</p> : null}
        <CopyButton
          label={label.copyTranslation}
          copiedLabel={label.copied}
          copied={copiedKey === 'translation'}
          onClick={() => copy('translation', translation || '')}
          disabled={!translation}
        />
        <CopyButton
          label={label.copyKnowledge}
          copiedLabel={label.copied}
          copied={copiedKey === 'knowledge'}
          onClick={() => copy('knowledge', buildKnowledgeMarkdown(knowledge))}
          disabled={!knowledge.vocabulary.length && !knowledge.expressions.length && !knowledge.grammar.length}
        />
        <CopyButton
          label={label.copyQuiz}
          copiedLabel={label.copied}
          copied={copiedKey === 'quiz'}
          onClick={() => copy('quiz', buildQuizMarkdown(quiz))}
          disabled={!quiz.length}
        />
      </aside>

      <section className="min-h-0 overflow-y-auto rounded-md border border-black/10 bg-[#444444] p-4 text-sm leading-7 text-zinc-100 dark:border-white/10">
        <pre className="whitespace-pre-wrap break-words font-mono">{markdown}</pre>
      </section>
    </div>
  );
}

function CopyButton({
  label,
  copiedLabel,
  copied,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  copiedLabel: string;
  copied: boolean;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button className={`${primary ? 'btn-primary' : 'btn-secondary'} w-full`} onClick={onClick} disabled={disabled}>
      {primary ? <Copy size={16} /> : <ClipboardCopy size={16} />}
      {copied ? copiedLabel : label}
    </button>
  );
}
