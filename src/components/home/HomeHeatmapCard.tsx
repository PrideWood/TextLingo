'use client';

import { useState } from 'react';
import { readLearningHistory, summarizeLearningHistory } from '../../../lib/storage/progress';
import { UsageDetailsModal } from '../progress/UsageDetailsModal';

interface HomeHeatmapCardProps {
  refreshKey: number;
}

export function HomeHeatmapCard({ refreshKey }: HomeHeatmapCardProps) {
  void refreshKey;
  const [open, setOpen] = useState(false);
  const summary = summarizeLearningHistory(readLearningHistory());
  const monthHeatmap = summary.heatmap.slice(-35);

  return (
    <>
      <section className="cursor-pointer px-1 py-2" onClick={() => setOpen(true)}>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Learning rhythm</h2>

        <div className="mt-3 grid max-w-[176px] grid-cols-7 gap-1.5">
          {monthHeatmap.map((item) => (
            <div
              key={item.date}
              title={`${item.date}: ${item.count}`}
              className={`h-4 w-4 rounded-[5px] ${
                item.count >= 4
                  ? 'bg-mint/90'
                  : item.count >= 2
                    ? 'bg-mint/50'
                    : item.count === 1
                      ? 'bg-mint/20'
                      : 'bg-zinc-200/70 dark:bg-zinc-800/70'
              }`}
            />
          ))}
        </div>
      </section>

      <UsageDetailsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
