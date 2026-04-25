import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { UiLanguage } from '../../types';
import type { RecentStudyRecord } from '../../types/recent';

interface RecentListProps {
  records: RecentStudyRecord[];
  onOpen: (record: RecentStudyRecord) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  uiLanguage: UiLanguage;
}

export function RecentList({ records, onOpen, onDelete, onClear, uiLanguage }: RecentListProps) {
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const isZh = uiLanguage === 'zh';

  const clearRecords = () => {
    onClear();
    setConfirmClearOpen(false);
  };

  return (
    <section className="px-1 py-2">
      <div className="flex items-center justify-between gap-3 px-2">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{isZh ? '最近学习' : 'Recent'}</h2>
        {records.length ? (
          <button className="text-xs font-semibold text-zinc-400 hover:text-coral" onClick={() => setConfirmClearOpen(true)}>
            {isZh ? '清空' : 'Clear'}
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        {records.length ? (
          records.slice(0, 8).map((record) => (
            <article
              key={record.id}
              className="group flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-zinc-100/70 dark:hover:bg-zinc-900"
              onClick={() => onOpen(record)}
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm text-zinc-700 group-hover:text-zinc-950 group-hover:underline dark:text-zinc-300 dark:group-hover:text-white">{record.title}</h3>
              </div>
              <span className="hidden shrink-0 text-xs text-zinc-300 sm:inline">{formatDate(record.updatedAt, uiLanguage)}</span>
              <button
                className="rounded-md p-1.5 text-zinc-300 opacity-0 transition hover:bg-coral/10 hover:text-coral group-hover:opacity-100"
                title={uiLanguage === 'zh' ? '删除记录' : 'Delete record'}
                aria-label={uiLanguage === 'zh' ? '删除记录' : 'Delete record'}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(record.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))
        ) : null}
      </div>

      {confirmClearOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4" onMouseDown={() => setConfirmClearOpen(false)}>
          <section
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-recent-title"
          >
            <h3 id="clear-recent-title" className="text-base font-semibold text-zinc-900 dark:text-white">
              {isZh ? '清空最近学习？' : 'Clear recent items?'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {isZh ? '此操作会移除首页的最近学习列表，已生成的学习记录统计不会被清空。' : 'This removes the Recent list on the home page. Learning rhythm statistics will not be cleared.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setConfirmClearOpen(false)}>
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button type="button" className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral/90" onClick={clearRecords}>
                {isZh ? '确认清空' : 'Clear'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function formatDate(value: string, uiLanguage: UiLanguage) {
  return new Intl.DateTimeFormat(uiLanguage === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
