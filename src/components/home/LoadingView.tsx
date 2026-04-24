'use client';

import { Sparkles, WandSparkles } from 'lucide-react';

const steps = ['正在理解文本', '正在生成译文', '正在提取知识点', '正在生成练习题'];

export function LoadingView() {
  return (
    <section className="flex min-h-screen items-center justify-center px-5">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint/10 text-mint shadow-sm">
          <WandSparkles className="animate-pulse" size={30} />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">TextLingo</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">正在把这段素材整理成分页式学习内容。</p>

        <div className="mt-8 space-y-3 text-left">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
              <Sparkles size={15} className="text-mint" />
              <span>{step}</span>
              <span className="ml-auto flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mint" style={{ animationDelay: `${index * 80}ms` }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mint" style={{ animationDelay: `${index * 80 + 120}ms` }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mint" style={{ animationDelay: `${index * 80 + 240}ms` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
