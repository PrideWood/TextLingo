'use client';

import { BarChart3, CalendarDays, Flame, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { readLearningHistory, summarizeLearningHistory } from '../../../lib/storage/progress';

interface UsageDetailsModalProps {
  open: boolean;
  onClose: () => void;
}

export function UsageDetailsModal({ open, onClose }: UsageDetailsModalProps) {
  if (!open) return null;

  const history = readLearningHistory();
  const summary = summarizeLearningHistory(history);
  const recent30DaysCount = summary.heatmap.slice(-30).reduce((sum, item) => sum + item.count, 0);
  const recentRecords = Object.entries(history.entriesByDate ?? {})
    .filter(([, count]) => count > 0)
    .sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate))
    .slice(0, 7);
  const mostActiveDate = Object.entries(history.entriesByDate ?? {}).sort((left, right) => right[1] - left[1])[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8" onMouseDown={onClose}>
      <section
        className="max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Learning Stats</p>
            <h2 className="section-title">本地学习记录</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">这些数据保存在当前浏览器的 localStorage 中。</p>
          </div>
          <button
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="关闭学习记录"
            title="关闭学习记录"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem icon={<BarChart3 size={16} />} label="总处理文本数" value={summary.totalCount} />
          <DetailItem icon={<CalendarDays size={16} />} label="今日处理数" value={summary.todayCount} />
          <DetailItem icon={<CalendarDays size={16} />} label="最近 7 天" value={summary.recent7DaysCount} />
          <DetailItem icon={<CalendarDays size={16} />} label="最近 30 天" value={recent30DaysCount} />
          <DetailItem icon={<Flame size={16} />} label="连续使用天数" value={summary.streakCount} />
          <DetailItem label="最活跃日期" value={mostActiveDate ? `${mostActiveDate[0]} · ${mostActiveDate[1]} 篇` : '暂无'} />
        </div>

        <div className="mt-5 rounded-md border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950">
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <CalendarDays size={16} />
            学习热力图
          </p>
          <div className="grid grid-cols-12 gap-1 sm:grid-cols-[repeat(14,minmax(0,1fr))]">
            {summary.heatmap.map((item) => (
              <div
                key={item.date}
                title={`${item.date}: ${item.count}`}
                className={`aspect-square rounded-[4px] ${
                  item.count >= 4
                    ? 'bg-mint/90'
                    : item.count >= 2
                      ? 'bg-mint/60'
                      : item.count === 1
                        ? 'bg-mint/30'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-md border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">最近学习记录</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {recentRecords.length ? (
              recentRecords.map(([date, count]) => (
                <p key={date} className="flex items-center justify-between gap-4">
                  <span>{date}</span>
                  <span>{count} 篇</span>
                </p>
              ))
            ) : (
              <p>完成一次分析后，这里会开始记录。</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}
