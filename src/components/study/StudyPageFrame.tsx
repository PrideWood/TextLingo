'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface StudyPageFrameProps {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function StudyPageFrame({
  label,
  title,
  description,
  children,
  currentIndex,
  total,
  onPrevious,
  onNext,
}: StudyPageFrameProps) {
  return (
    <section className="flex h-full min-h-[620px] flex-col rounded-lg border border-black/10 bg-white shadow-soft dark:border-white/10 dark:bg-zinc-900">
      <header className="border-b border-black/10 px-5 py-4 dark:border-white/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="eyebrow">{label}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h2>
            {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p> : null}
          </div>
          <p className="text-sm font-semibold text-zinc-400">
            {currentIndex + 1} / {total}
          </p>
        </div>
      </header>

      <div key={label} className="study-page-transition min-h-0 flex-1 overflow-y-auto p-5">
        {children}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-black/10 px-5 py-4 dark:border-white/10">
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mint text-white transition hover:bg-mint/90 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onNext}
          disabled={currentIndex === total - 1}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </footer>
    </section>
  );
}
