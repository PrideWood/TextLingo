'use client';

import { BarChart3, CalendarDays, Flame, PanelRightOpen, RotateCcw, UserRound } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { readLearningHistory, summarizeLearningHistory } from '../../../lib/storage/progress';

interface ProgressPanelProps {
  refreshKey?: number;
  avatarUrl?: string;
  displayName?: string;
  isLoggedIn?: boolean;
}

export function ProgressPanel({
  refreshKey = 0,
  avatarUrl,
  displayName = 'Guest learner',
  isLoggedIn = false,
}: ProgressPanelProps) {
  void refreshKey;
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const history = readLearningHistory();
  const summary = summarizeLearningHistory(history);
  const recent30DaysCount = summary.heatmap.slice(-30).reduce((sum, item) => sum + item.count, 0);
  const recentRecords = Object.entries(history.entriesByDate ?? {})
    .filter(([, count]) => count > 0)
    .sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate))
    .slice(0, 7);
  const mostActiveDate = Object.entries(history.entriesByDate ?? {}).sort((left, right) => right[1] - left[1])[0];

  return (
    <section
      className="panel cursor-pointer transition hover:border-mint/30"
      role="button"
      tabIndex={0}
      onClick={() => setIsDetailOpen(true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          setIsDetailOpen(true);
        }
      }}
    >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mint/10 text-mint">
              {isLoggedIn && avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <UserRound size={24} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{isLoggedIn ? 'Learning profile' : 'Guest learner'}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-sm font-semibold text-zinc-900 dark:text-white">
              <Flame size={16} className="text-mint" />
              连续 {summary.streakCount} 天
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">今日 {summary.todayCount} 篇</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              <CalendarDays size={16} />
              学习热力图
            </p>
            <button
              className="inline-flex items-center gap-1 text-xs font-semibold text-mint hover:text-mint/80"
              onClick={(event) => {
                event.stopPropagation();
                setIsDetailOpen((value) => !value);
              }}
            >
              {isDetailOpen ? '收起详情' : '查看详情'}
              <PanelRightOpen size={15} />
            </button>
          </div>
          <div className="grid grid-cols-12 gap-1">
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
                        : 'bg-zinc-100 dark:bg-zinc-800/70'
                }`}
              />
            ))}
          </div>
        </div>
      {isDetailOpen ? (
        <div
          className="mt-5 cursor-default rounded-md border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Learning Details</p>
                <h2 className="section-title">学习记录详情</h2>
              </div>
              <button
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                aria-label="收起详情"
                title="收起详情"
                type="button"
                onClick={() => setIsDetailOpen(false)}
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailItem icon={<BarChart3 size={16} />} label="总处理文本数" value={summary.totalCount} />
              <DetailItem icon={<CalendarDays size={16} />} label="今日处理数" value={summary.todayCount} />
              <DetailItem icon={<CalendarDays size={16} />} label="最近 7 天" value={summary.recent7DaysCount} />
              <DetailItem icon={<CalendarDays size={16} />} label="最近 30 天" value={recent30DaysCount} />
              <DetailItem icon={<Flame size={16} />} label="连续使用天数" value={summary.streakCount} />
              <DetailItem label="最活跃日期" value={mostActiveDate ? `${mostActiveDate[0]} · ${mostActiveDate[1]} 篇` : '暂无'} />
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
        </div>
      ) : null}
    </section>
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
    <div className="rounded-md border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950">
      <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}
