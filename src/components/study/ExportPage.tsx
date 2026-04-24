'use client';

import { ClipboardCopy, Copy } from 'lucide-react';
import { useState } from 'react';
import type { KnowledgeResult, QuizQuestion } from '../../types';
import { buildKnowledgeMarkdown, buildQuizMarkdown } from './studyUtils';

interface ExportPageProps {
  markdown: string;
  translation?: string;
  knowledge: KnowledgeResult;
  quiz: QuizQuestion[];
}

export function ExportPage({ markdown, translation, knowledge, quiz }: ExportPageProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  };

  return (
    <div className="grid h-full min-h-[460px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <CopyButton label="复制全部 Markdown" copied={copiedKey === 'all'} onClick={() => copy('all', markdown)} primary />
        <CopyButton
          label="复制译文"
          copied={copiedKey === 'translation'}
          onClick={() => copy('translation', translation || '')}
          disabled={!translation}
        />
        <CopyButton
          label="复制知识点"
          copied={copiedKey === 'knowledge'}
          onClick={() => copy('knowledge', buildKnowledgeMarkdown(knowledge))}
          disabled={!knowledge.vocabulary.length && !knowledge.expressions.length && !knowledge.grammar.length}
        />
        <CopyButton
          label="复制练习题"
          copied={copiedKey === 'quiz'}
          onClick={() => copy('quiz', buildQuizMarkdown(quiz))}
          disabled={!quiz.length}
        />
      </aside>

      <section className="min-h-0 overflow-y-auto rounded-md border border-black/10 bg-zinc-950 p-4 text-sm leading-7 text-zinc-100 dark:border-white/10">
        <pre className="whitespace-pre-wrap break-words font-mono">{markdown}</pre>
      </section>
    </div>
  );
}

function CopyButton({
  label,
  copied,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  copied: boolean;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button className={`${primary ? 'btn-primary' : 'btn-secondary'} w-full`} onClick={onClick} disabled={disabled}>
      {primary ? <Copy size={16} /> : <ClipboardCopy size={16} />}
      {copied ? '已复制' : label}
    </button>
  );
}
