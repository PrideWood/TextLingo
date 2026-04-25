'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

export interface StudyNavChild {
  label: string;
  targetId: string;
}

export interface StudyNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  children?: StudyNavChild[];
}

interface StudyOutlineProps {
  items: StudyNavItem[];
  currentIndex: number;
  visited: Set<string>;
  onSelect: (index: number, targetId?: string) => void;
}

export function StudyOutline({ items, currentIndex, visited, onSelect }: StudyOutlineProps) {
  return (
    <aside className="w-full shrink-0 overflow-x-hidden rounded-lg border border-black/10 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-zinc-900 lg:w-[260px]">
      <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1 lg:overflow-x-hidden">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = index === currentIndex;
          const seen = visited.has(item.id);

          return (
            <div key={item.id}>
              <button
                className={`flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition lg:w-full ${
                  active
                    ? 'bg-mint/10 text-mint'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
                onClick={() => onSelect(index)}
              >
                <Icon size={16} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate whitespace-nowrap">{item.label}</span>
                {active ? <ChevronRight size={15} className="shrink-0" /> : seen ? <CheckCircle2 size={15} className="shrink-0 text-mint" /> : <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />}
              </button>
              {active && item.children?.length ? (
                <div className="mt-1 hidden space-y-1 pl-8 lg:block">
                  {item.children.slice(0, 12).map((child, childIndex) => (
                    <button
                      key={`${item.id}-${childIndex}-${child.targetId}`}
                      className="block w-full truncate rounded px-2 py-1 text-left text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      title={child.label}
                      onClick={() => onSelect(index, child.targetId)}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
