'use client';

import { ClipboardCopy, Copy, FileSymlink } from 'lucide-react';
import { useRef, useState } from 'react';
import { copyTextToClipboard, selectElementText } from '../../../lib/clipboard';
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
  const markdownPreviewRef = useRef<HTMLPreElement | null>(null);
  const preferences = readPreferences();
  const label = {
    copied: uiLanguage === 'zh' ? '已复制' : 'Copied',
    copyAll: uiLanguage === 'zh' ? '复制全部 Markdown' : 'Copy Markdown',
    copyTranslation: uiLanguage === 'zh' ? '复制译文' : 'Copy translation',
    copyKnowledge: uiLanguage === 'zh' ? '复制知识点' : 'Copy learning points',
    copyQuiz: uiLanguage === 'zh' ? '复制练习题' : 'Copy quiz',
    obsidian: uiLanguage === 'zh' ? '发送到 Obsidian' : 'Send to Obsidian',
    copyFallback: uiLanguage === 'zh' ? '复制失败，已选中右侧 Markdown，可直接按快捷键复制。' : 'Copy failed. The Markdown preview is selected; use the keyboard shortcut to copy.',
    obsidianCopiedFallback: uiLanguage === 'zh' ? 'Markdown 已复制。内容较长，将打开 Obsidian 笔记后请直接粘贴正文。' : 'Markdown copied. The note is long; paste the content after Obsidian opens.',
    obsidianCopyFailedFallback: uiLanguage === 'zh' ? '内容较长，已尝试打开 Obsidian；右侧 Markdown 已选中，请复制后粘贴。' : 'The note is long; Obsidian was opened and the Markdown preview is selected for manual copy.',
    obsidianCopied: uiLanguage === 'zh' ? 'Markdown 已复制，并已尝试打开 Obsidian。' : 'Markdown copied and Obsidian was opened.',
    obsidianOpened: uiLanguage === 'zh' ? '已尝试打开 Obsidian。' : 'Tried to open Obsidian.',
  };

  const copy = async (key: string, value: string) => {
    setCopyError('');
    const copied = await copyTextToClipboard(value);
    if (!copied) {
      if (key === 'all') {
        selectElementText(markdownPreviewRef.current);
      }
      setCopyError(key === 'all' ? label.copyFallback : uiLanguage === 'zh' ? '复制失败，请手动选择文本复制。' : 'Copy failed. Please select and copy manually.');
      return;
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  const sendToObsidian = async () => {
    setObsidianError('');
    setObsidianStatus('');
    setCopyError('');

    if (!preferences.obsidian.enableObsidianExport) {
      setObsidianError(uiLanguage === 'zh' ? '请先在设置中开启 Obsidian 导出。' : 'Enable Obsidian export in Settings first.');
      return;
    }

    if (!preferences.obsidian.vault.trim()) {
      setObsidianError(uiLanguage === 'zh' ? '请先在设置中填写 Obsidian vault 名称。' : 'Add your Obsidian vault name in Settings first.');
      return;
    }

    const fileName = applyObsidianFileNameTemplate(preferences.obsidian.fileNameTemplate, { title });
    const uriWithContent = buildObsidianNewNoteUri({
      vault: preferences.obsidian.vault.trim(),
      folder: preferences.obsidian.folder,
      fileName,
      content: markdown,
    });
    const copied = await copyTextToClipboard(markdown);

    if (uriWithContent.length > 1800) {
      const uriWithoutContent = buildObsidianNewNoteUri({
        vault: preferences.obsidian.vault.trim(),
        folder: preferences.obsidian.folder,
        fileName,
      });

      if (!copied) {
        selectElementText(markdownPreviewRef.current);
      }

      setObsidianStatus(copied ? label.obsidianCopiedFallback : label.obsidianCopyFailedFallback);
      openObsidianUri(uriWithoutContent, preferences.obsidian.openAfterCreate);
    } else {
      setObsidianStatus(copied ? label.obsidianCopied : label.obsidianOpened);
      openObsidianUri(uriWithContent, preferences.obsidian.openAfterCreate);
    }
  };

  return (
    <div className="grid h-full min-h-[460px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <CopyButton label={label.copyAll} copiedLabel={label.copied} copied={copiedKey === 'all'} onClick={() => copy('all', markdown)} primary />
        <button
          className="btn-secondary w-full"
          onClick={() => void sendToObsidian()}
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
        <pre ref={markdownPreviewRef} className="whitespace-pre-wrap break-words font-mono">{markdown}</pre>
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
