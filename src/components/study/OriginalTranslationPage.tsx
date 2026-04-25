'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { KnowledgeItem } from '../../types';
import { getKnowledgeTerm } from './studyUtils';

interface OriginalTranslationPageProps {
  sourceText: string;
  translation?: string;
  vocabulary?: KnowledgeItem[];
}

export function OriginalTranslationPage({ sourceText, translation, vocabulary = [] }: OriginalTranslationPageProps) {
  const originalRef = useRef<HTMLDivElement | null>(null);
  const translationRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);
  const [translationHidden, setTranslationHidden] = useState(false);
  const terms = useMemo(
    () =>
      Array.from(new Map(vocabulary.map(getKnowledgeTerm).filter(Boolean).map((term) => [term.toLowerCase(), term])).values()).sort(
        (a, b) => b.length - a.length,
      ),
    [vocabulary],
  );

  const syncScroll = (from: HTMLDivElement | null, to: HTMLDivElement | null) => {
    if (!from || !to || syncingRef.current) return;

    const fromMax = from.scrollHeight - from.clientHeight;
    const toMax = to.scrollHeight - to.clientHeight;
    const ratio = fromMax > 0 ? from.scrollTop / fromMax : 0;

    syncingRef.current = true;
    to.scrollTop = ratio * Math.max(toMax, 0);
    window.setTimeout(() => {
      syncingRef.current = false;
    }, 0);
  };

  return (
    <div className="grid h-full min-h-[460px] gap-4 lg:grid-cols-2">
      <TextColumn
        title="Original"
        scrollRef={originalRef}
        text={sourceText}
        highlightTerms={terms}
        onScroll={() => syncScroll(originalRef.current, translationRef.current)}
      />
      <TextColumn
        title="Translation"
        scrollRef={translationRef}
        text={translation || '暂无译文'}
        hidden={translationHidden}
        onToggleHidden={() => setTranslationHidden((value) => !value)}
        onScroll={() => syncScroll(translationRef.current, originalRef.current)}
      />
    </div>
  );
}

function TextColumn({
  title,
  text,
  onScroll,
  scrollRef,
  highlightTerms = [],
  hidden,
  onToggleHidden,
}: {
  title: string;
  text: string;
  onScroll: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  highlightTerms?: string[];
  hidden?: boolean;
  onToggleHidden?: () => void;
}) {
  return (
    <section className="flex min-h-[360px] flex-col rounded-md border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950">
      <header className="flex h-[45px] items-center justify-between gap-3 border-b border-black/10 px-4 dark:border-white/10">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
        {onToggleHidden ? (
          <button className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onToggleHidden} title={hidden ? 'Show translation' : 'Hide translation'}>
            {hidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        ) : null}
      </header>
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto p-4">
        {hidden ? (
          <div className="flex h-full items-center justify-center rounded-md bg-white/70 text-sm text-zinc-400 dark:bg-zinc-900/70">
            Translation hidden
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-base leading-8 text-zinc-700 dark:text-zinc-200">
            {renderHighlightedText(text, highlightTerms)}
          </p>
        )}
      </div>
    </section>
  );
}

function renderHighlightedText(text: string, terms: string[]) {
  if (!terms.length) return text;
  const escaped = terms.map(escapeRegExp).filter(Boolean);
  if (!escaped.length) return text;
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const seenTerms = new Set<string>();

  return text.split(pattern).map((part, index) => {
    const matchedTerm = terms.find((term) => term.toLowerCase() === part.toLowerCase());
    if (!matchedTerm) return part;

    const normalized = matchedTerm.toLowerCase();
    if (seenTerms.has(normalized)) return part;
    seenTerms.add(normalized);

    return (
      <strong key={`${part}-${index}`} className="font-bold text-zinc-950 dark:text-white">
        {part}
      </strong>
    );
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
