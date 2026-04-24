'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';

interface OriginalTranslationPageProps {
  sourceText: string;
  translation?: string;
}

export function OriginalTranslationPage({ sourceText, translation }: OriginalTranslationPageProps) {
  const originalRef = useRef<HTMLDivElement | null>(null);
  const translationRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);

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
        onScroll={() => syncScroll(originalRef.current, translationRef.current)}
      />
      <TextColumn
        title="Translation"
        scrollRef={translationRef}
        text={translation || '暂无译文'}
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
}: {
  title: string;
  text: string;
  onScroll: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <section className="flex min-h-[360px] flex-col rounded-md border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950">
      <header className="border-b border-black/10 px-4 py-3 dark:border-white/10">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      </header>
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="whitespace-pre-wrap break-words text-base leading-8 text-zinc-700 dark:text-zinc-200">{text}</p>
      </div>
    </section>
  );
}
